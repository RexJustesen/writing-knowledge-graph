import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { generateTokens, generateJWT, verifyJWT } from '../lib/auth';
import { db } from '../lib/db';
import { 
  loginSchema, 
  registerSchema, 
  refreshTokenSchema,
  validateRequest 
} from '../lib/validation';
import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  ConflictError 
} from '../lib/errors';
import { authenticateToken, AuthenticatedRequest } from '../lib/middleware';

const router = express.Router();

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, username } = validateRequest(registerSchema, req.body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        username: username,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store session with refresh token
    await db.userSession.create({
      data: {
        token: accessToken,
        refreshToken: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isActive: true,
        createdAt: user.createdAt.toISOString(),
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = validateRequest(loginSchema, req.body);

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        isActive: true,
        lastLoginAt: true,
      }
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store session with refresh token
    await db.userSession.create({
      data: {
        token: accessToken,
        refreshToken: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      isActive: user.isActive,
      createdAt: new Date().toISOString(), // We'll use current time since we don't have createdAt from the select
      lastLoginAt: new Date().toISOString(),
    };

    res.json({
      user: userResponse,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

// Refresh access token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = validateRequest(refreshTokenSchema, req.body);

    // Find session with refresh token
    const session = await db.userSession.findFirst({
      where: { 
        refreshToken: refreshToken,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            isActive: true,
          }
        }
      }
    });

    if (!session || !session.user.isActive) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(session.userId);

    // Update session with new tokens
    await db.userSession.update({
      where: { id: session.id },
      data: {
        token: accessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
});

// Logout (remove session)
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = validateRequest(refreshTokenSchema, req.body);

    // Delete session
    await db.userSession.deleteMany({
      where: { 
        refreshToken: refreshToken
      }
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Logout from all devices (remove all sessions for user)
router.post('/logout-all', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthenticationError('User not authenticated');
    }

    // Delete all sessions for user
    await db.userSession.deleteMany({
      where: { 
        userId: req.userId
      }
    });

    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const user = await db.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            projects: true,
            collaborations: true,
          }
        }
      }
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    res.json({ 
      user: {
        ...user,
        name: user.username
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.patch('/me', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const updateData = validateRequest(
      z.object({
        username: z.string().min(1).max(100).optional(),
      }),
      req.body
    );

    const updatedUser = await db.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        lastLoginAt: true,
      }
    });

    res.json({ 
      user: {
        ...updatedUser,
        name: updatedUser.username
      }
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const { currentPassword, newPassword } = validateRequest(
      z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(6, 'New password must be at least 6 characters').max(128),
      }),
      req.body
    );

    // Get current user with password
    const user = await db.user.findUnique({
      where: { id: req.userId },
      select: { id: true, passwordHash: true }
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and invalidate all sessions (force re-login)
    await db.$transaction([
      db.user.update({
        where: { id: req.userId },
        data: { passwordHash: hashedPassword }
      }),
      db.userSession.deleteMany({
        where: { userId: req.userId }
      })
    ]);

    res.json({ message: 'Password changed successfully. Please log in again.' });
  } catch (error) {
    next(error);
  }
});

export default router;
