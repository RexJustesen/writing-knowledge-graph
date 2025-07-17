'use client';

import { 
  StoryTemplate, 
  PlotPointTemplate, 
  QuickTemplate, 
  PlotPointCategory,
  PlotPointSuggestion,
  Project,
  PlotPoint,
  EventType
} from '@/types/story';

// Predefined Story Templates
export const STORY_TEMPLATES: StoryTemplate[] = [
  {
    id: 'three-act-universal',
    name: 'Three-Act Structure',
    genre: 'Universal',
    description: 'Classic three-act structure suitable for any genre',
    actStructure: 3,
    plotPoints: [
      {
        id: 'inciting-incident',
        name: 'Inciting Incident',
        description: 'The event that kicks off your story\'s main conflict',
        guidance: 'This should happen early and disrupt your protagonist\'s normal world. It forces them to take action.',
        actId: 'act-1',
        order: 1,
        genre: ['Universal'],
        optional: false,
        category: PlotPointCategory.CONFLICT,
        defaultTitle: 'Inciting Incident'
      },
      {
        id: 'plot-point-1',
        name: 'Plot Point 1',
        description: 'Your protagonist commits to their journey',
        guidance: 'This is where your protagonist makes the decision to pursue their goal. There\'s no turning back.',
        actId: 'act-1',
        order: 2,
        genre: ['Universal'],
        optional: false,
        category: PlotPointCategory.CHARACTER,
        defaultTitle: 'Call to Adventure'
      },
      {
        id: 'midpoint',
        name: 'Midpoint',
        description: 'Everything changes - new information or major setback',
        guidance: 'The story takes a major turn. New information is revealed or a significant setback occurs.',
        actId: 'act-2',
        order: 1,
        genre: ['Universal'],
        optional: false,
        category: PlotPointCategory.TWIST,
        defaultTitle: 'Midpoint Revelation'
      },
      {
        id: 'plot-point-2',
        name: 'Plot Point 2',
        description: 'Darkest moment before the final push',
        guidance: 'Your protagonist faces their lowest point. This is where hope seems lost.',
        actId: 'act-2',
        order: 2,
        genre: ['Universal'],
        optional: false,
        category: PlotPointCategory.CONFLICT,
        defaultTitle: 'All Is Lost'
      },
      {
        id: 'climax',
        name: 'Climax',
        description: 'The confrontation that resolves your main conflict',
        guidance: 'The final battle, confrontation, or moment of truth where the main conflict is resolved.',
        actId: 'act-3',
        order: 1,
        genre: ['Universal'],
        optional: false,
        category: PlotPointCategory.RESOLUTION,
        defaultTitle: 'Climax'
      },
      {
        id: 'resolution',
        name: 'Resolution',
        description: 'The aftermath and new normal',
        guidance: 'Show how the world has changed and what the new normal looks like for your characters.',
        actId: 'act-3',
        order: 2,
        genre: ['Universal'],
        optional: true,
        category: PlotPointCategory.RESOLUTION,
        defaultTitle: 'Resolution'
      }
    ]
  },
  {
    id: 'mystery-thriller',
    name: 'Mystery/Thriller',
    genre: 'Mystery',
    description: 'Classic mystery structure with investigation beats',
    actStructure: 3,
    plotPoints: [
      {
        id: 'crime-discovery',
        name: 'Crime Discovery',
        description: 'The crime that starts the investigation',
        guidance: 'The inciting incident for mysteries - the crime or mystery that needs solving.',
        actId: 'act-1',
        order: 1,
        genre: ['Mystery', 'Thriller'],
        optional: false,
        category: PlotPointCategory.MYSTERY,
        defaultTitle: 'The Crime'
      },
      {
        id: 'investigation-begins',
        name: 'Investigation Begins',
        description: 'The protagonist commits to solving the mystery',
        guidance: 'Your detective or protagonist decides to investigate. Personal stakes are established.',
        actId: 'act-1',
        order: 2,
        genre: ['Mystery', 'Thriller'],
        optional: false,
        category: PlotPointCategory.CHARACTER,
        defaultTitle: 'Taking the Case'
      },
      {
        id: 'false-lead',
        name: 'False Lead',
        description: 'Red herring that misdirects the investigation',
        guidance: 'A clue or suspect that seems promising but leads nowhere. Creates misdirection.',
        actId: 'act-2',
        order: 1,
        genre: ['Mystery', 'Thriller'],
        optional: false,
        category: PlotPointCategory.MYSTERY,
        defaultTitle: 'Red Herring'
      },
      {
        id: 'key-revelation',
        name: 'Key Revelation',
        description: 'Important clue that points toward the truth',
        guidance: 'A crucial piece of evidence or information that shifts the investigation in the right direction.',
        actId: 'act-2',
        order: 2,
        genre: ['Mystery', 'Thriller'],
        optional: false,
        category: PlotPointCategory.TWIST,
        defaultTitle: 'Breakthrough'
      },
      {
        id: 'final-confrontation',
        name: 'Final Confrontation',
        description: 'Face-off with the real antagonist',
        guidance: 'The protagonist confronts the true culprit. Truth is revealed and conflict resolved.',
        actId: 'act-3',
        order: 1,
        genre: ['Mystery', 'Thriller'],
        optional: false,
        category: PlotPointCategory.RESOLUTION,
        defaultTitle: 'Unmasking'
      }
    ]
  },
  {
    id: 'romance',
    name: 'Romance',
    genre: 'Romance',
    description: 'Classic romance story structure',
    actStructure: 3,
    plotPoints: [
      {
        id: 'meet-cute',
        name: 'Meet Cute',
        description: 'The charming first encounter between love interests',
        guidance: 'The first meeting should be memorable and hint at their chemistry, even if they don\'t like each other initially.',
        actId: 'act-1',
        order: 1,
        genre: ['Romance'],
        optional: false,
        category: PlotPointCategory.ROMANCE,
        defaultTitle: 'First Meeting'
      },
      {
        id: 'attraction-building',
        name: 'Growing Attraction',
        description: 'Growing chemistry and connection',
        guidance: 'Show the characters getting to know each other and developing feelings through shared experiences.',
        actId: 'act-1',
        order: 2,
        genre: ['Romance'],
        optional: false,
        category: PlotPointCategory.CHARACTER,
        defaultTitle: 'Falling for Each Other'
      },
      {
        id: 'relationship-deepens',
        name: 'Relationship Deepens',
        description: 'Characters become closer and more vulnerable',
        guidance: 'The relationship moves to a deeper level. Characters share secrets or intimate moments.',
        actId: 'act-2',
        order: 1,
        genre: ['Romance'],
        optional: false,
        category: PlotPointCategory.ROMANCE,
        defaultTitle: 'Getting Serious'
      },
      {
        id: 'major-conflict',
        name: 'Major Conflict',
        description: 'The obstacle that seems to end the relationship',
        guidance: 'A major misunderstanding, external pressure, or internal fear threatens to tear them apart.',
        actId: 'act-2',
        order: 2,
        genre: ['Romance'],
        optional: false,
        category: PlotPointCategory.CONFLICT,
        defaultTitle: 'The Break-Up'
      },
      {
        id: 'grand-gesture',
        name: 'Grand Gesture',
        description: 'The act that proves true love',
        guidance: 'One character makes a significant sacrifice or gesture to win back their love.',
        actId: 'act-3',
        order: 1,
        genre: ['Romance'],
        optional: false,
        category: PlotPointCategory.ROMANCE,
        defaultTitle: 'Winning Them Back'
      },
      {
        id: 'happy-ending',
        name: 'Happy Ending',
        description: 'Love conquers all',
        guidance: 'The couple reunites and commits to their future together.',
        actId: 'act-3',
        order: 2,
        genre: ['Romance'],
        optional: false,
        category: PlotPointCategory.RESOLUTION,
        defaultTitle: 'Happily Ever After'
      }
    ]
  }
];

