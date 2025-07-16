'use client';

import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import Canvas, { CanvasHandle } from './Canvas';
import Toolbar from './Toolbar';
import ActNavigation from './ActNavigation';
import GlobalSearchBar from './GlobalSearchBar';
import QuickNavPalette from './QuickNavPalette';
import RecentItemsSidebar from './RecentItemsSidebar';
import { Project as BackendProject, ProjectApiService } from '@/services/projectApiService';
import { Project, ZoomLevel, Scene } from '../types/story';
import { useAuth } from '@/contexts/AuthContext';
import { SearchProvider, useSearch } from '@/contexts/SearchContext';
import { SearchResult } from '@/services/searchService';
import { NavigationService, RecentItem } from '@/services/navigationService';

// Helper function to generate a unique position for new plot points
const generateUniquePosition = (existingPlotPoints: any[]): { x: number; y: number } => {
  const GRID_SIZE = 200; // Distance between plot points
  const START_X = 100;
  const START_Y = 100;
  const MAX_COLS = 5; // Maximum columns before starting a new row
  
  // Get all existing positions
  const existingPositions = existingPlotPoints
    .map(pp => pp.position)
    .filter(pos => pos && typeof pos.x === 'number' && typeof pos.y === 'number');
  
  // Find a position that doesn't conflict with existing ones
  let row = 0;
  let col = 0;
  
  while (true) {
    const x = START_X + (col * GRID_SIZE);
    const y = START_Y + (row * GRID_SIZE);
    
    // Check if this position is too close to any existing position
    const hasConflict = existingPositions.some(pos => {
      const distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
      return distance < GRID_SIZE * 0.8; // Allow some tolerance
    });
    
    if (!hasConflict) {
      return { x, y };
    }
    
    // Move to next position in grid
    col++;
    if (col >= MAX_COLS) {
      col = 0;
      row++;
    }
    
    // Safety check to prevent infinite loop
    if (row > 20) {
      // Fallback to random position
      return {
        x: START_X + Math.random() * 500,
        y: START_Y + Math.random() * 500
      };
    }
  }
};

// Helper function to generate unique scene position around a plot point
const generateScenePosition = (plotPoint: any, existingScenes: any[], sceneIndex: number): { x: number; y: number } => {
  const radius = 120;
  const totalScenes = existingScenes.length + 1; // Include the new scene
  const angle = (sceneIndex * 2 * Math.PI) / Math.max(totalScenes, 1);
  
  return {
    x: plotPoint.position.x + radius * Math.cos(angle),
    y: plotPoint.position.y + radius * Math.sin(angle)
  };
};

interface ProjectWorkspaceProps {
  projectId: string;
  onBackToHomepage: () => void;
}

