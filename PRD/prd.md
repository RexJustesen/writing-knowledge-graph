# Product Requirements Document: Campfire App Prototype
## Visual Mind Map Writing Tool

**Version:** 1.3  
**Date:** July 7, 2025  
**Product Owner:** [Your Name]  
**Status:** Requirements Definition

---

## 1. Executive Summary

### Product Vision
A revolutionary writing application that transforms story development from linear scene-based organization to a visual, plot-centric mind map interface. Writers can manage multiple projects (stories/books) from a central homepage, with each project containing its own act-based organization system. Within each project, writers can organize their stories by acts, with each act containing its own visual canvas where plot points and scenes are mapped as interconnected nodes.

### Core Value Proposition
- **Project Management**: Central homepage for managing multiple writing projects
- **Act-Based Organization**: Separate visual canvases for each story act, reducing complexity
- **Plot-First Thinking**: Organize stories around plot points, not scenes
- **Visual Context**: Never lose sight of story structure while working on details
- **Rapid Reference**: Instant access to any story element without navigation guesswork
- **Nested Intelligence**: Expandable detail layers that maintain hierarchical relationships

---

## 2. Problem Statement

### Current Pain Points with Existing Tools
1. **Project Isolation**: No central place to manage multiple writing projects
2. **Too Many Clicks**: Critical information buried behind multiple navigation layers
3. **Lack of Visual Structure**: Folder-based organization obscures story relationships
4. **Scene Disconnection**: Individual scenes feel isolated without plot context
5. **Cognitive Load**: Writers must remember location and relationship of story elements
6. **Act Confusion**: All story elements crammed into one view creates visual overwhelm

### User Frustration Quote
*"I work on multiple stories at once, but every writing tool forces me to juggle separate files or projects. I want one place to see all my stories and jump into whichever one I'm feeling inspired to work on. Once I'm in a story, I think in plot points, not individual scenes. I don't want to click through blind folders—I want to recognize scenes by where they live in the story structure visually. But I also don't want to see my entire novel's complexity at once—I need to focus on one act at a time."*

---

## 3. Target Users

### Primary User Persona: "The Plot-Driven Writer"
- **Writing Style**: Conceptualizes stories through major plot points first
- **Workflow**: Prefers visual organization over linear/chronological structure
- **Needs**: Quick reference, contextual awareness, structural clarity
- **Frustrations**: Current tools force linear thinking and hide relationships

### Secondary Users
- Screenwriters working with three-act structure
- Novelists managing complex multi-POV narratives
- Writing teachers demonstrating story structure

---

## 4. Core Features & Requirements

### 4.1 Project Management Homepage

#### Primary Requirement
**Central Project Dashboard**: A homepage where users can view, create, and manage multiple writing projects

**User Stories:**
- As a writer, I want to see all my writing projects on one homepage so I can choose which story to work on
- As a writer, I want to create new projects quickly so I can capture inspiration for new stories
- As a writer, I want to see project metadata (last modified, word count, act count) so I can prioritize my work
- As a writer, I want to organize my projects visually so I can find them easily
- As a writer, I want to duplicate existing projects so I can explore alternative story directions

**Acceptance Criteria:**
- Homepage displays all projects as visual cards/tiles
- Each project card shows title, last modified date, and key metrics
- "New Project" button creates a new project with default settings
- Projects can be organized, sorted, and filtered
- Clicking a project navigates to that project's act-based canvas system
- Projects can be renamed, duplicated, or deleted from the homepage

### 4.2 Project Creation & Setup

#### Primary Requirement
**Streamlined Project Initialization**: Quick setup flow for new writing projects

**User Stories:**
- As a writer, I want to create a new project by clicking one button and entering a title
- As a writer, I want new projects to start with a default act structure so I can begin immediately
- As a writer, I want to choose from project templates (novel, screenplay, short story) to get appropriate starting structure
- As a writer, I want to import existing projects from other tools or file formats

**Acceptance Criteria:**
- New project dialog requires only a project title to create
- Projects initialize with "Act 1" canvas by default
- Optional project templates provide pre-configured act structures
- Project creation is under 3 clicks from homepage
- Projects are immediately accessible after creation

