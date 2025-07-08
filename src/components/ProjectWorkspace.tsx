'use client';

import React, { useState, useEffect } from 'react';
import Canvas, { CanvasHandle } from './Canvas';
import Toolbar from './Toolbar';
import ActNavigation from './ActNavigation';
import { Project, ZoomLevel } from '../types/story';
import { ProjectService } from '@/services/projectService';

interface ProjectWorkspaceProps {
  projectId: string;
  onBackToHomepage: () => void;
}

const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ projectId, onBackToHomepage }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = React.useRef<CanvasHandle>(null);

  // Load project on mount or when projectId changes
  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let loadedProject = ProjectService.getProject(projectId);
      
      // If project not found, try to migrate old single-project data
      if (!loadedProject) {
        const oldProjectData = localStorage.getItem('campfire-project');
        if (oldProjectData && projectId === 'legacy-project') {
          try {
            const oldProject = JSON.parse(oldProjectData);
            const migratedProject = migrateOldProjectData(oldProject);
            ProjectService.saveProject(migratedProject);
            loadedProject = migratedProject;
            
            // Remove old data
            localStorage.removeItem('campfire-project');
          } catch (migrationError) {
            console.error('Error migrating old project:', migrationError);
          }
        }
      }
      
      if (loadedProject) {
        setProject(loadedProject);
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
        { id: 'act-1', name: 'Act 1: Setup', description: 'Introduce characters and establish the world', order: 1 },
        { id: 'act-2', name: 'Act 2: Confrontation', description: 'Rising action and complications', order: 2 },
        { id: 'act-3', name: 'Act 3: Resolution', description: 'Climax and resolution', order: 3 }
      ];
    }

    // Migrate plot points to ensure they have actId
    const migratedPlotPoints = (oldProject.plotPoints || []).map((pp: any) => {
      let actId = pp.actId || 'act-1'; // Default to act 1
      
      // Try to map old act numbers to new act IDs if no actId exists
      if (!pp.actId && pp.act) {
        if (pp.act === 1 || pp.act === '1') actId = 'act-1';
        else if (pp.act === 2 || pp.act === '2') actId = 'act-2';
        else if (pp.act === 3 || pp.act === '3') actId = 'act-3';
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

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
    ProjectService.saveProject(updatedProject);
  };

  const handleZoomChange = (zoomLevel: ZoomLevel) => {
    if (!project) return;
    
    const updatedProject = {
      ...project,
      currentZoomLevel: zoomLevel
    };
    handleProjectUpdate(updatedProject);
  };

  const handleActChange = (actId: string) => {
    // Act change is handled in handleProjectUpdate when ActNavigation updates the project
  };

  const handleZoomToFit = () => {
    if (canvasRef.current) {
      canvasRef.current.handleZoomToFit();
    }
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

  // Check if we have any plot points in the current act
  const currentActPlotPoints = project.plotPoints.filter(pp => pp.actId === project.currentActId);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
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
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{project.title}</h1>
          {project.description && (
            <p className="text-sm text-gray-600 truncate">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{project.acts.length} acts</span>
          <span>{project.plotPoints.length} plot points</span>
          <span>{project.characters.length} characters</span>
        </div>
      </div>

      {/* Act Navigation Bar */}
      <ActNavigation 
        project={project}
        onProjectUpdate={handleProjectUpdate}
        onActChange={handleActChange}
      />

      {/* App Header with Toolbar */}
      <Toolbar 
        project={project}
        onProjectUpdate={handleProjectUpdate}
        onZoomChange={handleZoomChange}
        onZoomToFit={handleZoomToFit}
      />
      
      {/* Main Canvas Area */}
      <div className="flex-1 overflow-hidden">
        <Canvas 
          project={project}
          onProjectUpdate={handleProjectUpdate}
          ref={canvasRef}
          onZoomToFit={handleZoomToFit}
        />
      </div>
    </div>
  );
};

export default ProjectWorkspace;
