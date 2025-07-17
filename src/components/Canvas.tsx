'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import cytoscape, { Core } from 'cytoscape';
import { PlotPoint, ZoomLevel, Project, QuickTemplate } from '@/types/story';
import PropertyPanel from './PropertyPanel';
import QuickTemplateMenu from './QuickTemplateMenu';
import { TemplateService } from '@/services/templateService';

// Helper function to detect and fix overlapping plot points
const fixOverlappingPlotPoints = (plotPoints: PlotPoint[]): PlotPoint[] => {
  const GRID_SIZE = 300; // Increased for better spacing
  const START_X = 200;   // Moved away from origin
  const START_Y = 200;   // Moved away from origin
  const MAX_COLS = 4;    // Reduced for better organization
  const OVERLAP_THRESHOLD = 80; // Much more forgiving - nodes need to be within 80px to be considered overlapping
  
  // Group plot points by approximate position to find overlaps
  const positionGroups = new Map<string, PlotPoint[]>();
  
  plotPoints.forEach(pp => {
    // Treat any position at origin or invalid as needing repositioning
    const pos = pp.position;
    const isValidPosition = pos && pos.x > 0 && pos.y > 0;
    
    if (!isValidPosition) {
      // Invalid position - group under "invalid"
      const key = 'invalid';
      if (!positionGroups.has(key)) {
        positionGroups.set(key, []);
      }
      positionGroups.get(key)!.push(pp);
      return;
    }
    
    // Round positions to reduce floating point issues and create tolerance zones
    const roundedX = Math.round(pos.x / OVERLAP_THRESHOLD) * OVERLAP_THRESHOLD;
    const roundedY = Math.round(pos.y / OVERLAP_THRESHOLD) * OVERLAP_THRESHOLD;
    const key = `${roundedX},${roundedY}`;
    
    if (!positionGroups.has(key)) {
      positionGroups.set(key, []);
    }
    positionGroups.get(key)!.push(pp);
  });
  
  // Find groups with more than one plot point (overlapping) or invalid positions
  const problematicGroups = Array.from(positionGroups.entries())
    .filter(([key, group]) => group.length > 1 || key === 'invalid');
  
  if (problematicGroups.length === 0) {
    return plotPoints; // No overlaps, return as-is
  }
  
  // Only log and fix if there are actual problems
  const totalProblematicPlotPoints = problematicGroups.reduce((sum, [, group]) => sum + group.length, 0);
  if (totalProblematicPlotPoints > 1) {
    console.log(`🔧 Found ${problematicGroups.length} overlapping/invalid position groups affecting ${totalProblematicPlotPoints} plot points, organizing in grid...`);
  }
  
  // Get all used positions (excluding problematic ones)
  const usedPositions = new Set<string>();
  plotPoints.forEach(pp => {
    const pos = pp.position;
    if (pos && pos.x > 0 && pos.y > 0) {
      const key = `${pos.x},${pos.y}`;
      if (!problematicGroups.some(([groupKey]) => groupKey === key)) {
        usedPositions.add(key);
      }
    }
  });
  
  // Function to find next available grid position
  const findNextAvailablePosition = (): { x: number; y: number } => {
    let row = 0;
    let col = 0;
    
    while (true) {
      const x = START_X + (col * GRID_SIZE);
      const y = START_Y + (row * GRID_SIZE);
      const key = `${x},${y}`;
      
      if (!usedPositions.has(key)) {
        usedPositions.add(key);
        return { x, y };
      }
      
      col++;
      if (col >= MAX_COLS) {
        col = 0;
        row++;
      }
      
      // Safety check to prevent infinite loop
      if (row > 20) {
        console.warn('Grid positioning reached safety limit, using random position');
        return { 
          x: START_X + Math.random() * 1000, 
          y: START_Y + Math.random() * 1000 
        };
      }
    }
  };
  
  // Create updated plot points array
  const updatedPlotPoints = [...plotPoints];
  
  // Fix all problematic groups
  problematicGroups.forEach(([key, group]) => {
    group.forEach((plotPointToMove, index) => {
      if (index === 0 && key !== '0,0') {
        // Keep first plot point in original position if not at origin
        return;
      }
      
      const newPosition = findNextAvailablePosition();
      const plotPointIndex = updatedPlotPoints.findIndex(pp => pp.id === plotPointToMove.id);
      if (plotPointIndex !== -1) {
        updatedPlotPoints[plotPointIndex] = {
          ...updatedPlotPoints[plotPointIndex],
          position: newPosition
        };
        console.log(`📍 Moved plot point "${plotPointToMove.title}" to grid position ${newPosition.x},${newPosition.y}`);
      }
    });
  });
  
  return updatedPlotPoints;
};