### 4.3 Project Navigation & Organization

#### Primary Requirement
**Efficient Project Discovery**: Tools for finding and organizing multiple projects

**User Stories:**
- As a writer, I want to search across all my projects so I can find specific stories quickly
- As a writer, I want to tag projects by genre, status, or priority so I can filter them
- As a writer, I want to see recent projects first so I can continue where I left off
- As a writer, I want to archive completed projects so they don't clutter my active workspace

**Acceptance Criteria:**
- Global search searches across project titles and metadata
- Project filtering by tags, status, and creation date
- Recently accessed projects appear at top of homepage
- Archive/unarchive functionality for project organization
- Breadcrumb navigation showing: Homepage → Project → Act

### 4.4 Project Metadata & Analytics

#### Primary Requirement
**Project Progress Tracking**: Visual indicators of project status and progress

**User Stories:**
- As a writer, I want to see how many acts, plot points, and scenes each project contains
- As a writer, I want to track my writing progress across all projects
- As a writer, I want to see when I last worked on each project
- As a writer, I want to set project goals and track completion

**Acceptance Criteria:**
- Project cards display act count, plot point count, and scene count
- Last modified timestamp visible on each project
- Progress indicators for project completion status
- Optional project goals with progress tracking
- Export statistics for individual projects

### 4.5 Act-Based Canvas System

#### Primary Requirement
**Separate Act Canvases**: Each story act exists as its own independent visual graph canvas

**User Stories:**
- As a writer, I want to work on one act at a time so I can focus without being overwhelmed by the entire story
- As a writer, I want to easily switch between acts so I can maintain story continuity
- As a writer, I want to create new acts when my story structure evolves
- As a writer, I want each act to have its own visual space so I can organize plot points without crowding

**Acceptance Criteria:**
- Each act has its own dedicated Cytoscape.js canvas instance
- Acts are completely separate graphs with no visual overlap
- Switching between acts preserves the zoom level and position of each canvas
- Users can create unlimited acts with descriptive names
- Act canvases load independently for performance

### 4.6 Act Navigation System

#### Primary Requirement
**Top Navigation Bar**: Horizontal tab system for act switching and management

**User Stories:**
- As a writer, I want to see all my acts in a top navigation bar so I can quickly switch between them
- As a writer, I want to click on an act tab to instantly switch to that act's canvas
- As a writer, I want to see which act I'm currently viewing with clear visual indication
- As a writer, I want to right-click on act tabs to access management options (rename, delete, duplicate)

**Acceptance Criteria:**
- Top navigation bar shows all acts as clickable tabs
- Active act tab is visually highlighted with distinct styling
- Act tabs display act names (e.g., "Act 1", "Setup", "Rising Action")
- Tabs support right-click context menus for act management
- Navigation bar is always visible and accessible regardless of zoom level

### 4.7 New Act Creation

#### Primary Requirement
**Dynamic Act Creation**: Users can create new acts with blank canvases at any time

**User Stories:**
- As a writer, I want to create a new act by clicking a "+" button in the navigation bar
- As a writer, I want to name my acts meaningfully (not just "Act 1", "Act 2")
- As a writer, I want new acts to start with a blank canvas so I can structure them from scratch
- As a writer, I want to create acts based on my story's unique structure (not limited to 3-act format)

**Acceptance Criteria:**
- "+" button in navigation bar opens new act creation dialog
- Users can enter custom act names (with validation for uniqueness)
- New acts initialize with empty Cytoscape.js canvas
- Acts can be reordered by dragging tabs in the navigation bar
- Default act naming follows pattern: "Act 1", "Act 2", etc. (but editable)

### 4.8 Plot-First Visual Architecture (Per Act)

#### Primary Requirement
**Central Plot Point Hubs**: Each major plot point serves as a central node within its act's canvas

**User Stories:**
- As a writer, I want to see my major plot points as central bubbles within each act so I can understand that act's structure
- As a writer, I want to add new plot points by clicking in empty space within an act's canvas
- As a writer, I want to rearrange plot points spatially within each act so I can experiment with structure

