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
- [ ] Search input appears in header/toolbar on all screens
- [ ] Search returns results from all projects user has access to
- [ ] Results categorized by: Projects, Characters, Plot Points, Scenes, Acts
- [ ] Clicking result navigates directly to that element (opens project if needed)
- [ ] Search is case-insensitive and supports partial matching
- [ ] Recent searches are remembered (last 10)
- [ ] Search works with minimum 2 characters typed

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
- [ ] Search input visible on homepage and project workspace
- [ ] Returns results within 500ms for typical query
- [ ] Navigates correctly to found elements
- [ ] Works across all user's projects
- [ ] Mobile responsive design
- [ ] Unit tests cover search functionality

---

### Story 2: Keyboard Shortcuts for Act Navigation
**As a** writer working within a project  
**I want** to quickly switch between acts using keyboard shortcuts  
**So that** I can maintain my creative flow without reaching for the mouse

#### Acceptance Criteria
- [ ] `Ctrl/Cmd + 1` switches to Act I
- [ ] `Ctrl/Cmd + 2` switches to Act II  
- [ ] `Ctrl/Cmd + 3` switches to Act III
- [ ] `Ctrl/Cmd + 4` switches to Act IV (if exists)
- [ ] `Ctrl/Cmd + 5` switches to Act V (if exists)
- [ ] Shortcuts work when focus is anywhere in the application
- [ ] Visual indicator shows current act clearly
- [ ] Help tooltip shows available shortcuts

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
- [ ] All shortcuts work consistently
- [ ] No conflicts with browser shortcuts
- [ ] Visual feedback when switching acts
- [ ] Works on Windows, Mac, and Linux
- [ ] Documented in help system

---

### Story 3: Quick Jump Navigation Menu
**As a** writer with complex projects  
**I want** a quick-access menu to jump to specific story elements  
**So that** I can navigate large projects efficiently

#### Acceptance Criteria
- [ ] `Ctrl/Cmd + K` opens quick navigation command palette
- [ ] Palette shows: Recent items, All characters, All plot points by act
- [ ] Type-ahead filtering as user types
- [ ] Arrow keys navigate through options
- [ ] Enter key selects and navigates to item
- [ ] ESC key closes palette
- [ ] Shows keyboard shortcut hints in palette

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
- [ ] Command palette opens/closes smoothly
- [ ] Filtering works in real-time
- [ ] Navigation is keyboard-accessible
- [ ] Shows relevant context (act, character type, etc.)
- [ ] Performance handles 100+ items smoothly

---

### Story 4: Recent Items Sidebar
**As a** writer jumping between different story elements  
**I want** to see my recently accessed items  
**So that** I can quickly return to things I was just working on

#### Acceptance Criteria
- [ ] Collapsible sidebar shows last 15 accessed items
- [ ] Items include: characters, plot points, scenes, acts
- [ ] Shows timestamp of last access (e.g., "2 minutes ago")
- [ ] One-click navigation to any recent item
- [ ] Recent items persist across browser sessions
- [ ] Clear option to empty recent history
- [ ] Drag to reorder recent items

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
- [ ] Sidebar toggles open/closed smoothly
- [ ] Items are clickable and navigate correctly
- [ ] Recent history persists between sessions
- [ ] Performance handles frequent updates
- [ ] Visual design matches app theme

---

### Story 5: Smart Search Filters
**As a** writer with large, complex projects  
**I want** to filter search results by type and project  
**So that** I can find exactly what I'm looking for quickly

#### Acceptance Criteria
- [ ] Filter buttons: All, Characters, Plot Points, Scenes, Projects
- [ ] Project-specific search toggle (search only current project)
- [ ] Visual indicators show active filters
- [ ] Filter state persists during session
- [ ] Results update immediately when filters change
- [ ] Shows result count per filter type
- [ ] Clear all filters option

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
- [ ] All filter combinations work correctly
- [ ] UI clearly shows what filters are active
- [ ] Performance remains fast with filters applied
- [ ] Intuitive user interface for filter selection

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
- [ ] Search functionality with various inputs
- [ ] Keyboard shortcut event handling
- [ ] Filter combinations
- [ ] Recent items tracking

### Integration Tests
- [ ] Cross-project search results
- [ ] Navigation between projects/acts
- [ ] Performance with large datasets

### User Acceptance Tests
- [ ] Writers can find any story element in under 10 seconds
- [ ] Keyboard shortcuts work intuitively
- [ ] Search results are relevant and comprehensive

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
