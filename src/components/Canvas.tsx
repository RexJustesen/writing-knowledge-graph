'use client';

import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core } from 'cytoscape';
import { PlotPoint, Scene, ZoomLevel, Project, CytoscapeNodeData, CytoscapeEdgeData } from '@/types/story';
import PropertyPanel from './PropertyPanel';

interface CanvasProps {
  project: Project;
  onProjectUpdate: (project: Project) => void;
}

const Canvas: React.FC<CanvasProps> = ({ project, onProjectUpdate }) => {
  const cyRef = useRef<HTMLDivElement>(null);
  const [cy, setCy] = useState<Core | null>(null);
  const [currentZoom, setCurrentZoom] = useState<ZoomLevel>(project.currentZoomLevel);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [tempNode, setTempNode] = useState<any | null>(null); // For newly created nodes
  const [expandedPlotPoint, setExpandedPlotPoint] = useState<string | null>(null); // Track which plot point shows its scenes
  const [lastSaved, setLastSaved] = useState<Date>(new Date('2024-01-01')); // Use static initial date
  const [isMounted, setIsMounted] = useState(false);
  const [undoStack, setUndoStack] = useState<Project[]>([]); // For undo functionality
  const [undoExpandedStates, setUndoExpandedStates] = useState<(string | null)[]>([]); // Track expanded states for undo
  const [isUndoing, setIsUndoing] = useState(false); // Flag to prevent automatic rebuild during undo

  // Track if component has mounted to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
    setLastSaved(new Date()); // Set actual current time once mounted
  }, []);

  // Auto-save functionality - save every 10 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      // Auto-save temporary nodes by converting them to permanent ones
      if (tempNode) {
        const newId = `plot-${Date.now()}`;
        const newPlotPoint: PlotPoint = {
          ...tempNode,
          id: newId // Convert temp ID to permanent ID
        };
        const updatedProject = {
          ...project,
          plotPoints: [...project.plotPoints, newPlotPoint],
          lastModified: new Date()
        };
        
        // Update expanded state to use the new permanent ID
        if (expandedPlotPoint === tempNode.id) {
          setExpandedPlotPoint(newId);
        }
        
        onProjectUpdate(updatedProject);
        setTempNode(null); // Clear temp node since it's now saved
        console.log('Auto-saved temporary plot point at', new Date().toLocaleTimeString());
      }
      
      // Save to localStorage
      try {
        localStorage.setItem(`writing-graph-project-${project.id}`, JSON.stringify({
          ...project,
          lastModified: new Date()
        }));
        setLastSaved(new Date());
        console.log('Auto-saved project at', new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(autoSaveInterval);
  }, [project, tempNode, onProjectUpdate]);

  // Initialize Cytoscape instance
  useEffect(() => {
    if (!cyRef.current) return;

    const cytoscapeInstance = cytoscape({
      container: cyRef.current,
      style: [
        // Plot Point styling - prominent circular nodes (PRD Section 4.1)
        {
          selector: 'node[type="plot-point"]',
          style: {
            'background-color': 'data(color)',
            'width': 80,
            'height': 80,
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#ffffff',
            'font-size': '14px',
            'font-weight': 'bold',
            'text-wrap': 'wrap',
            'text-max-width': '70px',
            'border-width': 3,
            'border-color': '#ffffff',
            'shape': 'ellipse'
          }
        },
        // Scene styling - smaller satellite bubbles (PRD Section 4.2)
        {
          selector: 'node[type="scene"]',
          style: {
            'background-color': '#4f46e5',
            'width': 50,
            'height': 50,
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#ffffff',
            'font-size': '10px',
            'text-wrap': 'wrap',
            'text-max-width': '45px',
            'border-width': 2,
            'border-color': '#ffffff',
            'shape': 'ellipse'
          }
        },
        // Detail nodes (characters, settings, items)
        {
          selector: 'node[type="character"], node[type="setting"], node[type="item"]',
          style: {
            'background-color': '#6b7280',
            'width': 30,
            'height': 30,
            'label': 'data(label)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'color': '#374151',
            'font-size': '8px',
            'text-wrap': 'wrap',
            'text-max-width': '25px',
            'shape': 'rectangle'
          }
        },
        // Edge styling - visual connections (PRD Section 4.2)
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#d1d5db',
            'target-arrow-color': '#d1d5db',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        },
        // Selected node highlighting
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#fbbf24'
          }
        }
      ],
      layout: {
        name: 'preset',
        fit: true,
        padding: 50
      },
      // Enable user interaction (PRD Section 6.2)
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: true,
      selectionType: 'single'
    });

    setCy(cytoscapeInstance);

    // Event handlers for user interactions
    cytoscapeInstance.on('tap', 'node[type="plot-point"]', (event) => {
      const node = event.target;
      const plotPointId = node.id();
      
      // Select the node (adds yellow ring)
      node.select();
      
      // Center the node in the canvas with smooth animation
      cytoscapeInstance.animate({
        center: { eles: node },
        zoom: cytoscapeInstance.zoom()
      }, {
        duration: 300,
        easing: 'ease-out'
      });
      
      // Always open property panel on single click
      setSelectedNode(node);
      
      // Toggle scene visibility for this plot point
      if (expandedPlotPoint === plotPointId) {
        setExpandedPlotPoint(null); // Collapse scenes
      } else {
        setExpandedPlotPoint(plotPointId); // Expand scenes
      }
    });

    // Double-click to zoom to plot point focus
    cytoscapeInstance.on('dbltap', 'node[type="plot-point"]', (event: { target: any; }) => {
      const node = event.target;
      const plotPointId = node.id();
      
      if (currentZoom === ZoomLevel.STORY_OVERVIEW) {
        // Zoom to plot point focus (PRD Section 4.5)
        zoomToPlotPoint(plotPointId);
      }
    });

    cytoscapeInstance.on('tap', 'node[type="scene"]', (event) => {
      const node = event.target;
      const sceneId = node.id();
      
      // Select the node (adds yellow ring)
      node.select();
      
      // Center the node in the canvas with smooth animation
      cytoscapeInstance.animate({
        center: { eles: node },
        zoom: cytoscapeInstance.zoom()
      }, {
        duration: 300,
        easing: 'ease-out'
      });
      
      // Always open property panel on single click
      setSelectedNode(node);
    });

    // Double-click to zoom to scene detail
    cytoscapeInstance.on('dbltap', 'node[type="scene"]', (event) => {
      const node = event.target;
      const sceneId = node.id();
      
      if (currentZoom === ZoomLevel.PLOT_POINT_FOCUS) {
        // Zoom to scene detail (PRD Section 4.5)
        zoomToScene(sceneId);
      }
    });

    // Handle selection of detail nodes (characters, settings, items)
    cytoscapeInstance.on('tap', 'node[type="character"], node[type="setting"], node[type="item"]', (event) => {
      const node = event.target;
      
      // Select the node (adds yellow ring)
      node.select();
      
      // Center the node in the canvas with smooth animation
      cytoscapeInstance.animate({
        center: { eles: node },
        zoom: cytoscapeInstance.zoom()
      }, {
        duration: 300,
        easing: 'ease-out'
      });
      
      setSelectedNode(node);
    });

    // Right-click context menu (PRD Section 6.2)
    cytoscapeInstance.on('cxttap', 'node', (event) => {
      event.preventDefault();
      const node = event.target;
      showContextMenu(node, event.originalEvent.clientX, event.originalEvent.clientY);
    });

    // Canvas click to add new plot points or close panels
    cytoscapeInstance.on('tap', (event) => {
      if (event.target === cytoscapeInstance) {
        // Close property panel if clicking on empty canvas
        setSelectedNode(null);
        
        const position = event.position;
        if (currentZoom === ZoomLevel.STORY_OVERVIEW && position) {
          // Create temporary node that will be saved when user edits it
          const tempId = `temp-${Date.now()}`;
          setTempNode({
            id: tempId,
            title: 'New Plot Point',
            position: { x: position.x, y: position.y },
            color: '#3b82f6',
            actId: project.currentActId, // Assign to current act
            scenes: []
          });
          
          // Add temporary node to canvas
          const tempCyNodes = cytoscapeInstance.add({
            data: {
              id: tempId,
              label: 'New Plot Point',
              type: 'plot-point',
              color: '#3b82f6',                data: {
                  id: tempId,
                  title: 'New Plot Point',
                  position: { x: position.x, y: position.y },
                  color: '#3b82f6',
                  actId: project.currentActId, // Assign to current act
                  scenes: []
                }
            },
            position: { x: position.x, y: position.y }
          });
          
          // Immediately select the temp node for editing - get the first element from collection
          const tempCyNode = tempCyNodes[0];
          tempCyNode.select(); // Add selection (yellow ring)
          // Center the new node with smooth animation
          cytoscapeInstance.animate({
            center: { eles: tempCyNode },
            zoom: cytoscapeInstance.zoom()
          }, {
            duration: 300,
            easing: 'ease-out'
          });
          setSelectedNode(tempCyNode);
        }
      }
    });

    return () => {
      cytoscapeInstance.destroy();
    };
  }, []);

  // Update graph when project data changes
  useEffect(() => {
    if (!cy || isUndoing) return; // Skip rebuild during undo

    // Store the currently selected node ID and position before updating
    const currentlySelectedId = selectedNode ? 
      (typeof selectedNode.id === 'function' ? selectedNode.id() : selectedNode?.data?.id) : null;
    const currentCenterPosition = cy.pan();
    const currentZoomLevel = cy.zoom();

    const elements = generateCytoscapeElements(project, currentZoom, expandedPlotPoint, tempNode);
    cy.elements().remove();
    cy.add(elements);
    
    // Use a gentler layout that doesn't reset the viewport as much
    cy.layout({ 
      name: 'preset',
      fit: false, // Don't auto-fit to prevent jumping
      padding: 50 
    }).run();

    // Only restore selection without animation to prevent double animation
    if (currentlySelectedId) {
      // Use a small delay to ensure layout is complete
      setTimeout(() => {
        const nodeToSelect = cy.getElementById(currentlySelectedId);
        if (nodeToSelect.length > 0) {
          // Just select the node (this adds the yellow ring) without centering animation
          nodeToSelect.select();
          // The node should already be in the right position from the layout
        }
      }, 50); // Reduced delay for faster response
    }
  }, [cy, project, currentZoom, expandedPlotPoint, tempNode, selectedNode, isUndoing]);

  // Generate Cytoscape elements based on current zoom level and current act
  const generateCytoscapeElements = (project: Project, zoomLevel: ZoomLevel, expandedPlotPointId?: string | null, tempNode?: PlotPoint | null) => {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Filter plot points to only show those from the current act
    const currentActPlotPoints = project.plotPoints.filter(pp => pp.actId === project.currentActId);

    // Include all plot points from the current act
    currentActPlotPoints.forEach((plotPoint) => {
      // Always include plot points
      nodes.push({
        data: {
          id: plotPoint.id,
          label: plotPoint.title,
          type: 'plot-point',
          color: plotPoint.color,
          data: plotPoint
        },
        position: plotPoint.position
      });

      // Include scenes based on zoom level OR if this plot point is expanded
      const shouldShowScenes = zoomLevel !== ZoomLevel.STORY_OVERVIEW || expandedPlotPointId === plotPoint.id;
      
      if (shouldShowScenes) {
        plotPoint.scenes.forEach((scene) => {
          nodes.push({
            data: {
              id: scene.id,
              label: scene.title,
              type: 'scene',
              parentId: plotPoint.id,
              data: scene
            },
            position: scene.position || calculateScenePosition(plotPoint.position, plotPoint.scenes.indexOf(scene))
          });

          // Edge from plot point to scene
          edges.push({
            data: {
              id: `${plotPoint.id}-${scene.id}`,
              source: plotPoint.id,
              target: scene.id,
              type: 'contains'
            }
          });

          // Include scene details for SCENE_DETAIL zoom level
          if (zoomLevel === ZoomLevel.SCENE_DETAIL && project.focusedElementId === scene.id) {
            // Add character nodes
            scene.characterIds.forEach((characterId, index) => {
              const character = project.characters.find(c => c.id === characterId);
              if (character) {
                const charId = `${scene.id}-char-${character.id}`;
                nodes.push({
                  data: {
                    id: charId,
                    label: character.name,
                    type: 'character',
                    parentId: scene.id,
                    data: character
                  },
                  position: calculateDetailPosition(scene.position || plotPoint.position, 'character', index)
                });

                edges.push({
                  data: {
                    id: `${scene.id}-${charId}`,
                    source: scene.id,
                    target: charId,
                    type: 'contains'
                  }
                });
              }
            });

            // Add setting node
            if (scene.setting) {
              const settingId = `${scene.id}-setting-${scene.setting.id}`;
              nodes.push({
                data: {
                  id: settingId,
                  label: scene.setting.name,
                  type: 'setting',
                  parentId: scene.id,
                  data: scene.setting
                },
                position: calculateDetailPosition(scene.position || plotPoint.position, 'setting', 0)
              });

              edges.push({
                data: {
                  id: `${scene.id}-${settingId}`,
                  source: scene.id,
                  target: settingId,
                  type: 'contains'
                }
              });
            }

            // Add item nodes
            scene.items.forEach((item, index) => {
              const itemId = `${scene.id}-item-${item.id}`;
              nodes.push({
                data: {
                  id: itemId,
                  label: item.name,
                  type: 'item',
                  parentId: scene.id,
                  data: item
                },
                position: calculateDetailPosition(scene.position || plotPoint.position, 'item', index)
              });

              edges.push({
                data: {
                  id: `${scene.id}-${itemId}`,
                  source: scene.id,
                  target: itemId,
                  type: 'contains'
                }
              });
            });
          }
        });
      }
    });

    // Include temporary node if it exists and belongs to the current act
    if (tempNode && tempNode.actId === project.currentActId) {
      // Add the temporary plot point node itself
      nodes.push({
        data: {
          id: tempNode.id,
          label: tempNode.title,
          type: 'plot-point',
          color: tempNode.color,
          data: tempNode
        },
        position: tempNode.position
      });
      
      // Add scenes if this temp plot point is expanded
      const shouldShowTempScenes = expandedPlotPointId === tempNode.id;
      
      if (shouldShowTempScenes && tempNode.scenes) {
        tempNode.scenes.forEach((scene) => {
          nodes.push({
            data: {
              id: scene.id,
              label: scene.title,
              type: 'scene',
              parentId: tempNode.id,
              data: scene
            },
            position: scene.position || calculateScenePosition(tempNode.position, tempNode.scenes.indexOf(scene))
          });

          // Edge from temp plot point to scene
          edges.push({
            data: {
              id: `${tempNode.id}-${scene.id}`,
              source: tempNode.id,
              target: scene.id,
              type: 'contains'
            }
          });
        });
      }
    }

    return [...nodes, ...edges];
  };

  // Calculate position for scenes around plot point (satellite positioning)
  const calculateScenePosition = (plotPointPos: { x: number; y: number }, sceneIndex: number) => {
    const radius = 120;
    const angle = (sceneIndex * 2 * Math.PI) / Math.max(1, 6); // Up to 6 scenes around plot point
    return {
      x: plotPointPos.x + radius * Math.cos(angle),
      y: plotPointPos.y + radius * Math.sin(angle)
    };
  };

  // Calculate position for detail elements around scene
  const calculateDetailPosition = (
    scenePos: { x: number; y: number }, 
    type: 'character' | 'setting' | 'item', 
    index: number
  ) => {
    const radius = 80;
    let baseAngle = 0;
    
    // Different angular sections for different types
    switch (type) {
      case 'character':
        baseAngle = 0;
        break;
      case 'setting':
        baseAngle = Math.PI;
        break;
      case 'item':
        baseAngle = Math.PI / 2;
        break;
    }
    
    const angle = baseAngle + (index * Math.PI / 6);
    return {
      x: scenePos.x + radius * Math.cos(angle),
      y: scenePos.y + radius * Math.sin(angle)
    };
  };

  // Zoom to plot point focus
  const zoomToPlotPoint = (plotPointId: string) => {
    setCurrentZoom(ZoomLevel.PLOT_POINT_FOCUS);
    onProjectUpdate({
      ...project,
      currentZoomLevel: ZoomLevel.PLOT_POINT_FOCUS,
      focusedElementId: plotPointId
    });
  };

  // Zoom to scene detail
  const zoomToScene = (sceneId: string) => {
    setCurrentZoom(ZoomLevel.SCENE_DETAIL);
    onProjectUpdate({
      ...project,
      currentZoomLevel: ZoomLevel.SCENE_DETAIL,
      focusedElementId: sceneId
    });
  };

  // Create new plot point at position
  const createNewPlotPoint = (plotPointData: PlotPoint) => {
    // Remove temp node if it exists
    if (tempNode && cy) {
      cy.getElementById(tempNode.id).remove();
      setTempNode(null);
    }

    onProjectUpdate({
      ...project,
      plotPoints: [...project.plotPoints, plotPointData],
      lastModified: new Date()
    });
  };

  // Handle real-time node updates (like color changes)
  const handleRealTimeNodeUpdate = (nodeId: string, updates: any) => {
    if (!cy) return;
    
    // Check if this is a temporary node
    if (tempNode && nodeId === tempNode.id) {
      // Update temporary node data
      const updatedTempNode = { ...tempNode, ...updates };
      setTempNode(updatedTempNode);
      
      // Update the visual node
      const cyNode = cy.getElementById(nodeId);
      if (cyNode.length > 0) {
        if (updates.color) {
          cyNode.style('background-color', updates.color);
        }
        cyNode.data({
          ...cyNode.data(),
          color: updates.color,
          data: updatedTempNode
        });
      }
      return;
    }
    
    // Update the visual node immediately
    const cyNode = cy.getElementById(nodeId);
    if (cyNode.length > 0) {
      // Update visual properties
      if (updates.color) {
        cyNode.style('background-color', updates.color);
      }
      
      // Update the node data
      const currentData = cyNode.data();
      cyNode.data({
        ...currentData,
        color: updates.color,
        data: {
          ...currentData.data,
          ...updates
        }
      });
    }
    
    // Also update the project data
    const updatedProject = { ...project };
    const plotPointIndex = updatedProject.plotPoints.findIndex(pp => pp.id === nodeId);
    if (plotPointIndex !== -1) {
      updatedProject.plotPoints[plotPointIndex] = {
        ...updatedProject.plotPoints[plotPointIndex],
        ...updates
      };
      updatedProject.lastModified = new Date();
      onProjectUpdate(updatedProject);
    }
  };

  // Handle temporary node updates (for unsaved plot points)
  const handleTempNodeUpdate = (updatedTempNode: PlotPoint) => {
    setTempNode(updatedTempNode);
    
    // Auto-expand the plot point when scenes are added to show them immediately
    if (updatedTempNode.scenes && updatedTempNode.scenes.length > 0) {
      setExpandedPlotPoint(updatedTempNode.id);
    }
    
    // Update the visual node in Cytoscape
    if (cy && updatedTempNode) {
      const cyNode = cy.getElementById(updatedTempNode.id);
      if (cyNode.length > 0) {
        cyNode.data({
          ...cyNode.data(),
          data: updatedTempNode
        });
      }
    }
  };

  // Handle saving state for undo
  const handleSaveUndoState = () => {
    // Save the current state before any modifications with deep copy
    const deepCopyProject = JSON.parse(JSON.stringify(project));
    setUndoStack(prev => [...prev.slice(-9), deepCopyProject]); // Keep last 10 states
    setUndoExpandedStates(prev => [...prev.slice(-9), expandedPlotPoint]); // Save expanded state too
    console.log('Saved undo state. Current expanded plot point:', expandedPlotPoint);
  };

  // Handle node deletion
  const handleNodeDelete = (nodeId: string, nodeType: string) => {
    if (!cy) return;

    // Remove the node and its connected edges from the graph
    const nodeToRemove = cy.getElementById(nodeId);
    if (nodeToRemove.length > 0) {
      // If it's a plot point, also remove all connected scene nodes
      if (nodeType === 'plot-point') {
        const connectedEdges = nodeToRemove.connectedEdges();
        const connectedNodes = connectedEdges.connectedNodes().filter(node => 
          node.id() !== nodeId && node.data('type') === 'scene'
        );
        
        // Remove connected scene nodes first
        connectedNodes.remove();
        connectedEdges.remove();
      }
      
      // Remove the main node
      nodeToRemove.remove();
    }

    // Handle temporary node deletion
    if (nodeId.startsWith('temp-')) {
      setTempNode(null);
      if (expandedPlotPoint === nodeId) {
        setExpandedPlotPoint(null);
      }
    }

    // Close property panel if the deleted node was selected
    if (selectedNode && 
        ((typeof selectedNode.id === 'function' && selectedNode.id() === nodeId) ||
         selectedNode.data?.id === nodeId)) {
      setSelectedNode(null);
    }

    // Update expanded state if necessary
    if (expandedPlotPoint === nodeId) {
      setExpandedPlotPoint(null);
    }
  };

  // Handle undo functionality
  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    const previousExpandedState = undoExpandedStates[undoExpandedStates.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    const newUndoExpandedStates = undoExpandedStates.slice(0, -1);
    
    console.log('Performing undo. Previous state:', previousState);
    console.log('Previous state plot points:', previousState.plotPoints.length);
    console.log('Previous state scenes in expanded plot point:', 
      previousState.plotPoints.find(pp => pp.id === previousExpandedState)?.scenes?.length || 0);
    console.log('Restoring expanded plot point:', previousExpandedState);
    
    // Set undo flag to prevent automatic rebuild
    setIsUndoing(true);
    
    setUndoStack(newUndoStack);
    setUndoExpandedStates(newUndoExpandedStates);
    setExpandedPlotPoint(previousExpandedState); // Restore the expanded state
    
    // Update project state
    onProjectUpdate(previousState);
    
    // Manually rebuild the graph with the previous state and expanded state
    if (cy) {
      const elements = generateCytoscapeElements(previousState, currentZoom, previousExpandedState, tempNode);
      console.log('Generated elements for undo:', elements.map(el => ({
        id: el.data.id, 
        type: el.data.type, 
        label: el.data.label
      })));
      
      cy.elements().remove();
      cy.add(elements);
      
      console.log('Graph rebuilt with elements:', elements.length, 'nodes/edges');
      console.log('Restored expanded state:', previousExpandedState);
      
      // Re-run layout
      cy.layout({
        name: 'preset',
        fit: false,
        padding: 50,
        animate: false
      }).run();
    }
    
    // Reset undo flag after a brief delay to allow state updates to complete
    setTimeout(() => {
      setIsUndoing(false);
    }, 100);
  };

  // Add keyboard shortcut for undo (Ctrl+Z)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, undoExpandedStates, project, cy]);

  // Handle scene addition - auto-expand plot point to show new scenes
  const handleSceneAdded = (plotPointId: string) => {
    setExpandedPlotPoint(plotPointId);
    
    // Instead of full regeneration, try to maintain smooth focus on the selected plot point
    if (cy && selectedNode) {
      setTimeout(() => {
        const currentNode = cy.getElementById(plotPointId);
        if (currentNode.length > 0) {
          currentNode.select();
          // Only animate if the node has moved significantly
          cy.animate({
            center: { eles: currentNode },
            zoom: cy.zoom()
          }, {
            duration: 150,
            easing: 'ease-out'
          });
        }
      }, 100);
    }
  };

  // Handle property panel close
  const handlePropertyPanelClose = () => {
    // If we're closing a temp node without saving, remove it
    if (tempNode && cy) {
      cy.getElementById(tempNode.id).remove();
      setTempNode(null);
    }
    setSelectedNode(null);
  };

  // Handle property panel save - this will be called from PropertyPanel
  const handleProjectUpdateFromPanel = (updatedProject: Project) => {
    // If we were editing a temp node, it's now been saved
    if (tempNode) {
      setTempNode(null);
    }
    
    // Check if scenes were added to any plot point and ensure it's expanded
    // This handles the case where scenes are added through direct editing in PropertyPanel
    if (selectedNode) {
      let actualNode = selectedNode;
      if (selectedNode.length !== undefined && selectedNode.length > 0) {
        actualNode = selectedNode[0];
      }
      const nodeId = typeof actualNode.id === 'function' ? actualNode.id() : 
                     actualNode?.data?.id || actualNode?.data?.data?.id;
      
      if (nodeId) {
        const plotPoint = updatedProject.plotPoints.find(pp => pp.id === nodeId);
        if (plotPoint && plotPoint.scenes && plotPoint.scenes.length > 0) {
          setExpandedPlotPoint(nodeId);
        }
      }
    }
    
    onProjectUpdate(updatedProject);
  };

  // Context menu placeholder (to be implemented)
  const showContextMenu = (node: any, x: number, y: number) => {
    console.log('Context menu for node:', node.id(), 'at position:', x, y);
    // TODO: Implement context menu UI
  };

  return (
    <div className="w-full h-full relative">
      <div ref={cyRef} className="w-full h-full bg-gray-50" />
      
      {/* Zoom level indicator */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-3 py-2">
        <span className="text-sm font-medium text-gray-700">
          {currentZoom.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      </div>

      {/* Undo button */}
      <div className="absolute top-4 left-40 bg-white rounded-lg shadow-md px-3 py-2">
        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className={`text-sm font-medium transition-colors ${
            undoStack.length === 0 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-blue-600 hover:text-blue-800'
          }`}
          title={`Undo (Ctrl+Z)${undoStack.length > 0 ? ` - ${undoStack.length} action${undoStack.length > 1 ? 's' : ''} available` : ''}`}
        >
          ↶ Undo {undoStack.length > 0 && `(${undoStack.length})`}
        </button>
      </div>

      {/* Interaction help */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-3 py-2 text-xs text-gray-600 max-w-48">
        <div className="font-medium mb-1">Quick Guide:</div>
        <div>• Click: Edit node</div>
        <div>• Double-click: Zoom in</div>
        <div>• Empty space: New plot point</div>
      </div>

      {/* Auto-save status */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 text-xs text-gray-600">
        Last saved: {isMounted ? lastSaved.toLocaleTimeString() : '--:--:--'}
      </div>

      {/* Instructions for new users */}
      {project.plotPoints.length === 0 && !tempNode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start Your Story
            </h3>
            <p className="text-gray-600 mb-4">
              Click anywhere on the canvas to create your first plot point. 
              You can then add details and scenes to build your story structure.
            </p>
            <div className="text-sm text-gray-500">
              <p><strong>Tip:</strong> Single-click any node to edit it, double-click to zoom in</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Property Panel */}
      {selectedNode && (
        <PropertyPanel
          selectedNode={selectedNode}
          project={project}
          tempNode={tempNode}
          onProjectUpdate={handleProjectUpdateFromPanel}
          onRealTimeUpdate={handleRealTimeNodeUpdate}
          onTempNodeUpdate={handleTempNodeUpdate}
          onSceneAdded={handleSceneAdded}
          onNodeDelete={handleNodeDelete}
          onSaveUndoState={handleSaveUndoState}
          onClose={handlePropertyPanelClose}
        />
      )}
    </div>
  );
};

export default Canvas;
