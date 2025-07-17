'use client';

import { 
  Project, 
  PlotPoint, 
  PlotPointSuggestion, 
  StructureValidation, 
  ValidationWarning, 
  ValidationSuggestion,
  PlotPointCategory,
  EventType
} from '@/types/story';
import { TemplateService, STORY_TEMPLATES } from './templateService';

export class StoryAnalysisService {
  
  /**
   * Analyze the project's genre based on existing plot points and content
   */
  static analyzeStoryGenre(project: Project): string[] {
    const detectedGenres: string[] = [];
    
    // Check for genre-specific plot point categories
    const categories = project.plotPoints.map(pp => pp.category).filter(Boolean);
    
    if (categories.includes(PlotPointCategory.ROMANCE)) {
      detectedGenres.push('Romance');
    }
    if (categories.includes(PlotPointCategory.MYSTERY)) {
      detectedGenres.push('Mystery');
    }
    if (categories.includes(PlotPointCategory.ACTION)) {
      detectedGenres.push('Action');
    }
    
    // Check for genre-specific keywords in titles and descriptions
    const allText = project.plotPoints
      .map(pp => `${pp.title} ${pp.description || ''}`)
      .join(' ')
      .toLowerCase();
    
    if (/murder|detective|investigation|clue|suspect/.test(allText)) {
      if (!detectedGenres.includes('Mystery')) detectedGenres.push('Mystery');
    }
    
    if (/love|romance|relationship|wedding|date/.test(allText)) {
      if (!detectedGenres.includes('Romance')) detectedGenres.push('Romance');
    }
    
    if (/magic|wizard|dragon|fantasy|spell/.test(allText)) {
      detectedGenres.push('Fantasy');
    }
    
    if (/space|alien|future|robot|technology/.test(allText)) {
      detectedGenres.push('Sci-Fi');
    }
    
    return detectedGenres.length > 0 ? detectedGenres : ['Universal'];
  }

