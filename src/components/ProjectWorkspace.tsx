'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Project, PlotPoint, Character, Act, EventType, ZoomLevel } from '@/types/story';
import { ProjectApiService } from '@/services/projectApiService';
import { useAuth } from '@/contexts/AuthContext';
import { useSearch } from '@/contexts/SearchContext';
import { SearchProvider } from '@/contexts/SearchContext';
import Canvas, { CanvasHandle } from '@/components/Canvas';
import PropertyPanel from '@/components/PropertyPanel';
import Toolbar from '@/components/Toolbar';
import ActNavigation from '@/components/ActNavigation';
import RecentItemsSidebar from '@/components/RecentItemsSidebar';
import QuickNavPalette from '@/components/QuickNavPalette';
import PlotPointSuggestions from '@/components/PlotPointSuggestions';
import StoryValidationPanel from '@/components/StoryValidationPanel';
import GlobalSearchBar from '@/components/GlobalSearchBar';
import { NavigationService, RecentItem } from '@/services/navigationService';
import { SearchResult } from '@/services/searchService';
import { TemplateService } from '@/services/templateService';
import { useProjectStore, selectProject, selectIsLoading, selectError } from '@/stores/projectStore';

// Types for suggestion handling
interface PlotPointSuggestion {
  title: string;
  description: string;
  suggestedActId: string;
  eventType?: EventType;
}

// Utility functions
const convertStringToEventType = (eventTypeStr?: string): EventType | undefined => {
  if (!eventTypeStr) return undefined;
  
  const eventTypeValues = Object.values(EventType) as string[];
  
  if (eventTypeValues.includes(eventTypeStr)) {
    return eventTypeStr as EventType;
  }
  
  return undefined;
};

const generateUniquePosition = (existingPlotPoints: any[]): { x: number; y: number } => {
  const MIN_DISTANCE = 150;
  const SEARCH_RADIUS = 250;

  console.log('🎯 generateUniquePosition: Input plot points:', existingPlotPoints.length, existingPlotPoints);

  const existingPositions = existingPlotPoints
    .map(pp => pp.position)
    .filter(pos => pos && typeof pos.x === 'number' && typeof pos.y === 'number');

  console.log('🎯 generateUniquePosition: Valid positions found:', existingPositions.length, existingPositions);

  if (existingPositions.length === 0) {
    console.log('🎯 generateUniquePosition: No existing positions, using default position');
    return { x: 300, y: 200 };
  }

  const centerX = existingPositions.reduce((sum, pos) => sum + pos.x, 0) / existingPositions.length;
  const centerY = existingPositions.reduce((sum, pos) => sum + pos.y, 0) / existingPositions.length;

  console.log('🎯 generateUniquePosition: Center of mass calculated:', { centerX, centerY });

  for (let radius = MIN_DISTANCE; radius <= SEARCH_RADIUS; radius += 50) {
    for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 8) {
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const hasConflict = existingPositions.some(pos => {
        const distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
        return distance < MIN_DISTANCE;
      });

      if (!hasConflict) {
        console.log('🎯 generateUniquePosition: Found good position:', { x: Math.round(x), y: Math.round(y) });
        return { x: Math.round(x), y: Math.round(y) };
      }
    }
  }

  const fallbackPosition = {
    x: Math.round(centerX + Math.random() * 400 - 200),
    y: Math.round(centerY + Math.random() * 400 - 200)
  };
  console.log('🎯 generateUniquePosition: Using fallback position:', fallbackPosition);
  return fallbackPosition;
};

// Component Props
interface ProjectWorkspaceProps {
  projectId: string;
  onBackToHomepage: () => void;
}

