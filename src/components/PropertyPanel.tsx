'use client';

import React, { useState, useEffect } from 'react';
import { PlotPoint, Scene, Character, Setting, Item, Project, PlotPointCategory, EventType } from '@/types/story';
import { ProjectApiService } from '@/services/projectApiService';
import { TemplateService } from '@/services/templateService';

interface PropertyPanelProps {
  selectedNode: any | null;
  project: Project;
  tempNode?: PlotPoint | null; // For temporary nodes that haven't been saved yet
  onProjectUpdate: (project: Project, immediate?: boolean) => void;
  onClose: () => void;
  onRealTimeUpdate?: (nodeId: string, updates: any) => void; // For real-time updates like color changes
  onTempNodeUpdate?: (tempNode: PlotPoint) => void; // For updating temporary node data
  onSceneAdded?: (plotPointId: string) => void; // For auto-expanding plot points when scenes are added
  onNodeDelete?: (nodeId: string, nodeType: string) => void; // For deleting nodes from the canvas
  onSaveUndoState?: () => void; // For saving state before deletions
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ 
  selectedNode, 
  project, 
  tempNode,
  onProjectUpdate, 
  onClose,
  onRealTimeUpdate,
  onTempNodeUpdate,
  onSceneAdded,
  onNodeDelete,
  onSaveUndoState
}) => {
  const [formData, setFormData] = useState<any>({});
  const [currentScenes, setCurrentScenes] = useState<Scene[]>([]); // Local state for scenes
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCharacterInfo, setShowCharacterInfo] = useState<{ isOpen: boolean; character: Character | null }>({
    isOpen: false,
    character: null
  });

  // Initialize form data when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      // Handle Cytoscape Collection - extract first element if it's a collection
      let actualNode = selectedNode;
      if (selectedNode.length !== undefined && selectedNode.length > 0) {
        actualNode = selectedNode[0];
      }

      // Get the node ID to fetch current data from project
      let nodeId;
      if (typeof actualNode.id === 'function') {
        nodeId = actualNode.id();
      } else if (actualNode?.data?.id) {
        nodeId = actualNode.data.id;
      } else if (actualNode?.data?.data?.id) {
        nodeId = actualNode.data.data.id;
      }

      // For temporary nodes, use tempNode data
      if (nodeId && nodeId.startsWith('temp-') && tempNode) {
        setFormData({ ...tempNode });
        setCurrentScenes(tempNode.scenes || []);
      } else if (nodeId) {
        // For permanent nodes, get fresh data from project to reflect any deletions
        const currentPlotPoint = project.plotPoints.find(pp => pp.id === nodeId);
        if (currentPlotPoint) {
          console.log('🔍 PropertyPanel: Loading plot point data:', {
            nodeId,
            plotPointTitle: currentPlotPoint.title,
            eventType: currentPlotPoint.eventType,
            hasEventType: 'eventType' in currentPlotPoint,
            plotPointKeys: Object.keys(currentPlotPoint),
            fullPlotPoint: currentPlotPoint
          });
          setFormData({ ...currentPlotPoint });
          setCurrentScenes(currentPlotPoint.scenes || []);
        } else {
          // Fallback to node data if not found in project (for scenes, characters, etc.)
          if (typeof actualNode.data === 'function') {
            const nodeData = actualNode.data();
            if (nodeData.data) {
              setFormData({ ...nodeData.data });
            } else {
              setFormData({ ...nodeData });
            }
          } else if (actualNode?.data?.data) {
            setFormData({ ...actualNode.data.data });
          } else if (actualNode?.data) {
            setFormData({ ...actualNode.data });
          }
          setCurrentScenes([]); // Reset scenes for non-plot-point nodes
        }
      }
    }
  }, [selectedNode, tempNode, project]); // Add project as dependency to refresh when it changes

  if (!selectedNode) return null;

  // Handle Cytoscape Collection - extract first element if it's a collection
  let actualNode = selectedNode;
  if (selectedNode.length !== undefined && selectedNode.length > 0) {
    // This is a Collection, get the first element
    actualNode = selectedNode[0];
  }

  // Handle Cytoscape element data access
  let nodeType, nodeData;
  if (typeof actualNode.data === 'function') {
    const data = actualNode.data();
    nodeType = data.type;
    nodeData = data.data || data;
  } else {
    nodeType = actualNode.data?.type;
    nodeData = actualNode.data?.data || actualNode.data;
  }

  // Safety check - if we don't have a valid node type, don't render
  if (!nodeType) {
    // Don't spam console with errors, just return null silently
    return null;
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
    
    // For color changes, update in real-time if callback is provided
    if (field === 'color' && onRealTimeUpdate && selectedNode) {
      // Get node ID using proper Cytoscape element method
      let actualNode = selectedNode;
      if (selectedNode.length !== undefined && selectedNode.length > 0) {
        actualNode = selectedNode[0];
      }
      
      const nodeId = typeof actualNode.id === 'function' ? actualNode.id() : 
                     actualNode?.data?.id || actualNode?.data?.data?.id;
      
      if (nodeId) {
        onRealTimeUpdate(nodeId, { [field]: value });
      }
    }
  };

  const handleSceneUpdate = (sceneId: string, updates: Partial<Scene>) => {
    // Get node ID using proper Cytoscape element method
    const nodeId = typeof actualNode.id === 'function' ? actualNode.id() : 
                   actualNode?.data?.id || nodeData?.id;
    
    // Update local scenes state
    const updatedScenes = currentScenes.map(scene => 
      scene.id === sceneId ? { ...scene, ...updates } : scene
    );
    setCurrentScenes(updatedScenes);
    
    // Check if this is a temporary node
    if (nodeId && nodeId.startsWith('temp-') && tempNode && onTempNodeUpdate) {
      // Update the temporary node
      const updatedTempNode = {
        ...tempNode,
        scenes: updatedScenes
      };
      onTempNodeUpdate(updatedTempNode);
    } else {
      // Handle existing plot points
      const updatedProject = { ...project };
      updatedProject.plotPoints.forEach(plotPoint => {
        plotPoint.scenes = plotPoint.scenes.map(scene =>
          scene.id === sceneId ? { ...scene, ...updates } : scene
        );
      });
      updatedProject.lastModified = new Date();
      onProjectUpdate(updatedProject);
    }
  };

  const handleAddScene = () => {
    if (nodeType !== 'plot-point') return;
    
    // Get node ID using proper Cytoscape element method
    const nodeId = typeof actualNode.id === 'function' ? actualNode.id() : 
                   actualNode?.data?.id || nodeData?.id;
    
    // Calculate proper initial position for the new scene
    const plotPoint = project.plotPoints.find(pp => pp.id === nodeId) || 
                     (tempNode && nodeId === tempNode.id ? tempNode : null);
    
    let scenePosition = { x: 0, y: 0 };
    if (plotPoint && plotPoint.position) {
      const existingSceneCount = currentScenes.length;
      const radius = 120;
      const angle = (existingSceneCount * 2 * Math.PI) / Math.max(existingSceneCount + 1, 1);
      scenePosition = {
        x: plotPoint.position.x + radius * Math.cos(angle),
        y: plotPoint.position.y + radius * Math.sin(angle)
      };
    }
    
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: 'New Scene',
      synopsis: '',
      characterIds: [],
      setting: {
        id: `setting-${Date.now()}`,
        name: 'New Location',
        description: ''
      },
      items: [],
      position: scenePosition // Use calculated position instead of origin
    };
    
    // Update local scenes state
    const updatedScenes = [...currentScenes, newScene];
    setCurrentScenes(updatedScenes);
    
    // Check if this is a temporary node
    if (nodeId && nodeId.startsWith('temp-') && tempNode && onTempNodeUpdate) {
      // Update the temporary node
      const updatedTempNode = {
        ...tempNode,
        scenes: updatedScenes
      };
      onTempNodeUpdate(updatedTempNode);
      // Auto-expand the temporary plot point to show the new scene
      if (onSceneAdded) {
        onSceneAdded(nodeId);
      }
    } else {
      // Handle existing plot points
      const updatedProject = { ...project };
      const plotPointIndex = updatedProject.plotPoints.findIndex(pp => pp.id === nodeId);
      
      if (plotPointIndex !== -1) {
        updatedProject.plotPoints[plotPointIndex].scenes = updatedScenes;
        updatedProject.lastModified = new Date();
        onProjectUpdate(updatedProject);
        // Auto-expand the plot point to show the new scene
        if (onSceneAdded && nodeId) {
          onSceneAdded(nodeId);
        }
      }
    }
  };

  const handleDeleteScene = (sceneId: string) => {
    // Get node ID using proper Cytoscape element method
    const nodeId = typeof actualNode.id === 'function' ? actualNode.id() : 
                   actualNode?.data?.id || nodeData?.id;
    
    // Update local scenes state
    const updatedScenes = currentScenes.filter(scene => scene.id !== sceneId);
    setCurrentScenes(updatedScenes);
    
    // Check if this is a temporary node
    if (nodeId && nodeId.startsWith('temp-') && tempNode && onTempNodeUpdate) {
      // Update the temporary node
      const updatedTempNode = {
        ...tempNode,
        scenes: updatedScenes
      };
      onTempNodeUpdate(updatedTempNode);
    } else {
      // Save state for undo BEFORE deleting the scene
      if (onSaveUndoState) {
        onSaveUndoState();
      }

      // Handle existing plot points
      const updatedProject = { ...project };
      updatedProject.plotPoints.forEach(plotPoint => {
        plotPoint.scenes = plotPoint.scenes.filter(scene => scene.id !== sceneId);
      });
      updatedProject.lastModified = new Date();
      onProjectUpdate(updatedProject);
      
      // Notify the canvas to remove the scene node visually
      if (onNodeDelete) {
        onNodeDelete(sceneId, 'scene');
      }
    }
  };

  const handleDeleteNode = () => {
    const nodeId = typeof actualNode.id === 'function' ? actualNode.id() : 
                   actualNode?.data?.id || nodeData?.id;
    
    if (!nodeId) return;

    if (nodeType === 'plot-point') {
      // Show confirmation modal for plot points
      setShowDeleteModal(true);
    } else {
      // Direct delete for other node types (scenes, characters, etc.)
      handleDirectDelete();
    }
  };

  const handleDirectDelete = () => {
    const nodeId = typeof actualNode.id === 'function' ? actualNode.id() : 
                   actualNode?.data?.id || nodeData?.id;
    
    if (!nodeId) return;

    // Save state for undo before deleting (for non-plot-point nodes)
    if (onSaveUndoState) {
      onSaveUndoState();
    }

    const updatedProject = { ...project };

    switch (nodeType) {
      case 'scene':
        // Remove scene from all plot points
        updatedProject.plotPoints.forEach(plotPoint => {
          plotPoint.scenes = plotPoint.scenes.filter(scene => scene.id !== nodeId);
        });
        break;
        
      case 'character':
        // Remove character from all scenes by characterId
        updatedProject.plotPoints.forEach(plotPoint => {
          plotPoint.scenes.forEach(scene => {
            scene.characterIds = scene.characterIds.filter(id => id !== nodeId);
          });
        });
        break;
        
      case 'setting':
        // Find and remove setting (replace with default)
        updatedProject.plotPoints.forEach(plotPoint => {
          plotPoint.scenes.forEach(scene => {
            if (scene.setting && scene.setting.id === nodeId) {
              scene.setting = {
                id: `setting-${Date.now()}`,
                name: 'New Location',
                description: ''
              };
            }
          });
        });
        break;
        
      case 'item':
        // Remove item from all scenes
        updatedProject.plotPoints.forEach(plotPoint => {
          plotPoint.scenes.forEach(scene => {
            scene.items = scene.items.filter(item => item.id !== nodeId);
          });
        });
        break;
    }

    updatedProject.lastModified = new Date();
    onProjectUpdate(updatedProject);
    
    // Notify the canvas to remove the node visually
    if (onNodeDelete) {
      onNodeDelete(nodeId, nodeType);
    }
    
    onClose();
  };

  const handleConfirmPlotPointDelete = async () => {
    const nodeId = typeof actualNode.id === 'function' ? actualNode.id() : 
                   actualNode?.data?.id || nodeData?.id;
    
    if (!nodeId) return;

    // Check if this is a temporary node
    if (nodeId.startsWith('temp-')) {
      // Just remove the temporary node
      if (onNodeDelete) {
        onNodeDelete(nodeId, nodeType);
      }
    } else {
      try {
        // Find the plot point to get its actId
        const plotPointToDelete = project.plotPoints.find(pp => pp.id === nodeId);
        if (plotPointToDelete) {
          // Call backend API to delete the plot point
          await ProjectApiService.deletePlotPoint(project.id, plotPointToDelete.actId, nodeId);
        }
        
        // Remove plot point and all its scenes from project
        const updatedProject = { ...project };
        updatedProject.plotPoints = updatedProject.plotPoints.filter(pp => pp.id !== nodeId);
        updatedProject.lastModified = new Date();
        onProjectUpdate(updatedProject);
        
        // Notify the canvas to remove the node and its children
        if (onNodeDelete) {
          onNodeDelete(nodeId, nodeType);
        }
      } catch (error) {
        console.error('Failed to delete plot point:', error);
        // TODO: Show error message to user
      }
    }
    
    setShowDeleteModal(false);
    onClose();
  };

  const handleSave = () => {
    console.log('💾 PropertyPanel handleSave called with formData:', {
      id: formData.id,
      title: formData.title,
      eventType: formData.eventType,
      hasEventType: 'eventType' in formData,
      fullFormData: formData
    });

    const updatedProject = { ...project };
    // Get node ID using proper Cytoscape element method
    const nodeId = typeof actualNode.id === 'function' ? actualNode.id() : 
                   actualNode?.data?.id || nodeData?.id;
    const isNewNode = nodeId && nodeId.startsWith('temp-');
    
    if (nodeType === 'plot-point') {
      if (isNewNode) {
        // This is a new plot point - add it to the project
        const position = typeof actualNode.position === 'function' ? 
                        actualNode.position() : { x: 0, y: 0 };
        const newPlotPoint: PlotPoint = {
          ...formData,
          id: `plot-${Date.now()}`, // Generate a proper ID
          position: position,
          scenes: currentScenes // Use local scenes state
        };
        updatedProject.plotPoints.push(newPlotPoint);
      } else {
        // Update existing plot point - use local scenes state (including deletions)
        const plotPointIndex = updatedProject.plotPoints.findIndex(pp => pp.id === nodeId);
        if (plotPointIndex !== -1) {
          const currentPlotPoint = updatedProject.plotPoints[plotPointIndex];
          
          console.log('💾 PropertyPanel: Before updating plot point:', {
            nodeId,
            formDataKeys: Object.keys(formData),
            formDataEventType: formData.eventType,
            currentPlotPointEventType: currentPlotPoint.eventType,
            formDataHasEventType: 'eventType' in formData
          });
          
          const updatedPlotPoint = { 
            ...currentPlotPoint, // Preserve existing data
            ...formData, // Apply form updates (title, color, act, etc.)
            scenes: currentScenes // Use local scenes state which includes deletions
          };
          
          console.log('💾 PropertyPanel: After creating updated plot point:', {
            nodeId,
            oldEventType: currentPlotPoint.eventType,
            newEventType: formData.eventType,
            updatedPlotPointEventType: updatedPlotPoint.eventType,
            updatedPlotPointKeys: Object.keys(updatedPlotPoint)
          });
          
          updatedProject.plotPoints[plotPointIndex] = updatedPlotPoint;
        }
      }
    } else {
      // Handle other node types (scenes, characters, etc.) - existing logic
      switch (nodeType) {
        case 'scene':
          updatedProject.plotPoints.forEach(plotPoint => {
            const sceneIndex = plotPoint.scenes.findIndex(scene => scene.id === nodeId);
            if (sceneIndex !== -1) {
              plotPoint.scenes[sceneIndex] = { 
                ...plotPoint.scenes[sceneIndex], 
                ...formData 
              };
            }
          });
          break;
          
        case 'character':
          // Update character in the story-wide characters array
          const characterIndex = updatedProject.characters.findIndex(char => char.id === nodeId);
          if (characterIndex !== -1) {
            updatedProject.characters[characterIndex] = { 
              ...updatedProject.characters[characterIndex], 
              ...formData 
            };
          }
          break;
          
        case 'setting':
          updatedProject.plotPoints.forEach(plotPoint => {
            plotPoint.scenes.forEach(scene => {
              if (scene.setting && scene.setting.id === nodeId) {
                scene.setting = { 
                  ...scene.setting, 
                  ...formData 
                };
              }
            });
          });
          break;
          
        case 'item':
          updatedProject.plotPoints.forEach(plotPoint => {
            plotPoint.scenes.forEach(scene => {
              const itemIndex = scene.items.findIndex(item => item.id === nodeId);
              if (itemIndex !== -1) {
                scene.items[itemIndex] = { 
                  ...scene.items[itemIndex], 
                  ...formData 
                };
              }
            });
          });
          break;
      }
    }
    
    updatedProject.lastModified = new Date();
    console.log('💾 PropertyPanel: Calling onProjectUpdate with project:', {
      plotPointsCount: updatedProject.plotPoints.length,
      immediate: true,
      firstPlotPointWithEventType: updatedProject.plotPoints.find(pp => pp.eventType)
    });
    onProjectUpdate(updatedProject, true); // Use immediate=true for PropertyPanel changes
    onClose();
  };

  const renderPlotPointForm = () => {
    // Use local scenes state which reflects current changes including deletions
    const scenes = currentScenes;

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Title</label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="Plot point title"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Act</label>
          <select
            value={formData.actId || project.currentActId}
            onChange={(e) => handleInputChange('actId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            {project.acts
              .sort((a, b) => a.order - b.order)
              .map(act => (
                <option key={act.id} value={act.id}>
                  {act.name}
                </option>
              ))
            }
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Category</label>
          <select
            value={formData.category || PlotPointCategory.CHARACTER}
            onChange={(e) => {
              const category = e.target.value as PlotPointCategory;
              handleInputChange('category', category);
              // Update color to match category
              const categoryConfig = TemplateService.getCategoryConfig(category);
              handleInputChange('color', categoryConfig.color);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            {Object.values(PlotPointCategory).map(category => {
              const config = TemplateService.getCategoryConfig(category);
              return (
                <option key={category} value={category}>
                  {config.icon} {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Event Type 
            <span className="text-gray-500 text-xs ml-1">(Story Structure Element)</span>
          </label>
          <select
            value={formData.eventType || ''}
            onChange={(e) => {
              const eventType = e.target.value || undefined;
              console.log('🔄 PropertyPanel: Event Type changed:', {
                from: formData.eventType,
                to: eventType,
                plotPointTitle: formData.title
              });
              handleInputChange('eventType', eventType);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value="">None (Custom Plot Point)</option>
            
            <optgroup label="Universal Story Beats">
              <option value={EventType.INCITING_INCIDENT}>📍 Inciting Incident</option>
              <option value={EventType.CATALYST}>⚡ Catalyst</option>
              <option value={EventType.PLOT_POINT_1}>🚪 Plot Point 1 (Call to Adventure)</option>
              <option value={EventType.MIDPOINT_REVELATION}>🔄 Midpoint Revelation</option>
              <option value={EventType.PLOT_POINT_2}>🌑 Plot Point 2 (All Is Lost)</option>
              <option value={EventType.DARK_MOMENT}>😰 Dark Moment</option>
              <option value={EventType.BREAKTHROUGH}>💡 Breakthrough</option>
              <option value={EventType.CLIMAX}>🎯 Climax</option>
              <option value={EventType.FINAL_CONFRONTATION}>⚔️ Final Confrontation</option>
              <option value={EventType.RESOLUTION}>✅ Resolution</option>
            </optgroup>
            
            <optgroup label="Romance Story Beats">
              <option value={EventType.MEET_CUTE}>💕 Meet Cute</option>
              <option value={EventType.FALLING_IN_LOVE}>😍 Falling in Love</option>
              <option value={EventType.RELATIONSHIP_DEEPENS}>💖 Relationship Deepens</option>
              <option value={EventType.MAJOR_CONFLICT}>💔 Major Conflict</option>
              <option value={EventType.GRAND_GESTURE}>🌹 Grand Gesture</option>
              <option value={EventType.HAPPY_ENDING}>👰 Happy Ending</option>
            </optgroup>
            
            <optgroup label="Mystery/Thriller Beats">
              <option value={EventType.CRIME_DISCOVERY}>🔍 Crime Discovery</option>
              <option value={EventType.INVESTIGATION_BEGINS}>🕵️ Investigation Begins</option>
              <option value={EventType.FALSE_LEAD}>🚫 False Lead (Red Herring)</option>
              <option value={EventType.KEY_REVELATION}>🔑 Key Revelation</option>
              <option value={EventType.UNMASKING}>🎭 Unmasking</option>
            </optgroup>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Event Types help the AI understand your story structure and provide better suggestions.
          </p>
        </div>

        {formData.description !== undefined && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Plot point description"
              rows={3}
            />
          </div>
        )}

        {formData.guidance && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Template Guidance</label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">💡 {formData.guidance}</p>
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Color</label>
          <div className="flex space-x-2">
            {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map(color => (
              <button
                key={color}
                onClick={() => handleInputChange('color', color)}
                className={`w-8 h-8 rounded-full border-2 ${
                  formData.color === color ? 'border-gray-800' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Scenes Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-900">Scenes ({scenes.length})</label>
            <button
              onClick={handleAddScene}
              className="text-sm bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            >
              Add Scene
            </button>
          </div>
          
          {scenes.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {scenes.map((scene) => (
                <div key={scene.id} className="p-3 bg-gray-50 rounded border">
                  <div className="space-y-2">
                    <div>
                      <input
                        type="text"
                        value={scene.title}
                        onChange={(e) => handleSceneUpdate(scene.id, { title: e.target.value })}
                        className="w-full text-sm font-medium px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="Scene title"
                      />
                    </div>
                    <div>
                      <textarea
                        value={scene.synopsis}
                        onChange={(e) => handleSceneUpdate(scene.id, { synopsis: e.target.value })}
                        rows={2}
                        className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="Scene synopsis..."
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDeleteScene(scene.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Delete Scene
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 italic">No scenes yet. Click "Add Scene" to get started.</p>
          )}
        </div>
      </div>
    );
  };

  const renderSceneForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Title</label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          placeholder="Scene title"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Synopsis</label>
        <textarea
          value={formData.synopsis || ''}
          onChange={(e) => handleInputChange('synopsis', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          placeholder="What happens in this scene?"
        />
      </div>

      {/* Character Management for Scene */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Characters in Scene</label>
        
        {/* Current characters in scene */}
        <div className="mb-3">
          {(formData.characterIds || []).length > 0 ? (
            <div className="space-y-2">
              {(formData.characterIds || []).map((characterId: string) => {
                const character = project.characters.find(c => c.id === characterId);
                if (!character) return null;
                
                return (
                  <div key={characterId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{character.name}</span>
                      <button
                        onClick={() => {
                          // Open character info modal
                          setShowCharacterInfo({ isOpen: true, character });
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View character info"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        const updatedCharacterIds = (formData.characterIds || []).filter((id: string) => id !== characterId);
                        handleInputChange('characterIds', updatedCharacterIds);
                      }}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Remove character from scene"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No characters in this scene yet</p>
          )}
        </div>

        {/* Add character dropdown */}
        {project.characters.length > 0 && (
          <div>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  const currentCharacterIds = formData.characterIds || [];
                  if (!currentCharacterIds.includes(e.target.value)) {
                    handleInputChange('characterIds', [...currentCharacterIds, e.target.value]);
                  }
                  e.target.value = ''; // Reset dropdown
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">+ Add character to scene</option>
              {project.characters
                .filter(char => !(formData.characterIds || []).includes(char.id))
                .map(character => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))
              }
            </select>
          </div>
        )}

        {project.characters.length === 0 && (
          <p className="text-sm text-gray-500">
            <span className="italic">No characters created yet. </span>
            <span className="text-blue-600 cursor-pointer hover:text-blue-800">
              Create characters in the toolbar above.
            </span>
          </p>
        )}
      </div>
    </div>
  );

  const renderCharacterForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Name</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          placeholder="Character name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Character Type</label>
        <select
          value={formData.characterType || 'minor'}
          onChange={(e) => handleInputChange('characterType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        >
          <option value="protagonist">Protagonist</option>
          <option value="antagonist">Antagonist</option>
          <option value="supporting">Supporting</option>
          <option value="minor">Minor</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Physical Appearance</label>
        <textarea
          value={formData.appearance || ''}
          onChange={(e) => handleInputChange('appearance', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          placeholder="Physical description, clothing, distinctive features..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Personality & Emotions</label>
        <textarea
          value={formData.personality || ''}
          onChange={(e) => handleInputChange('personality', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          placeholder="Personality traits, emotional tendencies, quirks..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Motivation & Goals</label>
        <textarea
          value={formData.motivation || ''}
          onChange={(e) => handleInputChange('motivation', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          placeholder="What drives this character? Their goals and desires..."
        />
      </div>
    </div>
  );

  const renderSettingForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Name</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          placeholder="Location name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          placeholder="Describe the setting"
        />
      </div>
    </div>
  );

  const renderItemForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Name</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          placeholder="Item name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          placeholder="Describe the item and its significance"
        />
      </div>
    </div>
  );

  const getFormTitle = () => {
    switch (nodeType) {
      case 'plot-point': return 'Edit Plot Point';
      case 'scene': return 'Edit Scene';
      case 'character': return 'Edit Character';
      case 'setting': return 'Edit Setting';
      case 'item': return 'Edit Item';
      default: return 'Edit Element';
    }
  };

  const renderForm = () => {
    switch (nodeType) {
      case 'plot-point': return renderPlotPointForm();
      case 'scene': return renderSceneForm();
      case 'character': return renderCharacterForm();
      case 'setting': return renderSettingForm();
      case 'item': return renderItemForm();
      default: return <div>Unknown node type</div>;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl border-l border-gray-200 z-50 overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{getFormTitle()}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        {renderForm()}

        {/* Actions */}
        <div className="flex space-x-2 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={handleDeleteNode}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Plot Point?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this plot point? This will also delete all associated scenes, characters, settings, and items. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleConfirmPlotPointDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Plot Point
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Character Info Modal */}
      {showCharacterInfo.isOpen && showCharacterInfo.character && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Character: {showCharacterInfo.character.name}
              </h3>
              <button
                onClick={() => setShowCharacterInfo({ isOpen: false, character: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {showCharacterInfo.character.appearance && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Appearance</h4>
                  <p className="text-gray-700 text-sm">{showCharacterInfo.character.appearance}</p>
                </div>
              )}
              
              {showCharacterInfo.character.personality && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Personality & Emotions</h4>
                  <p className="text-gray-700 text-sm">{showCharacterInfo.character.personality}</p>
                </div>
              )}
              
              {showCharacterInfo.character.motivation && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Motivation & Goals</h4>
                  <p className="text-gray-700 text-sm">{showCharacterInfo.character.motivation}</p>
                </div>
              )}

              {showCharacterInfo.character.characterType && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Character Type</h4>
                  <p className="text-gray-700 text-sm capitalize">{showCharacterInfo.character.characterType}</p>
                </div>
              )}
              
              {!showCharacterInfo.character.appearance && !showCharacterInfo.character.personality && !showCharacterInfo.character.motivation && (
                <p className="text-gray-500 italic">No additional character information provided.</p>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowCharacterInfo({ isOpen: false, character: null })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyPanel;
