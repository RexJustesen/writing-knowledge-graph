import { ApiClient, PaginatedResponse } from './api';

// Backend API types (matching our backend schema)
export interface Project {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  status: 'draft' | 'in-progress' | 'completed' | 'archived';
  userId: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  currentZoomLevel?: string;
  currentActId?: string;
  focusedElementId?: string;
  isPublic: boolean;
  deletedAt?: string;
  isDeleted?: boolean;
}

export interface Act {
  id: string;
  name: string;
  description?: string;
  order: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlotPoint {
  id: string;
  projectId: string;
  actId: string;
  title: string;
  synopsis?: string;
  position: { x: number; y: number };
  color: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
  
  // Relations (when included)
  scenes?: Scene[];
}

export interface Scene {
  id: string;
  projectId: string;
  plotPointId: string;
  title: string;
  synopsis?: string;
  content?: string;
  wordCount: number;
  position?: { x: number; y: number };
  order?: number;
  createdAt: string;
  updatedAt: string;
  settingId?: string;
  
  // Relations (when included)
  setting?: Setting;
  characters?: Character[];
  items?: Item[];
}

export interface Character {
  id: string;
  name: string;
  description?: string;
  appearance?: string;
  personality?: string;
  motivation?: string;
  backstory?: string;
  characterType: 'PROTAGONIST' | 'ANTAGONIST' | 'SUPPORTING' | 'MINOR';
  arcNotes?: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  scenes?: Scene[];
}

export interface Setting {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  scenes?: Scene[];
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  significance: 'high' | 'medium' | 'low';
  projectId: string;
  createdAt: string;
  updatedAt: string;
  scenes?: Scene[];
}

export interface Collaborator {
  id: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  userId: string;
  projectId: string;
  addedBy: string;
  addedAt: string;
  user: {
    id: string;
    email: string;
    username: string;
    createdAt: string;
    lastLoginAt?: string;
  };
}

// Request/Response types
export interface CreateProjectRequest {
  title: string;
  description?: string;
  template?: 'NOVEL' | 'SCREENPLAY' | 'SHORT_STORY' | 'FROM_SCRATCH';
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  tags?: string[];
  status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  currentActId?: string;
  currentZoomLevel?: 'STORY_OVERVIEW' | 'PLOT_POINT_FOCUS' | 'SCENE_DETAIL' | 'CHARACTER_FOCUS';
  focusedElementId?: string;
  goals?: {
    targetWordCount?: number;
    targetActCount?: number;
    targetPlotPointCount?: number;
    deadline?: string;
    completionPercentage?: number;
  };
}

export interface CreateActRequest {
  name: string;
  description?: string | null;
  order: number;
}

export interface UpdateActRequest {
  name?: string;
  description?: string | null;
  order?: number;
}

export interface CreatePlotPointRequest {
  actId: string;
  title: string;
  synopsis?: string;
  position: {
    x: number;
    y: number;
  };
  color?: string;
  order?: number;
}

export interface UpdatePlotPointRequest {
  title?: string;
  synopsis?: string;
  position?: {
    x: number;
    y: number;
  };
  color?: string;
  order?: number;
  actId?: string;
}

export interface CreateSceneRequest {
  plotPointId: string;
  title: string;
  synopsis?: string;
  content?: string;
  position?: {
    x: number;
    y: number;
  };
  order?: number;
  settingId?: string;
  characterIds?: string[];
  itemIds?: string[];
}

export interface UpdateSceneRequest {
  title?: string;
  synopsis?: string;
  content?: string;
  position?: {
    x: number;
    y: number;
  };
  order?: number;
  settingId?: string;
  characterIds?: string[];
  itemIds?: string[];
}

export interface CreateCharacterRequest {
  name: string;
  description?: string;
  appearance?: string;
  personality?: string;
  motivation?: string;
  backstory?: string;
  characterType: Character['characterType'];
  arcNotes?: string;
}

export interface UpdateCharacterRequest {
  name?: string;
  description?: string;
  appearance?: string;
  personality?: string;
  motivation?: string;
  backstory?: string;
  characterType?: Character['characterType'];
  arcNotes?: string;
}

export interface CreateSettingRequest {
  name: string;
  description?: string;
}

export interface UpdateSettingRequest {
  name?: string;
  description?: string;
}

export interface CreateItemRequest {
  name: string;
  description?: string;
  significance: Item['significance'];
}

export interface UpdateItemRequest {
  name?: string;
  description?: string;
  significance?: Item['significance'];
}

export interface AddCollaboratorRequest {
  email: string;
  role: 'VIEWER' | 'EDITOR';
}

export interface UpdateCollaboratorRequest {
  role: 'VIEWER' | 'EDITOR' | 'OWNER';
}

export class ProjectApiService {
  // Project CRUD
  static async getProjects(): Promise<Project[]> {
    console.log('🔧 ProjectApiService.getProjects called');
    try {
      const response = await ApiClient.authenticatedRequest<{ projects: Project[] }>('GET', '/api/projects');
      console.log('🔧 getProjects response:', response);
      return response.projects || [];
    } catch (error) {
      console.error('🔧 getProjects error:', error);
      throw error;
    }
  }

