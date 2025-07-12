import express from 'express';
import { db } from '../lib/db';
import { 
  createPlotPointSchema, 
  updatePlotPointSchema,
  projectIdParamSchema,
  actIdParamSchema,
  plotPointIdParamSchema,
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

// Get all plot points for an act
router.get('/:projectId/acts/:actId/plotpoints', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, actId } = validateRequest(
      projectIdParamSchema.merge(actIdParamSchema), 
      req.params
    );

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

    const plotPoints = await db.plotPoint.findMany({
      where: { 
        projectId,
        actId 
      },
      include: {
        scenes: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            synopsis: true,
            wordCount: true,
            order: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    res.json({ plotpoints: plotPoints });
  } catch (error) {
    next(error);
  }
});

// Create new plot point
router.post('/:projectId/acts/:actId/plotpoints', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, actId } = validateRequest(
      projectIdParamSchema.merge(actIdParamSchema), 
      req.params
    );
    const plotPointData = validateRequest(createPlotPointSchema, req.body);

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

    const plotPoint = await db.plotPoint.create({
      data: {
        ...plotPointData,
        projectId,
        actId,
      },
      include: {
        scenes: {
          orderBy: { order: 'asc' }
        }
      }
    });

    console.log('Created plot point:', plotPoint);
    res.status(201).json({ plotpoint: plotPoint });
  } catch (error) {
    next(error);
  }
});

// Update plot point
router.patch('/:projectId/acts/:actId/plotpoints/:plotPointId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, actId, plotPointId } = validateRequest(
      projectIdParamSchema.merge(actIdParamSchema).merge(plotPointIdParamSchema), 
      req.params
    );
    const updateData = validateRequest(updatePlotPointSchema, req.body);

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

    const plotPoint = await db.plotPoint.update({
      where: { 
        id: plotPointId,
        projectId, // Ensure plot point belongs to project
        actId // Ensure plot point belongs to act
      },
      data: updateData,
      include: {
        scenes: {
          orderBy: { order: 'asc' }
        }
      }
    });

    res.json({ plotpoint: plotPoint });
  } catch (error) {
    next(error);
  }
});

// PUT endpoint as alias for PATCH (for frontend compatibility)
router.put('/:projectId/acts/:actId/plotpoints/:plotPointId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, actId, plotPointId } = validateRequest(
      projectIdParamSchema.merge(actIdParamSchema).merge(plotPointIdParamSchema), 
      req.params
    );
    const updateData = validateRequest(updatePlotPointSchema, req.body);

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

    const plotPoint = await db.plotPoint.update({
      where: { 
        id: plotPointId,
        projectId, // Ensure plot point belongs to project
        actId // Ensure plot point belongs to act
      },
      data: updateData,
      include: {
        scenes: {
          orderBy: { order: 'asc' }
        }
      }
    });

    res.json({ plotpoint: plotPoint });
  } catch (error) {
    next(error);
  }
});

// Delete plot point
router.delete('/:projectId/acts/:actId/plotpoints/:plotPointId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, actId, plotPointId } = validateRequest(
      projectIdParamSchema.merge(actIdParamSchema).merge(plotPointIdParamSchema), 
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

    await db.plotPoint.delete({
      where: { 
        id: plotPointId,
        projectId,
        actId
      }
    });

    res.json({ message: 'Plot point deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