**Acceptance Criteria:**
- Plot points appear as prominent circular nodes within their act canvas
- Users can drag and drop plot points to reposition them within the act
- Plot points can be color-coded by importance or type within each act
- Plot point labels are always visible without hovering
- Each act canvas can contain multiple plot points without overcrowding

### 4.9 Scene Constellation System (Per Act)

#### Primary Requirement
**Connected Scene Bubbles**: Scenes orbit around their parent plot points within each act

**User Stories:**
- As a writer, I want to see which scenes belong to each plot point within an act
- As a writer, I want to click on a scene bubble to zoom in and see its details
- As a writer, I want to add scenes to plot points by dragging from the plot point outward
- As a writer, I want scenes to stay within their act's canvas boundaries

**Acceptance Criteria:**
- Scene bubbles are visually connected to plot points with lines/curves
- Scene bubbles are smaller than plot points but clearly labeled
- Clicking a scene bubble triggers a zoom-in animation to detail view
- Scene bubbles can be repositioned around their parent plot point within the act
- Scenes cannot be moved between acts via dragging (intentional constraint)

### 4.10 Nested Detail Layers

#### Primary Requirement
**Expandable Information Hierarchy**: Each story element can reveal progressively detailed information

**Information Architecture:**
```
Act
├── Plot Point 1
│   ├── Scene 1
│   │   ├── Characters Present
│   │   │   ├── Character A
│   │   │   │   ├── Appearance
│   │   │   │   ├── Emotions
│   │   │   │   └── Motivation
│   │   │   └── Character B
│   │   ├── Items/Props
│   │   ├── Setting/Location
│   │   └── Synopsis
│   └── Scene 2
└── Plot Point 2
```

**User Stories:**
- As a writer, I want to expand scene details without losing sight of the plot point context
- As a writer, I want to see character information nested within scenes so I can track character arcs
- As a writer, I want to collapse details to return to the big picture view

**Acceptance Criteria:**
- Expandable nodes use consistent visual indicators (+ / - icons)
- Expansion animations are smooth and contextual
- Users can expand multiple detail layers simultaneously
- Breadcrumb navigation shows current detail level

### 4.11 Fast Reference System (Cross-Act)

#### Primary Requirement
**Zero-Navigation Information Access**: All story elements within an act are visually accessible without folder navigation

**User Stories:**
- As a writer, I want to see all my story elements for the current act on one canvas
- As a writer, I want to search across all acts and have results show me which act contains the information
- As a writer, I want to quickly jump between different acts without losing my place in each one

**Acceptance Criteria:**
- Global search highlights results and indicates which act contains them
- No information is hidden behind folders or tabs within an act
- Visual breadcrumbs show current act and focus area
- Quick keyboard shortcuts for act switching (Ctrl+1, Ctrl+2, etc.)
- Search results can automatically switch to the correct act

### 4.12 Zoom & Focus Controls (Per Act)

#### Primary Requirement
**Multi-Level Zoom Interface**: Users can zoom from act overview to detailed scene work within each act

**Zoom Levels:**
1. **Act Overview**: All plot points in current act visible, scenes collapsed
2. **Plot Point Focus**: One plot point centered, scenes visible
3. **Scene Detail**: Individual scene expanded with full detail hierarchy
4. **Character Focus**: Character-specific information across scenes within the act

**User Stories:**
- As a writer, I want to zoom out to see my entire act structure when I'm feeling lost
- As a writer, I want to zoom into a specific plot point when I need to work on its scenes
- As a writer, I want smooth transitions between zoom levels so I maintain context

**Acceptance Criteria:**
- Zoom controls are always accessible (toolbar + mouse wheel)
- Zoom transitions are animated and smooth
- Information density adapts to zoom level
- User can set default zoom level preferences

---

## 5. Technical Requirements

### 5.1 Platform Requirements
- **Primary Framework**: Next.js 14+ with TypeScript
- **Graph Visualization**: Multiple Cytoscape.js instances for act-based canvases
- **State Management**: Zustand or Redux for managing multiple projects and act states
- **Styling**: Tailwind CSS for responsive design including homepage and navigation
- **Routing**: Next.js App Router for project navigation (/ → /project/[id] → /project/[id]/act/[actId])
- **Future Platforms**: Desktop (Electron), Mobile (React Native)
- **Browser Support**: Chrome, Firefox, Safari, Edge (latest 2 versions)

