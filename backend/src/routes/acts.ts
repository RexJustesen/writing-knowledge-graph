import express from 'express';
import { z } from 'zod';
import { db } from '../lib/db';
import { 
  createActSchema, 
  updateActSchema,
  projectIdParamSchema,
  actIdParamSchema,
  validateRequest 
} from '../lib/validation';
import { 
  NotFoundError, 
  AuthorizationError 
} from '../lib/errors';
import { authenticateToken, AuthenticatedRequest } from '../lib/middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all acts for a project
router.get('/:projectId/acts', async (req: AuthenticatedRequest, res, next) => {
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

    const acts = await db.act.findMany({
      where: { projectId },
      include: {
        plotPoints: {
          orderBy: { order: 'asc' },
          include: {
            scenes: {
              orderBy: { order: 'asc' }
            }
          }
        },
        _count: {
          select: {
            plotPoints: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    res.json({ acts });
  } catch (error) {
    next(error);
  }
});

// Create new act
router.post('/:projectId/acts', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId } = validateRequest(projectIdParamSchema, req.params);
    const actData = validateRequest(createActSchema, req.body);

    // Check user has edit access to project
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: req.userId },
          { collaborators: { some: { userId: req.userId, role: { in: ['EDITOR', 'OWNER'] } } } }
        ]
      }
    });

    if (!project) {
      throw new NotFoundError('Project not found or insufficient permissions');
    }

    const act = await db.act.create({
      data: {
        ...actData,
        projectId,
      },
      include: {
        _count: {
          select: {
            plotPoints: true
          }
        }
      }
    });

    res.status(201).json({ act });
  } catch (error) {
    next(error);
  }
});

// Update act (PATCH)
router.patch('/:projectId/acts/:actId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, actId } = validateRequest(
      projectIdParamSchema.merge(actIdParamSchema), 
      req.params
    );
    const updateData = validateRequest(updateActSchema, req.body);

    // Check user has edit access
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: req.userId },
          { collaborators: { some: { userId: req.userId, role: { in: ['EDITOR', 'OWNER'] } } } }
        ]
      }
    });

    if (!project) {
      throw new NotFoundError('Project not found or insufficient permissions');
    }

    const act = await db.act.update({
      where: { 
        id: actId,
        projectId // Ensure act belongs to project
      },
      data: updateData,
      include: {
        _count: {
          select: {
            plotPoints: true
          }
        }
      }
    });

    res.json({ act });
  } catch (error) {
    next(error);
  }
});

// Update act (PUT - same as PATCH for compatibility)
router.put('/:projectId/acts/:actId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, actId } = validateRequest(
      projectIdParamSchema.merge(actIdParamSchema), 
      req.params
    );
    const updateData = validateRequest(updateActSchema, req.body);

    // Check user has edit access
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: req.userId },
          { collaborators: { some: { userId: req.userId, role: { in: ['EDITOR', 'OWNER'] } } } }
        ]
      }
    });

    if (!project) {
      throw new NotFoundError('Project not found or insufficient permissions');
    }

    const act = await db.act.update({
      where: { 
        id: actId,
        projectId // Ensure act belongs to project
      },
      data: updateData,
      include: {
        _count: {
          select: {
            plotPoints: true
          }
        }
      }
    });

    res.json({ act });
  } catch (error) {
    next(error);
  }
});

// Delete act
router.delete('/:projectId/acts/:actId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, actId } = validateRequest(
      projectIdParamSchema.merge(actIdParamSchema), 
      req.params
    );

    // Check user has edit access
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: req.userId },
          { collaborators: { some: { userId: req.userId, role: { in: ['EDITOR', 'OWNER'] } } } }
        ]
      }
    });

    if (!project) {
      throw new NotFoundError('Project not found or insufficient permissions');
    }

    await db.act.delete({
      where: { 
        id: actId,
        projectId // Ensure act belongs to project
      }
    });

    res.json({ message: 'Act deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
