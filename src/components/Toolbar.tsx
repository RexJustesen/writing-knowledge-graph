'use client';

import React from 'react';
import { ZoomLevel, Project } from '@/types/story';
import CharacterManager from './CharacterManager';

interface ToolbarProps {
  project: Project;
  onProjectUpdate: (project: Project) => void;
  onZoomChange: (zoomLevel: ZoomLevel) => void;
  onZoomToFit?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ project, onProjectUpdate, onZoomChange, onZoomToFit }) => {
  
  const handleSave = () => {
    // Trigger immediate save by updating the project with current timestamp
    const updatedProject = {
      ...project,
      lastModified: new Date()
    };
    onProjectUpdate(updatedProject);
    console.log('Manual project save triggered');
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

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left section - Zoom controls (PRD Section 4.5) */}
        <div className="flex items-center space-x-3">
          {/* Zoom to Fit button */}
          <button
            onClick={onZoomToFit}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            title="Zoom to fit all plot points or selected plot point"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 10l4 4m0-4l-4 4" />
            </svg>
            Zoom to Fit
          </button>

          {/* Search functionality (PRD Section 4.4) */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search story elements..."
              className="pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            title="Save project manually"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Save
          </button>
        </div>
      </div>

      {/* Quick stats - Current Act and Total */}
      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-6">
          <span className="font-medium text-gray-900">{currentActName}:</span>
          <span>{currentActPlotPoints.length} plot points</span>
          <span>{currentActScenes} scenes</span>
          <span>{currentActCharacters} characters</span>
        </div>
        <div className="flex items-center space-x-6">
          <span className="font-medium text-gray-900">Total Story:</span>
          <span>{totalPlotPoints} plot points</span>
          <span>{totalScenes} scenes</span>
          <span>{totalCharacters} characters</span>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
