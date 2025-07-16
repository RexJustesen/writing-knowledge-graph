# Sprint 1: Enhanced Search & Quick Navigation
**Duration:** 2 weeks  
**Priority:** Immediate Win - Low Complexity, High Impact  
**Sprint Goal:** Implement global search functionality and keyboard shortcuts to dramatically improve navigation speed across projects and acts.

---

## 🎯 Epic: Search & Navigation System
Transform the current basic navigation into a powerful, fast search-driven interface that allows writers to instantly find and jump to any story element across their entire workspace.

### Business Value
- **User Retention**: Reduce friction in daily workflow by 60%
- **Productivity**: Enable instant access to any story element without clicking through navigation
- **PRD Alignment**: Addresses core requirement for "rapid reference" and "never lose sight of story structure"

---

## 📋 User Stories

### Story 1: Global Search Across All Projects
**As a** writer managing multiple story projects  
**I want** to search across all my projects from any screen  
**So that** I can quickly find characters, plot points, or scenes without remembering which project they're in

#### Acceptance Criteria
- [x] Search input appears in header/toolbar on all screens
- [x] Search returns results from all projects user has access to
- [x] Results categorized by: Projects, Characters, Plot Points, Scenes, Acts
- [x] Clicking result navigates directly to that element (opens project if needed)
- [x] Search is case-insensitive and supports partial matching
- [x] Recent searches are remembered (last 10)
- [x] Search works with minimum 2 characters typed

#### Technical Implementation
```typescript
// New SearchService class needed
interface SearchResult {
  id: string;
  type: 'project' | 'character' | 'plotpoint' | 'scene' | 'act';
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  actId?: string;
  actName?: string;
}

// Add to existing api.ts
const searchAllProjects = async (query: string): Promise<SearchResult[]>
```

#### UI Components Needed
- `GlobalSearchBar.tsx` - Header search input
- `SearchResultsDropdown.tsx` - Dropdown results list
- `SearchResultItem.tsx` - Individual result with icon and navigation

#### Definition of Done
- [x] Search input visible on homepage and project workspace
- [x] Returns results within 500ms for typical query
- [x] Navigates correctly to found elements
- [x] Works across all user's projects
- [x] Mobile responsive design
- [x] Unit tests cover search functionality

---

### Story 2: Keyboard Shortcuts for Act Navigation
**As a** writer working within a project  
**I want** to quickly switch between acts using keyboard shortcuts  
**So that** I can maintain my creative flow without reaching for the mouse

#### Acceptance Criteria
- [x] `Ctrl/Cmd + 1` switches to Act I
- [x] `Ctrl/Cmd + 2` switches to Act II  
- [x] `Ctrl/Cmd + 3` switches to Act III
- [x] `Ctrl/Cmd + 4` switches to Act IV (if exists)
- [x] `Ctrl/Cmd + 5` switches to Act V (if exists)
- [x] Shortcuts work when focus is anywhere in the application
- [x] Visual indicator shows current act clearly
- [x] Help tooltip shows available shortcuts

#### Technical Implementation
```typescript
// Add to ProjectWorkspace.tsx
useEffect(() => {
  const handleKeyboard = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
      const actNumber = parseInt(e.key);
      switchToAct(actNumber);
    }
  };
  
  document.addEventListener('keydown', handleKeyboard);
  return () => document.removeEventListener('keydown', handleKeyboard);
}, []);
```

#### Definition of Done
- [x] All shortcuts work consistently
- [x] No conflicts with browser shortcuts
- [x] Visual feedback when switching acts
- [x] Works on Windows, Mac, and Linux
- [x] Documented in help system

---

### Story 3: Quick Jump Navigation Menu
**As a** writer with complex projects  
**I want** a quick-access menu to jump to specific story elements  
**So that** I can navigate large projects efficiently

#### Acceptance Criteria
- [x] `Ctrl/Cmd + K` opens quick navigation command palette
- [x] Palette shows: Recent items, All characters, All plot points by act
- [x] Type-ahead filtering as user types
- [x] Arrow keys navigate through options
- [x] Enter key selects and navigates to item
- [x] ESC key closes palette
- [x] Shows keyboard shortcut hints in palette

#### Technical Implementation
```typescript
// New component needed
interface QuickNavItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  icon: string;
  path: string;
}

const QuickNavPalette = () => {
  // Implementation with fuzzy search
  // Recent items tracking
  // Keyboard navigation
}
```

