import express from 'express';
import { db } from '../lib/db';
import { 
  createCharacterSchema, 
  updateCharacterSchema,
  projectIdParamSchema,
  characterIdParamSchema,
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

// Get all characters for a project
router.get('/:projectId/characters', async (req: AuthenticatedRequest, res, next) => {
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

    const characters = await db.character.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            scenes: true
          }
        }
      },
      orderBy: [
        { characterType: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({ characters });
  } catch (error) {
    next(error);
  }
});

// Get single character
router.get('/:projectId/characters/:characterId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, characterId } = validateRequest(
      projectIdParamSchema.merge(characterIdParamSchema), 
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

    const character = await db.character.findFirst({
      where: { 
        id: characterId,
        projectId 
      },
      include: {
        scenes: {
          include: {
            scene: {
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
        }
      }
    });

    if (!character) {
      throw new NotFoundError('Character not found');
    }

    res.json({ character });
  } catch (error) {
    next(error);
  }
});

// Create new character
router.post('/:projectId/characters', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId } = validateRequest(projectIdParamSchema, req.params);
    const characterData = validateRequest(createCharacterSchema, req.body);

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

    const character = await db.character.create({
      data: {
        ...characterData,
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

    res.status(201).json({ character });
  } catch (error) {
    next(error);
  }
});

// Update character
router.patch('/:projectId/characters/:characterId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, characterId } = validateRequest(
      projectIdParamSchema.merge(characterIdParamSchema), 
      req.params
    );
    const updateData = validateRequest(updateCharacterSchema, req.body);

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

    const character = await db.character.update({
      where: { 
        id: characterId,
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

    res.json({ character });
  } catch (error) {
    next(error);
  }
});

// Delete character
router.delete('/:projectId/characters/:characterId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, characterId } = validateRequest(
      projectIdParamSchema.merge(characterIdParamSchema), 
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

    await db.character.delete({
      where: { 
        id: characterId,
        projectId
      }
    });

    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