// Quick Templates for rapid plot point creation
export const QUICK_TEMPLATES: QuickTemplate[] = [
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
  },
  {
    id: 'plot_twist',
    name: 'Plot Twist',
    category: PlotPointCategory.TWIST,
    defaultTitle: 'Unexpected Revelation',
    descriptionTemplate: 'Shocking revelation that [what is revealed] changes everything. This means [consequences].',
    suggestedFields: ['revelation', 'impact', 'foreshadowing']
  },
  {
    id: 'conflict_scene',
    name: 'Conflict',
    category: PlotPointCategory.CONFLICT,
    defaultTitle: 'Confrontation',
    descriptionTemplate: '[Character A] confronts [Character B] about [issue]. The stakes are [consequences].',
    suggestedFields: ['participants', 'issue', 'outcome']
  },
  {
    id: 'world_building',
    name: 'World Building',
    category: PlotPointCategory.WORLDBUILDING,
    defaultTitle: 'World Expansion',
    descriptionTemplate: 'Characters discover/explore [location/concept] which reveals [worldbuilding element].',
    suggestedFields: ['location', 'discovery', 'significance']
  },
  {
    id: 'resolution_scene',
    name: 'Resolution',
    category: PlotPointCategory.RESOLUTION,
    defaultTitle: 'Conclusion',
    descriptionTemplate: '[Conflict/situation] is resolved when [solution]. This leads to [new status quo].',
    suggestedFields: ['resolution', 'method', 'aftermath']
  },
  {
    id: 'midpoint_revelation',
    name: 'Midpoint Revelation',
    category: PlotPointCategory.TWIST,
    defaultTitle: 'Midpoint Revelation',
    descriptionTemplate: 'Everything changes - new information or major setback. [What is revealed/happens] shifts the entire story direction.',
    suggestedFields: ['revelation', 'impact', 'new_direction'],
    eventType: EventType.MIDPOINT_REVELATION
  },
  {
    id: 'midpoint',
    name: 'Midpoint',
    category: PlotPointCategory.TWIST,
    defaultTitle: 'Midpoint',
    descriptionTemplate: 'Everything changes - new information or major setback. [What is revealed/happens] shifts the entire story direction.',
    suggestedFields: ['revelation', 'impact', 'new_direction'],
    eventType: EventType.MIDPOINT_REVELATION
  },
  {
    id: 'inciting_incident',
    name: 'Inciting Incident',
    category: PlotPointCategory.CONFLICT,
    defaultTitle: 'Inciting Incident',
    descriptionTemplate: 'The event that kicks off the main story. [What happens] forces [character] to [react/change].',
    suggestedFields: ['trigger_event', 'character_response', 'stakes'],
    eventType: EventType.INCITING_INCIDENT
  },
  {
    id: 'climax',
    name: 'Climax',
    category: PlotPointCategory.CONFLICT,
    defaultTitle: 'Climax',
    descriptionTemplate: 'The final confrontation where [character] faces [main conflict]. The outcome determines [story resolution].',
    suggestedFields: ['confrontation', 'stakes', 'resolution'],
    eventType: EventType.CLIMAX
  },
  {
    id: 'plot_point_1',
    name: 'Plot Point 1',
    category: PlotPointCategory.CONFLICT,
    defaultTitle: 'Plot Point 1',
    descriptionTemplate: 'The moment where [character] commits to [quest/goal]. There is no turning back.',
    suggestedFields: ['commitment', 'point_of_no_return', 'stakes'],
    eventType: EventType.PLOT_POINT_1
  },
  {
    id: 'plot_point_2',
    name: 'Plot Point 2',
    category: PlotPointCategory.CONFLICT,
    defaultTitle: 'Plot Point 2',
    descriptionTemplate: 'The darkest moment where [character] faces [major setback]. All seems lost.',
    suggestedFields: ['setback', 'emotional_low', 'new_approach'],
    eventType: EventType.PLOT_POINT_2
  }
];

