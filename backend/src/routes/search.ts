import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../lib/middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Search query validation schema
const searchQuerySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters'),
  types: z.string().optional(),
  projectId: z.string().optional(),
  actId: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50)
});

// Search result interface (matching frontend)
interface SearchResult {
  id: string;
  type: 'project' | 'character' | 'plotpoint' | 'scene' | 'act';
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  actId?: string;
  actName?: string;
  lastModified?: string;
  relevanceScore?: number;
}

// Global search endpoint
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { q, types, projectId, actId, limit } = searchQuerySchema.parse(req.query);
    const userId = req.userId!;
    
    // Parse types filter
    const searchTypes = types ? types.split(',') as SearchResult['type'][] : ['project', 'character', 'plotpoint', 'scene', 'act'];
    
    const results: SearchResult[] = [];
    const query = q.toLowerCase();

    // Get user's accessible projects
    const userProjects = await prisma.project.findMany({
      where: {
        OR: [
          { userId },
          {
            collaborators: {
              some: { userId }
            }
          }
        ],
        ...(projectId ? { id: projectId } : {})
      },
      select: {
        id: true,
        title: true,
        description: true,
        updatedAt: true
      }
    });

    const projectIds = userProjects.map(p => p.id);

    // Search projects
    if (searchTypes.includes('project') && !projectId) {
      for (const project of userProjects) {
        if (
          project.title.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query)
        ) {
          results.push({
            id: project.id,
            type: 'project',
            title: project.title,
            description: project.description || '',
            projectId: project.id,
            projectName: project.title,
            lastModified: project.updatedAt.toISOString()
          });
        }
      }
    }

    // Search acts
    if (searchTypes.includes('act') && projectIds.length > 0) {
      const acts = await prisma.act.findMany({
        where: {
          projectId: { in: projectIds },
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ],
          ...(actId ? { id: actId } : {})
        },
        include: {
          project: { select: { title: true } }
        },
        take: limit
      });

      for (const act of acts) {
        results.push({
          id: act.id,
          type: 'act',
          title: act.name,
          description: act.description || '',
          projectId: act.projectId,
          projectName: act.project.title,
          actId: act.id,
          actName: act.name,
          lastModified: act.updatedAt.toISOString()
        });
      }
    }

    // Search characters
    if (searchTypes.includes('character') && projectIds.length > 0) {
      const characters = await prisma.character.findMany({
        where: {
          projectId: { in: projectIds },
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { personality: { contains: query, mode: 'insensitive' } },
            { motivation: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          project: { select: { title: true } }
        },
        take: limit
      });

      for (const character of characters) {
        results.push({
          id: character.id,
          type: 'character',
          title: character.name,
          description: `${character.characterType} • ${character.description || ''}`,
          projectId: character.projectId,
          projectName: character.project.title,
          lastModified: character.updatedAt.toISOString()
        });
      }
    }

    // Search plot points
    if (searchTypes.includes('plotpoint') && projectIds.length > 0) {
      const plotPoints = await prisma.plotPoint.findMany({
        where: {
          projectId: { in: projectIds },
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { synopsis: { contains: query, mode: 'insensitive' } }
          ],
          ...(actId ? { actId } : {})
        },
        include: {
          project: { select: { title: true } },
          act: { select: { name: true } }
        },
        take: limit
      });

      for (const plotPoint of plotPoints) {
        results.push({
          id: plotPoint.id,
          type: 'plotpoint',
          title: plotPoint.title,
          description: plotPoint.synopsis || '',
          projectId: plotPoint.projectId,
          projectName: plotPoint.project.title,
          actId: plotPoint.actId,
          actName: plotPoint.act.name,
          lastModified: plotPoint.updatedAt.toISOString()
        });
      }
    }

    // Search scenes
    if (searchTypes.includes('scene') && projectIds.length > 0) {
      const scenes = await prisma.scene.findMany({
        where: {
          projectId: { in: projectIds },
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { synopsis: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } }
          ],
          ...(actId ? { plotPoint: { actId } } : {})
        },
        include: {
          project: { select: { title: true } },
          plotPoint: { 
            select: { 
              actId: true,
              act: { select: { name: true } }
            } 
          }
        },
        take: limit
      });

      for (const scene of scenes) {
        results.push({
          id: scene.id,
          type: 'scene',
          title: scene.title,
          description: scene.synopsis || '',
          projectId: scene.projectId,
          projectName: scene.project.title,
          actId: scene.plotPoint.actId,
          actName: scene.plotPoint.act.name,
          lastModified: scene.updatedAt.toISOString()
        });
      }
    }

    // Sort results by relevance (title matches first, then by last modified)
    results.sort((a, b) => {
      const aExactMatch = a.title.toLowerCase() === query;
      const bExactMatch = b.title.toLowerCase() === query;
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      const aStartsWith = a.title.toLowerCase().startsWith(query);
      const bStartsWith = b.title.toLowerCase().startsWith(query);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Sort by last modified (most recent first)
      if (a.lastModified && b.lastModified) {
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      }
      
      return 0;
    });

    // Limit final results
    const limitedResults = results.slice(0, limit);

    res.json({
      results: limitedResults,
      total: limitedResults.length,
      query: q,
      types: searchTypes
    });

  } catch (error) {
    console.error('Search error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid search parameters',
        details: error.errors
      });
    }
    
    res.status(500).json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