  /**
   * Generate contextual plot point suggestions based on current story state
   * Uses EventType to track structural story elements instead of plot point names
   */
  static generateSuggestions(project: Project): PlotPointSuggestion[] {
    const suggestions: PlotPointSuggestion[] = [];
    const detectedGenres = this.analyzeStoryGenre(project);
    
    // Get existing event types from plot points
    const existingEventTypes = new Set(
      project.plotPoints
        .map(pp => pp.eventType)
        .filter(eventType => eventType !== undefined && eventType !== null)
    );
    
    // Define essential story beats by genre
    const universalBeats = [
      {
        eventType: EventType.INCITING_INCIDENT,
        title: 'Inciting Incident',
        description: 'The event that kicks off your story\'s main conflict',
        actId: 'act-1',
        category: PlotPointCategory.CONFLICT,
        priority: 0.9,
        prerequisites: []
      },
      {
        eventType: EventType.PLOT_POINT_1,
        title: 'Call to Adventure',
        description: 'Your protagonist commits to their journey',
        actId: 'act-1',
        category: PlotPointCategory.CHARACTER,
        priority: 0.8,
        prerequisites: [EventType.INCITING_INCIDENT]
      },
      {
        eventType: EventType.MIDPOINT_REVELATION,
        title: 'Midpoint Revelation',
        description: 'Everything changes - new information or major setback',
        actId: 'act-2',
        category: PlotPointCategory.TWIST,
        priority: 0.8,
        prerequisites: [EventType.PLOT_POINT_1]
      },
      {
        eventType: EventType.PLOT_POINT_2,
        title: 'All Is Lost',
        description: 'Darkest moment before the final push',
        actId: 'act-2',
        category: PlotPointCategory.CONFLICT,
        priority: 0.8,
        prerequisites: [EventType.MIDPOINT_REVELATION]
      },
      {
        eventType: EventType.CLIMAX,
        title: 'Climax',
        description: 'The confrontation that resolves your main conflict',
        actId: 'act-3',
        category: PlotPointCategory.RESOLUTION,
        priority: 0.9,
        prerequisites: [EventType.PLOT_POINT_2]
      }
    ];
    
    const mysteryBeats = [
      {
        eventType: EventType.CRIME_DISCOVERY,
        title: 'The Crime',
        description: 'The crime that starts the investigation',
        actId: 'act-1',
        category: PlotPointCategory.MYSTERY,
        priority: 0.9,
        prerequisites: []
      },
      {
        eventType: EventType.INVESTIGATION_BEGINS,
        title: 'Taking the Case',
        description: 'The protagonist commits to solving the mystery',
        actId: 'act-1',
        category: PlotPointCategory.CHARACTER,
        priority: 0.8,
        prerequisites: [EventType.CRIME_DISCOVERY]
      },
      {
        eventType: EventType.FALSE_LEAD,
        title: 'Red Herring',
        description: 'False lead that misdirects the investigation',
        actId: 'act-2',
        category: PlotPointCategory.MYSTERY,
        priority: 0.7,
        prerequisites: [EventType.INVESTIGATION_BEGINS]
      },
      {
        eventType: EventType.KEY_REVELATION,
        title: 'Breakthrough',
        description: 'Important clue that points toward the truth',
        actId: 'act-2',
        category: PlotPointCategory.TWIST,
        priority: 0.8,
        prerequisites: [EventType.FALSE_LEAD]
      },
      {
        eventType: EventType.UNMASKING,
        title: 'Unmasking',
        description: 'Face-off with the real antagonist',
        actId: 'act-3',
        category: PlotPointCategory.RESOLUTION,
        priority: 0.9,
        prerequisites: [EventType.KEY_REVELATION]
      }
    ];
    
    const romanceBeats = [
      {
        eventType: EventType.MEET_CUTE,
        title: 'First Meeting',
        description: 'The charming first encounter between love interests',
        actId: 'act-1',
        category: PlotPointCategory.ROMANCE,
        priority: 0.9,
        prerequisites: []
      },
      {
        eventType: EventType.FALLING_IN_LOVE,
        title: 'Falling for Each Other',
        description: 'Growing chemistry and connection',
        actId: 'act-1',
        category: PlotPointCategory.CHARACTER,
        priority: 0.8,
        prerequisites: [EventType.MEET_CUTE]
      },
      {
        eventType: EventType.RELATIONSHIP_DEEPENS,
        title: 'Getting Serious',
        description: 'Characters become closer and more vulnerable',
        actId: 'act-2',
        category: PlotPointCategory.ROMANCE,
        priority: 0.7,
        prerequisites: [EventType.FALLING_IN_LOVE]
      },
      {
        eventType: EventType.MAJOR_CONFLICT,
        title: 'The Break-Up',
        description: 'The obstacle that seems to end the relationship',
        actId: 'act-2',
        category: PlotPointCategory.CONFLICT,
        priority: 0.8,
        prerequisites: [EventType.RELATIONSHIP_DEEPENS]
      },
      {
        eventType: EventType.GRAND_GESTURE,
        title: 'Winning Them Back',
        description: 'The act that proves true love',
        actId: 'act-3',
        category: PlotPointCategory.ROMANCE,
        priority: 0.8,
        prerequisites: [EventType.MAJOR_CONFLICT]
      },
      {
        eventType: EventType.HAPPY_ENDING,
        title: 'Happily Ever After',
        description: 'Love conquers all',
        actId: 'act-3',
        category: PlotPointCategory.RESOLUTION,
        priority: 0.9,
        prerequisites: [EventType.GRAND_GESTURE]
      }
    ];
    
    // Determine which beats to check based on detected genre
    let relevantBeats = [...universalBeats];
    if (detectedGenres.includes('Mystery')) {
      relevantBeats = [...mysteryBeats];
    } else if (detectedGenres.includes('Romance')) {
      relevantBeats = [...romanceBeats];
    }
    
    // Filter out beats that are already covered
    const missingBeats = relevantBeats.filter(beat => 
      !existingEventTypes.has(beat.eventType)
    );
    
    // Check prerequisites and suggest missing beats
    for (const beat of missingBeats) {
      const prerequisitesMet = beat.prerequisites.every(prereq => 
        existingEventTypes.has(prereq)
      );
      
      // Only suggest if prerequisites are met (or no prerequisites)
      if (prerequisitesMet || beat.prerequisites.length === 0) {
        suggestions.push({
          id: `suggestion-${beat.eventType}-${Date.now()}`,
          title: beat.title,
          description: beat.description,
          reasoning: this.generateReasoningForEventType(beat.eventType, project),
          suggestedActId: beat.actId,
          confidence: beat.priority,
          templateSource: this.getTemplateSourceForGenre(detectedGenres),
          category: beat.category,
          eventType: beat.eventType
        });
      }
    }
    
    // Sort by confidence and return top 3
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  /**
   * Generate contextual reasoning for why a specific event type should be added
   */
  private static generateReasoningForEventType(eventType: EventType, project: Project, actAnalysis?: any): string {
    const plotPointCount = project.plotPoints.length;
    
    switch (eventType) {
      case EventType.INCITING_INCIDENT:
        return plotPointCount === 0 
          ? "Every story needs an inciting incident to kick off the main conflict."
          : "Your story needs an inciting incident to set the main conflict in motion.";
      
      case EventType.PLOT_POINT_1:
        return "Your protagonist needs to commit to their journey with a clear decision point.";
      
      case EventType.MIDPOINT_REVELATION:
        return "Act II needs a midpoint where everything changes to maintain story momentum.";
      
      case EventType.PLOT_POINT_2:
        return "Your protagonist needs a dark moment before the final push to create tension.";
      
      case EventType.CLIMAX:
        return "Your story needs a climactic moment to resolve the main conflict.";
      
      case EventType.CRIME_DISCOVERY:
        return "Mystery stories need a central crime or puzzle to solve.";
      
      case EventType.INVESTIGATION_BEGINS:
        return "Your detective needs to commit to solving the mystery with personal stakes.";
      
      case EventType.FALSE_LEAD:
        return "Mysteries need misdirection to keep readers guessing.";
      
      case EventType.KEY_REVELATION:
        return "A breakthrough moment that shifts the investigation toward the truth.";
      
      case EventType.UNMASKING:
        return "The climactic confrontation where the truth is revealed.";
      
      case EventType.MEET_CUTE:
        return "Romance stories benefit from a memorable first meeting between love interests.";
      
      case EventType.FALLING_IN_LOVE:
        return "Show the characters developing feelings through shared experiences.";
      
      case EventType.RELATIONSHIP_DEEPENS:
        return "The relationship needs to move to a deeper, more vulnerable level.";
      
      case EventType.MAJOR_CONFLICT:
        return "Something must threaten to tear the lovers apart.";
      
      case EventType.GRAND_GESTURE:
        return "One character needs to prove their love with a significant act.";
      
      case EventType.HAPPY_ENDING:
        return "Romance stories need a satisfying reunion and commitment to the future.";
      
      default:
        return "This story element would strengthen your narrative structure.";
    }
  }

  /**
   * Get the template source name based on detected genres
   */
  private static getTemplateSourceForGenre(genres: string[]): string {
    if (genres.includes('Mystery')) return 'Mystery/Thriller Template';
    if (genres.includes('Romance')) return 'Romance Template';
    return 'Universal Three-Act Template';
  }

  /**
   * Determine if a specific plot point should be suggested
   */
  private static shouldSuggestPlotPoint(
    project: Project, 
    templatePoint: any, 
    template: any
  ): { suggest: boolean; reasoning: string; confidence: number } {
    const plotPointCount = project.plotPoints.length;
    const actPlotPoints = project.plotPoints.filter(pp => pp.actId === templatePoint.actId);
    
    // Basic logic for when to suggest plot points
    switch (templatePoint.id) {
      case 'inciting-incident':
        if (plotPointCount > 0 && actPlotPoints.length === 0) {
          return {
            suggest: true,
            reasoning: "Your story needs an inciting incident to kick off the main conflict.",
            confidence: 0.9
          };
        }
        break;
        
      case 'midpoint':
        if (plotPointCount >= 2 && !project.plotPoints.some(pp => pp.actId === 'act-2')) {
          return {
            suggest: true,
            reasoning: "Act II needs a midpoint to maintain story momentum.",
            confidence: 0.8
          };
        }
        break;
        
      case 'climax':
        if (plotPointCount >= 3 && !project.plotPoints.some(pp => pp.actId === 'act-3')) {
          return {
            suggest: true,
            reasoning: "Your story needs a climactic moment to resolve the main conflict.",
            confidence: 0.85
          };
        }
        break;
        
      case 'meet-cute':
        if (template.genre === 'Romance' && plotPointCount > 0) {
          return {
            suggest: true,
            reasoning: "Romance stories benefit from a memorable first meeting between love interests.",
            confidence: 0.7
          };
        }
        break;
        
      case 'crime-discovery':
        if (template.genre === 'Mystery' && plotPointCount > 0) {
          return {
            suggest: true,
            reasoning: "Mystery stories need a central crime or puzzle to solve.",
            confidence: 0.8
          };
        }
        break;
    }
    
    return { suggest: false, reasoning: '', confidence: 0 };
  }

  /**
   * Validate story structure and provide feedback
   */
  static validateStructure(project: Project): StructureValidation {
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];
    const strengths: string[] = [];
    
    // Analyze act distribution
    const actCounts = project.acts.map(act => ({
      actId: act.id,
      actName: act.name,
      count: project.plotPoints.filter(pp => pp.actId === act.id).length
    }));
    
    // Check for missing essential elements
    this.validateEssentialElements(project, warnings, suggestions);
    
    // Check pacing issues
    this.validatePacing(project, actCounts, warnings, suggestions);
    
    // Check genre consistency
    this.validateGenreConsistency(project, warnings);
    
    // Identify strengths
    this.identifyStoryStrengths(project, strengths);
    
    // Calculate overall score
    const score = this.calculateStructureScore(project, warnings);
    
    return {
      score,
      warnings,
      suggestions,
      strengths
    };
  }