  static async getProject(projectId: string): Promise<Project> {
    const response = await ApiClient.authenticatedRequest<{ project: Project }>('GET', `/api/projects/${projectId}`);
    return response.project;
  }

  static async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await ApiClient.authenticatedRequest<{ project: Project }>('POST', '/api/projects', data);
    return response.project;
  }

  static async updateProject(projectId: string, data: UpdateProjectRequest): Promise<Project> {
    const response = await ApiClient.authenticatedRequest<{ project: Project }>('PATCH', `/api/projects/${projectId}`, data);
    return response.project;
  }

  static async deleteProject(projectId: string): Promise<void> {
    await ApiClient.authenticatedRequest<{ message: string }>('DELETE', `/api/projects/${projectId}`);
  }

  // Act CRUD
  static async getActs(projectId: string): Promise<Act[]> {
    const response = await ApiClient.authenticatedRequest<{ acts: Act[] }>('GET', `/api/projects/${projectId}/acts`);
    return response.acts;
  }

  static async getAct(projectId: string, actId: string): Promise<Act> {
    const response = await ApiClient.authenticatedRequest<{ act: Act }>('GET', `/api/projects/${projectId}/acts/${actId}`);
    return response.act;
  }

  static async createAct(projectId: string, data: CreateActRequest): Promise<Act> {
    const response = await ApiClient.authenticatedRequest<{ act: Act }>('POST', `/api/projects/${projectId}/acts`, data);
    return response.act;
  }

  static async updateAct(projectId: string, actId: string, data: UpdateActRequest): Promise<Act> {
    const response = await ApiClient.authenticatedRequest<{ act: Act }>('PUT', `/api/projects/${projectId}/acts/${actId}`, data);
    return response.act;
  }

  static async deleteAct(projectId: string, actId: string): Promise<void> {
    await ApiClient.authenticatedRequest<{ message: string }>('DELETE', `/api/projects/${projectId}/acts/${actId}`);
  }

  // Plot Point CRUD
  static async getPlotPoints(projectId: string, actId: string): Promise<PlotPoint[]> {
    const response = await ApiClient.authenticatedRequest<{ plotpoints: PlotPoint[] }>('GET', `/api/projects/${projectId}/acts/${actId}/plotpoints`);
    return response.plotpoints;
  }

  static async getPlotPoint(projectId: string, actId: string, plotPointId: string): Promise<PlotPoint> {
    const response = await ApiClient.authenticatedRequest<{ plotpoint: PlotPoint }>('GET', `/api/projects/${projectId}/acts/${actId}/plotpoints/${plotPointId}`);
    return response.plotpoint;
  }

  static async createPlotPoint(projectId: string, actId: string, data: CreatePlotPointRequest): Promise<PlotPoint> {
    const response = await ApiClient.authenticatedRequest<{ plotpoint: PlotPoint }>('POST', `/api/projects/${projectId}/acts/${actId}/plotpoints`, data);
    return response.plotpoint;
  }

  static async updatePlotPoint(projectId: string, actId: string, plotPointId: string, data: UpdatePlotPointRequest): Promise<PlotPoint> {
    const response = await ApiClient.authenticatedRequest<{ plotpoint: PlotPoint }>('PUT', `/api/projects/${projectId}/acts/${actId}/plotpoints/${plotPointId}`, data);
    return response.plotpoint;
  }

  static async deletePlotPoint(projectId: string, actId: string, plotPointId: string): Promise<void> {
    await ApiClient.authenticatedRequest<{ message: string }>('DELETE', `/api/projects/${projectId}/acts/${actId}/plotpoints/${plotPointId}`);
  }

  // Scene CRUD
  static async getScenes(projectId: string, plotPointId: string): Promise<Scene[]> {
    const response = await ApiClient.authenticatedRequest<{ scenes: Scene[] }>('GET', `/api/projects/${projectId}/plotpoints/${plotPointId}/scenes`);
    return response.scenes;
  }

  static async getScene(projectId: string, plotPointId: string, sceneId: string): Promise<Scene> {
    const response = await ApiClient.authenticatedRequest<{ scene: Scene }>('GET', `/api/projects/${projectId}/plotpoints/${plotPointId}/scenes/${sceneId}`);
    return response.scene;
  }

  static async createScene(projectId: string, plotPointId: string, data: CreateSceneRequest): Promise<Scene> {
    const response = await ApiClient.authenticatedRequest<{ scene: Scene }>('POST', `/api/projects/${projectId}/plotpoints/${plotPointId}/scenes`, data);
    return response.scene;
  }

  static async updateScene(projectId: string, plotPointId: string, sceneId: string, data: UpdateSceneRequest): Promise<Scene> {
    const response = await ApiClient.authenticatedRequest<{ scene: Scene }>('PUT', `/api/projects/${projectId}/plotpoints/${plotPointId}/scenes/${sceneId}`, data);
    return response.scene;
  }

  static async deleteScene(projectId: string, plotPointId: string, sceneId: string): Promise<void> {
    await ApiClient.authenticatedRequest<{ message: string }>('DELETE', `/api/projects/${projectId}/plotpoints/${plotPointId}/scenes/${sceneId}`);
  }

