// Backend Story Templates for Sprint 2
// These templates define the complete structure that should be created when a user selects a template

export interface BackendPlotPointTemplate {
  title: string;
  description: string;
  guidance?: string;
  actOrder: number; // Which act this belongs to (1, 2, 3)
  plotPointOrder: number; // Order within the act
  color: string;
  category: string;
  eventType?: string; // EventType enum value for structural story elements
  scenes?: BackendSceneTemplate[];
}

export interface BackendSceneTemplate {
  title: string;
  synopsis: string;
  content?: string;
  sceneOrder: number;
  position?: { x: number; y: number };
}

export interface BackendActTemplate {
  name: string;
  description: string;
  order: number;
}

export interface BackendStoryTemplate {
  id: string;
  name: string;
  genre: string;
  description: string;
  acts: BackendActTemplate[];
  plotPoints: BackendPlotPointTemplate[];
  characters?: BackendCharacterTemplate[];
}

export interface BackendCharacterTemplate {
  name: string;
  description?: string;
  appearance?: string;
  personality?: string;
  motivation?: string;
  characterType: 'PROTAGONIST' | 'ANTAGONIST' | 'SUPPORTING' | 'MINOR';
}

// Plot Point Categories (matching frontend)
export const PLOT_POINT_CATEGORIES = {
  ACTION: 'ACTION',
  CHARACTER: 'CHARACTER', 
  WORLDBUILDING: 'WORLDBUILDING',
  CONFLICT: 'CONFLICT',
  RESOLUTION: 'RESOLUTION',
  TWIST: 'TWIST',
  ROMANCE: 'ROMANCE',
  MYSTERY: 'MYSTERY'
} as const;

// Category colors (matching frontend)
export const CATEGORY_COLORS = {
  [PLOT_POINT_CATEGORIES.ACTION]: '#EF4444',
  [PLOT_POINT_CATEGORIES.CHARACTER]: '#3B82F6', 
  [PLOT_POINT_CATEGORIES.WORLDBUILDING]: '#10B981',
  [PLOT_POINT_CATEGORIES.CONFLICT]: '#F59E0B',
  [PLOT_POINT_CATEGORIES.RESOLUTION]: '#8B5CF6',
  [PLOT_POINT_CATEGORIES.TWIST]: '#EAB308',
  [PLOT_POINT_CATEGORIES.ROMANCE]: '#EC4899',
  [PLOT_POINT_CATEGORIES.MYSTERY]: '#1E40AF'
} as const;

