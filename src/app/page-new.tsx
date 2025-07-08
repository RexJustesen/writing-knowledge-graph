'use client';

import React, { useState, useEffect } from 'react';
import ProjectHomepage from '../components/ProjectHomepage';
import ProjectWorkspace from '../components/ProjectWorkspace';

// Main app router component
export default function WritingPlannerApp() {
  const [currentView, setCurrentView] = useState<'homepage' | 'project'>('homepage');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Handle navigation to a specific project
  const handleProjectSelect = (projectId: string) => {
    setCurrentProjectId(projectId);
    setCurrentView('project');
  };

  // Handle navigation back to homepage
  const handleBackToHomepage = () => {
    setCurrentView('homepage');
    setCurrentProjectId(null);
  };

  // Handle browser back button and URL navigation (basic implementation)
  useEffect(() => {
    const handlePopState = () => {
      // Simple implementation - could be enhanced with proper routing
      if (currentView === 'project') {
        handleBackToHomepage();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView]);

  // Render the appropriate view
  if (currentView === 'homepage') {
    return <ProjectHomepage onProjectSelect={handleProjectSelect} />;
  }

  if (currentView === 'project' && currentProjectId) {
    return (
      <ProjectWorkspace 
        projectId={currentProjectId}
        onBackToHomepage={handleBackToHomepage}
      />
    );
  }

  // Fallback to homepage
  return <ProjectHomepage onProjectSelect={handleProjectSelect} />;
}
