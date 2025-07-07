# Product Requirements Document: Campfire App Prototype
## Visual Mind Map Writing Tool

**Version:** 1.2  
**Date:** July 7, 2025  
**Product Owner:** [Your Name]  
**Status:** Requirements Definition

---

## 1. Executive Summary

### Product Vision
A revolutionary writing application that transforms story development from linear scene-based organization to a visual, plot-centric mind map interface. Writers can organize their stories by acts, with each act containing its own visual canvas where plot points and scenes are mapped as interconnected nodes.

### Core Value Proposition
- **Act-Based Organization**: Separate visual canvases for each story act, reducing complexity
- **Plot-First Thinking**: Organize stories around plot points, not scenes
- **Visual Context**: Never lose sight of story structure while working on details
- **Rapid Reference**: Instant access to any story element without navigation guesswork
- **Nested Intelligence**: Expandable detail layers that maintain hierarchical relationships

---

## 2. Problem Statement

### Current Pain Points with Existing Tools
1. **Too Many Clicks**: Critical information buried behind multiple navigation layers
2. **Lack of Visual Structure**: Folder-based organization obscures story relationships
3. **Scene Disconnection**: Individual scenes feel isolated without plot context
4. **Cognitive Load**: Writers must remember location and relationship of story elements
5. **Act Confusion**: All story elements crammed into one view creates visual overwhelm

### User Frustration Quote
*"I think in plot points, not individual scenes. I don't want to click through blind folders—I want to recognize scenes by where they live in the story structure visually. But I also don't want to see my entire novel's complexity at once—I need to focus on one act at a time."*

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

### 4.1 Act-Based Canvas System

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

### 4.2 Act Navigation System

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

### 4.3 New Act Creation

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

### 4.4 Plot-First Visual Architecture (Per Act)

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

### 4.5 Scene Constellation System (Per Act)

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

### 4.6 Nested Detail Layers

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

### 4.7 Fast Reference System (Cross-Act)

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

### 4.8 Zoom & Focus Controls (Per Act)

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
- **State Management**: Zustand or Redux for managing multiple act states
- **Styling**: Tailwind CSS for responsive design including navigation tabs
- **Future Platforms**: Desktop (Electron), Mobile (React Native)
- **Browser Support**: Chrome, Firefox, Safari, Edge (latest 2 versions)

### 5.2 Technology Stack Rationale

#### Multiple Cytoscape.js Instances
- **Act Isolation**: Each act maintains its own graph instance for performance and clarity
- **Memory Management**: Inactive act canvases can be optimized or virtualized
- **Independent State**: Each act's zoom level, position, and selection state preserved
- **Performance**: Smaller graphs per act load faster than one massive graph

#### State Management Enhancement
- **Act Management**: Central store for managing active act, act metadata, and navigation state
- **Cross-Act Operations**: Coordinated operations like global search across multiple graph instances
- **Persistence**: Each act's canvas state saved independently for faster loading

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
- **Act Switching**: Transition between acts < 500ms
- **Canvas Load**: Individual act canvas load < 1 second
- **Memory Usage**: Efficient management of multiple Cytoscape.js instances
- **Zoom Performance**: Smooth 60fps animations within each act canvas
- **Data Capacity**: Support for 20+ acts, 50+ plot points per act, 500+ scenes per act

### 5.4 Data Requirements
- **File Format**: JSON-based project files with act-separated structure
- **Act Structure**: Hierarchical data model with acts as top-level containers
- **Type Definitions**: Strongly typed data models for acts, plot points, scenes, characters
- **Export Options**: PDF, Word, Final Draft (with act separation), plain text
- **Backup**: Cloud sync with act-level granularity for efficient updates

### 5.5 Development Architecture

#### Component Structure
```typescript
// Core component hierarchy
App
├── ActNavigationBar (act tabs and management)
├── ActCanvas (Cytoscape.js container for active act)
├── ActManager (create/edit/delete acts)
├── Toolbar (zoom controls, search across acts)
├── NodeDetails (expandable information panel)
├── ContextMenu (right-click options)
└── PropertyPanel (editing interface)
```

