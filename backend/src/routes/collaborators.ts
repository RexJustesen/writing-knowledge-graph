import express from 'express';
import { z } from 'zod';
import { db } from '../lib/db';
import { 
  projectIdParamSchema,
  validateRequest 
} from '../lib/validation';
import { 
  NotFoundError, 
  AuthorizationError,
  ConflictError 
} from '../lib/errors';
import { authenticateToken, AuthenticatedRequest } from '../lib/middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Collaboration schemas
const addCollaboratorSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['VIEWER', 'EDITOR']).default('VIEWER'),
});

const updateCollaboratorSchema = z.object({
  role: z.enum(['VIEWER', 'EDITOR', 'OWNER']),
});

const collaboratorIdParamSchema = z.object({
  collaboratorId: z.string().min(1, 'Collaborator ID is required'),
});

// Get all collaborators for a project
router.get('/:projectId/collaborators', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId } = validateRequest(projectIdParamSchema, req.params);

    // Check user has access to project
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: req.userId },
          { collaborators: { some: { userId: req.userId } } }
        ]
      }
    });

    if (!project) {
      throw new NotFoundError('Project not found or access denied');
    }

    const collaborators = await db.projectCollaborator.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            createdAt: true,
            lastLoginAt: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { addedAt: 'asc' }
      ]
    });

    res.json({ collaborators });
  } catch (error) {
    next(error);
  }
});

// Add new collaborator to project
router.post('/:projectId/collaborators', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId } = validateRequest(projectIdParamSchema, req.params);
    const { email, role } = validateRequest(addCollaboratorSchema, req.body);

    // Check user is project owner
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        userId: req.userId
      }
    });

    if (!project) {
      throw new NotFoundError('Project not found or insufficient permissions');
    }

    // Find user by email
    const targetUser = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true, isActive: true }
    });

    if (!targetUser) {
      throw new NotFoundError('User with this email not found');
    }

    if (!targetUser.isActive) {
      throw new AuthorizationError('Target user account is inactive');
    }

    // Check if user is already a collaborator
    const existingCollaborator = await db.projectCollaborator.findUnique({
      where: {
        userId_projectId: {
          userId: targetUser.id,
          projectId
        }
      }
    });

    if (existingCollaborator) {
      throw new ConflictError('User is already a collaborator on this project');
    }

    // Add collaborator
    const collaborator = await db.projectCollaborator.create({
      data: {
        userId: targetUser.id,
        projectId,
        role,
        addedBy: req.userId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            createdAt: true,
            lastLoginAt: true
          }
        }
      }
    });

    res.status(201).json({ collaborator });
  } catch (error) {
    next(error);
  }
});

// Update collaborator role
router.patch('/:projectId/collaborators/:collaboratorId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, collaboratorId } = validateRequest(
      projectIdParamSchema.merge(collaboratorIdParamSchema), 
      req.params
    );
    const { role } = validateRequest(updateCollaboratorSchema, req.body);

    // Check user is project owner
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        userId: req.userId
      }
    });

    if (!project) {
      throw new NotFoundError('Project not found or insufficient permissions');
    }

    // Cannot change owner role
    if (role === 'OWNER') {
      throw new AuthorizationError('Cannot assign OWNER role to collaborators');
    }

    const collaborator = await db.projectCollaborator.update({
      where: { 
        id: collaboratorId,
        projectId
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            createdAt: true,
            lastLoginAt: true
          }
        }
      }
    });

    res.json({ collaborator });
  } catch (error) {
    next(error);
  }
});

// Remove collaborator from project
router.delete('/:projectId/collaborators/:collaboratorId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, collaboratorId } = validateRequest(
      projectIdParamSchema.merge(collaboratorIdParamSchema), 
      req.params
    );

    // Check user is project owner or the collaborator removing themselves
    const collaborator = await db.projectCollaborator.findFirst({
      where: {
        id: collaboratorId,
        projectId
      }
    });

    if (!collaborator) {
      throw new NotFoundError('Collaborator not found');
    }

    const project = await db.project.findFirst({
      where: {
        id: projectId,
        userId: req.userId
      }
    });

    // Allow if user is owner OR if user is removing themselves
    if (!project && collaborator.userId !== req.userId) {
      throw new NotFoundError('Project not found or insufficient permissions');
    }

    await db.projectCollaborator.delete({
      where: { 
        id: collaboratorId,
        projectId
      }
    });

    res.json({ message: 'Collaborator removed successfully' });
  } catch (error) {
    next(error);
  }
});

// Leave project (self-remove)
router.post('/:projectId/leave', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId } = validateRequest(projectIdParamSchema, req.params);

    // Find user's collaboration record
    const collaborator = await db.projectCollaborator.findUnique({
      where: {
        userId_projectId: {
          userId: req.userId,
          projectId
        }
      }
    });

    if (!collaborator) {
      throw new NotFoundError('You are not a collaborator on this project');
    }

    await db.projectCollaborator.delete({
      where: {
        userId_projectId: {
          userId: req.userId,
          projectId
        }
      }
    });

    res.json({ message: 'Successfully left the project' });
  } catch (error) {
    next(error);
  }
});

export default router;