  private static validateEssentialElements(
    project: Project, 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ) {
    // Get existing event types from plot points
    const existingEventTypes = new Set(
      project.plotPoints
        .map(pp => pp.eventType)
        .filter((et): et is EventType => et !== undefined)
    );
    
    // Analyze act structure dynamically
    const actAnalysis = this.analyzeActStructure(project);
    
    // Check for essential story beats based on story length and structure
    this.validateStoryBeats(project, existingEventTypes, actAnalysis, warnings, suggestions);
  }

  private static analyzeActStructure(project: Project) {
    const acts = project.acts.sort((a, b) => a.order - b.order);
    const actAnalysis = acts.map(act => {
      const plotPoints = project.plotPoints.filter(pp => pp.actId === act.id);
      const eventTypes = plotPoints
        .map(pp => pp.eventType)
        .filter((et): et is EventType => et !== undefined);
      
      return {
        act,
        plotPointCount: plotPoints.length,
        eventTypes: new Set(eventTypes),
        isEmpty: plotPoints.length === 0
      };
    });

    return {
      totalActs: acts.length,
      acts: actAnalysis,
      firstAct: actAnalysis[0],
      middleActs: actAnalysis.slice(1, -1),
      lastAct: actAnalysis[actAnalysis.length - 1],
      hasContent: actAnalysis.some(a => !a.isEmpty)
    };
  }

