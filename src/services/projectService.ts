import { Project, ProjectMetadata, Act, ZoomLevel } from '@/types/story';

const PROJECTS_STORAGE_KEY = 'writing-planner-projects';
const PROJECT_PREFIX = 'writing-planner-project-';

export class ProjectService {
  // Get all project metadata for homepage display
  static getAllProjectMetadata(): ProjectMetadata[] {
    try {
      const projectsData = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (!projectsData) return [];
      
      const projectIds: string[] = JSON.parse(projectsData);
      const projects: ProjectMetadata[] = [];
      
      for (const projectId of projectIds) {
        const projectData = localStorage.getItem(`${PROJECT_PREFIX}${projectId}`);
        if (projectData) {
          const project: Project = JSON.parse(projectData);
          projects.push(this.generateProjectMetadata(project));
        }
      }
      
      // Sort by last accessed, then by last modified
      return projects.sort((a, b) => {
        const aTime = a.lastAccessed || a.lastModified;
        const bTime = b.lastAccessed || b.lastModified;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
    } catch (error) {
      console.error('Error loading project metadata:', error);
      return [];
    }
  }

  // Get a specific project
  static getProject(projectId: string): Project | null {
    try {
      const projectData = localStorage.getItem(`${PROJECT_PREFIX}${projectId}`);
      if (!projectData) return null;
      
      const project: Project = JSON.parse(projectData);
      
      // Update last accessed time
      project.lastAccessed = new Date();
      this.saveProject(project);
      
      return project;
    } catch (error) {
      console.error('Error loading project:', error);
      return null;
    }
  }

  // Save a project
  static saveProject(project: Project): void {
    try {
      // Update last modified time
      project.lastModified = new Date();
      
      // Save the project
      localStorage.setItem(`${PROJECT_PREFIX}${project.id}`, JSON.stringify(project));
      
      // Update the projects list
      const projectsData = localStorage.getItem(PROJECTS_STORAGE_KEY);
      let projectIds: string[] = projectsData ? JSON.parse(projectsData) : [];
      
      if (!projectIds.includes(project.id)) {
        projectIds.push(project.id);
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projectIds));
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  }

  // Create a new project
  static createProject(title: string, template?: 'novel' | 'screenplay' | 'short-story' | 'from-scratch'): Project {
    const projectId = `project-${Date.now()}`;
    const now = new Date();
    
    // Create default acts based on template
    let defaultActs: Act[];
    switch (template) {
      case 'from-scratch':
        defaultActs = [
          { id: 'act-1', name: 'Act 1', description: undefined, order: 1 }
        ];
        break;
      case 'screenplay':
        defaultActs = [
          { id: 'act-1', name: 'Act I: Setup', description: 'Establish characters and world', order: 1 },
          { id: 'act-2a', name: 'Act IIA: Rising Action', description: 'Complications arise', order: 2 },
          { id: 'act-2b', name: 'Act IIB: Midpoint', description: 'Point of no return', order: 3 },
          { id: 'act-3', name: 'Act III: Resolution', description: 'Climax and resolution', order: 4 }
        ];
        break;
      case 'short-story':
        defaultActs = [
          { id: 'act-1', name: 'Opening', description: 'Hook and setup', order: 1 },
          { id: 'act-2', name: 'Development', description: 'Conflict and rising action', order: 2 },
          { id: 'act-3', name: 'Climax & Resolution', description: 'Conclusion', order: 3 }
        ];
        break;
      default: // novel or no template
        defaultActs = [
          { id: 'act-1', name: 'Act 1: Beginning', description: 'Setup and inciting incident', order: 1 },
          { id: 'act-2', name: 'Act 2: Middle', description: 'Rising action and complications', order: 2 },
          { id: 'act-3', name: 'Act 3: End', description: 'Climax and resolution', order: 3 }
        ];
    }

    const newProject: Project = {
      id: projectId,
      title,
      description: '',
      tags: [],
      status: 'draft',
      createdDate: now,
      lastModified: now,
      lastAccessed: now,
      acts: defaultActs,
      currentActId: defaultActs[0].id,
      characters: [],
      plotPoints: [],
      currentZoomLevel: ZoomLevel.STORY_OVERVIEW
    };

    this.saveProject(newProject);
    return newProject;
  }

  // Duplicate a project
  static duplicateProject(originalProjectId: string, newTitle: string): Project | null {
    const originalProject = this.getProject(originalProjectId);
    if (!originalProject) return null;

    const newProjectId = `project-${Date.now()}`;
    const now = new Date();

    const duplicatedProject: Project = {
      ...originalProject,
      id: newProjectId,
      title: newTitle,
      createdDate: now,
      lastModified: now,
      lastAccessed: now,
      status: 'draft'
    };

    this.saveProject(duplicatedProject);
    return duplicatedProject;
  }

  // Delete a project
  static deleteProject(projectId: string): void {
    try {
      // Remove project data
      localStorage.removeItem(`${PROJECT_PREFIX}${projectId}`);
      
      // Update projects list
      const projectsData = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (projectsData) {
        const projectIds: string[] = JSON.parse(projectsData);
        const updatedIds = projectIds.filter(id => id !== projectId);
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedIds));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  }

  // Search projects
  static searchProjects(query: string): ProjectMetadata[] {
    const allProjects = this.getAllProjectMetadata();
    const lowerQuery = query.toLowerCase();
    
    return allProjects.filter(project => 
      project.title.toLowerCase().includes(lowerQuery) ||
      project.description?.toLowerCase().includes(lowerQuery) ||
      project.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Filter projects by status
  static filterProjectsByStatus(status: string): ProjectMetadata[] {
    const allProjects = this.getAllProjectMetadata();
    return allProjects.filter(project => project.status === status);
  }

  // Generate project metadata from full project
  private static generateProjectMetadata(project: Project): ProjectMetadata {
    const sceneCount = project.plotPoints.reduce((total, pp) => total + pp.scenes.length, 0);
    
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      tags: project.tags,
      status: project.status,
      createdDate: new Date(project.createdDate),
      lastModified: new Date(project.lastModified),
      lastAccessed: project.lastAccessed ? new Date(project.lastAccessed) : undefined,
      actCount: project.acts.length,
      plotPointCount: project.plotPoints.length,
      sceneCount,
      characterCount: project.characters.length
    };
  }

  // Migrate old single-project data to new multi-project system
  static migrateOldProject(): void {
    const oldProjectKey = 'campfire-project';
    const oldProjectData = localStorage.getItem(oldProjectKey);
    
    if (oldProjectData) {
      try {
        const oldProject = JSON.parse(oldProjectData);
        
        // Convert old project to new format
        const migratedProject: Project = {
          id: 'migrated-project-' + Date.now(),
          title: oldProject.title || 'Migrated Project',
          description: '',
          tags: [],
          status: 'in-progress',
          createdDate: new Date(oldProject.lastModified || Date.now()),
          lastModified: new Date(oldProject.lastModified || Date.now()),
          acts: oldProject.acts || [
            { id: 'act-1', name: 'Act 1', description: 'Beginning of the story', order: 1 }
          ],
          currentActId: oldProject.currentActId || 'act-1',
          characters: oldProject.characters || [],
          plotPoints: oldProject.plotPoints || [],
          currentZoomLevel: oldProject.currentZoomLevel || ZoomLevel.STORY_OVERVIEW,
          focusedElementId: oldProject.focusedElementId
        };

        this.saveProject(migratedProject);
        
        // Remove old project data
        localStorage.removeItem(oldProjectKey);
        
        console.log('Successfully migrated old project data');
      } catch (error) {
        console.error('Error migrating old project:', error);
      }
    }
  }
}
