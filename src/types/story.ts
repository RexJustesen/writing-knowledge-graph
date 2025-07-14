// Data models based on PRD Section 5.5 - Development Architecture
export interface PlotPoint {
  id: string;
  title: string;
  position: { x: number; y: number };
  color: string;
  actId: string; // Changed from act number to act ID for flexibility
  scenes: Scene[];
}

export interface Scene {
  id: string;
  title: string;
  synopsis: string;
  characterIds: string[]; // Changed from characters array to character IDs
  setting: Setting;
  items: Item[];
  position?: { x: number; y: number }; // Position relative to parent plot point
}

export interface Character {
  id: string;
  name: string;
  appearance?: string;
  personality?: string;
  motivation?: string;
  characterType?: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
}

export interface Setting {
  id: string;
  name: string;
  description?: string;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
}

// Zoom levels as defined in PRD Section 4.5
export enum ZoomLevel {
  STORY_OVERVIEW = 'STORY_OVERVIEW',    // All plot points visible, scenes collapsed
  PLOT_POINT_FOCUS = 'PLOT_POINT_FOCUS', // One plot point centered, scenes visible
  SCENE_DETAIL = 'SCENE_DETAIL',        // Individual scene expanded with full detail hierarchy
  CHARACTER_FOCUS = 'CHARACTER_FOCUS'   // Character-specific information across multiple scenes
}

// Act structure for act-based canvas system
export interface Act {
  id: string;
  name: string;
  description?: string;
  order: number; // For ordering tabs
  canvasState?: {
    zoom: number;
    pan: { x: number; y: number };
  };
}

// Project data structure for JSON serialization
export interface Project {
  id: string;
  title: string;
  description?: string; // Optional project description
  tags?: string[]; // For categorization and filtering
  status?: 'draft' | 'in-progress' | 'completed' | 'archived'; // Project status
  createdDate: Date;
  lastModified: Date;
  lastAccessed?: Date; // For sorting by recent activity
  goals?: {
    targetWordCount?: number;
    targetActCount?: number;
    targetPlotPointCount?: number;
    deadline?: Date;
  }; // Optional project goals
  acts: Act[];
  currentActId: string; // Currently active act
  characters: Character[]; // Story-wide characters
  plotPoints: PlotPoint[];
  currentZoomLevel: ZoomLevel;
  focusedElementId?: string; // ID of currently focused plot point or scene
}

// Project metadata for homepage display
export interface ProjectMetadata {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  status?: 'draft' | 'in-progress' | 'completed' | 'archived';
  createdDate: Date;
  lastModified: Date;
  lastAccessed?: Date;
  actCount: number;
  plotPointCount: number;
  sceneCount: number;
  characterCount: number;
}

// Cytoscape.js node and edge data interfaces
export interface CytoscapeNodeData {
  id: string;
  label: string;
  type: 'plot-point' | 'scene' | 'character' | 'setting' | 'item';
  parentId?: string;
  data: PlotPoint | Scene | Character | Setting | Item;
}

export interface CytoscapeEdgeData {
  id: string;
  source: string;
  target: string;
  type: 'contains' | 'relates-to';
}