  private static validateStoryBeats(
    project: Project,
    existingEventTypes: Set<EventType>,
    actAnalysis: any,
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ) {
    // Essential beats for any story length
    const essentialBeats: Array<{
      eventType: EventType;
      name: string;
      description: string;
      preferredAct: string;
      severity: 'low' | 'medium' | 'high';
    }> = [
      {
        eventType: EventType.INCITING_INCIDENT,
        name: 'Inciting Incident',
        description: 'The event that kicks off your main story conflict',
        preferredAct: 'first',
        severity: 'high'
      },
      {
        eventType: EventType.CLIMAX,
        name: 'Climax',
        description: 'The peak moment of conflict and tension',
        preferredAct: 'last',
        severity: 'high'
      }
    ];

    // Additional beats for longer stories
    if (actAnalysis.totalActs >= 2) {
      essentialBeats.push({
        eventType: EventType.PLOT_POINT_1,
        name: 'Plot Point 1',
        description: 'Major story turning point that propels the narrative forward',
        preferredAct: actAnalysis.totalActs === 2 ? 'first' : 'first',
        severity: 'medium'
      });
    }

    if (actAnalysis.totalActs >= 3) {
      essentialBeats.push({
        eventType: EventType.MIDPOINT_REVELATION,
        name: 'Midpoint Revelation',
        description: 'Major revelation or shift that changes everything',
        preferredAct: 'middle',
        severity: 'medium'
      });
      
      essentialBeats.push({
        eventType: EventType.PLOT_POINT_2,
        name: 'Plot Point 2',
        description: 'Final major turn before the climax',
        preferredAct: actAnalysis.totalActs > 3 ? 'middle' : 'middle',
        severity: 'medium'
      });
    }

    // Check for missing essential beats
    essentialBeats.forEach(beat => {
      if (!existingEventTypes.has(beat.eventType)) {
        const targetAct = this.getTargetActForBeat(beat.preferredAct, actAnalysis);
        const suggestedActId = this.getSuggestedActId(beat.preferredAct, actAnalysis);
        
        warnings.push({
          type: 'missing_element',
          message: `No ${beat.name} found`,
          suggestion: beat.description,
          actId: targetAct?.act.id || actAnalysis.firstAct?.act.id || 'unknown',
          severity: beat.severity
        });

        // Create suggestion with intelligent act handling
        const suggestion: any = {
          id: `add-${beat.eventType}`,
          message: `Consider adding a ${beat.name}`,
          action: 'Add plot point',
          templateId: beat.eventType,
          suggestedActId,
          needsActCreation: this.needsActCreation(beat.preferredAct, actAnalysis)
        };

        // Add context about act creation if needed
        if (suggestion.needsActCreation) {
          const actNumber = this.getActNumberForPosition(beat.preferredAct, actAnalysis);
          suggestion.message = `Add a ${beat.name} (will create Act ${actNumber} if needed)`;
          suggestion.description = `${beat.description} This will automatically create Act ${actNumber} to organize your story structure.`;
        }

        suggestions.push(suggestion);
      }
    });
  }

