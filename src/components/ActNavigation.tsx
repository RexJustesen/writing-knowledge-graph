'use client';

import React, { useState } from 'react';
import { Act, Project } from '@/types/story';
import { useProjectStore } from '@/stores/projectStore';

interface ActNavigationProps {
  project: Project;
  onProjectUpdate: (project: Project) => void;
  onActChange: (actId: string) => void;
}

interface NewActDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAct: (name: string, description?: string) => void;
  existingActNames: string[];
}

interface EditActDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateAct: (actId: string, name: string, description?: string) => void;
  act: Act | null;
  existingActNames: string[];
}

const NewActDialog: React.FC<NewActDialogProps> = ({ 
  isOpen, 
  onClose, 
  onCreateAct, 
  existingActNames 
}) => {
  const [actName, setActName] = useState('');
  const [actDescription, setActDescription] = useState('');
  const [nameError, setNameError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = actName.trim();
    if (!trimmedName) {
      setNameError('Act name is required');
      return;
    }
    
    if (existingActNames.includes(trimmedName)) {
      setNameError('An act with this name already exists');
      return;
    }
    
    onCreateAct(trimmedName, actDescription.trim() || undefined);
    setActName('');
    setActDescription('');
    setNameError('');
    onClose();
  };

  const handleClose = () => {
    setActName('');
    setActDescription('');
    setNameError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Act</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="actName" className="block text-sm font-medium text-gray-900 mb-2">
              Act Name *
            </label>
            <input
              type="text"
              id="actName"
              value={actName}
              onChange={(e) => {
                setActName(e.target.value);
                setNameError('');
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                nameError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Setup, Rising Action, Climax"
              autoFocus
            />
            {nameError && (
              <p className="mt-1 text-sm text-red-600">{nameError}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="actDescription" className="block text-sm font-medium text-gray-900 mb-2">
              Description (optional)
            </label>
            <textarea
              id="actDescription"
              value={actDescription}
              onChange={(e) => setActDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Brief description of this act's purpose"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Act
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditActDialog: React.FC<EditActDialogProps> = ({ 
  isOpen, 
  onClose, 
  onUpdateAct, 
  act,
  existingActNames 
}) => {
  const [actName, setActName] = useState('');
  const [actDescription, setActDescription] = useState('');
  const [nameError, setNameError] = useState('');

  // Initialize form when act changes
  React.useEffect(() => {
    if (act) {
      setActName(act.name);
      setActDescription(act.description || '');
      setNameError('');
    }
  }, [act]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!act) return;
    
    const trimmedName = actName.trim();
    if (!trimmedName) {
      setNameError('Act name is required');
      return;
    }
    
    // Check if name exists (excluding current act)
    const otherActNames = existingActNames.filter(name => name !== act.name);
    if (otherActNames.includes(trimmedName)) {
      setNameError('An act with this name already exists');
      return;
    }
    
    onUpdateAct(act.id, trimmedName, actDescription.trim() || undefined);
    setNameError('');
    onClose();
  };

  const handleClose = () => {
    setNameError('');
    onClose();
  };

  if (!isOpen || !act) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Act</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="editActName" className="block text-sm font-medium text-gray-900 mb-2">
              Act Name *
            </label>
            <input
              type="text"
              id="editActName"
              value={actName}
              onChange={(e) => {
                setActName(e.target.value);
                setNameError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="e.g., Act I, Setup, Inciting Incident"
              autoFocus
            />
            {nameError && (
              <p className="mt-1 text-sm text-red-600">{nameError}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="editActDescription" className="block text-sm font-medium text-gray-900 mb-2">
              Description (optional)
            </label>
            <textarea
              id="editActDescription"
              value={actDescription}
              onChange={(e) => setActDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Brief description of this act's purpose"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Act
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ActContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  act: Act;
  onClose: () => void;
  onEdit: (act: Act) => void;
  onRename: (act: Act) => void;
  onDuplicate: (act: Act) => void;
  onDelete: (act: Act) => void;
  canDelete: boolean;
}

const ActContextMenu: React.FC<ActContextMenuProps> = ({
  isOpen,
  position,
  act,
  onClose,
  onEdit,
  onRename,
  onDuplicate,
  onDelete,
  canDelete
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Invisible overlay to catch clicks outside */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Context menu */}
      <div
        className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[160px]"
        style={{
          left: position.x,
          top: position.y
        }}
      >
        <button
          onClick={() => {
            onEdit(act);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        
        <button
          onClick={() => {
            onRename(act);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Rename
        </button>
        
        <button
          onClick={() => {
            onDuplicate(act);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Duplicate
        </button>
        
        {canDelete && (
          <>
            <hr className="my-1" />
            <button
              onClick={() => {
                onDelete(act);
                onClose();
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </>
        )}
      </div>
    </>
  );
};

const ActNavigation: React.FC<ActNavigationProps> = ({ 
  project, 
  onProjectUpdate, 
  onActChange 
}) => {
  // Subscribe to current act ID from Zustand store
  const currentActId = useProjectStore(state => state.project?.currentActId || '');
  const createAct = useProjectStore(state => state.createAct);
  const updateCurrentAct = useProjectStore(state => state.updateCurrentAct);
  
  const [showNewActDialog, setShowNewActDialog] = useState(false);
  const [showEditActDialog, setShowEditActDialog] = useState(false);
  const [editingAct, setEditingAct] = useState<Act | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    act: Act | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    act: null
  });
  const [renameActId, setRenameActId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Sort acts by order
  const sortedActs = [...project.acts].sort((a, b) => a.order - b.order);

  const handleCreateAct = async (name: string, description?: string) => {
    try {
      console.log('🎭 ActNavigation: Creating new act via store:', { name, description });
      
      // Create act via store to persist to database
      const newAct = await createAct({
        title: name,
        description: description || '',
        order: Math.max(...project.acts.map(a => a.order), 0) + 1
      });
      
      console.log('🎭 ActNavigation: Act created successfully:', { actId: newAct.id, name: newAct.name });
      
      // Switch to the new act
      updateCurrentAct(newAct.id);
      
      // Call the parent callback if needed
      onActChange(newAct.id);
    } catch (error) {
      console.error('🎭 ActNavigation: Failed to create act:', error);
      // TODO: Show error message to user
    }
  };

  const handleActClick = (actId: string) => {
    console.log('🎭 ActNavigation: handleActClick called:', { 
      actId, 
      currentActId, 
      projectCurrentActId: project.currentActId 
    });
    
    if (actId !== currentActId) {
      const updatedProject: Project = {
        ...project,
        currentActId: actId,
        lastModified: new Date()
      };
      
      onProjectUpdate(updatedProject);
      onActChange(actId);
    }
  };

  const handleRightClick = (e: React.MouseEvent, act: Act) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      act
    });
  };

  const closeContextMenu = () => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      act: null
    });
  };

  const handleRename = (act: Act) => {
    setRenameActId(act.id);
    setRenameValue(act.name);
  };

  const handleRenameSubmit = (actId: string, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    const existingNames = project.acts
      .filter(a => a.id !== actId)
      .map(a => a.name);
      
    if (existingNames.includes(trimmedName)) {
      alert('An act with this name already exists');
      return;
    }

    const updatedProject: Project = {
      ...project,
      acts: project.acts.map(act =>
        act.id === actId ? { ...act, name: trimmedName } : act
      ),
      lastModified: new Date()
    };

    onProjectUpdate(updatedProject);
    setRenameActId(null);
  };

  const handleEdit = (act: Act) => {
    setEditingAct(act);
    setShowEditActDialog(true);
  };

  const handleUpdateAct = (actId: string, name: string, description?: string) => {
    const updatedProject: Project = {
      ...project,
      acts: project.acts.map(act =>
        act.id === actId ? { ...act, name, description } : act
      ),
      lastModified: new Date()
    };

    onProjectUpdate(updatedProject);
    setShowEditActDialog(false);
    setEditingAct(null);
  };

  const handleDuplicate = (act: Act) => {
    const baseName = act.name;
    let counter = 1;
    let newName = `${baseName} Copy`;
    
    const existingNames = project.acts.map(a => a.name);
    while (existingNames.includes(newName)) {
      counter++;
      newName = `${baseName} Copy ${counter}`;
    }

    const newActId = `act-${Date.now()}`;
    const duplicatedAct: Act = {
      id: newActId,
      name: newName,
      description: act.description,
      order: Math.max(...project.acts.map(a => a.order), 0) + 1
    };

    // Also duplicate plot points from the original act
    const originalPlotPoints = project.plotPoints.filter(pp => pp.actId === act.id);
    const duplicatedPlotPoints = originalPlotPoints.map(pp => ({
      ...pp,
      id: `plot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      actId: newActId,
      scenes: pp.scenes.map(scene => ({
        ...scene,
        id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
    }));

    const updatedProject: Project = {
      ...project,
      acts: [...project.acts, duplicatedAct],
      plotPoints: [...project.plotPoints, ...duplicatedPlotPoints],
      currentActId: newActId, // Switch to the duplicated act
      lastModified: new Date()
    };

    onProjectUpdate(updatedProject);
    onActChange(newActId);
  };

  const handleDelete = (act: Act) => {
    if (project.acts.length <= 1) {
      alert('Cannot delete the last remaining act');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${act.name}"? This will also delete all plot points and scenes in this act. This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    // Remove the act and all its plot points
    const updatedProject: Project = {
      ...project,
      acts: project.acts.filter(a => a.id !== act.id),
      plotPoints: project.plotPoints.filter(pp => pp.actId !== act.id),
      currentActId: act.id === currentActId 
        ? project.acts.find(a => a.id !== act.id)?.id || project.acts[0]?.id || ''
        : currentActId,
      lastModified: new Date()
    };

    onProjectUpdate(updatedProject);
    
    // Switch to the new current act if we deleted the active one
    if (act.id === currentActId) {
      onActChange(updatedProject.currentActId);
    }
  };

  const getActPlotPointCount = (actId: string) => {
    return project.plotPoints.filter(pp => pp.actId === actId).length;
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-4 py-2 shadow-sm">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {/* Act tabs */}
          {sortedActs.map((act) => (
            <div key={act.id} className="flex-shrink-0">
              {renameActId === act.id ? (
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleRenameSubmit(act.id, renameValue)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRenameSubmit(act.id, renameValue);
                    } else if (e.key === 'Escape') {
                      setRenameActId(null);
                    }
                  }}
                  className="px-3 py-2 text-sm font-medium border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => handleActClick(act.id)}
                  onContextMenu={(e) => handleRightClick(e, act)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                    currentActId === act.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={act.description || act.name}
                >
                  <span>{act.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    currentActId === act.id
                      ? 'bg-blue-500 text-blue-100'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {getActPlotPointCount(act.id)}
                  </span>
                </button>
              )}
            </div>
          ))}

          {/* Add new act button */}
          <button
            onClick={() => setShowNewActDialog(true)}
            className="flex-shrink-0 px-3 py-2 text-sm font-medium text-gray-600 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center"
            title="Create new act"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Act
          </button>
        </div>

        {/* Current act info */}
        {project.acts.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            <span className="font-medium">
              {sortedActs.find(act => act.id === currentActId)?.name || 'Unknown Act'}
            </span>
            {sortedActs.find(act => act.id === currentActId)?.description && (
              <span className="ml-2">
                • {sortedActs.find(act => act.id === currentActId)?.description}
              </span>
            )}
            <span className="ml-2">
              • {getActPlotPointCount(currentActId)} plot point{getActPlotPointCount(currentActId) !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* New act dialog */}
      <NewActDialog
        isOpen={showNewActDialog}
        onClose={() => setShowNewActDialog(false)}
        onCreateAct={handleCreateAct}
        existingActNames={project.acts.map(act => act.name)}
      />

      {/* Edit act dialog */}
      <EditActDialog
        isOpen={showEditActDialog}
        onClose={() => {
          setShowEditActDialog(false);
          setEditingAct(null);
        }}
        onUpdateAct={handleUpdateAct}
        act={editingAct}
        existingActNames={project.acts.map(act => act.name)}
      />

      {/* Context menu */}
      <ActContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        act={contextMenu.act!}
        onClose={closeContextMenu}
        onEdit={handleEdit}
        onRename={handleRename}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        canDelete={project.acts.length > 1}
      />
    </>
  );
};

export default ActNavigation;
