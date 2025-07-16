# Sprint 2: Plot Point Templates & Smart Defaults
**Duration:** 2 weeks  
**Priority:** Immediate Win - Low Complexity, High Impact  
**Sprint Goal:** Implement intelligent plot point templates and smart defaults that guide writers through proven story structures, reducing creative friction and improving story quality.

---

## 🎯 Epic: Intelligent Story Structure System
Transform plot point creation from blank-slate intimidation into guided, structure-aware story development that helps writers craft compelling narratives using proven storytelling frameworks.

### Business Value
- **User Engagement**: Reduce new user abandonment by 40%
- **Story Quality**: Help writers create more structurally sound stories
- **PRD Alignment**: Directly supports "plot-first thinking" and "rapid reference" goals
- **Competitive Advantage**: Most writing tools don't provide structural guidance

---

## 📋 User Stories

### Story 1: Genre-Based Plot Point Templates
**As a** writer starting a new story  
**I want** to choose from proven plot structures based on my genre  
**So that** I have a solid foundation and don't start with a blank canvas

#### Acceptance Criteria
- [ ] Template selection appears during new project creation
- [ ] Available genres: Literary Fiction, Mystery/Thriller, Romance, Fantasy/Sci-Fi, Horror, Comedy
- [ ] Each template includes 8-12 pre-populated plot points with descriptions
- [ ] Plot points include guidance text explaining their purpose
- [ ] Option to start with "blank canvas" for experienced writers
- [ ] Templates are customizable after creation
- [ ] Templates respect user's chosen act structure (3-act, 5-act, etc.)

#### Genre Templates Required

**Three-Act Structure (Universal)**
- Inciting Incident: "The event that kicks off your story's main conflict"
- Plot Point 1: "Your protagonist commits to their journey"
- Midpoint: "Everything changes - new information or major setback"
- Plot Point 2: "Darkest moment before the final push"
- Climax: "The confrontation that resolves your main conflict"

**Mystery/Thriller Additions**
- First Body/Crime: "The crime that starts the investigation"
- False Lead: "Red herring that misdirects the investigation"
- Revelation: "Key clue that points toward the truth"
- Final Confrontation: "Face-off with the real antagonist"

**Romance Additions**
- Meet Cute: "The charming first encounter between love interests"
- Attraction Building: "Growing chemistry and connection"
- Major Conflict: "The obstacle that seems to end the relationship"
- Grand Gesture: "The act that proves true love"

#### Technical Implementation
```typescript
interface PlotPointTemplate {
  id: string;
  name: string;
  description: string;
  guidance: string;
  actId: string;
  order: number;
  genre: string[];
  optional: boolean;
}

interface StoryTemplate {
  id: string;
  name: string;
  genre: string;
  description: string;
  plotPoints: PlotPointTemplate[];
  actStructure: number; // 3, 4, or 5 acts
}

// Add to project creation flow
const createProjectFromTemplate = async (
  templateId: string, 
  projectData: ProjectData
): Promise<Project>
```

#### UI Components Needed
- `TemplateSelector.tsx` - Template choice interface
- `TemplatePreview.tsx` - Shows template structure before selection
- `PlotPointGuidance.tsx` - Expandable guidance for each template plot point

#### Definition of Done
- [ ] Template selection integrated into project creation
- [ ] All genre templates have minimum 8 plot points each
- [ ] Template preview shows act distribution
- [ ] Created projects match template structure exactly
- [ ] Guidance text is helpful and actionable
- [ ] Templates work with all act structures

---

### Story 2: Smart Plot Point Suggestions
**As a** writer working on my story structure  
**I want** contextual suggestions for plot points based on what I already have  
**So that** I can identify gaps in my story and get inspiration for missing beats

#### Acceptance Criteria
- [ ] "Suggest Plot Point" button appears in each act
- [ ] Suggestions consider existing plot points in the story
- [ ] Suggestions match the story's apparent genre (detected or user-selected)
- [ ] Each suggestion includes: title, description, and placement reason
- [ ] Option to accept suggestion as-is or use as inspiration
- [ ] Suggestions adapt as story develops (different suggestions for different story states)
- [ ] Maximum 3 suggestions shown at a time to avoid overwhelm

