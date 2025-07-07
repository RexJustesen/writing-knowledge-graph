'use client';

import React, { useState, useEffect } from 'react';
import Canvas from '../components/Canvas';
import Toolbar from '../components/Toolbar';
import ActNavigation from '../components/ActNavigation';
import { Project, ZoomLevel, Act, Character } from '../types/story';

// Sample data to demonstrate the MVP functionality with act-based structure
const createSampleProject = (): Project => {
  const act1Id = 'act-1';
  const act2Id = 'act-2';
  const act3Id = 'act-3';

  const alexCharacterId = 'char-alex';
  const mentorCharacterId = 'char-mentor';

  return {
    id: 'sample-project',
    title: 'My First Story',
    acts: [
      {
        id: act1Id,
        name: 'Act 1: Setup',
        description: 'Introduce characters and establish the world',
        order: 1
      },
      {
        id: act2Id,
        name: 'Act 2: Confrontation',
        description: 'Rising action and complications',
        order: 2
      },
      {
        id: act3Id,
        name: 'Act 3: Resolution',
        description: 'Climax and resolution',
        order: 3
      }
    ],
    currentActId: act1Id,
    characters: [
      {
        id: alexCharacterId,
        name: 'Alex',
        appearance: 'Tall, determined, wearing simple clothes',
        emotions: 'Restless, ambitious, eager for change',
        motivation: 'Seeking adventure and purpose beyond the small town'
      },
      {
        id: mentorCharacterId,
        name: 'Mentor',
        appearance: 'Wise, weathered, carries ancient artifacts',
        emotions: 'Patient, knowing, slightly mysterious',
        motivation: 'Guide the hero on their journey'
      }
    ],
    plotPoints: [
      {
        id: 'plot-1',
        title: 'Opening Hook',
        position: { x: 200, y: 200 },
        color: '#3b82f6',
        actId: act1Id,
        scenes: [
          {
            id: 'scene-1',
            title: 'Hero\'s Introduction',
            synopsis: 'We meet our protagonist in their ordinary world.',
            characterIds: [alexCharacterId],
            setting: {
              id: 'setting-1',
              name: 'Small Town',
              description: 'A quiet place where nothing ever happens'
            },
            items: [
              {
                id: 'item-1',
                name: 'Letter',
                description: 'Mysterious invitation to adventure'
              }
            ]
          }
        ]
      },
      {
        id: 'plot-2',
        title: 'Call to Adventure',
        position: { x: 500, y: 300 },
        color: '#10b981',
        actId: act1Id,
        scenes: [
          {
            id: 'scene-2',
            title: 'The Invitation',
            synopsis: 'Alex receives the call to adventure.',
            characterIds: [alexCharacterId, mentorCharacterId],
            setting: {
              id: 'setting-2',
              name: 'Town Square',
              description: 'Where the journey begins'
            },
            items: []
          }
        ]
      },
      {
        id: 'plot-3',
        title: 'First Challenge',
        position: { x: 800, y: 200 },
        color: '#f59e0b',
        actId: act2Id,
        scenes: []
      }
    ],
    lastModified: new Date('2024-01-01'), // Use static date for sample project
    currentZoomLevel: ZoomLevel.STORY_OVERVIEW
  };
};

export default function CampfireApp() {
  const [project, setProject] = useState<Project>(createSampleProject());
  const [canvasInstances, setCanvasInstances] = useState<{ [actId: string]: any }>({});

  // Ensure project has at least one act for new projects
  useEffect(() => {
    if (project.acts.length === 0) {
      const defaultAct: Act = {
        id: 'act-1',
        name: 'Act 1',
        description: 'Beginning of the story',
        order: 1
      };
      
      setProject(prev => ({
        ...prev,
        acts: [defaultAct],
        currentActId: defaultAct.id,
        characters: prev.characters || [] // Ensure characters array exists
      }));
    }
  }, [project.acts.length]);

  // Load saved project on startup
  useEffect(() => {
    const savedProject = localStorage.getItem('campfire-project');
    if (savedProject) {
      try {
        const loadedProject = JSON.parse(savedProject);
        // Ensure backward compatibility - migrate old projects to act-based structure
        if (!loadedProject.acts || loadedProject.acts.length === 0) {
          const migratedProject = migrateToActBasedProject(loadedProject);
          setProject(migratedProject);
        } else {
          // Ensure characters array exists
          const updatedProject = {
            ...loadedProject,
            characters: loadedProject.characters || []
          };
          setProject(updatedProject);
        }
      } catch (error) {
        console.error('Failed to load saved project:', error);
      }
    }
  }, []);

  // Migrate old projects to act-based structure
  const migrateToActBasedProject = (oldProject: any): Project => {
    const defaultActs: Act[] = [
      { id: 'act-1', name: 'Act 1', description: 'Setup', order: 1 },
      { id: 'act-2', name: 'Act 2', description: 'Confrontation', order: 2 },
      { id: 'act-3', name: 'Act 3', description: 'Resolution', order: 3 }
    ];

    // Extract all unique characters from scenes and create story-wide character list
    const allCharacters: Character[] = [];
    const characterMap = new Map<string, string>(); // name -> id mapping

    const migratedPlotPoints = (oldProject.plotPoints || []).map((pp: any) => {
      const migratedScenes = (pp.scenes || []).map((scene: any) => {
        const characterIds: string[] = [];
        
        // Convert old character objects to character IDs
        if (scene.characters && Array.isArray(scene.characters)) {
          scene.characters.forEach((char: any) => {
            let characterId = characterMap.get(char.name);
            
            if (!characterId) {
              // Create new character
              characterId = char.id || `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              if (characterId) {
                characterMap.set(char.name, characterId);
                allCharacters.push({
                  id: characterId,
                  name: char.name,
                  appearance: char.appearance,
                  emotions: char.emotions,
                  motivation: char.motivation
                });
              }
            }
            
            if (characterId) {
              characterIds.push(characterId);
            }
          });
        }
        
        return {
          ...scene,
          characterIds,
          characters: undefined // Remove old characters array
        };
      });

      return {
        ...pp,
        actId: pp.act === 1 ? 'act-1' : pp.act === 2 ? 'act-2' : 'act-3',
        scenes: migratedScenes
      };
    });

    return {
      ...oldProject,
      acts: defaultActs,
      currentActId: 'act-1',
      characters: allCharacters,
      plotPoints: migratedPlotPoints
    };
  };

  // Auto-save every 30 seconds (PRD Section 5.3)
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      localStorage.setItem('campfire-project', JSON.stringify({
        ...project,
        lastModified: new Date()
      }));
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [project]);

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
  };

  const handleZoomChange = (zoomLevel: ZoomLevel) => {
    setProject(prev => ({
      ...prev,
      currentZoomLevel: zoomLevel
    }));
  };

  const handleActChange = (actId: string) => {
    // Act change is handled in handleProjectUpdate when ActNavigation updates the project
    console.log('Switched to act:', actId);
  };

  // Check if we have any plot points in the current act
  const currentActPlotPoints = project.plotPoints.filter(pp => pp.actId === project.currentActId);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
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
      />
      
      {/* Main Canvas Area */}
      <div className="flex-1 overflow-hidden">
        <Canvas 
          project={project}
          onProjectUpdate={handleProjectUpdate}
        />
      </div>
    </div>
  );
}