// Category configuration with colors and icons
export const CATEGORY_CONFIG = {
  [PlotPointCategory.ACTION]: { 
    color: '#EF4444', 
    icon: '⚔️', 
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    textColor: '#991B1B'
  },
  [PlotPointCategory.CHARACTER]: { 
    color: '#3B82F6', 
    icon: '👤', 
    bgColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    textColor: '#1D4ED8'
  },
  [PlotPointCategory.WORLDBUILDING]: { 
    color: '#10B981', 
    icon: '🌍', 
    bgColor: '#ECFDF5',
    borderColor: '#D1FAE5',
    textColor: '#047857'
  },
  [PlotPointCategory.CONFLICT]: { 
    color: '#F59E0B', 
    icon: '⚡', 
    bgColor: '#FFFBEB',
    borderColor: '#FED7AA',
    textColor: '#92400E'
  },
  [PlotPointCategory.RESOLUTION]: { 
    color: '#8B5CF6', 
    icon: '✅', 
    bgColor: '#F5F3FF',
    borderColor: '#E9D5FF',
    textColor: '#6D28D9'
  },
  [PlotPointCategory.TWIST]: { 
    color: '#EAB308', 
    icon: '🔄', 
    bgColor: '#FEFCE8',
    borderColor: '#FEF08A',
    textColor: '#A16207'
  },
  [PlotPointCategory.ROMANCE]: { 
    color: '#EC4899', 
    icon: '❤️', 
    bgColor: '#FDF2F8',
    borderColor: '#FBCFE8',
    textColor: '#BE185D'
  },
  [PlotPointCategory.MYSTERY]: { 
    color: '#1E40AF', 
    icon: '🔍', 
    bgColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    textColor: '#1E3A8A'
  }
};