  private static getSuggestedActId(preferredPosition: string, actAnalysis: any): string {
    const targetAct = this.getTargetActForBeat(preferredPosition, actAnalysis);
    if (targetAct) {
      return targetAct.act.id;
    }
    
    // If no act exists, suggest a template act ID for creation
    const actNumber = this.getActNumberForPosition(preferredPosition, actAnalysis);
    return `act-${actNumber}`;
  }

  private static needsActCreation(preferredPosition: string, actAnalysis: any): boolean {
    const targetAct = this.getTargetActForBeat(preferredPosition, actAnalysis);
    return !targetAct;
  }

  private static getActNumberForPosition(preferredPosition: string, actAnalysis: any): number {
    switch (preferredPosition) {
      case 'first':
        return 1;
      case 'middle':
        // For middle beats, suggest Act 2 if only 1 act exists, or the appropriate middle act
        if (actAnalysis.totalActs === 1) {
          return 2; // Suggest creating Act 2
        }
        return Math.ceil((actAnalysis.totalActs + 1) / 2); // Middle of expanded structure
      case 'last':
        // For last beats, suggest the next act number
        return actAnalysis.totalActs + 1;
      default:
        return 1;
    }
  }

  private static getTargetActForBeat(preferredPosition: string, actAnalysis: any) {
    switch (preferredPosition) {
      case 'first':
        return actAnalysis.firstAct;
      case 'middle':
        // For middle beats, prefer the actual middle act, or second act if only 2 acts
        if (actAnalysis.middleActs.length > 0) {
          const middleIndex = Math.floor(actAnalysis.middleActs.length / 2);
          return actAnalysis.middleActs[middleIndex];
        }
        return actAnalysis.acts[1] || actAnalysis.firstAct; // Fallback to second act
      case 'last':
        return actAnalysis.lastAct;
      default:
        return actAnalysis.firstAct;
    }
  }

