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
  emotions?: string;
  motivation?: string;
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
  STORY_OVERVIEW = 'story_overview',    // All plot points visible, scenes collapsed
  PLOT_POINT_FOCUS = 'plot_point_focus', // One plot point centered, scenes visible
  SCENE_DETAIL = 'scene_detail',        // Individual scene expanded with full detail hierarchy
  CHARACTER_FOCUS = 'character_focus'   // Character-specific information across multiple scenes
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
  acts: Act[];
  currentActId: string; // Currently active act
  characters: Character[]; // Story-wide characters
  plotPoints: PlotPoint[];
  lastModified: Date;
  currentZoomLevel: ZoomLevel;
  focusedElementId?: string; // ID of currently focused plot point or scene
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
