// Frontend copy of backend story templates for detailed suggestions
// This mirrors the backend templates but adapted for frontend usage

import { PlotPointCategory, EventType } from '@/types/story';

export interface FrontendSceneTemplate {
  title: string;
  synopsis: string;
  content?: string;
  sceneOrder: number;
  position?: { x: number; y: number };
}

export interface FrontendPlotPointTemplate {
  id: string;
  title: string;
  description: string;
  guidance?: string;
  actOrder: number; // Which act this belongs to (1, 2, 3)
  plotPointOrder: number; // Order within the act
  color: string;
  category: PlotPointCategory;
  eventType?: string; // EventType enum value for structural story elements
  scenes?: FrontendSceneTemplate[];
  characterRequirements?: FrontendCharacterTemplate[]; // Characters to create with this plot point
}

export interface FrontendCharacterTemplate {
  name: string;
  description?: string;
  appearance?: string;
  personality?: string;
  motivation?: string;
  characterType: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
}

export interface DetailedStoryTemplate {
  id: string;
  name: string;
  genre: string;
  description: string;
  plotPoints: FrontendPlotPointTemplate[];
  characters?: FrontendCharacterTemplate[];
}

// Category colors (matching backend)
const CATEGORY_COLORS = {
  [PlotPointCategory.ACTION]: '#EF4444',
  [PlotPointCategory.CHARACTER]: '#3B82F6', 
  [PlotPointCategory.WORLDBUILDING]: '#10B981',
  [PlotPointCategory.CONFLICT]: '#F59E0B',
  [PlotPointCategory.RESOLUTION]: '#8B5CF6',
  [PlotPointCategory.TWIST]: '#EAB308',
  [PlotPointCategory.ROMANCE]: '#EC4899',
  [PlotPointCategory.MYSTERY]: '#1E40AF'
};

