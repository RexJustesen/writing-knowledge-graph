import express from 'express';
import { db } from '../lib/db';
import { 
  createSceneSchema, 
  updateSceneSchema,
  projectIdParamSchema,
  plotPointIdParamSchema,
  sceneIdParamSchema,
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

// Get all scenes for a plot point
router.get('/:projectId/plotpoints/:plotPointId/scenes', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, plotPointId } = validateRequest(
      projectIdParamSchema.merge(plotPointIdParamSchema), 
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

    const scenes = await db.scene.findMany({
      where: { 
        projectId,
        plotPointId 
      },
      include: {
        setting: {
          select: { id: true, name: true }
        },
        characters: {
          include: {
            character: {
              select: { id: true, name: true, characterType: true }
            }
          }
        },
        items: {
          include: {
            item: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    res.json({ scenes });
  } catch (error) {
    next(error);
  }
});

// Create new scene
router.post('/:projectId/plotpoints/:plotPointId/scenes', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, plotPointId } = validateRequest(
      projectIdParamSchema.merge(plotPointIdParamSchema), 
      req.params
    );
    const sceneData = validateRequest(createSceneSchema, req.body);

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

    // Create scene with character and item associations
    const { characterIds, itemIds, ...sceneCreateData } = sceneData;
    
    const scene = await db.scene.create({
      data: {
        ...sceneCreateData,
        projectId,
        plotPointId,
        characters: characterIds ? {
          create: characterIds.map(characterId => ({
            characterId
          }))
        } : undefined,
        items: itemIds ? {
          create: itemIds.map(itemId => ({
            itemId
          }))
        } : undefined
      },
      include: {
        setting: true,
        characters: {
          include: {
            character: true
          }
        },
        items: {
          include: {
            item: true
          }
        }
      }
    });

    res.status(201).json({ scene });
  } catch (error) {
    next(error);
  }
});

// Update scene (PATCH for partial updates)
router.patch('/:projectId/plotpoints/:plotPointId/scenes/:sceneId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, plotPointId, sceneId } = validateRequest(
      projectIdParamSchema.merge(plotPointIdParamSchema).merge(sceneIdParamSchema), 
      req.params
    );
    const updateData = validateRequest(updateSceneSchema, req.body);

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

    const { characterIds, itemIds, ...sceneUpdateData } = updateData;

    // Handle character and item updates if provided
    const updateOperations: any = { ...sceneUpdateData };

    if (characterIds !== undefined) {
      // Replace all character associations
      updateOperations.characters = {
        deleteMany: {},
        create: characterIds.map(characterId => ({
          characterId
        }))
      };
    }

    if (itemIds !== undefined) {
      // Replace all item associations
      updateOperations.items = {
        deleteMany: {},
        create: itemIds.map(itemId => ({
          itemId
        }))
      };
    }

    const scene = await db.scene.update({
      where: { 
        id: sceneId,
        projectId,
        plotPointId
      },
      data: updateOperations,
      include: {
        setting: true,
        characters: {
          include: {
            character: true
          }
        },
        items: {
          include: {
            item: true
          }
        }
      }
    });

    res.json({ scene });
  } catch (error) {
    next(error);
  }
});

// Update scene (PUT for full updates - alias for PATCH to support frontend)
router.put('/:projectId/plotpoints/:plotPointId/scenes/:sceneId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, plotPointId, sceneId } = validateRequest(
      projectIdParamSchema.merge(plotPointIdParamSchema).merge(sceneIdParamSchema), 
      req.params
    );
    const updateData = validateRequest(updateSceneSchema, req.body);

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

    const { characterIds, itemIds, ...sceneUpdateData } = updateData;

    // Handle character and item updates if provided
    const updateOperations: any = { ...sceneUpdateData };

    if (characterIds !== undefined) {
      // Replace all character associations
      updateOperations.characters = {
        deleteMany: {},
        create: characterIds.map(characterId => ({
          characterId
        }))
      };
    }

    if (itemIds !== undefined) {
      // Replace all item associations
      updateOperations.items = {
        deleteMany: {},
        create: itemIds.map(itemId => ({
          itemId
        }))
      };
    }

    const scene = await db.scene.update({
      where: { 
        id: sceneId,
        projectId,
        plotPointId
      },
      data: updateOperations,
      include: {
        setting: true,
        characters: {
          include: {
            character: true
          }
        },
        items: {
          include: {
            item: true
          }
        }
      }
    });

    res.json({ scene });
  } catch (error) {
    next(error);
  }
});

// Delete scene
router.delete('/:projectId/plotpoints/:plotPointId/scenes/:sceneId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, plotPointId, sceneId } = validateRequest(
      projectIdParamSchema.merge(plotPointIdParamSchema).merge(sceneIdParamSchema), 
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

    await db.scene.delete({
      where: { 
        id: sceneId,
        projectId,
        plotPointId
      }
    });

    res.json({ message: 'Scene deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
