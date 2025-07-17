import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Project, PlotPoint, Act, Character, EventType, ZoomLevel } from '../types/story';
import { 
  ProjectApiService,
  Project as BackendProject,
  Act as BackendAct,
  PlotPoint as BackendPlotPoint,
  Character as BackendCharacter
} from '../services/projectApiService';

// Data conversion utilities
const convertBackendProject = (backendProject: BackendProject, acts: BackendAct[] = [], plotPoints: BackendPlotPoint[] = [], characters: BackendCharacter[] = []): Project => {
  return {
    id: backendProject.id,
    title: backendProject.title,
    description: backendProject.description,
    tags: backendProject.tags,
    status: backendProject.status as any,
    createdDate: new Date(backendProject.createdAt),
    lastModified: new Date(backendProject.updatedAt),
    lastAccessed: backendProject.lastAccessedAt ? new Date(backendProject.lastAccessedAt) : undefined,
    acts: acts.map(convertBackendAct),
    currentActId: backendProject.currentActId || (acts.length > 0 ? acts[0].id : ''),
    characters: characters.map(convertBackendCharacter),
    plotPoints: plotPoints.map(convertBackendPlotPoint),
    currentZoomLevel: (backendProject.currentZoomLevel as ZoomLevel) || ZoomLevel.STORY_OVERVIEW,
    focusedElementId: backendProject.focusedElementId,
    genre: 'general' // Default genre since it's not in backend yet
  };
};

const convertBackendAct = (backendAct: BackendAct): Act => {
  return {
    id: backendAct.id,
    name: backendAct.name,
    description: backendAct.description,
    order: backendAct.order
  };
};

const convertBackendPlotPoint = (backendPlotPoint: BackendPlotPoint): PlotPoint => {
  return {
    id: backendPlotPoint.id,
    title: backendPlotPoint.title,
    position: backendPlotPoint.position,
    color: backendPlotPoint.color,
    actId: backendPlotPoint.actId,
    scenes: backendPlotPoint.scenes?.map(scene => ({
      id: scene.id,
      title: scene.title,
      synopsis: scene.synopsis || '',
      characterIds: scene.characters?.map(char => char.id) || [],
      setting: scene.setting ? {
        id: scene.setting.id,
        name: scene.setting.name,
        description: scene.setting.description
      } : { id: '', name: '', description: '' },
      items: scene.items?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description
      })) || [],
      position: scene.position
    })) || [],
    description: backendPlotPoint.synopsis,
    eventType: backendPlotPoint.eventType as EventType
  };
};

const convertBackendCharacter = (backendCharacter: BackendCharacter): Character => {
  return {
    id: backendCharacter.id,
    name: backendCharacter.name,
    appearance: backendCharacter.appearance,
    personality: backendCharacter.personality,
    motivation: backendCharacter.motivation,
    characterType: backendCharacter.characterType?.toLowerCase() as any
  };
};

// Types for async operations
interface AsyncOperation {
  id: string;
  type: 'saving' | 'loading' | 'creating_act' | 'creating_plot_point';
  timestamp: number;
}

interface ProjectState {
  // Core state
  project: Project | null;
  isLoading: boolean;
  error: string | null;
  
  // Async operation tracking
  operations: AsyncOperation[];
  saveQueue: Project[];
  lastSavedProject: Project | null;
  
  // UI state
  selectedNodes: string[];
  selectedAct: string | null;
  
  // Actions
  setProject: (project: Project) => void;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: (immediate?: boolean) => Promise<void>;
  
  // Project content actions
  updateProjectMetadata: (updates: Partial<Pick<Project, 'title' | 'description' | 'genre'>>) => void;
  updateCurrentAct: (actId: string) => void;
  
  // Act actions
  createAct: (actData: { title: string; description?: string; order: number }) => Promise<Act>;
  updateAct: (actId: string, updates: Partial<Act>) => void;
  deleteAct: (actId: string) => void;
  ensureActExists: (actNumber: number) => Promise<Act>;
  
  // Plot point actions
  createPlotPoint: (plotPointData: {
    title: string;
    description?: string;
    actId: string;
    eventType?: EventType;
    position?: { x: number; y: number };
  }) => Promise<PlotPoint>;
  updatePlotPoint: (plotPointId: string, updates: Partial<PlotPoint>) => void;
  deletePlotPoint: (plotPointId: string) => Promise<void>;
  
  // Character actions
  createCharacter: (characterData: { name: string; description?: string; role?: string }) => Promise<Character>;
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  deleteCharacter: (characterId: string) => Promise<void>;
  
  // UI actions
  setSelectedNodes: (nodeIds: string[]) => void;
  setSelectedAct: (actId: string | null) => void;
  