// Detailed story templates with complete scene and character data
export const DETAILED_STORY_TEMPLATES: DetailedStoryTemplate[] = [
  {
    id: 'three-act-universal',
    name: 'Three-Act Structure',
    genre: 'Universal',
    description: 'Classic three-act structure suitable for any genre',
    plotPoints: [
      {
        id: 'inciting-incident',
        title: 'Inciting Incident',
        description: 'The event that kicks off your story\'s main conflict',
        guidance: 'This should happen early and disrupt your protagonist\'s normal world. It forces them to take action.',
        actOrder: 1,
        plotPointOrder: 1,
        color: CATEGORY_COLORS[PlotPointCategory.CONFLICT],
        category: PlotPointCategory.CONFLICT,
        eventType: EventType.INCITING_INCIDENT,
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
        id: 'plot-point-1',
        title: 'Call to Adventure',
        description: 'Your protagonist commits to their journey',
        guidance: 'This is where your protagonist makes the decision to pursue their goal. There\'s no turning back.',
        actOrder: 1,
        plotPointOrder: 2,
        color: CATEGORY_COLORS[PlotPointCategory.CHARACTER],
        category: PlotPointCategory.CHARACTER,
        eventType: EventType.PLOT_POINT_1,
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
        id: 'midpoint',
        title: 'Midpoint Revelation',
        description: 'Everything changes - new information or major setback',
        guidance: 'The story takes a major turn. New information is revealed or a significant setback occurs.',
        actOrder: 2,
        plotPointOrder: 1,
        color: CATEGORY_COLORS[PlotPointCategory.TWIST],
        category: PlotPointCategory.TWIST,
        eventType: EventType.MIDPOINT_REVELATION,
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
        id: 'plot-point-2',
        title: 'All Is Lost',
        description: 'Darkest moment before the final push',
        guidance: 'Your protagonist faces their lowest point. This is where hope seems lost.',
        actOrder: 2,
        plotPointOrder: 2,
        color: CATEGORY_COLORS[PlotPointCategory.CONFLICT],
        category: PlotPointCategory.CONFLICT,
        eventType: EventType.PLOT_POINT_2,
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
        id: 'climax',
        title: 'Climax',
        description: 'The confrontation that resolves your main conflict',
        guidance: 'The final battle, confrontation, or moment of truth where the main conflict is resolved.',
        actOrder: 3,
        plotPointOrder: 1,
        color: CATEGORY_COLORS[PlotPointCategory.RESOLUTION],
        category: PlotPointCategory.RESOLUTION,
        eventType: EventType.CLIMAX,
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
    plotPoints: [
      {
        id: 'crime-discovery',
        title: 'The Crime',
        description: 'The crime that starts the investigation',
        guidance: 'The inciting incident for mysteries - the crime or mystery that needs solving.',
        actOrder: 1,
        plotPointOrder: 1,
        color: CATEGORY_COLORS[PlotPointCategory.MYSTERY],
        category: PlotPointCategory.MYSTERY,
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
        ],
        characterRequirements: [
          {
            name: 'Detective Protagonist',
            description: 'The main character who investigates the mystery',
            characterType: 'protagonist',
            motivation: 'Seek justice and solve puzzles'
          },
          {
            name: 'Primary Suspect',
            description: 'The first person who appears guilty',
            characterType: 'antagonist',
            motivation: 'Hide the truth and avoid consequences'
          }
        ]
      },
      {
        id: 'investigation-begins',
        title: 'Taking the Case',
        description: 'The protagonist commits to solving the mystery',
        guidance: 'Your detective or protagonist decides to investigate. Personal stakes are established.',
        actOrder: 1,
        plotPointOrder: 2,
        color: CATEGORY_COLORS[PlotPointCategory.CHARACTER],
        category: PlotPointCategory.CHARACTER,
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
        id: 'false-lead',
        title: 'Red Herring',
        description: 'False lead that misdirects the investigation',
        guidance: 'A clue or suspect that seems promising but leads nowhere. Creates misdirection.',
        actOrder: 2,
        plotPointOrder: 1,
        color: CATEGORY_COLORS[PlotPointCategory.MYSTERY],
        category: PlotPointCategory.MYSTERY,
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
        id: 'key-revelation',
        title: 'Breakthrough',
        description: 'Important clue that points toward the truth',
        guidance: 'A crucial piece of evidence or information that shifts the investigation in the right direction.',
        actOrder: 2,
        plotPointOrder: 2,
        color: CATEGORY_COLORS[PlotPointCategory.TWIST],
        category: PlotPointCategory.TWIST,
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
        id: 'final-confrontation',
        title: 'Unmasking',
        description: 'Face-off with the real antagonist',
        guidance: 'The protagonist confronts the true culprit. Truth is revealed and conflict resolved.',
        actOrder: 3,
        plotPointOrder: 1,
        color: CATEGORY_COLORS[PlotPointCategory.RESOLUTION],
        category: PlotPointCategory.RESOLUTION,
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
        ],
        characterRequirements: [
          {
            name: 'True Culprit',
            description: 'The actual perpetrator of the crime',
            characterType: 'antagonist',
            motivation: 'Cover up their crime and escape justice'
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
        characterType: 'protagonist'
      },
      {
        name: 'Primary Suspect',
        description: 'The person who appears guilty but may be innocent',
        appearance: 'Suspicious behavior and unclear motives',
        personality: 'Secretive and defensive',
        motivation: 'Hiding something important',
        characterType: 'supporting'
      },
      {
        name: 'True Culprit',
        description: 'The real perpetrator behind the crime',
        appearance: 'Often appears innocent or helpful',
        personality: 'Manipulative and cunning',
        motivation: 'Personal gain or revenge',
        characterType: 'antagonist'
      }
    ]
  },
  {
    id: 'romance',
    name: 'Romance',
    genre: 'Romance',
    description: 'Classic romance story structure',
    plotPoints: [
      {
        id: 'meet-cute',
        title: 'First Meeting',
        description: 'The charming first encounter between love interests',
        guidance: 'The first meeting should be memorable and hint at their chemistry, even if they don\'t like each other initially.',
        actOrder: 1,
        plotPointOrder: 1,
        color: CATEGORY_COLORS[PlotPointCategory.ROMANCE],
        category: PlotPointCategory.ROMANCE,
        scenes: [
          {
            title: 'The Meet Cute',
            synopsis: 'When they first lay eyes on each other',
            content: 'The memorable first encounter that sets up their relationship.',
            sceneOrder: 1,
            position: { x: 150, y: 80 }
          }
        ],
        characterRequirements: [
          {
            name: 'Love Interest A',
            description: 'First romantic lead',
            characterType: 'protagonist',
            motivation: 'Find true love and emotional connection'
          },
          {
            name: 'Love Interest B',
            description: 'Second romantic lead',
            characterType: 'protagonist',
            motivation: 'Find true love and overcome personal barriers'
          }
        ]
      },
      {
        id: 'attraction-building',
        title: 'Falling for Each Other',
        description: 'Growing chemistry and connection',
        guidance: 'Show the characters getting to know each other and developing feelings through shared experiences.',
        actOrder: 1,
        plotPointOrder: 2,
        color: CATEGORY_COLORS[PlotPointCategory.CHARACTER],
        category: PlotPointCategory.CHARACTER,
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
        id: 'relationship-deepens',
        title: 'Getting Serious',
        description: 'Characters become closer and more vulnerable',
        guidance: 'The relationship moves to a deeper level. Characters share secrets or intimate moments.',
        actOrder: 2,
        plotPointOrder: 1,
        color: CATEGORY_COLORS[PlotPointCategory.ROMANCE],
        category: PlotPointCategory.ROMANCE,
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
        id: 'major-conflict',
        title: 'The Break-Up',
        description: 'The obstacle that seems to end the relationship',
        guidance: 'A major misunderstanding, external pressure, or internal fear threatens to tear them apart.',
        actOrder: 2,
        plotPointOrder: 2,
        color: CATEGORY_COLORS[PlotPointCategory.CONFLICT],
        category: PlotPointCategory.CONFLICT,
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
        id: 'grand-gesture',
        title: 'Winning Them Back',
        description: 'The act that proves true love',
        guidance: 'One character makes a significant sacrifice or gesture to win back their love.',
        actOrder: 3,
        plotPointOrder: 1,
        color: CATEGORY_COLORS[PlotPointCategory.ROMANCE],
        category: PlotPointCategory.ROMANCE,
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
        id: 'happy-ending',
        title: 'Happily Ever After',
        description: 'Love conquers all',
        guidance: 'The couple reunites and commits to their future together.',
        actOrder: 3,
        plotPointOrder: 2,
        color: CATEGORY_COLORS[PlotPointCategory.RESOLUTION],
        category: PlotPointCategory.RESOLUTION,
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
        characterType: 'protagonist'
      },
      {
        name: 'Love Interest B',  
        description: 'Second romantic lead',
        appearance: 'Appealing with hidden depths',
        personality: 'Independent but longing for partnership',
        motivation: 'Overcoming past hurt to find love',
        characterType: 'protagonist'
      }
    ]
  }
];

// Helper functions
export function getDetailedTemplateById(templateId: string): DetailedStoryTemplate | undefined {
  return DETAILED_STORY_TEMPLATES.find(template => template.id === templateId);
}

export function getPlotPointTemplateById(templateId: string, plotPointId: string): FrontendPlotPointTemplate | undefined {
  const template = getDetailedTemplateById(templateId);
  return template?.plotPoints.find(pp => pp.id === plotPointId);
}

export const DetailedTemplateService = {
  DETAILED_STORY_TEMPLATES,
  getDetailedTemplateById,
  getPlotPointTemplateById
};

export default DetailedTemplateService;