const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ projectId, onBackToHomepage }) => {
  // Zustand store hooks
  const project = useProjectStore(selectProject);
  const isLoading = useProjectStore(selectIsLoading);
  const error = useProjectStore(selectError);
  const loadProjectFromStore = useProjectStore(state => state.loadProject);
  const saveProject = useProjectStore(state => state.saveProject);
  const ensureActExistsFromStore = useProjectStore(state => state.ensureActExists);
  const createPlotPoint = useProjectStore(state => state.createPlotPoint);
  const updateCurrentAct = useProjectStore(state => state.updateCurrentAct);

  // Local UI state
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRecentItems, setShowRecentItems] = useState(false);
  const canvasRef = React.useRef<CanvasHandle>(null);
  const { user, logout } = useAuth();

  // Save status tracking
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [saveQueueLength, setSaveQueueLength] = useState(0);

  // Sprint 1: Search context integration
  const { 
    isQuickNavOpen, 
    closeQuickNav, 
    setCurrentProject 
  } = useSearch();

  // Load project on mount or when projectId changes
  useEffect(() => {
    console.log('🏗️ ProjectWorkspace: Loading project via Zustand store', { projectId });
    
    // Step 1: Clear any existing selections/focus BEFORE loading the new project
    const currentProject = useProjectStore.getState().project;
    if (currentProject && (currentProject.focusedElementId || currentProject.id !== projectId)) {
      console.log('🧹 ProjectWorkspace: Pre-clearing selections before loading new project', {
        currentProjectId: currentProject.id,
        newProjectId: projectId,
        hadFocus: !!currentProject.focusedElementId,
        focusedElement: currentProject.focusedElementId
      });
      
      const clearedProject = {
        ...currentProject,
        focusedElementId: undefined,
        currentZoomLevel: ZoomLevel.STORY_OVERVIEW, // Reset zoom level too
        lastModified: new Date()
      };
      useProjectStore.setState({ project: clearedProject });
      
      // Save immediately to database
      try {
        useProjectStore.getState().saveProject(true);
        console.log('🧹 ProjectWorkspace: Successfully saved cleared selections to database');
      } catch (error) {
        console.error('🧹 ProjectWorkspace: Failed to save cleared selections:', error);
      }
    }
    
    // Step 2: Load the new project
    loadProjectFromStore(projectId);

    // Cleanup function to clear focused element when leaving the component
    return () => {
      const exitingProject = useProjectStore.getState().project;
      if (exitingProject && (exitingProject.focusedElementId || exitingProject.currentZoomLevel === ZoomLevel.PLOT_POINT_FOCUS)) {
        console.log('🧹 ProjectWorkspace: Aggressive cleanup on unmount/project change', {
          projectId: exitingProject.id,
          hadFocus: !!exitingProject.focusedElementId,
          focusedElement: exitingProject.focusedElementId,
          currentZoom: exitingProject.currentZoomLevel
        });
        
        const totallyCleanProject = {
          ...exitingProject,
          focusedElementId: undefined,
          currentZoomLevel: ZoomLevel.STORY_OVERVIEW, // Reset zoom to fit all
          lastModified: new Date()
        };
        
        useProjectStore.setState({ project: totallyCleanProject });
        
        // Force save to database immediately
        try {
          useProjectStore.getState().saveProject(true);
          console.log('🧹 ProjectWorkspace: Aggressive cleanup saved to database successfully');
        } catch (error) {
          console.error('🧹 ProjectWorkspace: Failed to save aggressive cleanup:', error);
        }
      }
    };
  }, [projectId]); // Remove loadProjectFromStore from dependencies since Zustand functions are stable

  // Set initial save status when project loads
  useEffect(() => {
    if (project) {
      setLastAutoSave(project.lastModified);
      setHasUnsavedChanges(false);
      setIsSyncing(false);
    }
  }, [project]);

  // Update search context when project changes
  useEffect(() => {
    if (project) {
      setCurrentProject(project);
    }
  }, [project, setCurrentProject]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showUserMenu]);

  // ZUSTAND: Handle project updates using store action
  const handleProjectUpdate = async (updatedProject: Project, immediate = false) => {
    console.log('🔄 Zustand ProjectWorkspace: Project updated via store save:', {
      projectId: updatedProject.id,
      immediate,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // CRITICAL: Update the Zustand store with the new project data
    useProjectStore.setState({ project: updatedProject });
    
    // Update save status indicators
    setHasUnsavedChanges(true);
    setIsSyncing(immediate);
    
    try {
      // For now, we'll use basic localStorage backup until we refactor the store further
      localStorage.setItem(`writing-graph-project-${updatedProject.id}`, JSON.stringify(updatedProject));
      
      // Simulate save completion
      if (immediate) {
        setTimeout(() => {
          setIsSyncing(false);
          setHasUnsavedChanges(false);
          setLastAutoSave(new Date());
        }, 500);
      } else {
        // Auto-save after delay
        setTimeout(() => {
          setIsSyncing(true);
          setTimeout(() => {
            setIsSyncing(false);
            setHasUnsavedChanges(false);
            setLastAutoSave(new Date());
          }, 1000);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      setIsSyncing(false);
    }
  };

  // Sprint 2: Handle accepting plot point suggestions - ZUSTAND VERSION
  const handleSuggestionAccept = async (suggestion: PlotPointSuggestion) => {
    if (!project) return;
    
    console.log('🎯 Zustand: Accepting suggestion:', suggestion);
    
    try {
      // Step 1: Ensure the required act exists (this handles act creation automatically)
      let realActId = suggestion.suggestedActId;
      
      if (suggestion.suggestedActId.startsWith('act-')) {
        // Extract the act number from template ID (e.g., 'act-2' -> 2)
        const actNumber = parseInt(suggestion.suggestedActId.split('-')[1]);
        
        console.log('🎯 Zustand: Ensuring act exists via store:', { actNumber });
        const act = await ensureActExistsFromStore(actNumber);
        realActId = act.id;
        console.log('🎯 Zustand: Act ensured successfully:', { actNumber, realActId });
      }

      // Step 2: Create plot point with proper timing
      console.log('🎯 Zustand: Creating plot point via store:', { 
        title: suggestion.title, 
        actId: realActId 
      });
      
      const newPlotPoint = await createPlotPoint({
        title: suggestion.title,
        description: suggestion.description,
        actId: realActId,
        eventType: suggestion.eventType,
        position: generateUniquePosition(project.plotPoints.filter(pp => pp.actId === realActId))
      });

      console.log('🎯 Zustand: Plot point created successfully:', { 
        plotPointId: newPlotPoint.id,
        title: newPlotPoint.title 
      });

      // Navigate to the act if it's different from current act
      if (project.currentActId !== realActId) {
        console.log('🎯 Zustand: Switching to target act:', realActId);
        updateCurrentAct(realActId);
      }

      // Navigate to the newly created plot point
      // Get the current project state (which includes the new plot point)
      const currentProject = useProjectStore.getState().project;
      if (currentProject) {
        const updatedProject = {
          ...currentProject,
          currentActId: realActId, // Ensure act is updated
          currentZoomLevel: ZoomLevel.PLOT_POINT_FOCUS, // Focus on the plot point
          focusedElementId: newPlotPoint.id,
          lastModified: new Date()
        };
        handleProjectUpdate(updatedProject, true);
      }

      // Clear focus after allowing time for the user to see the focusing animation
      setTimeout(() => {
        const currentProjectForClear = useProjectStore.getState().project;
        if (currentProjectForClear && currentProjectForClear.focusedElementId) {
          console.log('🧹 ProjectWorkspace: Clearing focused element after delay in handleSuggestionAccept:', currentProjectForClear.focusedElementId);
          const clearedProject = {
            ...currentProjectForClear,
            focusedElementId: undefined,
            lastModified: new Date()
          };
          handleProjectUpdate(clearedProject, true);
        }
      }, 3000); // Increased to 3 seconds to ensure user sees the focus animation

    } catch (error) {
      console.error('🎯 Zustand: Failed to accept suggestion:', error);
    }
  };

  // Handle validation panel quick actions
  const handleValidationSuggestionAccept = async (suggestion: any) => {
    if (!project || !suggestion.templateId) return;
    
    console.log('🎯 Zustand: Accepting validation suggestion:', suggestion);
    console.log('🎯 Zustand: Available acts in project:', project.acts.map(act => ({ id: act.id, name: act.name })));
    
    try {
      // Get suggested act ID or use current act
      let targetActId = suggestion.suggestedActId || project.currentActId;
      
      console.log('🎯 Zustand: Initial target act ID:', { 
        suggestedActId: suggestion.suggestedActId, 
        currentActId: project.currentActId,
        targetActId,
        needsActCreation: suggestion.needsActCreation
      });
      
      // If suggestion specifies act creation, handle it
      if (suggestion.needsActCreation) {
        const actNumber = suggestion.suggestedActId && suggestion.suggestedActId.startsWith('act-') ? 
          parseInt(suggestion.suggestedActId.split('-')[1]) : 
          project.acts.length + 1;
        
        console.log('🎯 Zustand: Creating new act for validation suggestion:', { actNumber });
        const act = await ensureActExistsFromStore(actNumber);
        targetActId = act.id;
        
        // Switch to the new act
        updateCurrentAct(targetActId);
      } else if (suggestion.suggestedActId && suggestion.suggestedActId.startsWith('act-')) {
        // Handle template act IDs like 'act-2' by finding the corresponding real act
        const actNumber = parseInt(suggestion.suggestedActId.split('-')[1]);
        if (actNumber <= project.acts.length) {
          // Find the act by position (Act I = index 0, Act II = index 1, etc.)
          const targetAct = project.acts[actNumber - 1];
          if (targetAct) {
            targetActId = targetAct.id;
            console.log('🎯 Zustand: Mapped template act to real act:', { 
              templateId: suggestion.suggestedActId, 
              actNumber, 
              realActId: targetActId 
            });
          }
        }
      }

      console.log('🎯 Zustand: Final target act ID:', targetActId);
      
      // Verify the target act exists in the project
      const targetAct = project.acts.find(act => act.id === targetActId);
      if (!targetAct) {
        console.error('🚨 Zustand: Target act not found in project!', {
          targetActId,
          availableActs: project.acts.map(act => ({ id: act.id, name: act.name }))
        });
        throw new Error(`Target act ${targetActId} not found in project`);
      }
      
      // Check if this is a temporary act ID (not persisted to database)
      if (targetActId.startsWith('act-') && /^act-\d+$/.test(targetActId)) {
        console.error('🚨 Zustand: Cannot create plot point - target act has temporary ID (not saved to database)!', {
          targetActId,
          actName: targetAct.name
        });
        alert(`Cannot create plot point in "${targetAct.name}" - the act needs to be saved first. Please try again in a moment.`);
        return;
      }
      
      console.log('🎯 Zustand: Target act verified:', { 
        actId: targetAct.id, 
        actName: targetAct.name 
      });

      // Use the smart position generation algorithm for better UX
      const actPlotPoints = project.plotPoints.filter(pp => pp.actId === targetActId);
      const position = generateUniquePosition(actPlotPoints);
      console.log('🎯 Zustand: Generated smart position for validation suggestion:', { 
        position, 
        existingPlotPointsInAct: actPlotPoints.length 
      });

      // Create plot point using template service
      const templateData = TemplateService.applyQuickTemplate(
        suggestion.templateId, 
        targetActId, 
        position
      );
      
      const newPlotPoint = await createPlotPoint({
        title: templateData.title || 'New Plot Point',
        description: templateData.description || '',
        actId: targetActId,
        eventType: templateData.eventType,
        position: templateData.position || position
      });

      console.log('🎯 Zustand: Validation suggestion plot point created:', { 
        plotPointId: newPlotPoint.id,
        title: newPlotPoint.title,
        actId: targetActId
      });

      // Navigate to the act if it's different from current act
      if (project.currentActId !== targetActId) {
        console.log('🎯 Zustand: Switching to target act:', targetActId);
        updateCurrentAct(targetActId);
      }

      // Navigate to the new plot point by updating focused element
      // Get the current project state (which includes the new plot point)
      const currentProject = useProjectStore.getState().project;
      if (currentProject) {
        const updatedProject = {
          ...currentProject,
          currentActId: targetActId, // Ensure act is updated
          currentZoomLevel: ZoomLevel.PLOT_POINT_FOCUS, // Focus on the plot point
          focusedElementId: newPlotPoint.id,
          lastModified: new Date()
        };
        handleProjectUpdate(updatedProject, true);
      }

      // Clear focus after allowing time for the user to see the focusing animation
      setTimeout(() => {
        const currentProjectForClear = useProjectStore.getState().project;
        if (currentProjectForClear && currentProjectForClear.focusedElementId) {
          console.log('🧹 ProjectWorkspace: Clearing focused element after delay in handleValidationSuggestionAccept:', currentProjectForClear.focusedElementId);
          const clearedProject = {
            ...currentProjectForClear,
            focusedElementId: undefined,
            lastModified: new Date()
          };
          handleProjectUpdate(clearedProject, true);
        }
      }, 3000); // Increased to 3 seconds to ensure user sees the focus animation

    } catch (error) {
      console.error('🎯 Zustand: Failed to accept validation suggestion:', error);
    }
  };

  // Handle template quick search selections
  const handleTemplateQuickSearchSelect = async (templateData: any) => {
    console.log('Template selected:', templateData);
  };

  // Handle navigation functions (simplified for now)
  const handleProjectQuickNavigation = (item: any) => {
    console.log('Quick navigation to:', item);
  };

  const handleRecentItemNavigation = (item: any) => {
    console.log('Recent item navigation to:', item);
  };

  // Handle project search navigation
  const handleProjectSearchNavigation = (result: SearchResult) => {
    if (!project) return;

    console.log('🔍 Search navigation triggered:', {
      resultType: result.type,
      resultId: result.id,
      resultTitle: result.title,
      currentActId: project.currentActId,
      timestamp: new Date().toLocaleTimeString()
    });

    // For now, just log the navigation - this would typically handle routing to the specific item
    switch (result.type) {
      case 'plotpoint':
        console.log('Navigate to plot point:', result.title);
        break;
      case 'character':
        console.log('Navigate to character:', result.title);
        break;
      case 'act':
        console.log('Navigate to act:', result.title);
        break;
      case 'scene':
        console.log('Navigate to scene:', result.title);
        break;
    }
  };

  // Handle zoom controls
  const handleZoomChange = (zoomLevel: ZoomLevel) => {
    if (!project) return;
    
    const updatedProject = {
      ...project,
      currentZoomLevel: zoomLevel
    };
    handleProjectUpdate(updatedProject, true);
  };

  const handleZoomToFit = () => {
    if (canvasRef.current) {
      canvasRef.current.handleZoomToFit();
    }
  };

  // Handle act changes
  const handleActChange = (actId: string) => {
    console.log('🎬 handleActChange called:', {
      requestedActId: actId,
      currentActId: project?.currentActId,
      timestamp: new Date().toLocaleTimeString()
    });
    
    updateCurrentAct(actId);
    
    // Trigger zoom-to-fit for the new act's content
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.handleZoomToFit();
      }
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading project...</div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-xl font-semibold">Project Not Found</h2>
          </div>
          <p className="text-gray-600 mb-6">{error || 'The requested project could not be loaded.'}</p>
          <button
            onClick={onBackToHomepage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sprint 1: Recent Items Sidebar */}
      {showRecentItems && (
        <RecentItemsSidebar
          onNavigate={handleRecentItemNavigation}
          className="w-64 flex-shrink-0"
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Project Header with Back Button */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4">
          <button
            onClick={onBackToHomepage}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Back to Projects"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Projects</span>
          </button>

          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">{project.title}</h1>
            {project.description && (
              <p className="text-sm text-gray-600 truncate">{project.description}</p>
            )}
          </div>

          {/* Project Search */}
          <div className="w-80 hidden lg:block">
            <GlobalSearchBar
              placeholder="Search in project..."
              currentProjectId={project.id}
              currentProject={project}
              onNavigate={handleProjectSearchNavigation}
            />
          </div>

          {/* Project Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{project.acts.length} acts</span>
            <span>{project.plotPoints.length} plot points</span>
            <span>{project.characters.length} characters</span>
            <span>
              {project.plotPoints.reduce((total, pp) => total + pp.scenes.length, 0)} scenes
            </span>
            
            {/* Recent Items Toggle */}
            <button
              onClick={() => setShowRecentItems(!showRecentItems)}
              className={`p-2 rounded-lg transition-colors ${
                showRecentItems ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Toggle recent items"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            {/* Autosave Status Indicator */}
            <div className="flex items-center gap-2">
              {isSyncing ? (
                <div className="flex items-center gap-1 text-blue-600">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-xs">
                    {saveQueueLength > 0 ? `Saving (${saveQueueLength} queued)` : 'Saving...'}
                  </span>
                </div>
              ) : hasUnsavedChanges ? (
                <div className="flex items-center gap-1 text-amber-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs">Unsaved</span>
                </div>
              ) : lastAutoSave ? (
                <div className="flex items-center gap-1 text-green-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs">Saved {lastAutoSave.toLocaleTimeString()}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="User Menu"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-48">
                <div className="px-4 py-2 border-b border-gray-200">
                  <div className="text-sm font-medium text-gray-900">{user?.username || 'User'}</div>
                  <div className="text-xs text-gray-500">{user?.email || 'user@example.com'}</div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Act Navigation */}
        <ActNavigation 
          project={project}
          onProjectUpdate={handleProjectUpdate}
          onActChange={handleActChange}
        />
        
        {/* Main Canvas Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <Toolbar 
            project={project}
            onProjectUpdate={handleProjectUpdate}
            onZoomChange={handleZoomChange}
            onZoomToFit={handleZoomToFit}
          />
          
          <div className="flex-1 overflow-hidden flex">
            <Canvas 
              project={project}
              onProjectUpdate={handleProjectUpdate}
              ref={canvasRef}
            />
            
            {/* Sprint 2: Right Sidebar with Suggestions and Validation */}
            <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto p-4 space-y-4">
              <PlotPointSuggestions
                project={project}
                currentActId={project.currentActId}
                onSuggestionAccept={handleSuggestionAccept}
              />
              
              <StoryValidationPanel
                project={project}
                onSuggestionAccept={handleValidationSuggestionAccept}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Sprint 1: Quick Navigation Palette */}
      <QuickNavPalette
        isOpen={isQuickNavOpen}
        onClose={closeQuickNav}
        onNavigate={handleProjectQuickNavigation}
        currentProject={project}
      />
    </div>
  );
};

// Main component wrapped in SearchProvider for Sprint 1 functionality
const ProjectWorkspaceWithSearch: React.FC<ProjectWorkspaceProps> = (props) => {
  return (
    <SearchProvider 
      onNavigate={(path) => {
        console.log('Navigation requested:', path);
      }}
      onActSwitch={(actNumber) => {
        console.log('Act switch requested:', actNumber);
      }}
    >
      <ProjectWorkspace {...props} />
    </SearchProvider>
  );
};

export default ProjectWorkspaceWithSearch;
