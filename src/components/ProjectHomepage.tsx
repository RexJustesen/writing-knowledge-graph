'use client';

import React, { useState, useEffect } from 'react';
import { ProjectMetadata } from '@/types/story';
import { ProjectService } from '@/services/projectService';

interface ProjectHomepageProps {
  onProjectSelect: (projectId: string) => void;
}

const ProjectHomepage: React.FC<ProjectHomepageProps> = ({ onProjectSelect }) => {
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleProjectSelect = (projectId: string) => {
    onProjectSelect(projectId);
  };

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Filter projects when search or filter changes
  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, statusFilter]);

  const loadProjects = () => {
    setIsLoading(true);
    try {
      // Migrate old project data if it exists
      ProjectService.migrateOldProject();
      
      const allProjects = ProjectService.getAllProjectMetadata();
      setProjects(allProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = ProjectService.searchProjects(searchQuery);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const handleCreateProject = (title: string, template?: 'novel' | 'screenplay' | 'short-story' | 'from-scratch') => {
    const newProject = ProjectService.createProject(title, template);
    setShowNewProjectDialog(false);
    loadProjects(); // Refresh the project list to show the new project
    // Stay on homepage instead of navigating to the new project
    // onProjectSelect(newProject.id); // Removed this line
  };

  const handleDuplicateProject = (projectId: string, originalTitle: string) => {
    const newTitle = prompt('Enter a name for the duplicated project:', `Copy of ${originalTitle}`);
    if (newTitle && newTitle.trim()) {
      const duplicatedProject = ProjectService.duplicateProject(projectId, newTitle.trim());
      if (duplicatedProject) {
        loadProjects();
      }
    }
  };

  const handleDeleteProject = (projectId: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      ProjectService.deleteProject(projectId);
      loadProjects();
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Writing Projects</h1>
            <p className="text-gray-600 mt-2">Manage and organize your stories</p>
          </div>
          <button
            onClick={() => {
              setShowNewProjectDialog(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="all">All Projects</option>
              <option value="draft">Draft</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-gray-900">{projects.length}</div>
            <div className="text-gray-600 text-sm">Total Projects</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-blue-600">
              {projects.filter(p => p.status === 'in-progress').length}
            </div>
            <div className="text-gray-600 text-sm">In Progress</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-green-600">
              {projects.filter(p => p.status === 'completed').length}
            </div>
            <div className="text-gray-600 text-sm">Completed</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-gray-600">
              {projects.reduce((sum, p) => sum + p.plotPointCount, 0)}
            </div>
            <div className="text-gray-600 text-sm">Total Plot Points</div>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading projects...</div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            {projects.length === 0 ? (
              <>
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-600 mb-6">Create your first writing project to get started</p>
                <button
                  onClick={() => setShowNewProjectDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Your First Project
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onSelect={() => handleProjectSelect(project.id)}
                onDuplicate={() => handleDuplicateProject(project.id, project.title)}
                onDelete={() => handleDeleteProject(project.id, project.title)}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Project Dialog */}
      {showNewProjectDialog && (
        <NewProjectDialog
          onCreate={handleCreateProject}
          onCancel={() => setShowNewProjectDialog(false)}
        />
      )}
    </div>
  );
};

// Project Card Component
interface ProjectCardProps {
  project: ProjectMetadata;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  formatDate: (date: Date) => string;
  getStatusColor: (status?: string) => string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onSelect,
  onDuplicate,
  onDelete,
  formatDate,
  getStatusColor
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header with title and menu */}
        <div className="flex items-start justify-between mb-3">
          <h3 
            className="font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
            onClick={onSelect}
            title={project.title}
          >
            {project.title}
          </h3>
          <div className="relative" style={{ zIndex: 2 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-32">
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onDuplicate(); 
                    setShowMenu(false); 
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50"
                >
                  Duplicate
                </button>
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onDelete(); 
                    setShowMenu(false); 
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className="mb-3">
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
            {project.status?.replace('-', ' ') || 'draft'}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="text-gray-500">
            <span className="font-medium text-gray-900">{project.actCount}</span> acts
          </div>
          <div className="text-gray-500">
            <span className="font-medium text-gray-900">{project.plotPointCount}</span> plot points
          </div>
          <div className="text-gray-500">
            <span className="font-medium text-gray-900">{project.sceneCount}</span> scenes
          </div>
          <div className="text-gray-500">
            <span className="font-medium text-gray-900">{project.characterCount}</span> characters
          </div>
        </div>

        {/* Last modified */}
        <div className="text-xs text-gray-500 border-t pt-3">
          Last modified: {formatDate(project.lastModified)}
        </div>
      </div>

      {/* Click overlay for opening project */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={onSelect}
        style={{ zIndex: 1 }}
      />
    </div>
  );
};

// New Project Dialog Component
interface NewProjectDialogProps {
  onCreate: (title: string, template?: 'novel' | 'screenplay' | 'short-story' | 'from-scratch') => void;
  onCancel: () => void;
}

const NewProjectDialog: React.FC<NewProjectDialogProps> = ({ onCreate, onCancel }) => {
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState<'novel' | 'screenplay' | 'short-story' | 'from-scratch' | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreate(title.trim(), template || undefined);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Create New Project</h2>
          </div>
          
          <div className="px-6 py-4 space-y-4">
            <div>
              <label htmlFor="project-title" className="block text-sm font-medium text-gray-900 mb-2">
                Project Title *
              </label>
              <input
                id="project-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Enter your project title"
                autoFocus
                required
              />
            </div>

            <div>
              <label htmlFor="project-template" className="block text-sm font-medium text-gray-900 mb-2">
                Template (Optional)
              </label>
              <select
                id="project-template"
                value={template}
                onChange={(e) => setTemplate(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="">Custom (3 acts)</option>
                <option value="from-scratch">From Scratch (1 act)</option>
                <option value="novel">Novel (3 acts)</option>
                <option value="screenplay">Screenplay (4 acts)</option>
                <option value="short-story">Short Story (3 acts)</option>
              </select>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectHomepage;
