// Shared types between frontend and backend
// These types mirror the Prisma schema but are serialization-safe

export interface User {
  id: string;
  email: string;
  username?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  subscriptionTier: 'FREE' | 'PREMIUM' | 'PROFESSIONAL';
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  defaultZoomLevel: ZoomLevel;
  autoSaveInterval: number;
  enableKeyboardShortcuts: boolean;
  canvasBackgroundColor: string;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description?: string;
  tags: string[];
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  templateId?: string;
  goals?: ProjectGoals;
  metadata?: ProjectMetadata;
  currentActId?: string;
  currentZoomLevel: ZoomLevel;
  focusedElementId?: string;
  isPublic: boolean;
  
  // Relations (when included)
  acts?: Act[];
  plotPoints?: PlotPoint[];
  scenes?: Scene[];
  characters?: Character[];
  settings?: Setting[];
  items?: Item[];
  collaborators?: ProjectCollaborator[];
}

export interface ProjectGoals {
  targetWordCount?: number;
  targetActCount?: number;
  targetPlotPointCount?: number;
  deadline?: Date;
  completionPercentage: number;
}

export interface ProjectMetadata {
  actCount: number;
  plotPointCount: number;
  sceneCount: number;
  characterCount: number;
  wordCount: number;
  lastModifiedBy: string;
}

export interface ProjectCollaborator {
  id: string;
  userId: string;
  projectId: string;
  role: 'VIEWER' | 'EDITOR' | 'OWNER';
  addedAt: Date;
  addedBy: string;
  
  // Relations (when included)
  user?: Pick<User, 'id' | 'email' | 'username'>;
}

export interface Act {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  canvasState?: ActCanvasState;
  
  // Relations (when included)
  plotPoints?: PlotPoint[];
}

export interface ActCanvasState {
  zoom: number;
  panPosition: { x: number; y: number };
  selectedNodeIds: string[];
  expandedPlotPointIds: string[];
}

export interface PlotPoint {
  id: string;
  projectId: string;
  actId: string;
  title: string;
  synopsis?: string;
  position: { x: number; y: number };
  color: string;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (when included)
  scenes?: Scene[];
}

export interface Scene {
  id: string;
  projectId: string;
  plotPointId: string;
  title: string;
  synopsis?: string;
  content?: string;
  wordCount: number;
  position?: { x: number; y: number };
  order?: number;
  createdAt: Date;
  updatedAt: Date;
  settingId?: string;
  
  // Relations (when included)
  setting?: Setting;
  characters?: SceneCharacter[];
  items?: SceneItem[];
}

export interface Character {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  appearance?: string;
  personality?: string;
  motivation?: string;
  backstory?: string;
  characterType: 'PROTAGONIST' | 'ANTAGONIST' | 'SUPPORTING' | 'MINOR';
  arcNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (when included)
  scenes?: SceneCharacter[];
}

export interface Setting {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  location?: string;
  timeOfDay?: string;
  weather?: string;
  mood?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (when included)
  scenes?: Scene[];
}

export interface Item {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  significance?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (when included)
  scenes?: SceneItem[];
}

export interface SceneCharacter {
  id: string;
  sceneId: string;
  characterId: string;
  role?: string;
  emotionalState?: string;
  createdAt: Date;
  
  // Relations (when included)
  character?: Character;
}

export interface SceneItem {
  id: string;
  sceneId: string;
  itemId: string;
  usage?: string;
  createdAt: Date;
  
  // Relations (when included)
  item?: Item;
}

export interface ActivityLog {
  id: string;
  userId: string;
  projectId?: string;
  entityType: 'PROJECT' | 'ACT' | 'PLOT_POINT' | 'SCENE' | 'CHARACTER' | 'SETTING' | 'ITEM';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'MOVE' | 'DUPLICATE';
  changes?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  type: 'NOVEL' | 'SCREENPLAY' | 'SHORT_STORY' | 'FROM_SCRATCH' | 'CUSTOM';
  isSystem: boolean;
  defaultActs: ActTemplate[];
  createdBy?: string;
  createdAt: Date;
}

