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
  private static generateReasoningForEventType(eventType: EventType, project: Project): string {
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
    const plotPointTitles = project.plotPoints.map(pp => pp.title.toLowerCase());
    
    // Check for inciting incident
    if (!plotPointTitles.some(title => 
      title.includes('inciting') || title.includes('incident') || title.includes('catalyst')
    )) {
      warnings.push({
        type: 'missing_element',
        message: 'No inciting incident found',
        suggestion: 'Add an inciting incident to kick off your main story conflict',
        actId: 'act-1',
        severity: 'high'
      });
      
      suggestions.push({
        id: 'add-inciting-incident',
        message: 'Consider adding an inciting incident',
        action: 'Add plot point',
        templateId: 'inciting-incident'
      });
    }
    
    // Check for climax
    const act3Points = project.plotPoints.filter(pp => pp.actId === 'act-3');
    if (act3Points.length === 0) {
      warnings.push({
        type: 'missing_element',
        message: 'No climax or resolution found',
        suggestion: 'Add a climactic moment to resolve your main conflict',
        actId: 'act-3',
        severity: 'high'
      });
    }
  }

  private static validatePacing(
    project: Project, 
    actCounts: any[], 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ) {
    // Check for overcrowded acts
    actCounts.forEach(({ actId, count }) => {
      if (count > 6) {
        warnings.push({
          type: 'overcrowded_act',
          message: `Act ${actId} has too many plot points (${count})`,
          suggestion: 'Consider consolidating or moving some plot points to other acts',
          actId,
          severity: 'medium'
        });
      }
    });
    
    // Check for empty Act II (common problem)
    const act2Count = actCounts.find(ac => ac.actId === 'act-2')?.count || 0;
    if (act2Count === 0 && project.plotPoints.length > 2) {
      warnings.push({
        type: 'pacing_issue',
        message: 'Act II is empty',
        suggestion: 'Act II should contain the main development and midpoint of your story',
        actId: 'act-2',
        severity: 'high'
      });
      
      suggestions.push({
        id: 'add-midpoint',
        message: 'Add a midpoint to Act II',
        action: 'Add plot point',
        templateId: 'midpoint'
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
    const categories = project.plotPoints.map(pp => pp.category).filter(Boolean);
    const uniqueCategories = [...new Set(categories)];
    
    if (uniqueCategories.length >= 4) {
      strengths.push('Well-balanced story with diverse plot point types');
    }
    
    if (project.plotPoints.length >= 6) {
      strengths.push('Detailed story structure with good complexity');
    }
    
    const hasAllActs = project.acts.every(act => 
      project.plotPoints.some(pp => pp.actId === act.id)
    );
    
    if (hasAllActs) {
      strengths.push('Complete three-act structure with content in each act');
    }
    
    if (project.characters.length >= 3) {
      strengths.push('Rich character cast for story development');
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
    
    // Bonus points for completeness
    if (project.plotPoints.length >= 5) score += 10;
    if (project.characters.length >= 2) score += 5;
    
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