  private static validatePacing(
    project: Project, 
    actCounts: any[], 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ) {
    // Check for overcrowded acts
    actCounts.forEach(({ actId, actName, count }) => {
      if (count > 6) {
        warnings.push({
          type: 'overcrowded_act',
          message: `${actName} has too many plot points (${count})`,
          suggestion: 'Consider consolidating or moving some plot points to other acts',
          actId,
          severity: 'medium'
        });
      }
    });
    
    // Check for empty Act II (common problem)
    // Look for the second act by position or name (Act II, Act 2)
    const secondAct = project.acts.find(act => 
      act.name.toLowerCase().includes('ii') || 
      act.name.toLowerCase().includes('2') ||
      act.name.toLowerCase().includes('act ii') ||
      act.name.toLowerCase().includes('act 2')
    ) || project.acts[1]; // Fallback to second act by index
    
    const act2Count = secondAct ? 
      actCounts.find(ac => ac.actId === secondAct.id)?.count || 0 : 0;
    if (act2Count === 0 && project.plotPoints.length > 2) {
      warnings.push({
        type: 'pacing_issue',
        message: 'Act II is empty',
        suggestion: 'Act II should contain the main development and midpoint of your story',
        actId: 'act-2',
        severity: 'high'
      });
      
      // Find Act II (second act) or fall back to creating act-2
      let targetActId = 'act-2'; // Default template for act creation
      let needsActCreation = false;
      
      if (secondAct) {
        // Use the existing second act
        targetActId = secondAct.id;
      } else if (project.acts.length >= 2) {
        // Use the actual second act if it exists
        const fallbackSecondAct = project.acts[1];
        if (fallbackSecondAct) {
          targetActId = fallbackSecondAct.id;
        }
      } else {
        // Need to create Act II
        needsActCreation = true;
      }
      
      suggestions.push({
        id: 'add-midpoint',
        message: 'Add a midpoint to Act II',
        action: 'Add plot point',
        templateId: 'midpoint',
        suggestedActId: targetActId,
        needsActCreation: needsActCreation
      });
    }
  }

  private static validateGenreConsistency(project: Project, warnings: ValidationWarning[]) {
    const detectedGenres = this.analyzeStoryGenre(project);
    
    if (detectedGenres.includes('Romance')) {
      const hasRomancePlotPoints = project.plotPoints.some(pp => 
        pp.category === PlotPointCategory.ROMANCE
      );
      
      if (!hasRomancePlotPoints) {
        warnings.push({
          type: 'genre_mismatch',
          message: 'Romance genre detected but no romance plot points found',
          suggestion: 'Consider adding romantic development plot points',
          severity: 'low'
        });
      }
    }
  }