### 5.2 Technology Stack Rationale

#### Next.js App Router Enhancement
- **Project Routing**: Clean URL structure for projects and acts (/project/story-1/act/act-1)
- **Dynamic Loading**: Each project loads independently for better performance
- **SEO Benefits**: Individual project pages can be indexed and shared
- **Back Button Support**: Browser navigation works naturally between homepage and projects

#### State Management Enhancement
- **Project Management**: Central store for managing all projects, active project, and homepage state
- **Project Isolation**: Each project maintains its own state bubble for acts and canvases
- **Cross-Project Operations**: Global search, project creation, and homepage filtering
- **Persistence**: Project-level auto-save with project-specific storage keys

#### Next.js with TypeScript
- **Component Architecture**: React's component-based structure ideal for reusable UI elements (nodes, edges, menus)
- **Type Safety**: TypeScript ensures robust data modeling for complex nested story structures
- **Performance**: Built-in optimization for fast loading and smooth interactions
- **SEO Ready**: Server-side rendering capabilities for future marketing pages
- **Developer Experience**: Excellent tooling and development server

#### Cytoscape.js for Graph Visualization
- **Graph-Focused Design**: Purpose-built for network structures representing story relationships
- **Interactive Features**: Native support for zooming, panning, dragging nodes, and event handling
- **Flexible Layouts**: Multiple graph layout algorithms for optimal story structure visualization
- **Customization**: Highly customizable appearance for nodes, edges, and labels
- **Performance**: Optimized for mid-size datasets (100+ plot points, 1000+ scenes)
- **Open Source**: Extensible architecture for custom features like nested intelligence

#### Alternative Considerations
- **Large Scale**: For extremely complex stories, WebGL-accelerated libraries (KeyLines, Ogma, react-force-graph) may be considered
- **Declarative Approach**: Libraries like Nivo or ECharts offer more guided development if needed

### 5.3 Performance Requirements
- **Homepage Load**: Project list loads in < 1 second
- **Project Switching**: Navigation between projects < 500ms
- **Act Switching**: Transition between acts within project < 500ms
- **Canvas Load**: Individual act canvas load < 1 second
- **Memory Usage**: Efficient management of multiple projects and Cytoscape.js instances
- **Data Capacity**: Support for 50+ projects, 20+ acts per project, 50+ plot points per act

### 5.4 Data Requirements
- **File Format**: JSON-based project files with hierarchical structure
- **Project Structure**: Top-level project metadata with nested act-separated structure
- **Type Definitions**: Strongly typed data models for projects, acts, plot points, scenes
- **Storage**: Local storage for project list, individual project files for detailed data
- **Export Options**: Project-specific exports (PDF, Word, Final Draft), cross-project reports
- **Backup**: Cloud sync with project-level granularity for efficient updates

### 5.5 Development Architecture

#### Component Structure
```typescript
// Enhanced component hierarchy with project management
App
├── Homepage (project management dashboard)
│   ├── ProjectCard (individual project display)
│   ├── ProjectSearch (global project search)
│   ├── ProjectFilters (filtering and sorting)
│   └── NewProjectModal (project creation flow)
├── ProjectLayout (wrapper for project-specific features)
│   ├── ProjectHeader (project title and metadata)
│   ├── ActNavigationBar (act tabs and management)
│   ├── ActCanvas (Cytoscape.js container for active act)
│   ├── ActManager (create/edit/delete acts)
│   ├── Toolbar (zoom controls, search within project)
│   ├── NodeDetails (expandable information panel)
│   ├── ContextMenu (right-click options)
│   └── PropertyPanel (editing interface)
└── SharedComponents (breadcrumbs, navigation, etc.)
```

