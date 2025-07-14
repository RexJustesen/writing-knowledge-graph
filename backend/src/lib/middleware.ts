import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { AppError } from './errors';

interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

// Middleware to authenticate JWT tokens
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : null;

    if (!token) {
      throw new AppError('Access token required', 401);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT secret not configured', 500);
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    
    // Verify user still exists
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, username: true, isActive: true }
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    req.userId = user.id;
    req.user = {
      id: user.id,
      email: user.email,
      name: user.username || undefined,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Authentication error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : null;

    if (token) {
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret) as { userId: string };
        
        const user = await db.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, username: true, isActive: true }
        });

        if (user && user.isActive) {
          req.userId = user.id;
          req.user = {
            id: user.id,
            email: user.email,
            name: user.username || undefined,
          };
        }
      }
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

// Rate limiting middleware
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const clientData = requestCounts.get(clientIP);
    
    if (!clientData || now > clientData.resetTime) {
      // First request or window expired
      requestCounts.set(clientIP, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }
    
    if (clientData.count >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
      return;
    }
    
    clientData.count++;
    next();
  };
};

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 60 * 1000); // Clean up every minute

// CORS middleware
export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map(origin => origin.trim()) || ['http://localhost:3000'];
  const origin = req.headers.origin;

  console.log('CORS Debug:', { 
    requestOrigin: origin, 
    allowedOrigins, 
    envVar: process.env.CORS_ORIGINS 
  });

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    console.log('CORS: Origin allowed:', origin);
  } else {
    console.log('CORS: Origin not allowed:', origin);
    // For debugging, allow all origins temporarily
    res.header('Access-Control-Allow-Origin', '*');
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,ngrok-skip-browser-warning');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
};

// Error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        res.status(409).json({ error: 'A record with this information already exists' });
        return;
      case 'P2025':
        res.status(404).json({ error: 'Record not found' });
        return;
      case 'P2003':
        res.status(400).json({ error: 'Foreign key constraint failed' });
        return;
      default:
        res.status(400).json({ error: 'Database operation failed' });
        return;
    }
  }

  // Default error
  res.status(500).json({ error: 'Internal server error' });
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};

export type { AuthenticatedRequest };