#### Definition of Done
- [x] Command palette opens/closes smoothly
- [x] Filtering works in real-time
- [x] Navigation is keyboard-accessible
- [x] Shows relevant context (act, character type, etc.)
- [x] Performance handles 100+ items smoothly

---

### Story 4: Recent Items Sidebar
**As a** writer jumping between different story elements  
**I want** to see my recently accessed items  
**So that** I can quickly return to things I was just working on

#### Acceptance Criteria
- [x] Collapsible sidebar shows last 15 accessed items
- [x] Items include: characters, plot points, scenes, acts
- [x] Shows timestamp of last access (e.g., "2 minutes ago")
- [x] One-click navigation to any recent item
- [x] Recent items persist across browser sessions
- [x] Clear option to empty recent history
- [x] Drag to reorder recent items

#### Technical Implementation
```typescript
// Add to localStorage/backend
interface RecentItem {
  id: string;
  type: string;
  title: string;
  projectId: string;
  actId?: string;
  accessedAt: Date;
  icon: string;
}

// Service to track and retrieve recent items
class RecentItemsService {
  addRecentItem(item: RecentItem): void
  getRecentItems(): RecentItem[]
  clearRecent(): void
}
```

#### Definition of Done
- [x] Sidebar toggles open/closed smoothly
- [x] Items are clickable and navigate correctly
- [x] Recent history persists between sessions
- [x] Performance handles frequent updates
- [x] Visual design matches app theme

---

### Story 5: Smart Search Filters
**As a** writer with large, complex projects  
**I want** to filter search results by type and project  
**So that** I can find exactly what I'm looking for quickly

#### Acceptance Criteria
- [x] Filter buttons: All, Characters, Plot Points, Scenes, Projects
- [x] Project-specific search toggle (search only current project)
- [x] Visual indicators show active filters
- [x] Filter state persists during session
- [x] Results update immediately when filters change
- [x] Shows result count per filter type
- [x] Clear all filters option

#### Technical Implementation
```typescript
interface SearchFilters {
  types: ('character' | 'plotpoint' | 'scene' | 'project')[];
  projectId?: string;
  actId?: string;
}

// Update search service to accept filters
const searchWithFilters = async (
  query: string, 
  filters: SearchFilters
): Promise<SearchResult[]>
```

#### Definition of Done
- [x] All filter combinations work correctly
- [x] UI clearly shows what filters are active
- [x] Performance remains fast with filters applied
- [x] Intuitive user interface for filter selection

---

## 🔧 Technical Tasks

### Backend Updates Required
1. **Search API Endpoint**
   - Create `/api/search` endpoint
   - Implement full-text search across projects
   - Add pagination for large result sets
   - Include project access control

2. **Database Indexing**
   - Add search indexes to relevant tables
   - Optimize query performance
   - Consider search result caching

### Frontend Architecture
1. **Search Context Provider**
   - Global search state management
   - Recent items tracking
   - Keyboard shortcut management

2. **Navigation Service**
   - Centralized navigation logic
   - History tracking
   - Deep linking support

---

## 🧪 Testing Strategy

### Unit Tests
- [x] Search functionality with various inputs
- [x] Keyboard shortcut event handling
- [x] Filter combinations
- [x] Recent items tracking

### Integration Tests
- [x] Cross-project search results
- [x] Navigation between projects/acts
- [x] Performance with large datasets

### User Acceptance Tests
- [x] Writers can find any story element in under 10 seconds
- [x] Keyboard shortcuts work intuitively
- [x] Search results are relevant and comprehensive

---

## 📊 Success Metrics
- **Search Usage**: 80% of users use global search within first week
- **Navigation Speed**: Average time to find story element reduced by 60%
- **Keyboard Adoption**: 40% of power users adopt keyboard shortcuts
- **User Satisfaction**: Navigation friction complaints reduced by 75%

---

## 🚨 Risks & Mitigation
- **Risk**: Search performance with large projects
  - **Mitigation**: Implement result pagination and caching
- **Risk**: Keyboard shortcuts conflict with browser
  - **Mitigation**: Thorough testing across browsers and OS
- **Risk**: UI cluttered with new navigation elements
  - **Mitigation**: Progressive disclosure and user testing

---

## 📝 Notes for Developer
- Prioritize search performance - writers need instant results
- Focus on keyboard accessibility throughout
- Consider implementing search result highlighting
- Plan for future: voice search, AI-powered suggestions
- Ensure mobile touch-friendly alternatives to keyboard shortcuts