#### Data Models
```typescript
interface ProjectList {
  projects: ProjectMetadata[];
  activeProjectId?: string;
  filters: ProjectFilters;
}

interface ProjectMetadata {
  id: string;
  title: string;
  createdAt: Date;
  lastModified: Date;
  actCount: number;
  plotPointCount: number;
  sceneCount: number;
  tags: string[];
  status: 'active' | 'archived' | 'completed';
  template?: 'novel' | 'screenplay' | 'short-story';
}

interface Story {
  id: string;
  title: string;
  acts: Act[];
  activeActId: string;
  metadata: ProjectMetadata;
}

interface Act {
  id: string;
  title: string;
  order: number;
  plotPoints: PlotPoint[];
  canvasState: {
    zoom: number;
    pan: { x: number; y: number };
    selection: string[];
  };
}

interface PlotPoint {
  id: string;
  title: string;
  position: { x: number; y: number };
  color: string;
  actId: string;
  scenes: Scene[];
}

interface Scene {
  id: string;
  title: string;
  synopsis: string;
  characters: Character[];
  setting: Setting;
  items: Item[];
  actId: string;
  plotPointId: string;
}
```

---

## 6. User Experience Requirements

### 6.1 Homepage Design
- **Project Grid**: Responsive card layout for project display
- **Quick Actions**: Prominent "New Project" button and search bar
- **Visual Hierarchy**: Clear distinction between project management and project content
- **Loading States**: Smooth loading animations for project cards and navigation
- **Empty State**: Engaging onboarding for users with no projects

### 6.2 Project Navigation Experience
- **Breadcrumb Navigation**: Clear path showing Homepage → Project → Act
- **Back Navigation**: Browser back button returns to homepage from projects
- **Quick Switching**: Keyboard shortcuts or menu for rapid project switching
- **Context Preservation**: Returning to a project remembers last active act and position

### 6.3 Project Creation Flow
- **Minimal Friction**: Single-step creation with just project title required
- **Template Selection**: Optional templates with preview of act structure
- **Immediate Access**: New projects open directly to Act 1 canvas
- **Guided Setup**: Optional onboarding for new users

### 6.4 Cross-Project Features
- **Global Search**: Search across all projects with project context in results
- **Project Analytics**: Dashboard view of writing progress across all projects
- **Export Options**: Individual project exports or cross-project reports
- **Import Tools**: Import existing projects from files or other applications

### 6.5 Act Navigation Design
- **Tab System**: Horizontal tabs with clear visual hierarchy
- **Active State**: Distinct styling for currently active act
- **Overflow Handling**: Horizontal scrolling for many acts with scroll indicators
- **Quick Access**: Keyboard shortcuts for rapid act switching
- **Visual Feedback**: Smooth transitions between act canvases

### 6.6 Act Management Experience
- **Creation Flow**: Simple modal dialog for new act creation
- **Naming System**: Intuitive default naming with easy customization
- **Reordering**: Drag-and-drop tab reordering with visual feedback
- **Deletion Safeguards**: Confirmation dialogs for destructive actions
- **Duplication**: Option to duplicate acts with all contents

---

## 7. Success Metrics

### 7.1 Project Management Metrics
- **Projects per User**: Average number of active projects per user
- **Project Creation Rate**: How frequently users start new projects
- **Project Completion Rate**: Percentage of projects that reach defined completion
- **Homepage Engagement**: Time spent on homepage vs. in project canvases
- **Project Switching**: Frequency of navigation between different projects

### 7.2 Navigation Efficiency Metrics
- **Homepage to Project**: Time to navigate from homepage to specific project
- **Project Discovery**: Success rate of finding specific projects via search/browse
- **Cross-Project Search**: Usage and effectiveness of global search features
- **Breadcrumb Usage**: How often users use breadcrumb navigation

### 7.3 Act Management Metrics
- **Acts per Story**: Average number of acts created per story
- **Act Switching Frequency**: How often users switch between acts
- **Act Completion Rate**: Percentage of acts that contain plot points and scenes
- **Navigation Efficiency**: Time to find information across multiple acts

### 7.4 User Engagement Metrics
- **Time per Act**: Average time spent working within individual acts
- **Cross-Act Navigation**: Frequency of cross-act searches and references
- **Act Organization**: How users structure their stories across acts
- **Canvas Utilization**: How effectively users utilize each act's visual space