// Story Templates
export const BACKEND_STORY_TEMPLATES: BackendStoryTemplate[] = [
  {
    id: 'three-act-universal',
    name: 'Three-Act Structure',
    genre: 'Universal',
    description: 'Classic three-act structure suitable for any genre',
    acts: [
      { name: 'Act I', description: 'Setup and inciting incident', order: 1 },
      { name: 'Act II', description: 'Rising action and complications', order: 2 },
      { name: 'Act III', description: 'Climax and resolution', order: 3 }
    ],
    plotPoints: [
      {
        title: 'Inciting Incident',
        description: 'The event that kicks off your story\'s main conflict',
        guidance: 'This should happen early and disrupt your protagonist\'s normal world. It forces them to take action.',
        actOrder: 1,
        plotPointOrder: 1,
        color: CATEGORY_COLORS.CONFLICT,
        category: PLOT_POINT_CATEGORIES.CONFLICT,
        eventType: 'inciting_incident',
        scenes: [
          {
            title: 'Opening Scene',
            synopsis: 'Establish the normal world before the inciting incident',
            content: 'Show your protagonist in their everyday life, hinting at what they want or need.',
            sceneOrder: 1,
            position: { x: 150, y: 80 }
          },
          {
            title: 'The Incident',
            synopsis: 'The moment everything changes',
            content: 'The specific event that forces your protagonist to act and sets the story in motion.',
            sceneOrder: 2,
            position: { x: 150, y: 120 }
          }
        ]
      },
      {
        title: 'Call to Adventure',
        description: 'Your protagonist commits to their journey',
        guidance: 'This is where your protagonist makes the decision to pursue their goal. There\'s no turning back.',
        actOrder: 1,
        plotPointOrder: 2,
        color: CATEGORY_COLORS.CHARACTER,
        category: PLOT_POINT_CATEGORIES.CHARACTER,
        eventType: 'plot_point_1',
        scenes: [
          {
            title: 'The Decision',
            synopsis: 'Protagonist decides to pursue their goal',
            content: 'Show the moment your protagonist commits to the journey ahead.',
            sceneOrder: 1,
            position: { x: 350, y: 80 }
          }
        ]
      },
      {
        title: 'Midpoint Revelation',
        description: 'Everything changes - new information or major setback',
        guidance: 'The story takes a major turn. New information is revealed or a significant setback occurs.',
        actOrder: 2,
        plotPointOrder: 1,
        color: CATEGORY_COLORS.TWIST,
        category: PLOT_POINT_CATEGORIES.TWIST,
        eventType: 'midpoint_revelation',
        scenes: [
          {
            title: 'The Revelation',
            synopsis: 'New information changes everything',
            content: 'A crucial piece of information is revealed that changes the protagonist\'s understanding.',
            sceneOrder: 1,
            position: { x: 550, y: 80 }
          }
        ]
      },
      {
        title: 'All Is Lost',
        description: 'Darkest moment before the final push',
        guidance: 'Your protagonist faces their lowest point. This is where hope seems lost.',
        actOrder: 2,
        plotPointOrder: 2,
        color: CATEGORY_COLORS.CONFLICT,
        category: PLOT_POINT_CATEGORIES.CONFLICT,
        eventType: 'plot_point_2',
        scenes: [
          {
            title: 'The Low Point',
            synopsis: 'Everything seems hopeless',
            content: 'The protagonist faces their darkest moment. Victory seems impossible.',
            sceneOrder: 1,
            position: { x: 750, y: 80 }
          }
        ]
      },
      {
        title: 'Climax',
        description: 'The confrontation that resolves your main conflict',
        guidance: 'The final battle, confrontation, or moment of truth where the main conflict is resolved.',
        actOrder: 3,
        plotPointOrder: 1,
        color: CATEGORY_COLORS.RESOLUTION,
        category: PLOT_POINT_CATEGORIES.RESOLUTION,
        eventType: 'climax',
        scenes: [
          {
            title: 'Final Confrontation',
            synopsis: 'The ultimate test',
            content: 'The climactic moment where the protagonist faces their greatest challenge.',
            sceneOrder: 1,
            position: { x: 950, y: 80 }
          }
        ]
      }
    ]
  },
  {
    id: 'mystery-thriller',
    name: 'Mystery/Thriller',
    genre: 'Mystery',
    description: 'Classic mystery structure with investigation beats',
    acts: [
      { name: 'Act I', description: 'Setup and inciting incident', order: 1 },
      { name: 'Act II', description: 'Rising action and complications', order: 2 },
      { name: 'Act III', description: 'Climax and resolution', order: 3 }
    ],
    plotPoints: [
      {
        title: 'The Crime',
        description: 'The crime that starts the investigation',
        guidance: 'The inciting incident for mysteries - the crime or mystery that needs solving.',
        actOrder: 1,
        plotPointOrder: 1,
        color: CATEGORY_COLORS.MYSTERY,
        category: PLOT_POINT_CATEGORIES.MYSTERY,
        eventType: 'crime_discovery',
        scenes: [
          {
            title: 'Discovery of the Crime',
            synopsis: 'The crime is discovered',
            content: 'The moment the crime is revealed, setting the mystery in motion.',
            sceneOrder: 1,
            position: { x: 150, y: 80 }
          },
          {
            title: 'Initial Investigation',
            synopsis: 'First look at the crime scene',
            content: 'Initial examination reveals key clues and establishes the mystery.',
            sceneOrder: 2,
            position: { x: 150, y: 120 }
          }
        ]
      },
      {
        title: 'Taking the Case',
        description: 'The protagonist commits to solving the mystery',
        guidance: 'Your detective or protagonist decides to investigate. Personal stakes are established.',
        actOrder: 1,
        plotPointOrder: 2,
        color: CATEGORY_COLORS.CHARACTER,
        category: PLOT_POINT_CATEGORIES.CHARACTER,
        eventType: 'investigation_begins',
        scenes: [
          {
            title: 'Personal Investment',
            synopsis: 'Why this case matters',
            content: 'Establish why the protagonist must solve this particular mystery.',
            sceneOrder: 1,
            position: { x: 350, y: 80 }
          }
        ]
      },
      {
        title: 'Red Herring',
        description: 'False lead that misdirects the investigation',
        guidance: 'A clue or suspect that seems promising but leads nowhere. Creates misdirection.',
        actOrder: 2,
        plotPointOrder: 1,
        color: CATEGORY_COLORS.MYSTERY,
        category: PLOT_POINT_CATEGORIES.MYSTERY,
        eventType: 'false_lead',
        scenes: [
          {
            title: 'False Lead',
            synopsis: 'Following the wrong trail',
            content: 'The investigation follows a promising lead that turns out to be false.',
            sceneOrder: 1,
            position: { x: 550, y: 80 }
          }
        ]
      },
      {
        title: 'Breakthrough',
        description: 'Important clue that points toward the truth',
        guidance: 'A crucial piece of evidence or information that shifts the investigation in the right direction.',
        actOrder: 2,
        plotPointOrder: 2,
        color: CATEGORY_COLORS.TWIST,
        category: PLOT_POINT_CATEGORIES.TWIST,
        eventType: 'key_revelation',
        scenes: [
          {
            title: 'Key Evidence',
            synopsis: 'The clue that changes everything',
            content: 'Discovery of crucial evidence that points toward the real culprit.',
            sceneOrder: 1,
            position: { x: 750, y: 80 }
          }
        ]
      },
      {
        title: 'Unmasking',
        description: 'Face-off with the real antagonist',
        guidance: 'The protagonist confronts the true culprit. Truth is revealed and conflict resolved.',
        actOrder: 3,
        plotPointOrder: 1,
        color: CATEGORY_COLORS.RESOLUTION,
        category: PLOT_POINT_CATEGORIES.RESOLUTION,
        eventType: 'unmasking',
        scenes: [
          {
            title: 'The Confrontation',
            synopsis: 'Revealing the truth',
            content: 'The climactic scene where the protagonist confronts the culprit and reveals the truth.',
            sceneOrder: 1,
            position: { x: 950, y: 80 }
          },
          {
            title: 'Resolution',
            synopsis: 'Justice served',
            content: 'The aftermath where justice is served and loose ends are tied up.',
            sceneOrder: 2,
            position: { x: 950, y: 120 }
          }
        ]
      }
    ],
    characters: [
      {
        name: 'Detective Protagonist',
        description: 'The main investigator who solves the mystery',
        appearance: 'Observant and detail-oriented',
        personality: 'Persistent, analytical, and driven by justice',
        motivation: 'To uncover the truth and bring justice to victims',
        characterType: 'PROTAGONIST'
      },
      {
        name: 'Primary Suspect',
        description: 'The person who appears guilty but may be innocent',
        appearance: 'Suspicious behavior and unclear motives',
        personality: 'Secretive and defensive',
        motivation: 'Hiding something important',
        characterType: 'SUPPORTING'
      },
      {
        name: 'True Culprit',
        description: 'The real perpetrator behind the crime',
        appearance: 'Often appears innocent or helpful',
        personality: 'Manipulative and cunning',
        motivation: 'Personal gain or revenge',
        characterType: 'ANTAGONIST'
      }
    ]
  },
  {
    id: 'romance',
    name: 'Romance',
    genre: 'Romance',
    description: 'Classic romance story structure',
    acts: [
      { name: 'Act I', description: 'Setup and inciting incident', order: 1 },
      { name: 'Act II', description: 'Rising action and complications', order: 2 },
      { name: 'Act III', description: 'Climax and resolution', order: 3 }
    ],
    plotPoints: [
      {
        title: 'First Meeting',
        description: 'The charming first encounter between love interests',
        guidance: 'The first meeting should be memorable and hint at their chemistry, even if they don\'t like each other initially.',
        actOrder: 1,
        plotPointOrder: 1,
        color: CATEGORY_COLORS.ROMANCE,
        category: PLOT_POINT_CATEGORIES.ROMANCE,
        eventType: 'meet_cute',
        scenes: [
          {
            title: 'The Meet Cute',
            synopsis: 'When they first lay eyes on each other',
            content: 'The memorable first encounter that sets up their relationship.',
            sceneOrder: 1,
            position: { x: 150, y: 80 }
          }
        ]
      },
      {
        title: 'Falling for Each Other',
        description: 'Growing chemistry and connection',
        guidance: 'Show the characters getting to know each other and developing feelings through shared experiences.',
        actOrder: 1,
        plotPointOrder: 2,
        color: CATEGORY_COLORS.CHARACTER,
        category: PLOT_POINT_CATEGORIES.CHARACTER,
        eventType: 'falling_in_love',
        scenes: [
          {
            title: 'Getting to Know Each Other',
            synopsis: 'Building the connection',
            content: 'Shared experiences that bring them closer together.',
            sceneOrder: 1,
            position: { x: 350, y: 80 }
          }
        ]
      },
      {
        title: 'Getting Serious',
        description: 'Characters become closer and more vulnerable',
        guidance: 'The relationship moves to a deeper level. Characters share secrets or intimate moments.',
        actOrder: 2,
        plotPointOrder: 1,
        color: CATEGORY_COLORS.ROMANCE,
        category: PLOT_POINT_CATEGORIES.ROMANCE,
        eventType: 'relationship_deepens',
        scenes: [
          {
            title: 'Opening Up',
            synopsis: 'Sharing vulnerabilities',
            content: 'The moment they become truly vulnerable with each other.',
            sceneOrder: 1,
            position: { x: 550, y: 80 }
          }
        ]
      },
      {
        title: 'The Break-Up',
        description: 'The obstacle that seems to end the relationship',
        guidance: 'A major misunderstanding, external pressure, or internal fear threatens to tear them apart.',
        actOrder: 2,
        plotPointOrder: 2,
        color: CATEGORY_COLORS.CONFLICT,
        category: PLOT_POINT_CATEGORIES.CONFLICT,
        eventType: 'major_conflict',
        scenes: [
          {
            title: 'The Misunderstanding',
            synopsis: 'What tears them apart',
            content: 'The conflict that seems to end their relationship.',
            sceneOrder: 1,
            position: { x: 750, y: 80 }
          }
        ]
      },
      {
        title: 'Winning Them Back',
        description: 'The act that proves true love',
        guidance: 'One character makes a significant sacrifice or gesture to win back their love.',
        actOrder: 3,
        plotPointOrder: 1,
        color: CATEGORY_COLORS.ROMANCE,
        category: PLOT_POINT_CATEGORIES.ROMANCE,
        eventType: 'grand_gesture',
        scenes: [
          {
            title: 'The Grand Gesture',
            synopsis: 'Proving true love',
            content: 'The significant act that proves their love is real.',
            sceneOrder: 1,
            position: { x: 950, y: 80 }
          }
        ]
      },
      {
        title: 'Happily Ever After',
        description: 'Love conquers all',
        guidance: 'The couple reunites and commits to their future together.',
        actOrder: 3,
        plotPointOrder: 2,
        color: CATEGORY_COLORS.RESOLUTION,
        category: PLOT_POINT_CATEGORIES.RESOLUTION,
        eventType: 'happy_ending',
        scenes: [
          {
            title: 'Reunion',
            synopsis: 'Together forever',
            content: 'The happy ending where love triumphs.',
            sceneOrder: 1,
            position: { x: 1150, y: 80 }
          }
        ]
      }
    ],
    characters: [
      {
        name: 'Love Interest A',
        description: 'First romantic lead',
        appearance: 'Attractive and charismatic',
        personality: 'Charming but perhaps guarded',
        motivation: 'Finding true love and connection',
        characterType: 'PROTAGONIST'
      },
      {
        name: 'Love Interest B',  
        description: 'Second romantic lead',
        appearance: 'Appealing with hidden depths',
        personality: 'Independent but longing for partnership',
        motivation: 'Overcoming past hurt to find love',
        characterType: 'PROTAGONIST'
      }
    ]
  }
];

