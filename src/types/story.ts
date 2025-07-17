// Plot Point Categories for Sprint 2
export enum PlotPointCategory {
  ACTION = 'action',           // ⚔️ Red
  CHARACTER = 'character',     // 👤 Blue  
  WORLDBUILDING = 'world',     // 🌍 Green
  CONFLICT = 'conflict',       // ⚡ Orange
  RESOLUTION = 'resolution',   // ✅ Purple
  TWIST = 'twist',            // 🔄 Yellow
  ROMANCE = 'romance',        // ❤️ Pink
  MYSTERY = 'mystery'         // 🔍 Dark Blue
}

// Event Types for structural story elements - tracks what story beats are covered
export enum EventType {
  // Universal Story Beats
  INCITING_INCIDENT = 'inciting_incident',
  CATALYST = 'catalyst',
  PLOT_POINT_1 = 'plot_point_1',
  MIDPOINT_REVELATION = 'midpoint_revelation',
  PLOT_POINT_2 = 'plot_point_2',
  CLIMAX = 'climax',
  RESOLUTION = 'resolution',
  DARK_MOMENT = 'dark_moment',
  BREAKTHROUGH = 'breakthrough',
  FINAL_CONFRONTATION = 'final_confrontation',
  
  // Romance Specific
  MEET_CUTE = 'meet_cute',
  FALLING_IN_LOVE = 'falling_in_love',
  RELATIONSHIP_DEEPENS = 'relationship_deepens',
  MAJOR_CONFLICT = 'major_conflict',
  GRAND_GESTURE = 'grand_gesture',
  HAPPY_ENDING = 'happy_ending',
  
  // Mystery/Thriller Specific
  CRIME_DISCOVERY = 'crime_discovery',
  INVESTIGATION_BEGINS = 'investigation_begins',
  FALSE_LEAD = 'false_lead',
  KEY_REVELATION = 'key_revelation',
  UNMASKING = 'unmasking'
}

// Data models based on PRD Section 5.5 - Development Architecture
export interface PlotPoint {
  id: string;
  title: string;
  position: { x: number; y: number };
  color: string;
  actId: string; // Changed from act number to act ID for flexibility
  scenes: Scene[];
  // Sprint 2 additions
  category?: PlotPointCategory;
  description?: string;
  guidance?: string; // Template guidance text
  templateId?: string; // If created from template
  eventType?: EventType; // Structural story element type for suggestion system
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
  // Sprint 2 additions
  genre?: string; // Detected or user-selected genre
  templateId?: string; // If created from template
}

// Sprint 2: Template System
export interface PlotPointTemplate {
  id: string;
  name: string;
  description: string;
  guidance: string;
  actId: string;
  order: number;
  genre: string[];
  optional: boolean;
  category: PlotPointCategory;
  defaultTitle: string;
}

export interface StoryTemplate {
  id: string;
  name: string;
  genre: string;
  description: string;
  plotPoints: PlotPointTemplate[];
  actStructure: number; // 3, 4, or 5 acts
}

export interface QuickTemplate {
  id: string;
  name: string;
  category: PlotPointCategory;
  defaultTitle: string;
  descriptionTemplate: string;
  suggestedFields: string[];
  eventType?: EventType;
}

// Sprint 2: Story Analysis & Suggestions
export interface PlotPointSuggestion {
  id: string;
  title: string;
  description: string;
  reasoning: string;
  suggestedActId: string;
  confidence: number; // 0-1 score
  templateSource?: string;
  templateId?: string; // ID to look up in DetailedTemplateService
  guidance?: string; // Optional guidance text
  category: PlotPointCategory;
  eventType?: EventType; // Structural story element this suggestion represents
  sceneTemplates?: SceneTemplate[]; // Scenes to create with this plot point
  requiredCharacters?: string[]; // Character types that should exist
  needsActCreation?: boolean; // Whether accepting this suggestion requires creating a new act
  message?: string; // Enhanced message that includes act creation context
}

export interface SceneTemplate {
  title: string;
  synopsis: string;
  content?: string;
  sceneOrder: number;
  position?: { x: number; y: number };
}

// Sprint 2: Story Structure Validation
export interface StructureValidation {
  score: number; // 0-100
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  strengths: string[];
}

export interface ValidationWarning {
  type: 'missing_element' | 'pacing_issue' | 'genre_mismatch' | 'overcrowded_act';
  message: string;
  suggestion: string;
  actId?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ValidationSuggestion {
  id: string;
  message: string;
  action: string;
  templateId?: string;
  suggestedActId?: string;
  needsActCreation?: boolean;
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