#### Suggestion Logic Examples
- If story has "Inciting Incident" but no "Call to Adventure" → Suggest call to adventure
- If Act II has no midpoint → Suggest midpoint plot point
- If romance detected but no "Meet Cute" → Suggest meet cute scene
- If mystery detected but no "Red Herring" → Suggest false lead

#### Technical Implementation
```typescript
interface PlotPointSuggestion {
  id: string;
  title: string;
  description: string;
  reasoning: string;
  suggestedActId: string;
  confidence: number; // 0-1 score
  templateSource?: string;
}

class PlotSuggestionEngine {
  generateSuggestions(project: Project): PlotPointSuggestion[]
  analyzeStoryGenre(project: Project): string[]
  detectMissingBeats(plotPoints: PlotPoint[]): string[]
}
```

#### Definition of Done
- [ ] Suggestions appear contextually and helpfully
- [ ] Suggestion quality improves story structure
- [ ] No more than 3 suggestions shown at once
- [ ] Suggestions adapt to user's story development
- [ ] Performance handles suggestion generation quickly

---

### Story 3: Plot Point Categories & Icons
**As a** writer organizing my story structure  
**I want** to categorize my plot points with visual indicators  
**So that** I can quickly understand the type and function of each story beat

#### Acceptance Criteria
- [ ] Plot point categories: Action, Character Development, World Building, Conflict, Resolution, Twist, Romance, Mystery
- [ ] Each category has distinct icon and color
- [ ] Category selection during plot point creation
- [ ] Category can be changed after creation
- [ ] Visual legend/key available
- [ ] Categories filter: show only specific types
- [ ] Category affects plot point appearance on canvas

#### Category System
```typescript
enum PlotPointCategory {
  ACTION = 'action',           // ⚔️ Red
  CHARACTER = 'character',     // 👤 Blue  
  WORLDBUILDING = 'world',     // 🌍 Green
  CONFLICT = 'conflict',       // ⚡ Orange
  RESOLUTION = 'resolution',   // ✅ Purple
  TWIST = 'twist',            // 🔄 Yellow
  ROMANCE = 'romance',        // ❤️ Pink
  MYSTERY = 'mystery'         // 🔍 Dark Blue
}

interface PlotPoint {
  // ... existing fields
  category: PlotPointCategory;
  icon: string;
  color: string;
}
```

#### Definition of Done
- [ ] All categories have distinct, intuitive icons
- [ ] Color coding is consistent throughout app
- [ ] Category filtering works smoothly
- [ ] Categories help users understand story structure at a glance

---

### Story 4: Story Structure Validation
**As a** writer developing my plot  
**I want** gentle feedback about potential structural issues  
**So that** I can improve my story's pacing and completeness

#### Acceptance Criteria
- [ ] Validation sidebar shows story health indicators
- [ ] Warnings (not errors) for: missing inciting incident, no midpoint, empty acts, too many plot points in one act
- [ ] Positive feedback when structure looks good
- [ ] Suggestions link to relevant templates or guidance
- [ ] Validation can be dismissed/ignored by advanced users
- [ ] Validation adapts to detected story genre
- [ ] Optional "story structure score" with improvement tips

#### Validation Rules
- **Missing Foundation**: No inciting incident in Act I
- **Pacing Issues**: Act II has no midpoint or too many plot points
- **Weak Ending**: Act III has fewer than 2 plot points
- **Genre Mismatch**: Romance story with no character development plot points
- **Overcrowded Acts**: More than 6 plot points in single act

#### Technical Implementation
```typescript
interface StructureValidation {
  score: number; // 0-100
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  strengths: string[];
}

interface ValidationWarning {
  type: 'missing_element' | 'pacing_issue' | 'genre_mismatch';
  message: string;
  suggestion: string;
  actId?: string;
  severity: 'low' | 'medium' | 'high';
}

class StoryValidator {
  validateStructure(project: Project): StructureValidation
  checkPacing(acts: Act[]): ValidationWarning[]
  validateGenreConsistency(project: Project): ValidationWarning[]
}
```