const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ projectId, onBackToHomepage }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRecentItems, setShowRecentItems] = useState(false);
  const canvasRef = React.useRef<CanvasHandle>(null);
  const { user, logout } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [saveQueueLength, setSaveQueueLength] = useState(0);
  
  // Sprint 1: Search context integration
  const { 
    isQuickNavOpen, 
    closeQuickNav, 
    setCurrentProject 
  } = useSearch();

  // Load project on mount or when projectId changes
  useEffect(() => {
    loadProject();
  }, [projectId]);

  // Sprint 1: Update search context when project changes
  useEffect(() => {
    setCurrentProject(project || undefined);
    
    // Track project access when project loads
    if (project) {
      NavigationService.trackProjectAccess(project.id, project.title);
    }
  }, [project, setCurrentProject]);

  // Sprint 1: Keyboard shortcuts for act navigation
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Act switching shortcuts: Ctrl/Cmd + 1-5
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const actNumber = parseInt(e.key);
        handleActSwitchByNumber(actNumber);
      }
    };
    
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [project]);

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

  // Convert backend project format to frontend format
  const convertBackendProject = async (backendProject: BackendProject): Promise<Project> => {
    try {
      // Load related data
      const [acts, characters] = await Promise.all([
        ProjectApiService.getActs(backendProject.id),
        ProjectApiService.getCharacters(backendProject.id)
      ]);

      // Load plot points for each act and their scenes
      const allPlotPoints = [];
      for (const act of acts) {
        try {
          const plotPoints = await ProjectApiService.getPlotPoints(backendProject.id, act.id);
          
          // Ensure plotPoints is an array
          const plotPointsArray = Array.isArray(plotPoints) ? plotPoints : [];
          
          // Load scenes for each plot point
          for (const plotPoint of plotPointsArray) {
            try {
              const scenes = await ProjectApiService.getScenes(backendProject.id, plotPoint.id);
              
              const frontendScenes: Scene[] = scenes.map((scene, index) => ({
                id: scene.id,
                title: scene.title,
                synopsis: scene.synopsis || scene.content || '',
                characterIds: (scene as any).characters ? (scene as any).characters.map((sc: any) => sc.character.id) : [], // Load scene-character relationships
                setting: {
                  id: scene.settingId || 'default-setting',
                  name: 'Default Setting',
                  description: ''
                },
                items: (scene as any).items ? (scene as any).items.map((si: any) => si.item.id) : [], // Load scene-item relationships
                position: (scene.position && typeof scene.position.x === 'number' && typeof scene.position.y === 'number') 
                  ? scene.position 
                  : generateScenePosition(plotPoint, frontendScenes, index) // Generate position around plot point only if no valid position exists
              }));

              allPlotPoints.push({
                id: plotPoint.id,
                title: plotPoint.title,
                position: plotPoint.position || { x: 0, y: 0 }, // Use actual position from backend
                color: plotPoint.color || '#3b82f6', // Use actual color from backend
                actId: plotPoint.actId,
                scenes: frontendScenes
              });
            } catch (sceneError) {
              console.warn('Failed to load scenes for plot point:', plotPoint.id, sceneError);
              // Add plot point without scenes if scene loading fails
              allPlotPoints.push({
                id: plotPoint.id,
                title: plotPoint.title,
                position: plotPoint.position || { x: 0, y: 0 },
                color: plotPoint.color || '#3b82f6',
                actId: plotPoint.actId,
                scenes: []
              });
            }
          }
        } catch (plotPointError) {
          console.error('Failed to load plot points for act:', act.id, plotPointError);
          console.error('Error details:', plotPointError);
        }
      }

      return {
        id: backendProject.id,
        title: backendProject.title,
        description: backendProject.description,
        tags: backendProject.tags || [],
        status: backendProject.status,
        createdDate: new Date(backendProject.createdAt),
        lastModified: new Date(backendProject.updatedAt),
        lastAccessed: new Date(), // Set current time as last accessed
        acts: acts.map(act => ({
          id: act.id,
          name: act.name,
          description: act.description,
          order: act.order
        })),
        currentActId: backendProject.currentActId || acts[0]?.id || '',
        characters: characters.map(char => ({
          id: char.id,
          name: char.name,
          appearance: char.appearance || char.description, // Use appearance field first, fallback to description
          personality: char.personality, // Map personality field
          motivation: char.motivation, // Map motivation field  
          characterType: char.characterType?.toLowerCase() as 'protagonist' | 'antagonist' | 'supporting' | 'minor', // Map character type to lowercase
        })),
        plotPoints: allPlotPoints,
        currentZoomLevel: (backendProject.currentZoomLevel as ZoomLevel) || ZoomLevel.STORY_OVERVIEW,
        focusedElementId: backendProject.focusedElementId
      };
    } catch (error) {
      console.error('Error converting backend project:', error);
      // Return minimal project structure on error
      return {
        id: backendProject.id,
        title: backendProject.title,
        description: backendProject.description,
        tags: [],
        status: backendProject.status,
        createdDate: new Date(backendProject.createdAt),
        lastModified: new Date(backendProject.updatedAt),
        lastAccessed: new Date(),
        acts: [{ id: 'fallback-act-1', name: 'Act 1', description: 'Beginning', order: 1 }],
        currentActId: 'fallback-act-1',
        characters: [],
        plotPoints: [],
        currentZoomLevel: ZoomLevel.STORY_OVERVIEW,
        focusedElementId: undefined
      };
    }
  };

  const loadProject = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const backendProject = await ProjectApiService.getProject(projectId);
      
      if (backendProject) {
        const frontendProject = await convertBackendProject(backendProject);
        setProject(frontendProject);
      } else {
        setError('Project not found');
      }
    } catch (err) {
      setError('Failed to load project');
      console.error('Error loading project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Migration function for old project data format
  const migrateOldProjectData = (oldProject: any): Project => {
    const now = new Date();
    const projectId = 'migrated-project-' + Date.now();
    
    // Create default acts if none exist
    let acts = oldProject.acts;
    if (!acts || !Array.isArray(acts)) {
      acts = [
        { id: 'fallback-act-1', name: 'Act 1: Setup', description: 'Introduce characters and establish the world', order: 1 },
        { id: 'fallback-act-2', name: 'Act 2: Confrontation', description: 'Rising action and complications', order: 2 },
        { id: 'fallback-act-3', name: 'Act 3: Resolution', description: 'Climax and resolution', order: 3 }
      ];
    }

    // Migrate plot points to ensure they have actId
    const migratedPlotPoints = (oldProject.plotPoints || []).map((pp: any) => {
      let actId = pp.actId || acts[0]?.id || ''; // Default to first act
      
      // Try to map old act numbers to new act IDs if no actId exists
      if (!pp.actId && pp.act) {
        if (pp.act === 1 || pp.act === '1') actId = acts[0]?.id || '';
        else if (pp.act === 2 || pp.act === '2') actId = acts[1]?.id || '';
        else if (pp.act === 3 || pp.act === '3') actId = acts[2]?.id || '';
      }
      
      // Migrate scene characters from objects to IDs if needed
      const migratedScenes = (pp.scenes || []).map((scene: any) => ({
        ...scene,
        characterIds: Array.isArray(scene.characters) 
          ? scene.characters.map((char: any) => typeof char === 'string' ? char : char.id || char.name)
          : scene.characterIds || []
      }));

      return {
        ...pp,
        actId,
        scenes: migratedScenes
      };
    });

    return {
      id: projectId,
      title: oldProject.title || 'Migrated Project',
      description: '',
      tags: [],
      status: 'in-progress',
      createdDate: new Date(oldProject.lastModified || now),
      lastModified: new Date(oldProject.lastModified || now),
      lastAccessed: now,
      acts,
      currentActId: oldProject.currentActId || acts[0].id,
      characters: oldProject.characters || [],
      plotPoints: migratedPlotPoints,
      currentZoomLevel: oldProject.currentZoomLevel || ZoomLevel.STORY_OVERVIEW,
      focusedElementId: oldProject.focusedElementId
    };
  };

  // State for reliable saving
  const [saveQueue, setSaveQueue] = useState<Project[]>([]);
  const [isProcessingSaveQueue, setIsProcessingSaveQueue] = useState(false);
  const saveQueueRef = useRef<Project[]>([]);
  const isProcessingSaveQueueRef = useRef(false);

  // Update refs when state changes
  useEffect(() => {
    saveQueueRef.current = saveQueue;
    setSaveQueueLength(saveQueue.length);
  }, [saveQueue]);

  useEffect(() => {
    isProcessingSaveQueueRef.current = isProcessingSaveQueue;
  }, [isProcessingSaveQueue]);

  const handleProjectUpdate = async (updatedProject: Project, immediate = false) => {
    console.log('🔄 ProjectWorkspace: Project updated:', {
      projectId: updatedProject.id,
      plotPointsCount: updatedProject.plotPoints.length,
      plotPointIds: updatedProject.plotPoints.map(pp => ({ id: pp.id, title: pp.title })),
      immediate,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Always update the current project state immediately
    setProject(updatedProject);
    
    // Save to localStorage immediately for backup
    localStorage.setItem(`writing-graph-project-${updatedProject.id}`, JSON.stringify(updatedProject));
    
    // Add to save queue
    addToSaveQueue(updatedProject, immediate);
  };

  // Add project to save queue and process it
  const addToSaveQueue = (project: Project, immediate: boolean) => {
    console.log('🔄 ProjectWorkspace: Adding to save queue:', {
      projectId: project.id,
      plotPointsCount: project.plotPoints.length,
      temporaryPlotPoints: project.plotPoints.filter(pp => pp.id.startsWith('temp-') || pp.id.startsWith('plot-')),
      immediate,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Clear any existing autosave timeout since we're queuing this save
    if (autoSaveTimeoutId) {
      clearTimeout(autoSaveTimeoutId);
      setAutoSaveTimeoutId(null);
    }

    // Simply replace the queue with the latest project (no need for complex queue management)
    setSaveQueue([project]);
    
    // IMPORTANT: Update ref immediately for synchronous access
    saveQueueRef.current = [project];

    console.log('🔄 ProjectWorkspace: Save queue updated, triggering processing:', {
      immediate,
      queueLength: 1,
      refLength: saveQueueRef.current.length,
      timestamp: new Date().toLocaleTimeString()
    });

    // Process queue immediately or with delay
    if (immediate) {
      console.log('🔄 ProjectWorkspace: Processing queue immediately...');
      processSaveQueue();
    } else {
      // Schedule queue processing with delay
      const timeoutId = setTimeout(() => {
        processSaveQueue();
      }, AUTOSAVE_DELAY);
      setAutoSaveTimeoutId(timeoutId);
    }
  };

  // Process the save queue sequentially
  const processSaveQueue = async () => {
    console.log('🔄 ProjectWorkspace: processSaveQueue called', {
      isProcessing: isProcessingSaveQueueRef.current,
      saveQueueRefLength: saveQueueRef.current.length,
      saveQueueStateLength: saveQueue.length,
      timestamp: new Date().toLocaleTimeString()
    });
    
    if (isProcessingSaveQueueRef.current) {
      console.log('Save queue already being processed, skipping...');
      return;
    }

    if (saveQueueRef.current.length === 0) {
      console.log('Save queue is empty, nothing to process');
      return;
    }

    isProcessingSaveQueueRef.current = true;
    setIsProcessingSaveQueue(true);
    setIsSyncing(true);

    try {
      // Get the project to save (should only be one since we replace the queue)
      const projectToSave = saveQueueRef.current[0];
      
      console.log(`Processing save queue: saving project ${projectToSave.id}`);
      
      // Detect what type of changes we have
      const changeType = detectChanges(lastSavedProject, projectToSave);
      
      if (changeType !== 'none') {
        if (changeType === 'lightweight') {
          await lightweightSync(projectToSave);
        } else {
          await syncProjectContent(projectToSave);
        }
        
        // Update last saved project only after successful save
        setLastSavedProject({ ...projectToSave });
        setHasUnsavedChanges(false);
        setLastAutoSave(new Date());
        
        console.log(`Successfully saved project (${changeType}) at`, new Date().toLocaleTimeString());
      }
      
      // Clear the queue after successful processing
      setSaveQueue([]);
      
    } catch (error) {
      console.error('Failed to save project:', error);
      // On error, we'll just leave it in the queue for potential retry
    } finally {
      isProcessingSaveQueueRef.current = false;
      setIsProcessingSaveQueue(false);
      setIsSyncing(false);
    }
  };

  // Lightweight sync for UI state changes only (zoom, focus, etc.)
  const lightweightSync = async (updatedProject: Project) => {
    if (!updatedProject.id) return;
    
    setIsSyncing(true);
    try {
      const updateData = {
        currentActId: updatedProject.currentActId,
        currentZoomLevel: updatedProject.currentZoomLevel?.toUpperCase() as 'STORY_OVERVIEW' | 'PLOT_POINT_FOCUS' | 'SCENE_DETAIL' | 'CHARACTER_FOCUS',
        focusedElementId: updatedProject.focusedElementId,
      };

      await ProjectApiService.updateProject(updatedProject.id, updateData);
      console.log('Lightweight project sync completed');
    } catch (error) {
      console.error('Failed to sync project UI state:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleZoomChange = (zoomLevel: ZoomLevel) => {
    if (!project) return;
    
    const updatedProject = {
      ...project,
      currentZoomLevel: zoomLevel
    };
    handleProjectUpdate(updatedProject, true); // Immediate sync for zoom changes
  };

  const handleActChange = (actId: string) => {
    console.log('🎬 handleActChange called:', {
      requestedActId: actId,
      currentActId: project?.currentActId,
      requestedAct: project?.acts.find(a => a.id === actId)?.name,
      currentAct: project?.acts.find(a => a.id === project?.currentActId)?.name,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Ensure the project state is updated immediately
    if (project && actId !== project.currentActId) {
      const updatedProject = {
        ...project,
        currentActId: actId,
        lastModified: new Date()
      };
      
      console.log('🔄 Updating project state immediately for act change:', {
        from: project.currentActId,
        to: actId,
        fromAct: project.acts.find(a => a.id === project.currentActId)?.name,
        toAct: project.acts.find(a => a.id === actId)?.name
      });
      
      // Use flushSync to ensure immediate state update
      flushSync(() => {
        setProject(updatedProject);
      });
      
      // Also call handleProjectUpdate for backend sync
      handleProjectUpdate(updatedProject, true);
    }
    
    // Trigger zoom-to-fit for the new act's content
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.handleZoomToFit();
      }
    }, 100); // Small delay to ensure act content has been rendered
    
    // Sprint 1: Track act access
    if (project) {
      const act = project.acts.find(a => a.id === actId);
      if (act) {
        NavigationService.trackActAccess(act.id, act.name, project.id, project.title);
      }
    }
  };

  // Sprint 1: Handle act switching by number (for keyboard shortcuts)
  const handleActSwitchByNumber = (actNumber: number) => {
    if (!project) return;
    
    const targetAct = project.acts.find(act => act.order === actNumber);
    if (targetAct) {
      const updatedProject = {
        ...project,
        currentActId: targetAct.id
      };
      handleProjectUpdate(updatedProject, true);
      handleActChange(targetAct.id);
    }
  };

  // Sprint 1: Handle search navigation within project
  const handleProjectSearchNavigation = async (result: SearchResult) => {
    if (!project) return;

    console.log('🔍 Search navigation triggered:', {
      resultType: result.type,
      resultId: result.id,
      resultTitle: result.title,
      currentActId: project.currentActId,
      timestamp: new Date().toLocaleTimeString()
    });

    switch (result.type) {
      case 'act':
        const targetAct = project.acts.find(act => act.id === result.id);
        if (targetAct) {
          const updatedProject = {
            ...project,
            currentActId: targetAct.id
          };
          handleProjectUpdate(updatedProject, true);
          handleActChange(targetAct.id);
        }
        break;
      case 'plotpoint':
        let plotPoint = project.plotPoints.find(pp => pp.id === result.id);
        if (!plotPoint) {
          // Plot point not found in current state, refresh project data
          console.log('Plot point not found in current state, refreshing project data...');
          try {
            const backendProject = await ProjectApiService.getProject(projectId);
            if (backendProject) {
              const refreshedProject = await convertBackendProject(backendProject);
              setProject(refreshedProject);
              
              // Now try to find the plot point in the refreshed data
              const refreshedPlotPoint = refreshedProject.plotPoints.find(pp => pp.id === result.id);
              if (refreshedPlotPoint) {
                const updatedProject = {
                  ...refreshedProject,
                  currentActId: refreshedPlotPoint.actId,
                  focusedElementId: refreshedPlotPoint.id
                };
                handleProjectUpdate(updatedProject, true);
                handleActChange(refreshedPlotPoint.actId);
                
                setTimeout(() => {
                  if (canvasRef.current) {
                    canvasRef.current.handleZoomToFit();
                  }
                }, 200);
              }
            }
          } catch (error) {
            console.error('Failed to refresh project data:', error);
          }
          return;
        }
        
        const plotPointUpdatedProject = {
          ...project,
          currentActId: plotPoint.actId,
          focusedElementId: plotPoint.id
        };
        handleProjectUpdate(plotPointUpdatedProject, true);
        handleActChange(plotPoint.actId);
        
        setTimeout(() => {
          if (canvasRef.current) {
            canvasRef.current.handleZoomToFit();
          }
        }, 200);
        break;
      case 'character':
        const characterUpdatedProject = {
          ...project,
          focusedElementId: result.id,
          currentZoomLevel: ZoomLevel.CHARACTER_FOCUS
        };
        handleProjectUpdate(characterUpdatedProject, true);
        break;
      case 'scene':
        let sceneFound = project.plotPoints
          .flatMap(pp => pp.scenes.map(scene => ({ scene, plotPoint: pp })))
          .find(({ scene }) => scene.id === result.id);
        
        if (!sceneFound) {
          // Scene not found in current state, refresh project data
          console.log('Scene not found in current state, refreshing project data...');
          try {
            const backendProject = await ProjectApiService.getProject(projectId);
            if (backendProject) {
              const refreshedProject = await convertBackendProject(backendProject);
              setProject(refreshedProject);
              
              // Now try to find the scene in the refreshed data
              const refreshedSceneFound = refreshedProject.plotPoints
                .flatMap(pp => pp.scenes.map(scene => ({ scene, plotPoint: pp })))
                .find(({ scene }) => scene.id === result.id);
              
              if (refreshedSceneFound) {
                const updatedProject = {
                  ...refreshedProject,
                  currentActId: refreshedSceneFound.plotPoint.actId,
                  focusedElementId: refreshedSceneFound.scene.id,
                  currentZoomLevel: ZoomLevel.SCENE_DETAIL
                };
                handleProjectUpdate(updatedProject, true);
                handleActChange(refreshedSceneFound.plotPoint.actId);
              }
            }
          } catch (error) {
            console.error('Failed to refresh project data:', error);
          }
          return;
        }
        
        const sceneUpdatedProject = {
          ...project,
          currentActId: sceneFound.plotPoint.actId,
          focusedElementId: sceneFound.scene.id,
          currentZoomLevel: ZoomLevel.SCENE_DETAIL
        };
        handleProjectUpdate(sceneUpdatedProject, true);
        handleActChange(sceneFound.plotPoint.actId);
        break;
    }
  };

  // Sprint 1: Handle quick nav navigation
  const handleProjectQuickNavigation = (item: any) => {
    handleProjectSearchNavigation({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.subtitle,
      projectId: item.projectId,
      projectName: project?.title || '',
      actId: item.actId
    } as SearchResult);
  };

  // Sprint 1: Handle recent items navigation
  const handleRecentItemNavigation = (item: RecentItem) => {
    if (item.projectId !== projectId) {
      onBackToHomepage();
      return;
    }

    handleProjectSearchNavigation({
      id: item.id,
      type: item.type as any,
      title: item.title,
      description: '',
      projectId: item.projectId,
      projectName: project?.title || '',
      actId: item.actId
    } as SearchResult);
  };

  const handleZoomToFit = () => {
    if (canvasRef.current) {
      canvasRef.current.handleZoomToFit();
    }
  };

  // Content sync functionality - handles syncing of acts, plot points, scenes, and characters
  const syncProjectContent = async (updatedProject: Project) => {
    if (!updatedProject.id) return;

    try {
      setIsSyncing(true);
      
      console.log('Syncing project content. Current project state:', {
        projectId: updatedProject.id,
        currentActId: updatedProject.currentActId,
        acts: updatedProject.acts.map(act => ({ id: act.id, name: act.name })),
        plotPointsCount: updatedProject.plotPoints.length
      });

      // First sync basic project metadata
      await lightweightSync(updatedProject);

      // Then sync content in order: Acts -> Characters -> Plot Points -> Scenes
      await syncActs(updatedProject);
      await syncCharacters(updatedProject);
      await syncPlotPointsAndScenes(updatedProject);

      console.log('All project content synced successfully');
      
      // Refresh project from backend to get updated IDs for any created content
      console.log('🔄 ProjectWorkspace: Refreshing project from backend to get updated IDs...');
      const backendProject = await ProjectApiService.getProject(updatedProject.id);
      
      if (backendProject) {
        // Convert backend project to frontend format with all updated IDs
        const refreshedProject = await convertBackendProject(backendProject);
        console.log('✅ ProjectWorkspace: Project refreshed with real IDs', {
          plotPointsCount: refreshedProject.plotPoints.length,
          plotPointIds: refreshedProject.plotPoints.map((pp: any) => ({ id: pp.id, title: pp.title }))
        });
        setProject(refreshedProject);
        setLastSavedProject({ ...refreshedProject });
      }
    } catch (error) {
      console.error('Failed to sync project content:', error);
      // TODO: Add user notification for sync failures
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync acts with backend
  const syncActs = async (project: Project) => {
    try {
      console.log('Syncing acts. Frontend acts:', project.acts.map(a => ({ id: a.id, name: a.name })));
      
      // Get current acts from backend
      const backendActs = await ProjectApiService.getActs(project.id);
      console.log('Backend acts:', backendActs.map(a => ({ id: a.id, name: a.name })));
      
      const frontendActs = project.acts;

      // Find acts to create, update, and delete
      const actsToCreate = frontendActs.filter(act => 
        !backendActs.find(backendAct => backendAct.id === act.id)
      );
      
      const actsToUpdate = frontendActs.filter(act => 
        backendActs.find(backendAct => backendAct.id === act.id)
      );

      const actsToDelete = backendActs.filter(backendAct => 
        !frontendActs.find(act => act.id === backendAct.id)
      );

      console.log('Acts to create:', actsToCreate.map(a => ({ id: a.id, name: a.name })));

      // Create new acts and update the project with the actual backend IDs
      const actIdMapping: { [oldId: string]: string } = {};
      for (const act of actsToCreate) {
        const createdAct = await ProjectApiService.createAct(project.id, {
          name: act.name,
          description: act.description || null, // Convert undefined to null
          order: act.order
        });
        actIdMapping[act.id] = createdAct.id;
        console.log(`Created act: ${act.name}, old ID: ${act.id}, new ID: ${createdAct.id}`);
      }

      // Update existing acts
      for (const act of actsToUpdate) {
        await ProjectApiService.updateAct(project.id, act.id, {
          name: act.name,
          description: act.description || null, // Convert undefined to null
          order: act.order
        });
      }

      // Delete removed acts
      for (const act of actsToDelete) {
        await ProjectApiService.deleteAct(project.id, act.id);
      }

      // If we created new acts, update the project structure with the new IDs
      if (Object.keys(actIdMapping).length > 0) {
        console.log('Updating project with new act IDs:', actIdMapping);
        
        // Update act IDs
        const updatedActs = project.acts.map(act => ({
          ...act,
          id: actIdMapping[act.id] || act.id
        }));

        // Update currentActId if it was mapped
        const updatedCurrentActId = actIdMapping[project.currentActId] || project.currentActId;

        // Update plot point actIds
        const updatedPlotPoints = project.plotPoints.map(pp => ({
          ...pp,
          actId: actIdMapping[pp.actId] || pp.actId
        }));

        // Update the project with new IDs
        const updatedProject = {
          ...project,
          acts: updatedActs,
          currentActId: updatedCurrentActId,
          plotPoints: updatedPlotPoints
        };

        // Update the project state
        setProject(updatedProject);
        console.log('Updated project with new act IDs');
      }
    } catch (error) {
      console.error('Failed to sync acts:', error);
      throw error;
    }
  };

  // Sync characters with backend
  const syncCharacters = async (project: Project) => {
    try {
      // Get current characters from backend
      const backendCharacters = await ProjectApiService.getCharacters(project.id);
      const frontendCharacters = project.characters;

      // Find characters to create, update, and delete
      const charactersToCreate = frontendCharacters.filter(char => 
        !backendCharacters.find(backendChar => backendChar.id === char.id)
      );
      
      const charactersToUpdate = frontendCharacters.filter(char => 
        backendCharacters.find(backendChar => backendChar.id === char.id)
      );

      const charactersToDelete = backendCharacters.filter(backendChar => 
        !frontendCharacters.find(char => char.id === backendChar.id)
      );

      // Create new characters
      for (const character of charactersToCreate) {
        await ProjectApiService.createCharacter(project.id, {
          name: character.name,
          description: character.appearance, // Map appearance to description for backward compatibility
          appearance: character.appearance,
          personality: character.personality,
          motivation: character.motivation,
          characterType: (character.characterType?.toUpperCase() || 'MINOR') as 'PROTAGONIST' | 'ANTAGONIST' | 'SUPPORTING' | 'MINOR'
        });
      }

      // Update existing characters
      for (const character of charactersToUpdate) {
        await ProjectApiService.updateCharacter(project.id, character.id, {
          name: character.name,
          description: character.appearance, // Map appearance to description for backward compatibility
          appearance: character.appearance,
          personality: character.personality,
          motivation: character.motivation,
          characterType: (character.characterType?.toUpperCase() || 'MINOR') as 'PROTAGONIST' | 'ANTAGONIST' | 'SUPPORTING' | 'MINOR'
        });
      }

      // Delete removed characters
      for (const character of charactersToDelete) {
        await ProjectApiService.deleteCharacter(project.id, character.id);
      }
    } catch (error) {
      console.error('Failed to sync characters:', error);
      throw error;
    }
  };

  // Sync plot points and their scenes with backend
  const syncPlotPointsAndScenes = async (project: Project) => {
    console.log('🔄 ProjectWorkspace: Starting syncPlotPointsAndScenes', {
      projectId: project.id,
      totalPlotPoints: project.plotPoints.length,
      temporaryPlotPoints: project.plotPoints.filter(pp => pp.id.startsWith('temp-') || pp.id.startsWith('plot-')).length
    });
    
    try {
      const frontendPlotPoints = project.plotPoints;

      for (const plotPoint of frontendPlotPoints) {
        let plotPointId = plotPoint.id;
        
        // Check if this is a temporary ID that needs to be created
        const isTemporary = plotPoint.id.startsWith('temp-') || plotPoint.id.startsWith('plot-');
        
        if (isTemporary) {
          try {
            console.log(`🔧 ProjectWorkspace: Creating plot point: ${plotPoint.title} with actId: ${plotPoint.actId}, tempId: ${plotPoint.id}`);
            // Try to create the plot point
            const createdPlotPoint = await ProjectApiService.createPlotPoint(project.id, plotPoint.actId, {
              actId: plotPoint.actId,
              title: plotPoint.title,
              position: plotPoint.position || generateUniquePosition(project.plotPoints),
              color: plotPoint.color
            });
            
            if (createdPlotPoint && createdPlotPoint.id) {
              plotPointId = createdPlotPoint.id;
              console.log(`✅ ProjectWorkspace: Created plot point: ${plotPoint.title} - OLD ID: ${plotPoint.id} -> NEW ID: ${plotPointId}`);
            } else {
              console.error('❌ ProjectWorkspace: Created plot point response missing id:', createdPlotPoint);
              continue;
            }
          } catch (error) {
            console.error('Failed to create plot point:', plotPoint.title, error);
            continue; // Skip this plot point if creation fails
          }
        } else {
          // Try to update existing plot point
          try {
            await ProjectApiService.updatePlotPoint(project.id, plotPoint.actId, plotPoint.id, {
              title: plotPoint.title,
              position: plotPoint.position ? {
                x: plotPoint.position.x,
                y: plotPoint.position.y
              } : undefined,
              color: plotPoint.color,
              actId: plotPoint.actId // Include actId in the update
            });
            console.log(`Updated plot point: ${plotPoint.title}`);
          } catch (error) {
            // If update fails, try to create it
            try {
              const createdPlotPoint = await ProjectApiService.createPlotPoint(project.id, plotPoint.actId, {
                actId: plotPoint.actId,
                title: plotPoint.title,
                position: {
                  x: plotPoint.position?.x || 100,
                  y: plotPoint.position?.y || 100
                },
                color: plotPoint.color
              });
              plotPointId = createdPlotPoint.id;
              console.log(`Created plot point (after update failed): ${plotPoint.title} with ID: ${plotPointId}`);
            } catch (createError) {
              console.error('Failed to create plot point after update failed:', plotPoint.title, createError);
              continue;
            }
          }
        }

        // Sync scenes for this plot point
        await syncScenesForPlotPoint(project.id, plotPointId, plotPoint);
      }
    } catch (error) {
      console.error('Failed to sync plot points and scenes:', error);
      throw error;
    }
  };

  // Sync scenes for a specific plot point
  const syncScenesForPlotPoint = async (projectId: string, plotPointId: string, plotPoint: any) => {
    try {
      const frontendScenes = plotPoint.scenes || [];

      // First, get current scenes from backend to find ones that need to be deleted
      let backendScenes: any[] = [];
      try {
        backendScenes = await ProjectApiService.getScenes(projectId, plotPointId);
      } catch (error) {
        console.warn(`Failed to fetch backend scenes for plot point ${plotPointId}:`, error);
        backendScenes = [];
      }

      // Find scenes to delete (exist in backend but not in frontend)
      const frontendSceneIds = frontendScenes.map((scene: any) => scene.id);
      const scenesToDelete = backendScenes.filter(backendScene => 
        !frontendSceneIds.includes(backendScene.id)
      );

      // Delete removed scenes
      for (const sceneToDelete of scenesToDelete) {
        try {
          await ProjectApiService.deleteScene(projectId, plotPointId, sceneToDelete.id);
          console.log(`Deleted scene: ${sceneToDelete.title} (ID: ${sceneToDelete.id})`);
        } catch (error) {
          console.error(`Failed to delete scene ${sceneToDelete.title}:`, error);
        }
      }

      // Then handle creating and updating scenes
      for (const scene of frontendScenes) {
        // Check if this is a temporary ID that needs to be created
        const isTemporary = scene.id.startsWith('temp-') || scene.id.startsWith('scene-');
        
        if (isTemporary) {
          try {
            // Try to create the scene - use the scene's current position if it exists
            const scenePosition = scene.position && typeof scene.position.x === 'number' && typeof scene.position.y === 'number'
              ? scene.position 
              : (project?.plotPoints.find(pp => pp.id === plotPointId) ? 
                  generateScenePosition(project.plotPoints.find(pp => pp.id === plotPointId)!, project.plotPoints.find(pp => pp.id === plotPointId)!.scenes, project.plotPoints.find(pp => pp.id === plotPointId)!.scenes.length) : 
                  { x: 0, y: 0 }
                );
            
            const createdScene = await ProjectApiService.createScene(projectId, plotPointId, {
              plotPointId: plotPointId,
              title: scene.title,
              synopsis: scene.synopsis,
              content: scene.synopsis,
              position: scenePosition,
              characterIds: scene.characterIds || []
            });
            console.log(`Created scene: ${scene.title} with ID: ${createdScene.id}`);
          } catch (error) {
            console.error('Failed to create scene:', scene.title, error);
          }
        } else {
          // Try to update existing scene
          try {
            await ProjectApiService.updateScene(projectId, plotPointId, scene.id, {
              title: scene.title,
              synopsis: scene.synopsis,
              content: scene.synopsis,
              position: scene.position,
              characterIds: scene.characterIds || []
            });
            console.log(`Updated scene: ${scene.title}`);
          } catch (error) {
            // If update fails, try to create it
            try {
              const scenePosition = scene.position && typeof scene.position.x === 'number' && typeof scene.position.y === 'number'
                ? scene.position 
                : (project?.plotPoints.find(pp => pp.id === plotPointId) ? 
                    generateScenePosition(project.plotPoints.find(pp => pp.id === plotPointId)!, project.plotPoints.find(pp => pp.id === plotPointId)!.scenes, project.plotPoints.find(pp => pp.id === plotPointId)!.scenes.length) : 
                    { x: 0, y: 0 }
                  );
              
              const createdScene = await ProjectApiService.createScene(projectId, plotPointId, {
                plotPointId: plotPointId,
                title: scene.title,
                synopsis: scene.synopsis,
                content: scene.synopsis,
                position: scenePosition,
                characterIds: scene.characterIds || []
              });
              console.log(`Created scene (after update failed): ${scene.title} with ID: ${createdScene.id}`);
            } catch (createError) {
              console.error('Failed to create scene after update failed:', scene.title, createError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to sync scenes for plot point:', plotPointId, error);
      throw error;
    }
  };

  // Optimized autosave system
  const [lastSavedProject, setLastSavedProject] = useState<Project | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveTimeoutId, setAutoSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  // Constants for autosave optimization
  const AUTOSAVE_DELAY = 3000; // 3 seconds after last change
  const AUTOSAVE_MAX_INTERVAL = 30000; // Force save every 30 seconds if changes exist
  const LIGHTWEIGHT_SYNC_DELAY = 1000; // 1 second for lightweight changes (zoom, pan)

  // Detect changes between projects
  const detectChanges = (oldProject: Project | null, newProject: Project): 'none' | 'lightweight' | 'content' => {
    if (!oldProject) return 'content';

    // Check for lightweight changes (UI state only)
    const lightweightChanges = [
      'currentZoomLevel',
      'focusedElementId',
      'currentActId'
    ];
    
    const hasLightweightChanges = lightweightChanges.some(
      key => (oldProject as any)[key] !== (newProject as any)[key]
    );

    // Check for content changes (data that needs backend sync)
    const contentChanges = [
      'title',
      'description', 
      'tags',
      'status',
      'acts',
      'characters',
      'plotPoints'
    ];

    const hasContentChanges = contentChanges.some(key => {
      const oldValue = (oldProject as any)[key];
      const newValue = (newProject as any)[key];
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    });

    if (hasContentChanges) return 'content';
    if (hasLightweightChanges) return 'lightweight';
    return 'none';
  };

  // Optimized autosave function

  // Process any remaining saves when component unmounts
  useEffect(() => {
    return () => {
      if (saveQueueRef.current.length > 0) {
        console.log('Component unmounting, processing remaining saves...');
        // Process synchronously on unmount
        processSaveQueue();
      }
    };
  }, []);

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

  // Check if we have any plot points in the current act
  const currentActPlotPoints = project.plotPoints.filter(pp => pp.actId === project.currentActId);

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

        {/* Sprint 1: Project Search */}
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
          
          {/* Sprint 1: Recent Items Toggle */}
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
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
          </button>
          
          {showUserMenu && (
            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-48">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Act Navigation Bar */}
      <ActNavigation 
        project={project}
        onProjectUpdate={handleProjectUpdate}
        onActChange={handleActChange}
      />

      {/* App Header with Toolbar */}
      <div className="relative">
        <Toolbar 
          project={project}
          onProjectUpdate={handleProjectUpdate}
          onZoomChange={handleZoomChange}
          onZoomToFit={handleZoomToFit}
        />
        
        {/* Sync Status Indicator */}
        {isSyncing && (
          <div className="absolute top-2 right-16 flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm border border-blue-200">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Saving...</span>
          </div>
        )}
      </div>
      
      {/* Main Canvas Area */}
      <div className="flex-1 overflow-hidden">
        <Canvas 
          project={project}
          onProjectUpdate={handleProjectUpdate}
          ref={canvasRef}
        />
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