// Helper function to detect and fix overlapping scenes within each plot point
const fixOverlappingScenes = (plotPoints: PlotPoint[]): PlotPoint[] => {
  const SCENE_OVERLAP_THRESHOLD = 60; // Scenes need to be within 60px to be considered overlapping

  const updatedPlotPoints = plotPoints.map(plotPoint => {
    if (!plotPoint.scenes || plotPoint.scenes.length <= 1) {
      return plotPoint; // No overlap possible with 0 or 1 scene
    }
    
    // Group scenes by approximate position to find overlaps (similar to plot points)
    const positionGroups = new Map<string, typeof plotPoint.scenes>();
    
    plotPoint.scenes.forEach(scene => {
      const position = scene.position || { x: 0, y: 0 };
      const isValidPosition = position.x > 0 && position.y > 0;
      
      if (!isValidPosition) {
        // Invalid position - group under "invalid"
        const key = 'invalid';
        if (!positionGroups.has(key)) {
          positionGroups.set(key, []);
        }
        positionGroups.get(key)!.push(scene);
        return;
      }
      
      // Round positions to create tolerance zones for overlap detection
      const roundedX = Math.round(position.x / SCENE_OVERLAP_THRESHOLD) * SCENE_OVERLAP_THRESHOLD;
      const roundedY = Math.round(position.y / SCENE_OVERLAP_THRESHOLD) * SCENE_OVERLAP_THRESHOLD;
      const key = `${roundedX},${roundedY}`;
      
      if (!positionGroups.has(key)) {
        positionGroups.set(key, []);
      }
      positionGroups.get(key)!.push(scene);
    });
    
    // Find groups with more than one scene (overlapping) or invalid positions
    const problematicGroups = Array.from(positionGroups.entries())
      .filter(([key, group]) => group.length > 1 || key === 'invalid');
    
    if (problematicGroups.length === 0) {
      return plotPoint; // No overlaps, return as-is
    }
    
    const totalProblematicScenes = problematicGroups.reduce((sum, [, group]) => sum + group.length, 0);
    if (totalProblematicScenes > 1) {
      console.log(`Found ${problematicGroups.length} overlapping scene groups in plot point "${plotPoint.title}", repositioning ${totalProblematicScenes} scenes...`);
    }
    
    // Calculate proper positions for scenes that need repositioning
    let repositionIndex = 0;
    const updatedScenes = plotPoint.scenes.map((scene) => {
      // Check if this scene is in a problematic group
      const scenePosition = scene.position || { x: 0, y: 0 };
      const isValidPosition = scenePosition.x > 0 && scenePosition.y > 0;
      
      let isProblematic = false;
      if (!isValidPosition) {
        isProblematic = true;
      } else {
        const roundedX = Math.round(scenePosition.x / SCENE_OVERLAP_THRESHOLD) * SCENE_OVERLAP_THRESHOLD;
        const roundedY = Math.round(scenePosition.y / SCENE_OVERLAP_THRESHOLD) * SCENE_OVERLAP_THRESHOLD;
        const sceneKey = `${roundedX},${roundedY}`;
        isProblematic = problematicGroups.some(([key]) => key === sceneKey);
      }
      
      if (isProblematic) {
        // Recalculate position using compact horizontal layout near plot point
        const offsetX = repositionIndex * 120; // 120px apart horizontally for better spacing
        const offsetY = 80; // 80px below plot point to avoid overlap
        const newPosition = {
          x: plotPoint.position.x + offsetX,
          y: plotPoint.position.y + offsetY
        };
        console.log(`Repositioning scene "${scene.title}" to ${newPosition.x},${newPosition.y}`);
        repositionIndex++;
        return { ...scene, position: newPosition };
      }
      
      return scene; // Keep existing position if not problematic
    });
    
    return {
      ...plotPoint,
      scenes: updatedScenes
    };
  });
  
  return updatedPlotPoints;
};

interface CanvasProps {
  project: Project;
  onProjectUpdate: (project: Project, immediate?: boolean) => void;
}

