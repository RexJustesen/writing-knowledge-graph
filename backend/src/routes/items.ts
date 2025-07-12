import express from 'express';
import { db } from '../lib/db';
import { 
  createItemSchema, 
  updateItemSchema,
  projectIdParamSchema,
  itemIdParamSchema,
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

// Get all items for a project
router.get('/:projectId/items', async (req: AuthenticatedRequest, res, next) => {
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

    const items = await db.item.findMany({
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

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// Get single item
router.get('/:projectId/items/:itemId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, itemId } = validateRequest(
      projectIdParamSchema.merge(itemIdParamSchema), 
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

    const item = await db.item.findFirst({
      where: { 
        id: itemId,
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

    if (!item) {
      throw new NotFoundError('Item not found');
    }

    res.json({ item });
  } catch (error) {
    next(error);
  }
});

// Create new item
router.post('/:projectId/items', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId } = validateRequest(projectIdParamSchema, req.params);
    const itemData = validateRequest(createItemSchema, req.body);

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

    const item = await db.item.create({
      data: {
        ...itemData,
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

    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

// Update item
router.patch('/:projectId/items/:itemId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, itemId } = validateRequest(
      projectIdParamSchema.merge(itemIdParamSchema), 
      req.params
    );
    const updateData = validateRequest(updateItemSchema, req.body);

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

    const item = await db.item.update({
      where: { 
        id: itemId,
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

    res.json({ item });
  } catch (error) {
    next(error);
  }
});

// Delete item
router.delete('/:projectId/items/:itemId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId, itemId } = validateRequest(
      projectIdParamSchema.merge(itemIdParamSchema), 
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

    await db.item.delete({
      where: { 
        id: itemId,
        projectId
      }
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