#### Definition of Done
- [ ] Validation runs automatically but unobtrusively
- [ ] Feedback is encouraging, not critical
- [ ] Suggestions are actionable and helpful
- [ ] Validation doesn't interrupt creative flow
- [ ] Advanced users can disable validation

---

### Story 5: Quick Plot Point Creation with Templates
**As a** writer in the flow of story development  
**I want** to quickly create plot points using smart templates  
**So that** I can capture ideas rapidly without losing momentum

#### Acceptance Criteria
- [ ] Right-click on canvas shows "Add Plot Point" with template options
- [ ] Template dropdown shows contextually relevant options
- [ ] Quick templates: Action Scene, Character Moment, Plot Twist, Dialogue Scene, Conflict, Resolution
- [ ] Each template pre-fills appropriate fields
- [ ] Templates include placeholder text that guides content creation
- [ ] Option to create blank plot point alongside templates
- [ ] Templates respect current act context

#### Quick Templates
```typescript
interface QuickTemplate {
  id: string;
  name: string;
  category: PlotPointCategory;
  defaultTitle: string;
  descriptionTemplate: string;
  suggestedFields: string[];
}

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: 'action_scene',
    name: 'Action Scene',
    category: PlotPointCategory.ACTION,
    defaultTitle: 'Action Sequence',
    descriptionTemplate: 'High-energy scene where [character] must [action] to [goal]. Stakes: [what happens if they fail].',
    suggestedFields: ['location', 'characters', 'stakes']
  },
  {
    id: 'character_moment',
    name: 'Character Development',
    category: PlotPointCategory.CHARACTER,
    defaultTitle: 'Character Growth',
    descriptionTemplate: '[Character] realizes [insight] about [themselves/situation]. This changes their [motivation/approach].',
    suggestedFields: ['character', 'realization', 'impact']
  }
  // ... more templates
];
```

#### Definition of Done
- [ ] Right-click context menu works smoothly
- [ ] Templates speed up plot point creation significantly
- [ ] Template suggestions are contextually appropriate
- [ ] Templates provide helpful structure without being restrictive

---

## 🔧 Technical Tasks

### Backend Updates Required
1. **Template System API**
   - Create `/api/templates` endpoint for template CRUD
   - Store template definitions in database
   - Support custom user templates (future)

2. **Story Analysis Service**
   - Genre detection algorithm
   - Story structure analysis
   - Plot gap identification

### Frontend Architecture
1. **Template Engine**
   - Template rendering system
   - Context-aware suggestion logic
   - Validation rule engine

2. **Enhanced Plot Point Model**
   - Category system integration
   - Template metadata
   - Validation hooks

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Template application creates correct structure
- [ ] Suggestion engine provides relevant recommendations
- [ ] Validation rules catch common structural issues
- [ ] Category system works with all plot point operations

### Integration Tests
- [ ] Project creation with templates end-to-end
- [ ] Template suggestions adapt to story changes
- [ ] Validation feedback updates in real-time

### User Acceptance Tests
- [ ] New writers can create structured stories using templates
- [ ] Experienced writers find suggestions helpful, not intrusive
- [ ] Template guidance reduces time to first complete story outline

---

## 📊 Success Metrics
- **Template Adoption**: 70% of new projects use templates
- **Structure Quality**: Stories created with templates have 40% fewer structural gaps
- **User Confidence**: New user completion rate increases by 35%
- **Suggestion Acceptance**: 50% of suggested plot points are accepted

---

## 🚨 Risks & Mitigation
- **Risk**: Templates feel restrictive to creative writers
  - **Mitigation**: Always provide "blank" option, make templates customizable
- **Risk**: Suggestions feel like "writing by committee"
  - **Mitigation**: Frame as inspiration, not requirements; allow dismissal
- **Risk**: Template system becomes too complex
  - **Mitigation**: Start with core genres, expand based on user feedback

---

## 📝 Notes for Developer
- Templates should inspire, not constrain creativity
- Focus on storytelling craft, not prescriptive formulas
- Make all guidance optional and dismissible
- Consider cultural differences in story structure
- Plan for user-generated templates in future sprints
- Ensure templates work well across different act structures