export interface CanvasHandle {
  handleZoomToFit: () => void;
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(({ project, onProjectUpdate }, ref) => {
  const cyRef = useRef<HTMLDivElement>(null);
  const [cy, setCy] = useState<Core | null>(null);
  const [currentZoom, setCurrentZoom] = useState<ZoomLevel>(project.currentZoomLevel);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [tempNode, setTempNode] = useState<any | null>(null); // For newly created nodes
  const [expandedPlotPoint, setExpandedPlotPoint] = useState<string | null>(null); // Track which plot point shows its scenes
  const [isMounted, setIsMounted] = useState(false);
  const [undoStack, setUndoStack] = useState<Project[]>([]); // For undo functionality
  const [undoExpandedStates, setUndoExpandedStates] = useState<(string | null)[]>([]); // Track expanded states for undo
  const [isUndoing, setIsUndoing] = useState(false); // Flag to prevent automatic rebuild during undo
  const [draggedNodes, setDraggedNodes] = useState<Map<string, { x: number; y: number }>>(new Map()); // Track currently dragged nodes
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track if this is the first project load
  const [hasTriggeredInitialZoom, setHasTriggeredInitialZoom] = useState(false); // Prevent double initial zoom
  const lastFocusedElementRef = useRef<string | null>(null); // Track last focused element to prevent repeated focusing
  // Sprint 2: Template menu state
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [templateMenuPosition, setTemplateMenuPosition] = useState({ x: 0, y: 0 });
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);

  // Track if component has mounted to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fix overlapping plot points and scenes when project loads (but not when adding new ones)
  useEffect(() => {
    if (!project || !project.plotPoints || project.plotPoints.length === 0) {
      return;
    }
    
    // Only fix overlaps on true initial load, not when adding new plot points
    if (isInitialLoad && hasTriggeredInitialZoom) {
      const fixedPlotPoints = fixOverlappingPlotPoints(project.plotPoints);
      const fixedWithScenes = fixOverlappingScenes(fixedPlotPoints);
      
      // If positions were changed, update the project
      if (JSON.stringify(fixedWithScenes) !== JSON.stringify(project.plotPoints)) {
        console.log('🔧 Canvas: Fixing overlaps on initial project load');
        const updatedProject = {
          ...project,
          plotPoints: fixedWithScenes,
          lastModified: new Date()
        };
        onProjectUpdate(updatedProject);
      }
    }
  }, [project.id, isInitialLoad, hasTriggeredInitialZoom]); // Only run when project initially loads

  // Sync currentZoom state with project's currentZoomLevel
  useEffect(() => {
    setCurrentZoom(project.currentZoomLevel);
  }, [project.currentZoomLevel]);

  // Function to update plot point position in project data
  const updatePlotPointPosition = (plotPointId: string, newPosition: { x: number; y: number }) => {
    const updatedProject = {
      ...project,
      plotPoints: project.plotPoints.map(pp => 
        pp.id === plotPointId 
          ? { ...pp, position: newPosition }
          : pp
      ),
      lastModified: new Date()
    };
    
    console.log(`Updated plot point ${plotPointId} position to`, newPosition);
    onProjectUpdate(updatedProject); // This will trigger autosave
  };

  // Function to update scene position in project data
  const updateScenePosition = (sceneId: string, newPosition: { x: number; y: number }) => {
    const updatedProject = {
      ...project,
      plotPoints: project.plotPoints.map(pp => ({
        ...pp,
        scenes: pp.scenes.map(scene =>
          scene.id === sceneId
            ? { ...scene, position: newPosition }
            : scene
        )
      })),
      lastModified: new Date()
    };
    
    console.log(`Updated scene ${sceneId} position to`, newPosition);
    onProjectUpdate(updatedProject); // This will trigger autosave
  };

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
        fit: false,
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
    // NOTE: Main event handlers moved to project-dependent useEffect below









    // Right-click context menu (PRD Section 6.2)
    cytoscapeInstance.on('cxttap', 'node', (event) => {
      event.preventDefault();
      const node = event.target;
      showContextMenu(node, event.originalEvent.clientX, event.originalEvent.clientY);
    });



    // Node drag event handlers for position tracking
    // Track when dragging starts
    cytoscapeInstance.on('grab', 'node[type="plot-point"], node[type="scene"]', (event) => {
      const node = event.target;
      const nodeId = node.id();
      const position = node.position();
      
      // Add this node to the dragged nodes map
      setDraggedNodes(prev => {
        const newMap = new Map(prev);
        newMap.set(nodeId, { x: position.x, y: position.y });
        return newMap;
      });
      
      console.log(`Started dragging node ${nodeId} from position`, position);
    });

    // Track when dragging ends and save new position
    cytoscapeInstance.on('free', 'node[type="plot-point"], node[type="scene"]', (event) => {
      const node = event.target;
      const nodeId = node.id();
      const newPosition = node.position();
      
      // Get the original position from the dragged nodes map
      const originalPosition = draggedNodes.get(nodeId);
      
      if (originalPosition) {
        // Check if position actually changed (avoid unnecessary saves)
        const positionChanged = 
          Math.abs(newPosition.x - originalPosition.x) > 1 ||
          Math.abs(newPosition.y - originalPosition.y) > 1;
          
        if (positionChanged) {
          console.log(`Node ${nodeId} moved from`, originalPosition, 'to', newPosition);
          
          // Update the project data with new position after a short delay
          // to allow the drag operation to complete fully
          setTimeout(() => {
            const nodeType = node.data('type');
            if (nodeType === 'plot-point') {
              updatePlotPointPosition(nodeId, { x: newPosition.x, y: newPosition.y });
            } else if (nodeType === 'scene') {
              updateScenePosition(nodeId, { x: newPosition.x, y: newPosition.y });
            }
          }, 100);
        }
      }
      
      // Remove this node from the dragged nodes map after a delay
      setTimeout(() => {
        setDraggedNodes(prev => {
          const newMap = new Map(prev);
          newMap.delete(nodeId);
          return newMap;
        });
      }, 200);
    });

    return () => {
      cytoscapeInstance.destroy();
    };
  }, []);

  // Register event handlers that depend on project state - re-register when project changes
  useEffect(() => {
    if (!cy) return;

    console.log('🔄 Canvas: Re-registering project-dependent event handlers', {
      currentActId: project.currentActId,
      currentAct: project.acts.find(a => a.id === project.currentActId)?.name,
      currentZoom,
      projectZoomLevel: project.currentZoomLevel,
      timestamp: new Date().toLocaleTimeString()
    });

    // Remove existing canvas tap handler to avoid duplicates
    cy.off('tap');

    // Re-register all the node tap handlers (these don't depend on project state)
    cy.on('tap', 'node[type="plot-point"]', (event) => {
      const node = event.target;
      const plotPointId = node.id();
      
      // Select the node (adds yellow ring)
      node.select();
      
      // Center the node in the canvas with smooth animation
      cy.animate({
        center: { eles: node },
        zoom: cy.zoom()
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

    cy.on('tap', 'node[type="scene"]', (event) => {
      const node = event.target;
      const sceneId = node.id();
      
      // Select the node (adds yellow ring)
      node.select();
      
      // Center the node in the canvas with smooth animation
      cy.animate({
        center: { eles: node },
        zoom: cy.zoom()
      }, {
        duration: 300,
        easing: 'ease-out'
      });
      
      // Always open property panel on single click
      setSelectedNode(node);
    });

    cy.on('tap', 'node[type="character"], node[type="setting"], node[type="item"]', (event) => {
      const node = event.target;
      
      // Select the node (adds yellow ring)
      node.select();
      
      // Center the node in the canvas with smooth animation
      cy.animate({
        center: { eles: node },
        zoom: cy.zoom()
      }, {
        duration: 300,
        easing: 'ease-out'
      });
      
      setSelectedNode(node);
    });

    cy.on('cxttap', 'node', (event) => {
      event.preventDefault();
      const node = event.target;
      showContextMenu(node, event.originalEvent.clientX, event.originalEvent.clientY);
    });

    // Canvas click to add new plot points or close panels - THIS HANDLER DEPENDS ON PROJECT STATE
    cy.on('tap', (event) => {
      if (event.target === cy) {
        // Close property panel if clicking on empty canvas
        setSelectedNode(null);
        
        const position = event.position;
        
        // DEBUG: Always log canvas tap details
        console.log('🖱️ Canvas: Canvas tap detected:', {
          currentZoom,
          expectedZoom: ZoomLevel.STORY_OVERVIEW,
          zoomMatches: currentZoom === ZoomLevel.STORY_OVERVIEW,
          projectZoomLevel: project.currentZoomLevel,
          position: position ? { x: position.x, y: position.y } : null,
          currentActId: project.currentActId,
          timestamp: new Date().toLocaleTimeString()
        });
        
        // Allow plot point creation from any zoom level when clicking empty canvas
        if (position) {
          // If not in STORY_OVERVIEW, switch to it first to allow plot point creation
          if (currentZoom !== ZoomLevel.STORY_OVERVIEW) {
            console.log('🔄 Canvas: Switching to STORY_OVERVIEW to enable plot point creation');
            setCurrentZoom(ZoomLevel.STORY_OVERVIEW);
            
            // Update project state as well
            onProjectUpdate({
              ...project,
              currentZoomLevel: ZoomLevel.STORY_OVERVIEW
            });
          }
          
          // Debug: Log current act info with FRESH project state
          console.log('🎯 Canvas: Opening template menu for new plot point:', {
            currentActId: project.currentActId,
            currentAct: project.acts.find(a => a.id === project.currentActId)?.name,
            position: { x: position.x, y: position.y },
            timestamp: new Date().toLocaleTimeString()
          });
          
          // Sprint 2: Show template menu instead of directly creating plot point
          setPendingPosition({ x: position.x, y: position.y });
          
          // Convert canvas position to screen position for menu
          const container = event.cy.container();
          if (container) {
            const containerRect = container.getBoundingClientRect();
            
            // Convert canvas coordinates to rendered (screen) coordinates
            const renderedPos = event.cy.scratch()._private ? 
              // Use cytoscape's built-in coordinate conversion
              { x: event.originalEvent.clientX, y: event.originalEvent.clientY } :
              // Fallback: manual conversion using cytoscape's coordinate system
              {
                x: containerRect.left + (position.x - event.cy.pan().x) * event.cy.zoom(),
                y: containerRect.top + (position.y - event.cy.pan().y) * event.cy.zoom()
              };
            
            console.log('🎯 Canvas: Click coordinates:', {
              canvas: { x: position.x, y: position.y },
              container: { left: containerRect.left, top: containerRect.top },
              pan: event.cy.pan(),
              zoom: event.cy.zoom(),
              rendered: renderedPos,
              clientFromEvent: { x: event.originalEvent.clientX, y: event.originalEvent.clientY }
            });
            
            // Use the client coordinates from the original mouse event (most reliable)
            openTemplateMenu(event.originalEvent.clientX, event.originalEvent.clientY);
          }
        }
      }
    });

  }, [cy, project.currentActId]); // Re-run when cy instance or currentActId changes

  // Update graph when project data changes
  useEffect(() => {
    
    // Check if tempNode was successfully saved to backend and clear it
    if (tempNode && (tempNode.id.startsWith('temp-') || tempNode.id.startsWith('plot-'))) {
      // Look for a plot point that matches tempNode's position and title but has a database ID
      const matchingSavedPlotPoint = project.plotPoints.find(pp => 
        pp.title === tempNode.title && 
        pp.position?.x === tempNode.position?.x && 
        pp.position?.y === tempNode.position?.y &&
        !pp.id.startsWith('temp-') && 
        !pp.id.startsWith('plot-')
      );
      
      if (matchingSavedPlotPoint) {
        console.log('🆔 Canvas: Detected temp node was saved, clearing tempNode state:', {
          tempId: tempNode.id,
          savedId: matchingSavedPlotPoint.id,
          title: tempNode.title
        });
        setTempNode(null);
        
        // Update selectedNode to reference the saved plot point if it was the selected temp node
        if (selectedNode && selectedNode.id && selectedNode.id() === tempNode.id) {
          // We'll let the normal update process handle re-selecting the node with new ID
          setSelectedNode(null);
        }
      }
    }
    
    if (!cy || isUndoing || draggedNodes.size > 0) {
      return; // Skip rebuild during undo or while any nodes are being dragged
    }

    // Store the currently selected node ID and position before updating
    const currentlySelectedId = selectedNode ? 
      (typeof selectedNode.id === 'function' ? selectedNode.id() : selectedNode?.data?.id) : null;
    const currentCenterPosition = cy.pan();
    const currentZoomLevel = cy.zoom();

    const elements = generateCytoscapeElements(project, project.currentZoomLevel, expandedPlotPoint, tempNode, isInitialLoad); // Only fix overlaps on initial load
    cy.elements().remove();
    cy.add(elements);
    
    // Check if we need to use automatic layout due to overlapping positions
    const needsAutoLayout = elements.some(el => {
      if (el.data.type === 'plot-point') {
        const pos = el.position;
        return !pos || pos.x === 0 || pos.y === 0;
      }
      return false;
    });
    
    // Use appropriate layout based on whether positions are valid
    if (needsAutoLayout) {
      console.log('🔧 Canvas: Using automatic grid layout due to invalid positions');
      cy.layout({ 
        name: 'grid',
        fit: false,
        padding: 50,
        rows: Math.ceil(Math.sqrt(elements.filter(el => el.data.type === 'plot-point').length)),
        spacingFactor: 2.5,
        avoidOverlap: true
      }).run();
    } else {
      // Use preset layout with existing positions
      cy.layout({ 
        name: 'preset',
        fit: false, // Don't auto-fit to prevent jumping
        padding: 50 
      }).run();
      
      // Trigger a resize to ensure Cytoscape adapts to container dimensions
      setTimeout(() => {
        if (cy) {
          cy.resize();
        }
      }, 100);
    }

    // Handle initial zoom-to-fit on first project load - only once!
    if (isInitialLoad && !hasTriggeredInitialZoom && elements.length > 0) {
      console.log('🔄 Canvas: Triggering initial zoom-to-fit animation');
      setHasTriggeredInitialZoom(true);
      setTimeout(() => {
        if (cy) {
          cy.animate({
            fit: { eles: cy.nodes(), padding: 50 }
          }, {
            duration: 500,
            easing: 'ease-out'
          });
        }
        setIsInitialLoad(false);
      }, 100);
    } else if (isInitialLoad && hasTriggeredInitialZoom) {
      console.log('🔄 Canvas: Skipping initial zoom - already triggered');
      setIsInitialLoad(false);
    }

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
  }, [cy, project.plotPoints, project.acts, project.currentActId, project.currentZoomLevel, expandedPlotPoint, tempNode, selectedNode, isUndoing, draggedNodes, isInitialLoad]);

  // Separate useEffect for handling focusedElementId to prevent multiple triggers
  useEffect(() => {
    if (!cy || !project.focusedElementId) {
      // Clear the last focused element when there's no focused element
      if (!project.focusedElementId) {
        lastFocusedElementRef.current = null;
      }
      return;
    }

    // Prevent focusing on the same element multiple times
    if (lastFocusedElementRef.current === project.focusedElementId) {
      console.log('🎯 Canvas: Skipping focus - already focused on element:', project.focusedElementId);
      return;
    }

    console.log('🎯 Canvas: Handling focused element:', project.focusedElementId);
    lastFocusedElementRef.current = project.focusedElementId;
    
    setTimeout(() => {
      const nodeToFocus = cy.getElementById(project.focusedElementId!);
      if (nodeToFocus.length > 0) {
        // Select the node to trigger the property panel
        nodeToFocus.select();
        setSelectedNode(nodeToFocus);
        
        // Only animate if the node is not already in view or reasonably centered
        const nodePosition = nodeToFocus.renderedPosition();
        const viewportCenter = {
          x: cy.width() / 2,
          y: cy.height() / 2
        };
        
        const distance = Math.sqrt(
          Math.pow(nodePosition.x - viewportCenter.x, 2) + 
          Math.pow(nodePosition.y - viewportCenter.y, 2)
        );
        
        // Only animate if the node is far from center (more than 30% of viewport)
        const shouldAnimate = distance > Math.min(cy.width(), cy.height()) * 0.3;
        
        if (shouldAnimate) {
          cy.animate({
            center: { eles: nodeToFocus },
            zoom: cy.zoom() // Keep current zoom level
          }, {
            duration: 400, // Shorter duration to feel snappier
            easing: 'ease-out'
          });
          console.log(`🎯 Canvas: Focused and centered on element ${project.focusedElementId} (distance: ${Math.round(distance)}px)`);
        } else {
          console.log(`🎯 Canvas: Focused on element ${project.focusedElementId} without animation (already in view, distance: ${Math.round(distance)}px)`);
        }
      }
    }, 150); // Slightly longer delay to ensure layout animations complete first
  }, [cy, project.focusedElementId]);

  // Reset focus ref when project changes to prevent stale references
  useEffect(() => {
    console.log('🧹 Canvas: Resetting focus ref for new project:', project.id);
    lastFocusedElementRef.current = null;
  }, [project.id]);

  // Generate Cytoscape elements based on current zoom level and current act
  const generateCytoscapeElements = (
    project: Project, 
    zoomLevel: ZoomLevel, 
    expandedPlotPointId?: string | null, 
    tempNode?: PlotPoint | null,
    shouldFixOverlaps: boolean = true
  ) => {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Filter plot points to only show those from the current act
    let currentActPlotPoints = project.plotPoints.filter(pp => pp.actId === project.currentActId);
    
    // Only fix overlapping plot points when explicitly requested (e.g., on initial load)
    if (currentActPlotPoints.length > 0 && shouldFixOverlaps) {
      const originalLength = currentActPlotPoints.length;
      currentActPlotPoints = fixOverlappingPlotPoints(currentActPlotPoints);
      
      // Only fix scenes if we're also fixing plot points
      currentActPlotPoints = fixOverlappingScenes(currentActPlotPoints);
    }

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
            position: isValidScenePosition(scene.position) 
              ? scene.position 
              : calculateScenePosition(plotPoint.position, plotPoint.scenes.indexOf(scene))
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

            // Add setting node (only if it's not a default/placeholder setting)
            if (scene.setting && scene.setting.id !== 'default-setting' && scene.setting.name !== 'Default Setting') {
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
            position: isValidScenePosition(scene.position) 
              ? scene.position 
              : calculateScenePosition(tempNode.position, tempNode.scenes.indexOf(scene))
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

  // Helper function to check if a scene position is valid (not undefined)
  const isValidScenePosition = (position?: { x: number; y: number }): boolean => {
    return !!(position && typeof position.x === 'number' && typeof position.y === 'number');
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
      const elements = generateCytoscapeElements(previousState, currentZoom, previousExpandedState, tempNode, false);
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

  // Handle zoom to fit functionality
  const handleZoomToFit = () => {
    console.log('🔍 Canvas: handleZoomToFit called');
    if (!cy) return;

    const currentActPlotPoints = project.plotPoints.filter(pp => pp.actId === project.currentActId);
    
    if (currentActPlotPoints.length === 0) {
      // No plot points in current act, just center the view with animation
      console.log('🔍 Canvas: No plot points, fitting all nodes');
      cy.animate({
        fit: { eles: cy.nodes(), padding: 50 }
      }, {
        duration: 500,
        easing: 'ease-out'
      });
      return;
    }

    // Check if there's a selected node
    const selectedNodes = cy.$(':selected');
    
    if (selectedNodes.length > 0) {
      // Zoom to selected plot point or scene
      const selectedNode = selectedNodes[0];
      const nodeType = selectedNode.data('type');
      
      if (nodeType === 'plot-point') {
        // Zoom to the plot point and its scenes if expanded
        const plotPointId = selectedNode.id();
        let nodesToFit = selectedNode;
        
        // If this plot point is expanded, include its scenes
        if (expandedPlotPoint === plotPointId) {
          const connectedScenes = selectedNode.connectedEdges().connectedNodes().filter(node => 
            node.data('type') === 'scene'
          );
          nodesToFit = nodesToFit.union(connectedScenes);
        }
        
        cy.animate({
          fit: { eles: nodesToFit, padding: 50 }
        }, {
          duration: 500,
          easing: 'ease-out'
        });
      } else if (nodeType === 'scene') {
        // Zoom to the scene and its parent plot point
        const parentPlotPoint = selectedNode.connectedEdges().connectedNodes().filter(node => 
          node.data('type') === 'plot-point'
        );
        const nodesToFit = selectedNode.union(parentPlotPoint);
        cy.animate({
          fit: { eles: nodesToFit, padding: 50 }
        }, {
          duration: 500,
          easing: 'ease-out'
        });
      } else {
        // For character, setting, or item nodes, zoom to their parent scene
        const parentScene = selectedNode.connectedEdges().connectedNodes().filter(node => 
          node.data('type') === 'scene'
        );
        if (parentScene.length > 0) {
          cy.animate({
            fit: { eles: parentScene, padding: 50 }
          }, {
            duration: 500,
            easing: 'ease-out'
          });
        } else {
          cy.animate({
            fit: { eles: selectedNode, padding: 50 }
          }, {
            duration: 500,
            easing: 'ease-out'
          });
        }
      }
    } else {
      // No selection, fit all plot points in current act
      const plotPointNodes = cy.nodes().filter(node => 
        node.data('type') === 'plot-point' && 
        currentActPlotPoints.some(pp => pp.id === node.id())
      );
      
      if (plotPointNodes.length > 0) {
        cy.animate({
          fit: { eles: plotPointNodes, padding: 80 } // Slightly more padding for overview
        }, {
          duration: 500,
          easing: 'ease-out'
        });
      } else {
        cy.animate({
          fit: { eles: cy.nodes(), padding: 50 }
        }, {
          duration: 500,
          easing: 'ease-out'
        });
      }
    }
  };

  // Expose handleZoomToFit through ref
  useImperativeHandle(ref, () => ({
    handleZoomToFit
  }));

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
    
    // Force immediate canvas regeneration to show new scenes
    if (cy) {
      // Small delay to ensure the project state has been updated
      setTimeout(() => {
        const elements = generateCytoscapeElements(project, currentZoom, plotPointId, tempNode, false);
        cy.elements().remove();
        cy.add(elements);
        
        // Use preset layout to maintain positions
        cy.layout({ 
          name: 'preset',
          fit: false,
          padding: 50 
        }).run();
        
        // Maintain focus on the plot point with scenes now visible
        const currentNode = cy.getElementById(plotPointId);
        if (currentNode.length > 0) {
          currentNode.select();
          cy.animate({
            center: { eles: currentNode },
            zoom: cy.zoom()
          }, {
            duration: 150,
            easing: 'ease-out'
          });
        }
      }, 50); // Small delay to ensure state updates are complete
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
  const handleProjectUpdateFromPanel = (updatedProject: Project, immediate?: boolean) => {
    console.log('🎯 Canvas: handleProjectUpdateFromPanel called', {
      plotPointsWithEventType: updatedProject.plotPoints.filter(pp => pp.eventType).length,
      immediate,
      firstPlotPointWithEventType: updatedProject.plotPoints.find(pp => pp.eventType)
    });

    // If we were editing a temp node, it's now been saved
    if (tempNode) {
      setTempNode(null);
    }
    
    // Ensure all plot points have valid positions before saving
    const plotPointsWithValidPositions = updatedProject.plotPoints.map(pp => {
      if (!pp.position || pp.position.x === 0 || pp.position.y === 0) {
        // Use the temp node position if available, otherwise use a default grid position
        const validPosition = tempNode?.position || { x: 200 + Math.random() * 400, y: 200 + Math.random() * 400 };
        console.log(`🔧 Assigned valid position to plot point "${pp.title}": ${validPosition.x}, ${validPosition.y}`);
        const updatedPlotPoint = { ...pp, position: validPosition };
        console.log('🔧 Position validation - preserving eventType:', {
          originalEventType: pp.eventType,
          updatedEventType: updatedPlotPoint.eventType,
          title: pp.title
        });
        return updatedPlotPoint;
      }
      return pp;
    });

    const projectWithValidPositions = { ...updatedProject, plotPoints: plotPointsWithValidPositions };
    
    console.log('🎯 Canvas: Calling onProjectUpdate with validated project', {
      plotPointsWithEventType: projectWithValidPositions.plotPoints.filter(pp => pp.eventType).length,
      immediate
    });    // Check if scenes were added to any plot point and ensure it's expanded
    // This handles the case where scenes are added through direct editing in PropertyPanel
    if (selectedNode) {
      let actualNode = selectedNode;
      if (selectedNode.length !== undefined && selectedNode.length > 0) {
        actualNode = selectedNode[0];
      }
      const nodeId = typeof actualNode.id === 'function' ? actualNode.id() : 
                     actualNode?.data?.id || actualNode?.data?.data?.id;
      
      if (nodeId) {
        const plotPoint = projectWithValidPositions.plotPoints.find(pp => pp.id === nodeId);
        if (plotPoint && plotPoint.scenes && plotPoint.scenes.length > 0) {
          setExpandedPlotPoint(nodeId);
        }
      }
    }
    
    onProjectUpdate(projectWithValidPositions, immediate);
  };

  // Smart positioning to avoid overlaps when creating new plot points
  const generateUniquePosition = (existingPlotPoints: PlotPoint[]): { x: number; y: number } => {
    const MIN_DISTANCE = 150; // Minimum distance between plot points
    const SEARCH_RADIUS = 250; // How far to search around existing nodes
    
    // Get all existing positions
    const existingPositions = existingPlotPoints
      .map(pp => pp.position)
      .filter(pos => pos && typeof pos.x === 'number' && typeof pos.y === 'number');
    
    // If no existing plot points, use a sensible default
    if (existingPositions.length === 0) {
      return { x: 300, y: 300 };
    }
    
    // Find the center of mass of existing plot points
    const centerX = existingPositions.reduce((sum, pos) => sum + pos.x, 0) / existingPositions.length;
    const centerY = existingPositions.reduce((sum, pos) => sum + pos.y, 0) / existingPositions.length;
    
    // Try positions in expanding circles around the center of mass
    for (let radius = MIN_DISTANCE; radius <= SEARCH_RADIUS; radius += 50) {
      for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 8) {
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        // Check if this position is too close to any existing position
        const hasConflict = existingPositions.some(pos => {
          const distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
          return distance < MIN_DISTANCE;
        });
        
        if (!hasConflict) {
          return { x: Math.round(x), y: Math.round(y) };
        }
      }
    }
    
    // Fallback: place it near the center with some randomness
    return {
      x: Math.round(centerX + (Math.random() - 0.5) * 300),
      y: Math.round(centerY + (Math.random() - 0.5) * 300)
    };
  };

  // Sprint 2: Template menu handlers
  const openTemplateMenu = (x: number, y: number) => {
    // Smart positioning to keep menu on screen
    const menuWidth = 256; // min-w-64 = 256px
    const menuHeight = 400; // Approximate height based on content
    const padding = 16; // Safety padding from screen edges
    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Adjust X position to keep menu on screen
    let adjustedX = x;
    if (x + menuWidth/2 + padding > screenWidth) {
      // Too close to right edge, position to the left
      adjustedX = screenWidth - menuWidth - padding;
    } else if (x - menuWidth/2 - padding < 0) {
      // Too close to left edge, position to the right
      adjustedX = menuWidth/2 + padding;
    }
    
    // Adjust Y position to keep menu on screen
    let adjustedY = y;
    if (y + menuHeight + padding > screenHeight) {
      // Too close to bottom edge, position above
      adjustedY = y - menuHeight - 20; // 20px above cursor
    } else {
      // Normal positioning below cursor
      adjustedY = y + 10; // 10px below cursor
    }
    
    // Ensure Y doesn't go above screen
    if (adjustedY < padding) {
      adjustedY = padding;
    }
    
    console.log(`🎯 Canvas: Positioning template menu at (${adjustedX}, ${adjustedY}) from original (${x}, ${y})`);
    setTemplateMenuPosition({ x: adjustedX, y: adjustedY });
    setShowTemplateMenu(true);
  };

  const handleTemplateSelect = (template: QuickTemplate | null) => {
    if (!pendingPosition) return;

    // Get current act plot points for smart positioning
    const currentActPlotPoints = project.plotPoints.filter(pp => pp.actId === project.currentActId);
    
    // Use smart positioning instead of exact click position to avoid overlaps
    const smartPosition = generateUniquePosition(currentActPlotPoints);
    
    console.log('🎯 Canvas: Creating plot point with smart positioning:', {
      pendingClick: pendingPosition,
      smartPosition,
      existingCount: currentActPlotPoints.length
    });
    
    let newPlotPoint: PlotPoint;
    
    if (template) {
      // Create plot point from template
      const templateData = TemplateService.applyQuickTemplate(
        template.id, 
        project.currentActId, 
        smartPosition // Use smart position instead of pendingPosition
      );
      
      newPlotPoint = {
        id: `plot-${Date.now()}`,
        ...templateData,
        scenes: [],
        // Ensure all required fields are present
        title: templateData.title || 'New Plot Point',
        description: templateData.description || '',
        guidance: templateData.guidance || '',
        position: smartPosition, // Use smart position
        actId: project.currentActId
      } as PlotPoint;
    } else {
      // Create blank plot point
      newPlotPoint = {
        id: `plot-${Date.now()}`,
        title: 'New Plot Point',
        description: '',
        position: smartPosition, // Use smart position
        color: '#3b82f6',
        actId: project.currentActId,
        scenes: []
      };
    }
    
    // Remove temp node if it exists
    if (tempNode && cy) {
      cy.getElementById(tempNode.id).remove();
      setTempNode(null);
    }

    // Add the plot point to the project immediately
    const updatedProject = {
      ...project,
      plotPoints: [...project.plotPoints, newPlotPoint],
      focusedElementId: newPlotPoint.id, // Focus on the newly created plot point
      lastModified: new Date()
    };

    console.log(`🎯 Canvas: Created plot point "${newPlotPoint.title}" and focusing on it`);
    onProjectUpdate(updatedProject);
    
    // Clear the focused state after the canvas has processed the focus
    setTimeout(() => {
      const clearedFocusProject = {
        ...updatedProject,
        focusedElementId: undefined,
        lastModified: new Date()
      };
      onProjectUpdate(clearedFocusProject);
    }, 500);

    setPendingPosition(null);
  };

  // Context menu placeholder (to be implemented)
  const showContextMenu = (node: any, x: number, y: number) => {
    console.log('Context menu for node:', node.id(), 'at position:', x, y);
    // TODO: Implement context menu UI
  };

  return (
    <div className="w-full h-full relative">
      <div ref={cyRef} className="w-full h-full bg-gray-50" />
      
      {/* Undo button */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-3 py-2">
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

      {/* Instructions for new users */}
      {project.plotPoints.length === 0 && !tempNode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start Your Story
            </h3>
            <p className="text-gray-900 mb-4">
              Click anywhere on the canvas to create your first plot point. 
              You can then add details and scenes to build your story structure.
            </p>
            <div className="text-sm text-gray-600">
              <p><strong>Tip:</strong> Single-click any node to edit it, double-click to zoom in</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Property Panel */}
      {selectedNode && (
        <PropertyPanel
          selectedNode={selectedNode}
          tempNode={tempNode}
          onRealTimeUpdate={handleRealTimeNodeUpdate}
          onTempNodeUpdate={handleTempNodeUpdate}
          onSceneAdded={handleSceneAdded}
          onNodeDelete={handleNodeDelete}
          onSaveUndoState={handleSaveUndoState}
          onClose={handlePropertyPanelClose}
        />
      )}
      
      {/* Sprint 2: Quick Template Menu */}
      <QuickTemplateMenu
        isOpen={showTemplateMenu}
        position={templateMenuPosition}
        onTemplateSelect={handleTemplateSelect}
        onClose={() => setShowTemplateMenu(false)}
      />
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