  private static identifyStoryStrengths(project: Project, strengths: string[]) {
    const actAnalysis = this.analyzeActStructure(project);
    const existingEventTypes = new Set(
      project.plotPoints
        .map(pp => pp.eventType)
        .filter((et): et is EventType => et !== undefined)
    );
    
    // Analyze story structure strengths
    if (actAnalysis.hasContent) {
      const actsWithContent = actAnalysis.acts.filter(a => !a.isEmpty).length;
      if (actsWithContent === actAnalysis.totalActs) {
        if (actAnalysis.totalActs === 1) {
          strengths.push('Focused single-act structure with complete content');
        } else if (actAnalysis.totalActs === 2) {
          strengths.push('Well-developed two-act structure with content in both acts');
        } else if (actAnalysis.totalActs === 3) {
          strengths.push('Complete three-act structure with content in each act');
        } else {
          strengths.push(`Comprehensive ${actAnalysis.totalActs}-act structure with content throughout`);
        }
      } else if (actsWithContent > 1) {
        strengths.push(`Strong foundation with content in ${actsWithContent} of ${actAnalysis.totalActs} acts`);
      }
    }

    // Check for essential story beats coverage
    const essentialBeats = [EventType.INCITING_INCIDENT, EventType.CLIMAX];
    const hasEssentialBeats = essentialBeats.every(beat => existingEventTypes.has(beat));
    
    if (hasEssentialBeats) {
      strengths.push('Core story structure with essential dramatic beats');
    }

    // Check for advanced story beats
    const advancedBeats = [
      EventType.PLOT_POINT_1, 
      EventType.MIDPOINT_REVELATION, 
      EventType.PLOT_POINT_2
    ];
    const advancedBeatCount = advancedBeats.filter(beat => existingEventTypes.has(beat)).length;
    
    if (advancedBeatCount >= 2) {
      strengths.push('Sophisticated plot structure with multiple turning points');
    }

    // Analyze plot point variety and depth
    const categories = project.plotPoints.map(pp => pp.category).filter(Boolean);
    const uniqueCategories = [...new Set(categories)];
    
    if (uniqueCategories.length >= 4) {
      strengths.push('Well-balanced story with diverse plot point types');
    }
    
    if (project.plotPoints.length >= 6) {
      strengths.push('Detailed story structure with good complexity');
    }

    // Character development strengths
    if (project.characters.length >= 3) {
      strengths.push('Rich character cast for story development');
    }

    // Genre-specific strengths
    const genreEventTypes = [
      EventType.MEET_CUTE, EventType.FALLING_IN_LOVE, EventType.MAJOR_CONFLICT, // Romance
      EventType.CRIME_DISCOVERY, EventType.INVESTIGATION_BEGINS, EventType.FALSE_LEAD, // Mystery
      EventType.KEY_REVELATION, EventType.UNMASKING // Mystery/Thriller
    ];
    
    const genreSpecificCount = genreEventTypes.filter(beat => existingEventTypes.has(beat)).length;
    if (genreSpecificCount >= 2) {
      strengths.push('Strong genre-specific story elements and conventions');
    }
  }

  private static calculateStructureScore(project: Project, warnings: ValidationWarning[]): number {
    let score = 100;
    
    // Deduct points for warnings
    warnings.forEach(warning => {
      switch (warning.severity) {
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Analyze structure and give appropriate bonuses
    const actAnalysis = this.analyzeActStructure(project);
    const existingEventTypes = new Set(
      project.plotPoints
        .map(pp => pp.eventType)
        .filter((et): et is EventType => et !== undefined)
    );

    // Bonus for having content in acts (scaled by number of acts)
    const actsWithContent = actAnalysis.acts.filter(a => !a.isEmpty).length;
    if (actsWithContent > 0) {
      score += Math.min(10, actsWithContent * 3); // Up to 10 points for act coverage
    }

    // Bonus for essential story beats
    if (existingEventTypes.has(EventType.INCITING_INCIDENT)) score += 5;
    if (existingEventTypes.has(EventType.CLIMAX)) score += 5;

    // Bonus for plot complexity (but not too much)
    if (project.plotPoints.length >= 3) score += 5;
    if (project.plotPoints.length >= 6) score += 5;

    // Bonus for character development
    if (project.characters.length >= 2) score += 3;
    if (project.characters.length >= 4) score += 2;

    // Bonus for EventType usage (shows structural awareness)
    const eventTypeCount = existingEventTypes.size;
    if (eventTypeCount >= 2) score += 5;
    if (eventTypeCount >= 4) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Detect missing story beats based on common patterns
   */
  static detectMissingBeats(plotPoints: PlotPoint[]): string[] {
    const missing: string[] = [];
    const titles = plotPoints.map(pp => pp.title.toLowerCase());
    
    const commonBeats = [
      { keywords: ['inciting', 'incident'], name: 'Inciting Incident' },
      { keywords: ['midpoint', 'middle'], name: 'Midpoint' },
      { keywords: ['climax', 'final'], name: 'Climax' },
      { keywords: ['resolution', 'ending'], name: 'Resolution' }
    ];
    
    commonBeats.forEach(beat => {
      const found = titles.some(title => 
        beat.keywords.some(keyword => title.includes(keyword))
      );
      
      if (!found) {
        missing.push(beat.name);
      }
    });
    
    return missing;
  }
}

export default StoryAnalysisService;
