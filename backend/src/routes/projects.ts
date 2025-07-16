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
import { getTemplateById, getLegacyTemplate, BACKEND_STORY_TEMPLATES } from '../lib/storyTemplates';

// Helper function to get template data - supports both new Sprint 2 templates and legacy templates
function getTemplateData(templateId?: string): { template: any; isLegacy: boolean } {
  // Handle legacy templates first
  if (templateId && ['NOVEL', 'SCREENPLAY', 'SHORT_STORY', 'FROM_SCRATCH'].includes(templateId)) {
    const legacyTemplate = getLegacyTemplate(templateId as 'NOVEL' | 'SCREENPLAY' | 'SHORT_STORY' | 'FROM_SCRATCH');
    return { template: legacyTemplate, isLegacy: true };
  }
  
  // Handle new Sprint 2 templates
  if (templateId) {
    const newTemplate = getTemplateById(templateId);
    if (newTemplate) {
      return { template: newTemplate, isLegacy: false };
    }
  }
  
  // Default to three-act structure
  const defaultTemplate = getTemplateById('three-act-universal');
  return { template: defaultTemplate, isLegacy: false };
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

    // Get template data
    const { template: templateData, isLegacy } = getTemplateData(template);
    console.log('Using template data:', templateData?.name, 'isLegacy:', isLegacy);

    // Create the project in a transaction to ensure everything is created atomically
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

      let createdActs = [];
      let actIdMapping: { [order: number]: string } = {};

      if (templateData) {
        // Create acts from template
        console.log('Creating acts from template:', templateData.acts);
        for (const actTemplate of templateData.acts) {
          const act = await tx.act.create({
            data: {
              projectId: project.id,
              name: actTemplate.name,
              description: actTemplate.description,
              order: actTemplate.order,
            }
          });
          createdActs.push(act);
          actIdMapping[actTemplate.order] = act.id;
          console.log(`Created act: ${actTemplate.name} with ID: ${act.id}`);
        }

        // Create characters from template (if any)
        if (templateData.characters && templateData.characters.length > 0) {
          console.log('Creating characters from template:', templateData.characters.length);
          for (const charTemplate of templateData.characters) {
            await tx.character.create({
              data: {
                projectId: project.id,
                name: charTemplate.name,
                description: charTemplate.description || '',
                appearance: charTemplate.appearance || '',
                personality: charTemplate.personality || '',
                motivation: charTemplate.motivation || '',
                characterType: charTemplate.characterType,
              }
            });
            console.log(`Created character: ${charTemplate.name}`);
          }
        }

        // Create plot points and scenes from template (if any)
        if (templateData.plotPoints && templateData.plotPoints.length > 0) {
          console.log('Creating plot points from template:', templateData.plotPoints.length);
          for (const plotPointTemplate of templateData.plotPoints) {
            const actId = actIdMapping[plotPointTemplate.actOrder];
            if (!actId) {
              console.warn(`No act found for order ${plotPointTemplate.actOrder}, skipping plot point`);
              continue;
            }

            // Create the plot point
            const plotPoint = await tx.plotPoint.create({
              data: {
                projectId: project.id,
                actId: actId,
                title: plotPointTemplate.title,
                synopsis: plotPointTemplate.description,
                position: {
                  x: 100 + (plotPointTemplate.plotPointOrder * 200) + (plotPointTemplate.actOrder - 1) * 600,
                  y: 100
                },
                color: plotPointTemplate.color,
                order: plotPointTemplate.plotPointOrder,
                // TODO: Add eventType support once types are updated
                eventType: plotPointTemplate.eventType,
              }
            });
            console.log(`Created plot point: ${plotPointTemplate.title} with ID: ${plotPoint.id}`);

            // Create scenes for this plot point (if any)
            if (plotPointTemplate.scenes && plotPointTemplate.scenes.length > 0) {
              for (const sceneTemplate of plotPointTemplate.scenes) {
                await tx.scene.create({
                  data: {
                    projectId: project.id,
                    plotPointId: plotPoint.id,
                    title: sceneTemplate.title,
                    synopsis: sceneTemplate.synopsis,
                    content: sceneTemplate.content || sceneTemplate.synopsis,
                    position: {
                      // Always position scenes relative to their plot point for better layout
                      x: (plotPoint.position as any).x + (sceneTemplate.sceneOrder * 120), // Slightly more spacing
                      y: (plotPoint.position as any).y + 60 // Slightly below the plot point
                    },
                    order: sceneTemplate.sceneOrder,
                  }
                });
                console.log(`Created scene: ${sceneTemplate.title}`);
              }
            }
          }
        }
      } else {
        // Fallback: create default act if no template
        const defaultAct = await tx.act.create({
          data: {
            projectId: project.id,
            name: 'Act 1',
            description: 'First act',
            order: 1,
          }
        });
        createdActs.push(defaultAct);
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
