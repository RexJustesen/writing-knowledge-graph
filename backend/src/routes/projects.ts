import express from 'express';
import { z } from 'zod';
import { db } from '../lib/db';
import { 
  createProjectSchema, 
  updateProjectSchema,
  searchProjectsSchema,
  projectIdParamSchema,
  validateRequest 
} from '../lib/validation';
import { 
  NotFoundError, 
  AuthorizationError,
  ValidationError 
} from '../lib/errors';
import { authenticateToken, AuthenticatedRequest } from '../lib/middleware';

// Helper function to get default acts based on template
function getDefaultActsForTemplate(template?: 'NOVEL' | 'SCREENPLAY' | 'SHORT_STORY' | 'FROM_SCRATCH') {
  switch (template) {
    case 'SCREENPLAY':
      return [
        { name: 'Act I', description: 'Setup and inciting incident', order: 1 },
        { name: 'Act II-A', description: 'First half of second act', order: 2 },
        { name: 'Act II-B', description: 'Second half of second act', order: 3 },
        { name: 'Act III', description: 'Climax and resolution', order: 4 },
      ];
    case 'SHORT_STORY':
      return [
        { name: 'Beginning', description: 'Opening and setup', order: 1 },
        { name: 'Middle', description: 'Conflict and development', order: 2 },
        { name: 'End', description: 'Climax and resolution', order: 3 },
      ];
    case 'FROM_SCRATCH':
      return [
        { name: 'Act 1', description: 'First act', order: 1 },
      ];
    case 'NOVEL':
    default:
      return [
        { name: 'Act I', description: 'Setup and inciting incident', order: 1 },
        { name: 'Act II', description: 'Rising action and complications', order: 2 },
        { name: 'Act III', description: 'Climax and resolution', order: 3 },
      ];
  }
}

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all projects for authenticated user
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { query, status, tags, limit = 10, offset = 0 } = validateRequest(
      searchProjectsSchema, 
      req.query
    );

    const whereClause: any = {
      OR: [
        { userId: req.userId },
        { 
          collaborators: {
            some: { userId: req.userId }
          }
        }
      ]
    };

    // Add filters
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (tags && tags.length > 0) {
      whereClause.tags = { hasEvery: tags };
    }

    const [projects, totalCount] = await Promise.all([
      db.project.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, email: true, username: true }
          },
          _count: {
            select: {
              acts: true,
              plotPoints: true,
              scenes: true,
              characters: true,
              collaborators: true,
            }
          },
          collaborators: {
            include: {
              user: {
                select: { id: true, email: true, username: true }
              }
            }
          }
        },
        orderBy: [
          { updatedAt: 'desc' }
        ],
        skip: offset,
        take: limit,
      }),
      db.project.count({ where: whereClause })
    ]);

    const formattedProjects = projects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      tags: project.tags,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lastAccessedAt: project.lastAccessedAt,
      currentZoomLevel: project.currentZoomLevel,
      isPublic: project.isPublic,
      owner: {
        id: project.user.id,
        email: project.user.email,
        name: project.user.username
      },
      counts: {
        actCount: project._count.acts,
        plotPointCount: project._count.plotPoints,
        sceneCount: project._count.scenes,
        characterCount: project._count.characters,
        collaboratorCount: project._count.collaborators,
      },
      collaborators: project.collaborators.map(collab => ({
        id: collab.id,
        role: collab.role,
        user: {
          id: collab.user.id,
          email: collab.user.email,
          name: collab.user.username
        }
      })),
      userRole: project.userId === req.userId 
        ? 'OWNER' 
        : project.collaborators.find(c => c.userId === req.userId)?.role || 'VIEWER'
    }));

    res.json({
      projects: formattedProjects,
      pagination: {
        total: totalCount,
        offset,
        limit,
        hasMore: (offset || 0) + (limit || 10) < totalCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single project by ID
router.get('/:projectId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId } = validateRequest(projectIdParamSchema, req.params);

    const project = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: req.userId },
          { 
            collaborators: {
              some: { userId: req.userId }
            }
          },
          { isPublic: true }
        ]
      },
      include: {
        user: {
          select: { id: true, email: true, username: true }
        },
        acts: {
          orderBy: { order: 'asc' },
          include: {
            plotPoints: {
              orderBy: { order: 'asc' },
              include: {
                scenes: {
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        },
        characters: true,
        settings: true,
        items: true,
        collaborators: {
          include: {
            user: {
              select: { id: true, email: true, username: true }
            }
          }
        }
      }
    });

    if (!project) {
      throw new NotFoundError('Project not found or access denied');
    }

    const userRole = project.userId === req.userId 
      ? 'OWNER' 
      : project.collaborators.find(c => c.userId === req.userId)?.role || 'VIEWER';

    res.json({
      project: {
        ...project,
        owner: {
          id: project.user.id,
          email: project.user.email,
          name: project.user.username
        },
        collaborators: project.collaborators.map(collab => ({
          id: collab.id,
          role: collab.role,
          user: {
            id: collab.user.id,
            email: collab.user.email,
            name: collab.user.username
          }
        })),
        userRole
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create new project
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { title, description, tags, template } = validateRequest(
      createProjectSchema, 
      req.body
    );

    console.log('Creating project with template:', template);

    // Create the project in a transaction to ensure acts are created atomically
    const result = await db.$transaction(async (tx) => {
      // Create the project
      const project = await tx.project.create({
        data: {
          title,
          description,
          tags: tags || [],
          isPublic: false,
          userId: req.userId!,
        },
        include: {
          user: {
            select: { id: true, email: true, username: true }
          },
        }
      });

      // Create default acts based on template
      const defaultActs = getDefaultActsForTemplate(template);
      console.log('Default acts for template:', template, defaultActs);
      const createdActs = [];
      
      for (const actTemplate of defaultActs) {
        console.log('Creating act:', actTemplate);
        const act = await tx.act.create({
          data: {
            projectId: project.id,
            name: actTemplate.name,
            description: actTemplate.description,
            order: actTemplate.order,
          }
        });
        createdActs.push(act);
      }

      // Set the first act as the current act
      const updatedProject = await tx.project.update({
        where: { id: project.id },
        data: {
          currentActId: createdActs[0]?.id || null,
        },
        include: {
          user: {
            select: { id: true, email: true, username: true }
          },
          _count: {
            select: {
              acts: true,
              plotPoints: true,
              scenes: true,
              characters: true,
              collaborators: true,
            }
          }
        }
      });

      return updatedProject;
    });

    res.status(201).json({
      project: {
        ...result,
        owner: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.username
        },
        userRole: 'OWNER'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update project
router.patch('/:projectId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId } = validateRequest(projectIdParamSchema, req.params);
    const updateData = validateRequest(updateProjectSchema, req.body);

    console.log('PATCH project request:', { projectId, updateData, body: req.body });

    // Check permission
    const existingProject = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: req.userId },
          { 
            collaborators: {
              some: { 
                userId: req.userId,
                role: { in: ['EDITOR', 'OWNER'] }
              }
            }
          }
        ]
      }
    });

    if (!existingProject) {
      throw new NotFoundError('Project not found or insufficient permissions');
    }

    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        user: {
          select: { id: true, email: true, username: true }
        }
      }
    });

    res.json({
      project: {
        ...updatedProject,
        owner: {
          id: updatedProject.user.id,
          email: updatedProject.user.email,
          name: updatedProject.user.username
        }
      }
    });
  } catch (error) {
    console.error('Project update error:', error);
    console.error('Update data:', req.body);
    console.error('Project ID:', req.params.projectId);
    next(error);
  }
});

// Delete project
router.delete('/:projectId', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('User not authenticated');
    }

    const { projectId } = validateRequest(projectIdParamSchema, req.params);

    // Check if user owns the project
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        userId: req.userId
      }
    });

    if (!project) {
      throw new NotFoundError('Project not found or insufficient permissions');
    }

    await db.project.delete({
      where: { id: projectId }
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