#### Data Models
```typescript
interface Story {
  id: string;
  title: string;
  acts: Act[];
  activeActId: string;
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

### 6.1 Act Navigation Design
- **Tab System**: Horizontal tabs with clear visual hierarchy
- **Active State**: Distinct styling for currently active act
- **Overflow Handling**: Horizontal scrolling for many acts with scroll indicators
- **Quick Access**: Keyboard shortcuts for rapid act switching
- **Visual Feedback**: Smooth transitions between act canvases

### 6.2 Act Management Experience
- **Creation Flow**: Simple modal dialog for new act creation
- **Naming System**: Intuitive default naming with easy customization
- **Reordering**: Drag-and-drop tab reordering with visual feedback
- **Deletion Safeguards**: Confirmation dialogs for destructive actions
- **Duplication**: Option to duplicate acts with all contents

### 6.3 Cross-Act Features
- **Global Search**: Search results show act context and enable quick navigation
- **Character Tracking**: Character information can span multiple acts
- **Timeline Integration**: Optional timeline view showing all acts in sequence
- **Export Coordination**: Export options that respect act boundaries

### 6.4 Visual Design Principles
- **Act Separation**: Clear visual distinction between act navigation and canvas
- **Consistent Iconography**: Clear visual language for different story elements
- **Color Coding**: Act-specific color schemes with global consistency
- **Spatial Intelligence**: Use 2D space meaningfully within each act's structure

---

## 7. Success Metrics

### 7.1 Act Management Metrics
- **Acts per Story**: Average number of acts created per story
- **Act Switching Frequency**: How often users switch between acts
- **Act Completion Rate**: Percentage of acts that contain plot points and scenes
- **Navigation Efficiency**: Time to find information across multiple acts

### 7.2 User Engagement Metrics
- **Time per Act**: Average time spent working within individual acts
- **Cross-Act Navigation**: Frequency of cross-act searches and references
- **Act Organization**: How users structure their stories across acts
- **Canvas Utilization**: How effectively users utilize each act's visual space

### 7.3 Productivity Metrics
- **Clicks to Information**: Average clicks to reach specific story elements
- **Navigation Efficiency**: Time spent navigating vs. writing
- **Context Switching**: Frequency of zoom level changes
- **Error Recovery**: Time to recover from accidental navigation

### 7.4 Satisfaction Metrics
- **User Feedback**: Qualitative feedback on structural clarity
- **Feature Requests**: Most requested enhancements
- **Bug Reports**: Issues with visual navigation or data access
- **Completion Rate**: Percentage of users who complete a full story outline

---

## 8. Development Phases

### Phase 1: Core MVP with Act System (Weeks 1-10)
- Next.js project setup with TypeScript configuration
- Act navigation bar with tab system and creation flow
- Multiple Cytoscape.js instances with act-based canvas management
- Basic plot point and scene creation within acts
- Act switching with preserved canvas state
- Local file save/load with act-separated JSON structure

### Phase 2: Enhanced Act Experience (Weeks 11-14)
- Advanced zoom controls within each act canvas
- Cross-act search and highlight functionality
- Act management features (rename, delete, duplicate, reorder)
- Keyboard shortcuts for act navigation
- Visual improvements and custom styling for act system

### Phase 3: Cross-Act Features (Weeks 15-18)
- Global search with act context display
- Character tracking across multiple acts
- Export system that respects act boundaries
- Act-specific color coding and themes
- Performance optimization for multiple canvas instances

### Phase 4: Advanced Act Features (Weeks 19-22)
- Timeline view integration across all acts
- Act templates and structural guidance
- Collaborative features with act-level permissions
- Mobile responsive design for act navigation
- Advanced analytics and act utilization metrics

---

## 9. Risk Assessment

### Technical Risks
- **Multiple Canvas Performance**: Managing multiple Cytoscape.js instances may impact memory usage
- **State Synchronization**: Coordinating state across multiple act canvases
- **Act Switching Performance**: Ensuring smooth transitions between large act canvases
- **Data Complexity**: Managing hierarchical act → plot point → scene relationships

### User Experience Risks
- **Act Overwhelm**: Users may create too many acts and lose organization
- **Navigation Confusion**: Users may forget which act contains specific information
- **Workflow Disruption**: Act switching may interrupt creative flow
- **Learning Curve**: Users need to understand act-based organization concept

### Business Risks
- **Feature Complexity**: Act system may be too complex for simple stories
- **Performance Expectations**: Users expect instant switching between acts
- **Data Migration**: Existing stories may need migration to act-based structure
- **Platform Limitations**: Act system may not translate well to mobile interfaces

---

## 10. Appendices

### Appendix A: Act-Based User Research
- Survey results on how writers currently organize multi-act stories
- Interview notes about act-switching workflows and preferences
- Competitive analysis of act-based writing tools
- User testing results for act navigation interfaces

### Appendix B: Technical Specifications
- Multiple Cytoscape.js instance management patterns
- Act-based state management architecture
- Performance benchmarks for multi-canvas applications
- Database schema design for hierarchical act structure

### Appendix C: Design Mockups
- Act navigation bar designs and interactions
- Act creation and management flows
- Cross-act search and reference interfaces
- Act-specific visual themes and customization options

---

**Document End**

*This PRD serves as the foundation for developing a revolutionary writing tool that prioritizes visual story structure organized by acts. The act-based canvas system reduces complexity while maintaining the core value of visual organization and rapid access to story elements. The success of this prototype depends on seamless act navigation while preserving the intuitive mind-map approach within each act's canvas.*