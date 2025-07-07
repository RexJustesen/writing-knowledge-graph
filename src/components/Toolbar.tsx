'use client';

import React from 'react';
import { ZoomLevel, Project } from '@/types/story';
import CharacterManager from './CharacterManager';

interface ToolbarProps {
  project: Project;
  onProjectUpdate: (project: Project) => void;
  onZoomChange: (zoomLevel: ZoomLevel) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ project, onProjectUpdate, onZoomChange }) => {
  
  const handleZoomToOverview = () => {
    const updatedProject = {
      ...project,
      currentZoomLevel: ZoomLevel.STORY_OVERVIEW,
      focusedElementId: undefined
    };
    onProjectUpdate(updatedProject);
    onZoomChange(ZoomLevel.STORY_OVERVIEW);
  };

  const handleSave = () => {
    // Save to localStorage for MVP (PRD Phase 1)
    localStorage.setItem('campfire-project', JSON.stringify({
      ...project,
      lastModified: new Date()
    }));
    
    // TODO: Implement cloud sync in Phase 3
    console.log('Project saved locally');
  };

  const handleLoad = () => {
    // Load from localStorage for MVP
    const savedProject = localStorage.getItem('campfire-project');
    if (savedProject) {
      const loadedProject = JSON.parse(savedProject);
      onProjectUpdate(loadedProject);
    }
  };

  // Get current act statistics
  const currentActPlotPoints = project.plotPoints.filter(pp => pp.actId === project.currentActId);
  const currentActScenes = currentActPlotPoints.reduce((total, pp) => total + pp.scenes.length, 0);
  const currentActCharacters = currentActPlotPoints.reduce((total, pp) => 
    total + pp.scenes.reduce((sceneTotal, scene) => sceneTotal + (scene.characterIds?.length || 0), 0), 0
  );

  const totalPlotPoints = project.plotPoints.length;
  const totalScenes = project.plotPoints.reduce((total, pp) => total + pp.scenes.length, 0);
  const totalCharacters = project.plotPoints.reduce((total, pp) => 
    total + pp.scenes.reduce((sceneTotal, scene) => sceneTotal + (scene.characterIds?.length || 0), 0), 0
  );

  const currentActName = project.acts.find(act => act.id === project.currentActId)?.name || 'Current Act';

  const handleExport = () => {
    // TODO: Implement export functionality in Phase 3
    console.log('Export functionality to be implemented');
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left section - Zoom controls (PRD Section 4.5) */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={handleZoomToOverview}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                project.currentZoomLevel === ZoomLevel.STORY_OVERVIEW
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
              title="Story Overview - See all plot points"
            >
              Overview
            </button>
            <button
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                project.currentZoomLevel === ZoomLevel.PLOT_POINT_FOCUS
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
              title="Plot Point Focus - View scenes for selected plot point"
              disabled={!project.focusedElementId}
            >
              Plot Focus
            </button>
            <button
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                project.currentZoomLevel === ZoomLevel.SCENE_DETAIL
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
              title="Scene Detail - View detailed scene information"
              disabled={!project.focusedElementId}
            >
              Scene Detail
            </button>
          </div>

          {/* Search functionality (PRD Section 4.4) */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search story elements..."
              className="pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-2 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Center section - Project title */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-gray-900">
            {project.title}
          </h1>
          <p className="text-xs text-gray-500">
            Last modified: {new Date(project.lastModified).toLocaleDateString()}
          </p>
        </div>

        {/* Right section - Character management and File operations */}
        <div className="flex items-center space-x-2">
          <CharacterManager 
            project={project}
            onProjectUpdate={onProjectUpdate}
          />
          
          <button
            onClick={handleSave}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            title="Save project locally"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Save
          </button>
          
          <button
            onClick={handleLoad}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            title="Load saved project"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Load
          </button>

          <button
            onClick={handleExport}
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            title="Export project (coming in Phase 3)"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Quick stats - Current Act and Total */}
      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-6">
          <span className="font-medium text-gray-700">{currentActName}:</span>
          <span>{currentActPlotPoints.length} plot points</span>
          <span>{currentActScenes} scenes</span>
          <span>{currentActCharacters} characters</span>
        </div>
        <div className="flex items-center space-x-6">
          <span className="font-medium text-gray-700">Total Story:</span>
          <span>{totalPlotPoints} plot points</span>
          <span>{totalScenes} scenes</span>
          <span>{totalCharacters} characters</span>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