// Helper function to get template by ID
export function getTemplateById(templateId: string): BackendStoryTemplate | undefined {
  return BACKEND_STORY_TEMPLATES.find(template => template.id === templateId);
}

// Helper function for backward compatibility with old template enum
export function getLegacyTemplate(template?: 'NOVEL' | 'SCREENPLAY' | 'SHORT_STORY' | 'FROM_SCRATCH'): BackendStoryTemplate | undefined {
  switch (template) {
    case 'NOVEL':
      return getTemplateById('three-act-universal');
    case 'SCREENPLAY':
      return {
        ...getTemplateById('three-act-universal')!,
        acts: [
          { name: 'Act I', description: 'Setup and inciting incident', order: 1 },
          { name: 'Act II-A', description: 'First half of second act', order: 2 },
          { name: 'Act II-B', description: 'Second half of second act', order: 3 },
          { name: 'Act III', description: 'Climax and resolution', order: 4 },
        ]
      };
    case 'SHORT_STORY':
      return {
        ...getTemplateById('three-act-universal')!,
        acts: [
          { name: 'Beginning', description: 'Opening and setup', order: 1 },
          { name: 'Middle', description: 'Conflict and development', order: 2 },
          { name: 'End', description: 'Climax and resolution', order: 3 },
        ]
      };
    case 'FROM_SCRATCH':
      return {
        id: 'blank',
        name: 'Blank Canvas',
        genre: 'Universal',
        description: 'Start from scratch',
        acts: [{ name: 'Act 1', description: 'First act', order: 1 }],
        plotPoints: [],
        characters: []
      };
    default:
      return getTemplateById('three-act-universal');
  }
}

// Add blank canvas template to our main templates array
BACKEND_STORY_TEMPLATES.push({
  id: 'blank',
  name: 'Blank Canvas',
  genre: 'Universal', 
  description: 'Start from scratch with just one act',
  acts: [{ name: 'Act 1', description: 'First act', order: 1 }],
  plotPoints: [],
  characters: []
});