  // Character CRUD
  static async getCharacters(projectId: string): Promise<Character[]> {
    const response = await ApiClient.authenticatedRequest<{ characters: Character[] }>('GET', `/api/projects/${projectId}/characters`);
    return response.characters;
  }

  static async getCharacter(projectId: string, characterId: string): Promise<Character> {
    const response = await ApiClient.authenticatedRequest<{ character: Character }>('GET', `/api/projects/${projectId}/characters/${characterId}`);
    return response.character;
  }

  static async createCharacter(projectId: string, data: CreateCharacterRequest): Promise<Character> {
    const response = await ApiClient.authenticatedRequest<{ character: Character }>('POST', `/api/projects/${projectId}/characters`, data);
    return response.character;
  }

  static async updateCharacter(projectId: string, characterId: string, data: UpdateCharacterRequest): Promise<Character> {
    const response = await ApiClient.authenticatedRequest<{ character: Character }>('PUT', `/api/projects/${projectId}/characters/${characterId}`, data);
    return response.character;
  }

  static async deleteCharacter(projectId: string, characterId: string): Promise<void> {
    await ApiClient.authenticatedRequest<{ message: string }>('DELETE', `/api/projects/${projectId}/characters/${characterId}`);
  }

  // Setting CRUD
  static async getSettings(projectId: string): Promise<Setting[]> {
    const response = await ApiClient.authenticatedRequest<{ settings: Setting[] }>('GET', `/api/projects/${projectId}/settings`);
    return response.settings;
  }

  static async getSetting(projectId: string, settingId: string): Promise<Setting> {
    const response = await ApiClient.authenticatedRequest<{ setting: Setting }>('GET', `/api/projects/${projectId}/settings/${settingId}`);
    return response.setting;
  }

  static async createSetting(projectId: string, data: CreateSettingRequest): Promise<Setting> {
    const response = await ApiClient.authenticatedRequest<{ setting: Setting }>('POST', `/api/projects/${projectId}/settings`, data);
    return response.setting;
  }

  static async updateSetting(projectId: string, settingId: string, data: UpdateSettingRequest): Promise<Setting> {
    const response = await ApiClient.authenticatedRequest<{ setting: Setting }>('PUT', `/api/projects/${projectId}/settings/${settingId}`, data);
    return response.setting;
  }

  static async deleteSetting(projectId: string, settingId: string): Promise<void> {
    await ApiClient.authenticatedRequest<{ message: string }>('DELETE', `/api/projects/${projectId}/settings/${settingId}`);
  }

  // Item CRUD
  static async getItems(projectId: string): Promise<Item[]> {
    const response = await ApiClient.authenticatedRequest<{ items: Item[] }>('GET', `/api/projects/${projectId}/items`);
    return response.items;
  }

  static async getItem(projectId: string, itemId: string): Promise<Item> {
    const response = await ApiClient.authenticatedRequest<{ item: Item }>('GET', `/api/projects/${projectId}/items/${itemId}`);
    return response.item;
  }

  static async createItem(projectId: string, data: CreateItemRequest): Promise<Item> {
    const response = await ApiClient.authenticatedRequest<{ item: Item }>('POST', `/api/projects/${projectId}/items`, data);
    return response.item;
  }

  static async updateItem(projectId: string, itemId: string, data: UpdateItemRequest): Promise<Item> {
    const response = await ApiClient.authenticatedRequest<{ item: Item }>('PUT', `/api/projects/${projectId}/items/${itemId}`, data);
    return response.item;
  }

  static async deleteItem(projectId: string, itemId: string): Promise<void> {
    await ApiClient.authenticatedRequest<{ message: string }>('DELETE', `/api/projects/${projectId}/items/${itemId}`);
  }

  // Collaborator management
  static async getCollaborators(projectId: string): Promise<Collaborator[]> {
    const response = await ApiClient.authenticatedRequest<{ collaborators: Collaborator[] }>('GET', `/api/projects/${projectId}/collaborators`);
    return response.collaborators;
  }

  static async addCollaborator(projectId: string, data: AddCollaboratorRequest): Promise<Collaborator> {
    const response = await ApiClient.authenticatedRequest<{ collaborator: Collaborator }>('POST', `/api/projects/${projectId}/collaborators`, data);
    return response.collaborator;
  }

  static async updateCollaborator(projectId: string, collaboratorId: string, data: UpdateCollaboratorRequest): Promise<Collaborator> {
    const response = await ApiClient.authenticatedRequest<{ collaborator: Collaborator }>('PATCH', `/api/projects/${projectId}/collaborators/${collaboratorId}`, data);
    return response.collaborator;
  }

  static async removeCollaborator(projectId: string, collaboratorId: string): Promise<void> {
    await ApiClient.authenticatedRequest<{ message: string }>('DELETE', `/api/projects/${projectId}/collaborators/${collaboratorId}`);
  }

  static async leaveProject(projectId: string): Promise<void> {
    await ApiClient.authenticatedRequest<{ message: string }>('POST', `/api/projects/${projectId}/leave`);
  }
}