### 7.5 Productivity Metrics
- **Clicks to Information**: Average clicks to reach specific story elements
- **Navigation Efficiency**: Time spent navigating vs. writing
- **Context Switching**: Frequency of zoom level changes
- **Error Recovery**: Time to recover from accidental navigation

### 7.6 Satisfaction Metrics
- **User Feedback**: Qualitative feedback on structural clarity
- **Feature Requests**: Most requested enhancements
- **Bug Reports**: Issues with visual navigation or data access
- **Completion Rate**: Percentage of users who complete a full story outline

---

## 8. Development Phases

### Phase 0: Project Management Foundation (Weeks 1-4)
- Next.js project setup with App Router for project navigation
- Homepage component with project card layout
- Basic project creation, editing, and deletion
- Project metadata storage and retrieval
- Navigation routing between homepage and projects
- Project search and filtering functionality

### Phase 1: Core MVP with Act System (Weeks 5-14)
- Next.js project enhancement with TypeScript configuration
- Project-scoped act navigation bar with tab system
- Multiple Cytoscape.js instances with project and act-based canvas management
- Basic plot point and scene creation within project acts
- Act switching with preserved canvas state per project
- Local file save/load with project-separated JSON structure

### Phase 2: Enhanced Act Experience (Weeks 15-18)
- Advanced zoom controls within each act canvas
- Cross-act search and highlight functionality
- Act management features (rename, delete, duplicate, reorder)
- Keyboard shortcuts for act navigation
- Visual improvements and custom styling for act system

### Phase 3: Cross-Act Features (Weeks 19-22)
- Global search with act context display
- Character tracking across multiple acts
- Export system that respects act boundaries
- Act-specific color coding and themes
- Performance optimization for multiple canvas instances

### Phase 4: Advanced Act Features (Weeks 23-26)
- Timeline view integration across all acts
- Act templates and structural guidance
- Collaborative features with act-level permissions
- Mobile responsive design for act navigation
- Advanced analytics and act utilization metrics

---

## 9. Risk Assessment

### Technical Risks
- **Project Scaling**: Managing multiple projects with multiple canvas instances may impact performance
- **Navigation Complexity**: Users may get lost in Homepage → Project → Act hierarchy
- **State Management**: Coordinating state across projects, acts, and canvases
- **Data Organization**: Managing hierarchical project → act → plot point → scene relationships
- **Memory Usage**: Multiple projects in memory may impact browser performance

### User Experience Risks
- **Project Overwhelm**: Users may create too many projects and lose organization
- **Context Switching**: Frequent project switching may disrupt creative flow
- **Navigation Confusion**: Complex hierarchy may confuse users about current location
- **Homepage Abandonment**: Users may bypass homepage and work in single projects
- **Feature Discovery**: Project management features may overshadow core writing features

### Business Risks
- **Feature Complexity**: Act system may be too complex for simple stories
- **Performance Expectations**: Users expect instant switching between acts
- **Data Migration**: Existing stories may need migration to act-based structure
- **Platform Limitations**: Act system may not translate well to mobile interfaces

---

## 10. Appendices

### Appendix A: Project Management User Research
- Survey results on how writers manage multiple projects and stories
- Interview notes about project organization and switching workflows
- Analysis of existing project management patterns in writing tools
- User testing results for homepage navigation and project discovery

### Appendix B: Technical Specifications
- Multiple Cytoscape.js instance management patterns
- Act-based state management architecture
- Performance benchmarks for multi-canvas applications
- Database schema design for hierarchical act structure

### Appendix C: Design Mockups
- Homepage and project card designs and interactions
- Project creation and management flows
- Cross-project search and reference interfaces
- Act navigation bar designs and interactions
- Act-specific visual themes and customization options

---

**Document End**

*This PRD serves as the foundation for developing a revolutionary writing tool that prioritizes project management and visual story structure organized by acts. The project homepage provides a central hub for managing multiple stories, while the act-based canvas system within each project reduces complexity and maintains the core value of visual organization and rapid access to story elements. The success of this prototype depends on seamless navigation between projects and acts while preserving the intuitive mind-map approach within each project's structure.*