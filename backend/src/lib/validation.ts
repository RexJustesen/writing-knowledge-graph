import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username must be less than 50 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Project validation schemas
export const createProjectSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  template: z.enum(['NOVEL', 'SCREENPLAY', 'SHORT_STORY', 'FROM_SCRATCH']).optional(),
  tags: z.array(z.string().max(50)).max(20, 'Too many tags').optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
  currentActId: z.string().optional(),
  currentZoomLevel: z.enum(['STORY_OVERVIEW', 'PLOT_POINT_FOCUS', 'SCENE_DETAIL', 'CHARACTER_FOCUS']).optional(),
  focusedElementId: z.string().optional().nullable(),
  goals: z.object({
    targetWordCount: z.number().positive().optional(),
    targetActCount: z.number().positive().optional(),
    targetPlotPointCount: z.number().positive().optional(),
    deadline: z.string().datetime().optional(),
    completionPercentage: z.number().min(0).max(100),
  }).optional(),
});

// Act validation schemas
export const createActSchema = z.object({
  name: z.string().min(1, 'Act name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').nullable().optional(),
  order: z.number().int().positive('Order must be a positive integer'),
});

export const updateActSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  order: z.number().int().positive().optional(),
  canvasState: z.object({
    zoom: z.number().positive(),
    panPosition: z.object({
      x: z.number(),
      y: z.number(),
    }),
    selectedNodeIds: z.array(z.string()),
    expandedPlotPointIds: z.array(z.string()),
  }).optional(),
});

// Plot Point validation schemas
export const createPlotPointSchema = z.object({
  actId: z.string().min(1, 'Act ID is required'),
  title: z.string().min(1, 'Plot point title is required').max(100, 'Title too long'),
  synopsis: z.string().max(1000, 'Synopsis too long').optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  order: z.number().int().optional(),
});

export const updatePlotPointSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  synopsis: z.string().max(1000).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  order: z.number().int().optional(),
  actId: z.string().optional(), // For moving between acts
});

// Scene validation schemas
export const createSceneSchema = z.object({
  plotPointId: z.string().min(1, 'Plot point ID is required'),
  title: z.string().min(1, 'Scene title is required').max(100, 'Title too long'),
  synopsis: z.string().max(1000, 'Synopsis too long').optional(),
  content: z.string().max(50000, 'Content too long').optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  order: z.number().int().optional(),
  settingId: z.string().optional(),
  characterIds: z.array(z.string()).optional(),
  itemIds: z.array(z.string()).optional(),
});

export const updateSceneSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  synopsis: z.string().max(1000).optional(),
  content: z.string().max(50000).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  order: z.number().int().optional(),
  settingId: z.string().optional(),
  characterIds: z.array(z.string()).optional(),
  itemIds: z.array(z.string()).optional(),
});

// Character validation schemas
export const createCharacterSchema = z.object({
  name: z.string().min(1, 'Character name is required').max(100, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  appearance: z.string().max(1000, 'Appearance description too long').optional(),
  personality: z.string().max(1000, 'Personality description too long').optional(),
  motivation: z.string().max(1000, 'Motivation description too long').optional(),
  backstory: z.string().max(2000, 'Backstory too long').optional(),
  characterType: z.enum(['PROTAGONIST', 'ANTAGONIST', 'SUPPORTING', 'MINOR', 'protagonist', 'antagonist', 'supporting', 'minor']).optional(),
  arcNotes: z.string().max(2000, 'Arc notes too long').optional(),
});

export const updateCharacterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  appearance: z.string().max(1000).optional(),
  personality: z.string().max(1000).optional(),
  motivation: z.string().max(1000).optional(),
  backstory: z.string().max(2000).optional(),
  characterType: z.enum(['PROTAGONIST', 'ANTAGONIST', 'SUPPORTING', 'MINOR', 'protagonist', 'antagonist', 'supporting', 'minor']).optional(),
  arcNotes: z.string().max(2000).optional(),
});

// Setting validation schemas
export const createSettingSchema = z.object({
  name: z.string().min(1, 'Setting name is required').max(100, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  location: z.string().max(200, 'Location too long').optional(),
  timeOfDay: z.string().max(50, 'Time of day too long').optional(),
  weather: z.string().max(100, 'Weather description too long').optional(),
  mood: z.string().max(100, 'Mood description too long').optional(),
});

export const updateSettingSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  timeOfDay: z.string().max(50).optional(),
  weather: z.string().max(100).optional(),
  mood: z.string().max(100).optional(),
});

// Item validation schemas
export const createItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  significance: z.string().max(1000, 'Significance description too long').optional(),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  significance: z.string().max(1000).optional(),
});

// Search and pagination schemas
export const searchProjectsSchema = z.object({
  query: z.string().max(100).optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// Common parameter schemas
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const projectIdParamSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
});

export const actIdParamSchema = z.object({
  actId: z.string().min(1, 'Act ID is required'),
});

export const plotPointIdParamSchema = z.object({
  plotPointId: z.string().min(1, 'Plot point ID is required'),
});

export const sceneIdParamSchema = z.object({
  sceneId: z.string().min(1, 'Scene ID is required'),
});

export const characterIdParamSchema = z.object({
  characterId: z.string().min(1, 'Character ID is required'),
});

export const settingIdParamSchema = z.object({
  settingId: z.string().min(1, 'Setting ID is required'),
});

export const itemIdParamSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
});

// Utility function to validate request data
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}
