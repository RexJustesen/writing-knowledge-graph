import express from 'express';
import { db } from '../lib/db';
import { 
  createSettingSchema, 
  updateSettingSchema,
  projectIdParamSchema,
  settingIdParamSchema,
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

// Get all settings for a project
router.get('/:projectId/settings', async (req: AuthenticatedRequest, res, next) => {
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

    const settings = await db.setting.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            scenes: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

// Get single setting
router.get('/:projectId/settings/:settingId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, settingId } = validateRequest(
      projectIdParamSchema.merge(settingIdParamSchema), 
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

    const setting = await db.setting.findFirst({
      where: { 
        id: settingId,
        projectId 
      },
      include: {
        scenes: {
          select: {
            id: true,
            title: true,
            plotPoint: {
              select: {
                id: true,
                title: true,
                act: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!setting) {
      throw new NotFoundError('Setting not found');
    }

    res.json({ setting });
  } catch (error) {
    next(error);
  }
});

// Create new setting
router.post('/:projectId/settings', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId } = validateRequest(projectIdParamSchema, req.params);
    const settingData = validateRequest(createSettingSchema, req.body);

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

    const setting = await db.setting.create({
      data: {
        ...settingData,
        projectId,
      },
      include: {
        _count: {
          select: {
            scenes: true
          }
        }
      }
    });

    res.status(201).json({ setting });
  } catch (error) {
    next(error);
  }
});

// Update setting
router.patch('/:projectId/settings/:settingId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, settingId } = validateRequest(
      projectIdParamSchema.merge(settingIdParamSchema), 
      req.params
    );
    const updateData = validateRequest(updateSettingSchema, req.body);

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

    const setting = await db.setting.update({
      where: { 
        id: settingId,
        projectId
      },
      data: updateData,
      include: {
        _count: {
          select: {
            scenes: true
          }
        }
      }
    });

    res.json({ setting });
  } catch (error) {
    next(error);
  }
});

// Delete setting
router.delete('/:projectId/settings/:settingId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, settingId } = validateRequest(
      projectIdParamSchema.merge(settingIdParamSchema), 
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

    await db.setting.delete({
      where: { 
        id: settingId,
        projectId
      }
    });

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