  // Utility actions
  addOperation: (operation: Omit<AsyncOperation, 'timestamp'>) => void;
  removeOperation: (operationId: string) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  project: null,
  isLoading: false,
  error: null,
  operations: [],
  saveQueue: [],
  lastSavedProject: null,
  selectedNodes: [],
  selectedAct: null,
};

export const useProjectStore = create<ProjectState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Core actions
    setProject: (project: Project) => {
      console.log('🏪 ProjectStore: Setting project', { projectId: project.id, title: project.title });
      set({ project, error: null });
    },

    loadProject: async (projectId: string) => {
      console.log('🏪 ProjectStore: Loading project', { projectId });
      set({ isLoading: true, error: null });
      
      try {
        // Load project and related data
        const [project, acts, characters] = await Promise.all([
          ProjectApiService.getProject(projectId),
          ProjectApiService.getActs(projectId),
          ProjectApiService.getCharacters(projectId)
        ]);

        // Load plot points for each act
        const plotPointPromises = acts.map(act => 
          ProjectApiService.getPlotPoints(projectId, act.id)
        );
        const plotPointArrays = await Promise.all(plotPointPromises);
        const allPlotPoints = plotPointArrays.flat();

        const convertedProject = convertBackendProject(project, acts, allPlotPoints, characters);
        
        // Always clear focus and reset zoom when loading a project to prevent double zoom issues
        const cleanProject = {
          ...convertedProject,
          focusedElementId: undefined,
          currentZoomLevel: 'STORY_OVERVIEW' as any, // Reset to overview
          lastModified: new Date()
        };
        
        console.log('🧹 ProjectStore: Auto-clearing focus on project load', {
          originalFocus: convertedProject.focusedElementId,
          originalZoom: convertedProject.currentZoomLevel
        });
        
        set({ 
          project: cleanProject, 
          lastSavedProject: cleanProject,
          isLoading: false 
        });
        console.log('🏪 ProjectStore: Project loaded successfully', { 
          projectId: convertedProject.id,
          title: convertedProject.title 
        });
      } catch (error) {
        console.error('🏪 ProjectStore: Failed to load project', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load project',
          isLoading: false 
        });
      }
    },

    saveProject: async (immediate = false) => {
      const { project, saveQueue, operations } = get();
      if (!project) return;

      // Check if already saving
      const isSaving = operations.some(op => op.type === 'saving');
      if (isSaving && !immediate) {
        console.log('🏪 ProjectStore: Save already in progress, queueing');
        set(state => ({ saveQueue: [...state.saveQueue, project] }));
        return;
      }

      const operationId = `save-${Date.now()}`;
      get().addOperation({ id: operationId, type: 'saving' });

      try {
        console.log('🏪 ProjectStore: Saving project', { projectId: project.id, immediate });
        
        // Convert status to backend format
        const convertStatusToBackend = (status?: string) => {
          if (!status) return undefined;
          switch (status) {
            case 'draft': return 'DRAFT';
            case 'in-progress': return 'IN_PROGRESS';
            case 'completed': return 'COMPLETED';
            case 'archived': return 'ARCHIVED';
            default: return status.toUpperCase().replace('-', '_');
          }
        };
        
        const updateData = {
          title: project.title,
          description: project.description || undefined, // Convert null/empty to undefined so it's omitted
          tags: project.tags,
          status: convertStatusToBackend(project.status) as any,
          currentActId: project.currentActId,
          currentZoomLevel: project.currentZoomLevel as any,
          focusedElementId: project.focusedElementId || undefined // Convert null to undefined
        };
        
        // Remove undefined values to avoid sending them
        const cleanedUpdateData = Object.fromEntries(
          Object.entries(updateData).filter(([_, value]) => value !== undefined)
        );
        
        console.log('🏪 ProjectStore: Sending update data:', cleanedUpdateData);
        
        await ProjectApiService.updateProject(project.id, cleanedUpdateData);

        set({ 
          lastSavedProject: project, 
          error: null,
          saveQueue: saveQueue.filter(p => p !== project)
        });
        
        console.log('🏪 ProjectStore: Project saved successfully');

        // Process save queue if there are pending saves
        const { saveQueue: currentQueue } = get();
        if (currentQueue.length > 0) {
          const nextProject = currentQueue[currentQueue.length - 1];
          set({ project: nextProject });
          setTimeout(() => get().saveProject(true), 100);
        }
      } catch (error) {
        console.error('🏪 ProjectStore: Failed to save project', error);
        set({ error: error instanceof Error ? error.message : 'Failed to save project' });
      } finally {
        get().removeOperation(operationId);
      }
    },

    // Project metadata actions
    updateProjectMetadata: (updates) => {
      const { project } = get();
      if (!project) return;

      const updatedProject = { ...project, ...updates };
      set({ project: updatedProject });
      
      // Auto-save after a short delay
      setTimeout(() => get().saveProject(), 1000);
    },

    updateCurrentAct: (actId: string) => {
      const { project } = get();
      if (!project) return;
      
      console.log('🏪 ProjectStore: Updating current act', { 
        from: project.currentActId, 
        to: actId,
        actName: project.acts.find(a => a.id === actId)?.name
      });
      
      const updatedProject = { 
        ...project, 
        currentActId: actId,
        lastModified: new Date()
      };
      set({ project: updatedProject });
      
      // Auto-save after a short delay
      setTimeout(() => get().saveProject(), 1000);
    },

    // Act actions
    createAct: async (actData) => {
      const { project } = get();
      if (!project) throw new Error('No project loaded');

      const operationId = `create-act-${Date.now()}`;
      get().addOperation({ id: operationId, type: 'creating_act' });

      try {
        console.log('🏪 ProjectStore: Creating act', actData);
        
        const response = await ProjectApiService.createAct(project.id, {
          name: actData.title, // Backend uses 'name', frontend uses 'title'
          description: actData.description,
          order: actData.order
        });

        const newAct = convertBackendAct(response);

        // Update project with new act
        const updatedProject = {
          ...project,
          acts: [...project.acts, newAct].sort((a, b) => a.order - b.order)
        };

        set({ project: updatedProject });
        
        // Wait a moment for state to propagate
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('🏪 ProjectStore: Act created successfully', { actId: newAct.id });
        return newAct;
      } catch (error) {
        console.error('🏪 ProjectStore: Failed to create act', error);
        set({ error: error instanceof Error ? error.message : 'Failed to create act' });
        throw error;
      } finally {
        get().removeOperation(operationId);
      }
    },

    ensureActExists: async (actNumber: number) => {
      const { project } = get();
      if (!project) throw new Error('No project loaded');

      // Check if act already exists
      const existingAct = project.acts.find(act => act.order === actNumber);
      if (existingAct) {
        console.log('🏪 ProjectStore: Act already exists', { actNumber, actId: existingAct.id });
        return existingAct;
      }

      // Create the act
      console.log('🏪 ProjectStore: Creating missing act', { actNumber });
      return get().createAct({
        title: `Act ${actNumber}`,
        description: `Act ${actNumber} of the story`,
        order: actNumber
      });
    },

    updateAct: (actId: string, updates: Partial<Act>) => {
      const { project } = get();
      if (!project) return;

      const updatedProject = {
        ...project,
        acts: project.acts.map(act =>
          act.id === actId ? { ...act, ...updates } : act
        )
      };

      set({ project: updatedProject });
      setTimeout(() => get().saveProject(), 1000);
    },

    deleteAct: (actId: string) => {
      const { project } = get();
      if (!project) return;

      // Remove act and associated plot points
      const updatedProject = {
        ...project,
        acts: project.acts.filter(act => act.id !== actId),
        plotPoints: project.plotPoints.filter(pp => pp.actId !== actId)
      };

      set({ project: updatedProject });
      setTimeout(() => get().saveProject(), 1000);
    },

    // Plot point actions
    createPlotPoint: async (plotPointData) => {
      const { project } = get();
      if (!project) throw new Error('No project loaded');

      const operationId = `create-plot-point-${Date.now()}`;
      get().addOperation({ id: operationId, type: 'creating_plot_point' });

      try {
        console.log('🏪 ProjectStore: Creating plot point', plotPointData);
        
        const response = await ProjectApiService.createPlotPoint(project.id, plotPointData.actId, {
          actId: plotPointData.actId,
          title: plotPointData.title,
          synopsis: plotPointData.description,
          position: plotPointData.position || { x: 0, y: 0 },
          color: '#3B82F6', // Default blue color
          eventType: plotPointData.eventType
        });

        const newPlotPoint = convertBackendPlotPoint(response);

        // Update project with new plot point
        const updatedProject = {
          ...project,
          plotPoints: [...project.plotPoints, newPlotPoint]
        };

        set({ project: updatedProject });
        
        console.log('🏪 ProjectStore: Plot point created successfully', { plotPointId: newPlotPoint.id });
        return newPlotPoint;
      } catch (error) {
        console.error('🏪 ProjectStore: Failed to create plot point', error);
        set({ error: error instanceof Error ? error.message : 'Failed to create plot point' });
        throw error;
      } finally {
        get().removeOperation(operationId);
      }
    },

    updatePlotPoint: (plotPointId: string, updates: Partial<PlotPoint>) => {
      const { project } = get();
      if (!project) return;

      const updatedProject = {
        ...project,
        plotPoints: project.plotPoints.map(pp =>
          pp.id === plotPointId ? { ...pp, ...updates } : pp
        )
      };

      set({ project: updatedProject });
      setTimeout(() => get().saveProject(), 1000);
    },

    deletePlotPoint: async (plotPointId: string) => {
      const { project } = get();
      if (!project) return;

      // Find the plot point to get its actId for the delete API call
      const plotPointToDelete = project.plotPoints.find(pp => pp.id === plotPointId);
      if (!plotPointToDelete) {
        console.warn('🏪 ProjectStore: Plot point not found for deletion:', plotPointId);
        return;
      }

      try {
        console.log('🏪 ProjectStore: Deleting plot point', { 
          plotPointId, 
          actId: plotPointToDelete.actId,
          title: plotPointToDelete.title 
        });

        // Call backend API to delete from database
        await ProjectApiService.deletePlotPoint(project.id, plotPointToDelete.actId, plotPointId);

        // Update frontend state
        const updatedProject = {
          ...project,
          plotPoints: project.plotPoints.filter(pp => pp.id !== plotPointId)
        };

        set({ project: updatedProject });
        console.log('🏪 ProjectStore: Plot point deleted successfully', { plotPointId });
      } catch (error) {
        console.error('🏪 ProjectStore: Failed to delete plot point:', error);
        // TODO: Show error message to user and potentially revert the optimistic update
        throw error;
      }
    },

    // Character actions
    createCharacter: async (characterData) => {
      const { project } = get();
      if (!project) throw new Error('No project loaded');

      try {
        console.log('🏪 ProjectStore: Creating character', characterData);
        
        const response = await ProjectApiService.createCharacter(project.id, {
          name: characterData.name,
          description: characterData.description,
          characterType: 'SUPPORTING', // Default character type
        });

        const newCharacter = convertBackendCharacter(response);

        // Update project with new character
        const updatedProject = {
          ...project,
          characters: [...project.characters, newCharacter]
        };

        set({ project: updatedProject });
        
        console.log('🏪 ProjectStore: Character created successfully', { characterId: newCharacter.id });
        return newCharacter;
      } catch (error) {
        console.error('🏪 ProjectStore: Failed to create character', error);
        set({ error: error instanceof Error ? error.message : 'Failed to create character' });
        throw error;
      }
    },

    updateCharacter: (characterId: string, updates: Partial<Character>) => {
      const { project } = get();
      if (!project) return;

      const updatedProject = {
        ...project,
        characters: project.characters.map(char =>
          char.id === characterId ? { ...char, ...updates } : char
        )
      };

      set({ project: updatedProject });
      setTimeout(() => get().saveProject(), 1000);
    },

    deleteCharacter: async (characterId: string) => {
      const { project } = get();
      if (!project) return;

      // Find the character to delete for logging
      const characterToDelete = project.characters.find(char => char.id === characterId);
      if (!characterToDelete) {
        console.warn('🏪 ProjectStore: Character not found for deletion:', characterId);
        return;
      }

      try {
        console.log('🏪 ProjectStore: Deleting character', { 
          characterId, 
          name: characterToDelete.name 
        });

        // Call backend API to delete from database
        await ProjectApiService.deleteCharacter(project.id, characterId);

        // Update frontend state
        const updatedProject = {
          ...project,
          characters: project.characters.filter(char => char.id !== characterId)
        };

        set({ project: updatedProject });
        console.log('🏪 ProjectStore: Character deleted successfully', { characterId });
      } catch (error) {
        console.error('🏪 ProjectStore: Failed to delete character:', error);
        // TODO: Show error message to user and potentially revert the optimistic update
        throw error;
      }
    },

    // UI actions
    setSelectedNodes: (nodeIds: string[]) => {
      set({ selectedNodes: nodeIds });
    },

    setSelectedAct: (actId: string | null) => {
      set({ selectedAct: actId });
    },

    // Utility actions
    addOperation: (operation) => {
      set(state => ({
        operations: [...state.operations, { ...operation, timestamp: Date.now() }]
      }));
    },

    removeOperation: (operationId: string) => {
      set(state => ({
        operations: state.operations.filter(op => op.id !== operationId)
      }));
    },

    clearError: () => {
      set({ error: null });
    },

    reset: () => {
      set(initialState);
    },
  }))
);

// Selectors for common use cases
export const selectProject = (state: ProjectState) => state.project;
export const selectIsLoading = (state: ProjectState) => state.isLoading;
export const selectError = (state: ProjectState) => state.error;
export const selectSelectedNodes = (state: ProjectState) => state.selectedNodes;
export const selectIsOperationInProgress = (operationType: AsyncOperation['type']) => 
  (state: ProjectState) => state.operations.some(op => op.type === operationType);

// Computed selectors
export const selectPlotPointsByAct = (actId: string) => (state: ProjectState) => 
  state.project?.plotPoints.filter(pp => pp.actId === actId) || [];

export const selectCharactersByRole = (role: string) => (state: ProjectState) =>
  state.project?.characters.filter(char => char.characterType === role) || [];