// Template Service Class
export class TemplateService {
  
  static getTemplateById(templateId: string): StoryTemplate | undefined {
    return STORY_TEMPLATES.find(t => t.id === templateId);
  }

  static getTemplatesByGenre(genre: string): StoryTemplate[] {
    return STORY_TEMPLATES.filter(t => 
      t.genre === genre || t.genre === 'Universal'
    );
  }

  static getAllTemplates(): StoryTemplate[] {
    return STORY_TEMPLATES;
  }

  static getQuickTemplates(): QuickTemplate[] {
    return QUICK_TEMPLATES;
  }

  static getQuickTemplateById(templateId: string): QuickTemplate | undefined {
    return QUICK_TEMPLATES.find(t => t.id === templateId);
  }

  static getCategoryConfig(category: PlotPointCategory) {
    return CATEGORY_CONFIG[category];
  }

  static createProjectFromTemplate(
    templateId: string, 
    projectTitle: string, 
    projectDescription?: string
  ): Partial<Project> {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Create acts based on template structure
    const acts = [];
    for (let i = 1; i <= template.actStructure; i++) {
      acts.push({
        id: `act-${i}`,
        name: `Act ${i}`,
        description: i === 1 ? 'Setup' : i === template.actStructure ? 'Resolution' : 'Development',
        order: i
      });
    }

    // Create plot points from template
    const plotPoints: PlotPoint[] = template.plotPoints.map((templatePoint, index) => ({
      id: `plot-${Date.now()}-${index}`,
      title: templatePoint.defaultTitle,
      description: templatePoint.description,
      guidance: templatePoint.guidance,
      position: { x: 100 + (index * 200), y: 100 },
      color: CATEGORY_CONFIG[templatePoint.category].color,
      actId: templatePoint.actId,
      scenes: [],
      category: templatePoint.category,
      templateId: templatePoint.id
    }));

    return {
      title: projectTitle,
      description: projectDescription,
      genre: template.genre,
      templateId: template.id,
      acts,
      currentActId: 'act-1',
      plotPoints,
      characters: []
    };
  }

  static applyQuickTemplate(templateId: string, actId: string, position: { x: number; y: number }): Partial<PlotPoint> {
    const template = this.getQuickTemplateById(templateId);
    if (!template) {
      throw new Error(`Quick template ${templateId} not found`);
    }

    return {
      title: template.defaultTitle,
      description: template.descriptionTemplate,
      category: template.category,
      color: CATEGORY_CONFIG[template.category].color,
      actId,
      position,
      scenes: [],
      eventType: template.eventType
    };
  }
}

export default TemplateService;