export interface ActTemplate {
  name: string;
  description: string;
  order: number;
}

// Enums that match the database
export enum ZoomLevel {
  STORY_OVERVIEW = 'STORY_OVERVIEW',
  PLOT_POINT_FOCUS = 'PLOT_POINT_FOCUS',
  SCENE_DETAIL = 'SCENE_DETAIL',
  CHARACTER_FOCUS = 'CHARACTER_FOCUS'
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name?: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
  template?: 'NOVEL' | 'SCREENPLAY' | 'SHORT_STORY' | 'FROM_SCRATCH';
  tags?: string[];
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  tags?: string[];
  status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  goals?: ProjectGoals;
  currentActId?: string;
  currentZoomLevel?: ZoomLevel;
  focusedElementId?: string;
}

export interface CreateActRequest {
  name: string;
  description?: string;
  order: number;
}

export interface UpdateActRequest {
  name?: string;
  description?: string;
  order?: number;
  canvasState?: ActCanvasState;
}

export interface CreatePlotPointRequest {
  actId: string;
  title: string;
  synopsis?: string;
  position: { x: number; y: number };
  color?: string;
  order?: number;
}

export interface UpdatePlotPointRequest {
  title?: string;
  synopsis?: string;
  position?: { x: number; y: number };
  color?: string;
  order?: number;
  actId?: string; // For moving between acts
}

export interface CreateSceneRequest {
  plotPointId: string;
  title: string;
  synopsis?: string;
  content?: string;
  position?: { x: number; y: number };
  order?: number;
  settingId?: string;
  characterIds?: string[];
  itemIds?: string[];
}

export interface UpdateSceneRequest {
  title?: string;
  synopsis?: string;
  content?: string;
  position?: { x: number; y: number };
  order?: number;
  settingId?: string;
  characterIds?: string[];
  itemIds?: string[];
}

export interface CreateCharacterRequest {
  name: string;
  description?: string;
  appearance?: string;
  personality?: string;
  motivation?: string;
  backstory?: string;
  characterType?: 'PROTAGONIST' | 'ANTAGONIST' | 'SUPPORTING' | 'MINOR';
  arcNotes?: string;
}

export interface UpdateCharacterRequest {
  name?: string;
  description?: string;
  appearance?: string;
  personality?: string;
  motivation?: string;
  backstory?: string;
  characterType?: 'PROTAGONIST' | 'ANTAGONIST' | 'SUPPORTING' | 'MINOR';
  arcNotes?: string;
}

export interface CreateSettingRequest {
  name: string;
  description?: string;
  location?: string;
  timeOfDay?: string;
  weather?: string;
  mood?: string;
}

export interface UpdateSettingRequest {
  name?: string;
  description?: string;
  location?: string;
  timeOfDay?: string;
  weather?: string;
  mood?: string;
}

export interface CreateItemRequest {
  name: string;
  description?: string;
  significance?: string;
}

export interface UpdateItemRequest {
  name?: string;
  description?: string;
  significance?: string;
}

// Search and pagination types
export interface SearchProjectsRequest {
  query?: string;
  status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// WebSocket event types for real-time collaboration
export interface SocketEvents {
  // Project events
  'project:join': { projectId: string };
  'project:leave': { projectId: string };
  'project:update': { projectId: string; data: Partial<Project> };
  
  // Plot point events
  'plotpoint:create': { projectId: string; plotPoint: PlotPoint };
  'plotpoint:update': { projectId: string; plotPointId: string; data: Partial<PlotPoint> };
  'plotpoint:delete': { projectId: string; plotPointId: string };
  
  // Scene events
  'scene:create': { projectId: string; scene: Scene };
  'scene:update': { projectId: string; sceneId: string; data: Partial<Scene> };
  'scene:delete': { projectId: string; sceneId: string };
  
  // User presence
  'user:join': { projectId: string; user: Pick<User, 'id' | 'username' | 'email'> };
  'user:leave': { projectId: string; userId: string };
  'user:cursor': { projectId: string; userId: string; position: { x: number; y: number } };
}
