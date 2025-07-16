'use client';

import React, { useState } from 'react';
import { Character, Project } from '@/types/story';

interface CharacterManagerProps {
  project: Project;
  onProjectUpdate: (project: Project) => void;
}

interface CharacterModalProps {
  isOpen: boolean;
  character?: Character | null;
  onClose: () => void;
  onSave: (character: Character) => void;
  onDelete?: (characterId: string) => void;
  existingCharacterNames: string[];
}

const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  character,
  onClose,
  onSave,
  onDelete,
  existingCharacterNames
}) => {
  const [formData, setFormData] = useState<Partial<Character>>({
    name: '',
    appearance: '',
    personality: '',
    motivation: '',
    characterType: 'minor'
  });
  const [nameError, setNameError] = useState('');

  // Initialize form data when character or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: character?.name || '',
        appearance: character?.appearance || '',
        personality: character?.personality || '',
        motivation: character?.motivation || '',
        characterType: character?.characterType || 'minor'
      });
      setNameError('');
    }
  }, [isOpen, character]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = formData.name?.trim();
    if (!trimmedName) {
      setNameError('Character name is required');
      return;
    }
    
    // Check for duplicate names (excluding current character if editing)
    const isDuplicate = existingCharacterNames.some(name => 
      name.toLowerCase() === trimmedName.toLowerCase() && 
      (!character || character.name.toLowerCase() !== trimmedName.toLowerCase())
    );
    
    if (isDuplicate) {
      setNameError('A character with this name already exists');
      return;
    }
    
    const characterData: Character = {
      id: character?.id || `char-${Date.now()}`,
      name: trimmedName,
      appearance: formData.appearance?.trim(),
      personality: formData.personality?.trim(),
      motivation: formData.motivation?.trim(),
      characterType: formData.characterType || 'minor'
    };
    
    onSave(characterData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      appearance: '',
      personality: '',
      motivation: '',
      characterType: 'minor'
    });
    setNameError('');
    onClose();
  };

  const handleDelete = () => {
    if (character && onDelete) {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete "${character.name}"? This will remove them from all scenes in your story.`
      );
      
      if (confirmDelete) {
        onDelete(character.id);
        handleClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {character ? 'Edit Character' : 'Create New Character'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="characterName" className="block text-sm font-medium text-gray-900 mb-2">
              Name *
            </label>
            <input
              type="text"
              id="characterName"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                setNameError('');
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                nameError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Character name"
              autoFocus
            />
            {nameError && (
              <p className="mt-1 text-sm text-red-600">{nameError}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="characterType" className="block text-sm font-medium text-gray-900 mb-2">
              Character Type
            </label>
            <select
              id="characterType"
              value={formData.characterType}
              onChange={(e) => setFormData(prev => ({ ...prev, characterType: e.target.value as Character['characterType'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="protagonist">Protagonist</option>
              <option value="antagonist">Antagonist</option>
              <option value="supporting">Supporting</option>
              <option value="minor">Minor</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="characterAppearance" className="block text-sm font-medium text-gray-900 mb-2">
              Physical Appearance
            </label>
            <textarea
              id="characterAppearance"
              value={formData.appearance}
              onChange={(e) => setFormData(prev => ({ ...prev, appearance: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Physical description, clothing, distinctive features..."
              rows={3}
            />
          </div>
          
          <div>
            <label htmlFor="characterPersonality" className="block text-sm font-medium text-gray-900 mb-2">
              Personality & Emotions
            </label>
            <textarea
              id="characterPersonality"
              value={formData.personality}
              onChange={(e) => setFormData(prev => ({ ...prev, personality: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Personality traits, emotional tendencies, quirks..."
              rows={3}
            />
          </div>
          
          <div>
            <label htmlFor="characterMotivation" className="block text-sm font-medium text-gray-900 mb-2">
              Motivation & Goals
            </label>
            <textarea
              id="characterMotivation"
              value={formData.motivation}
              onChange={(e) => setFormData(prev => ({ ...prev, motivation: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="What drives this character? Their goals and desires..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-between pt-4">
            <div>
              {character && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Delete Character
                </button>
              )}
            </div>
            <div className="flex space-x-3">
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
                {character ? 'Save Changes' : 'Create Character'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const CharacterManager: React.FC<CharacterManagerProps> = ({ project, onProjectUpdate }) => {
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [showCharacterList, setShowCharacterList] = useState(false);

  const handleCreateCharacter = () => {
    setEditingCharacter(null);
    setShowCharacterModal(true);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setShowCharacterModal(true);
  };

  const handleSaveCharacter = (character: Character) => {
    const updatedProject: Project = {
      ...project,
      characters: editingCharacter
        ? project.characters.map(c => c.id === character.id ? character : c)
        : [...project.characters, character],
      lastModified: new Date()
    };
    
    onProjectUpdate(updatedProject);
  };

  const handleDeleteCharacter = (characterId: string) => {
    const updatedProject: Project = {
      ...project,
      characters: project.characters.filter(c => c.id !== characterId),
      plotPoints: project.plotPoints.map(pp => ({
        ...pp,
        scenes: pp.scenes.map(scene => ({
          ...scene,
          characterIds: scene.characterIds.filter(id => id !== characterId)
        }))
      })),
      lastModified: new Date()
    };
    
    onProjectUpdate(updatedProject);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowCharacterList(!showCharacterList)}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          title="Manage Characters"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Characters ({project.characters.length})
          <svg 
            className={`w-4 h-4 ml-1 transition-transform ${showCharacterList ? 'transform rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showCharacterList && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 min-w-[300px] mr-4">
            <div className="p-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900">Story Characters</h3>
                <button
                  onClick={handleCreateCharacter}
                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                >
                  + Add Character
                </button>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {project.characters.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">No characters created yet</p>
                  <button
                    onClick={handleCreateCharacter}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Create your first character
                  </button>
                </div>
              ) : (
                <div className="p-2">
                  {project.characters.map(character => (
                    <div
                      key={character.id}
                      className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900">{character.name}</div>
                          {character.characterType && (
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              character.characterType === 'protagonist' ? 'bg-blue-100 text-blue-800' :
                              character.characterType === 'antagonist' ? 'bg-red-100 text-red-800' :
                              character.characterType === 'supporting' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {character.characterType.charAt(0).toUpperCase() + character.characterType.slice(1)}
                            </span>
                          )}
                        </div>
                        {character.appearance && (
                          <div className="text-sm text-gray-500 truncate">{character.appearance}</div>
                        )}
                      </div>
                      <button
                        onClick={() => handleEditCharacter(character)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Edit character"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <CharacterModal
        isOpen={showCharacterModal}
        character={editingCharacter}
        onClose={() => {
          setShowCharacterModal(false);
          setEditingCharacter(null);
        }}
        onSave={handleSaveCharacter}
        onDelete={handleDeleteCharacter}
        existingCharacterNames={project.characters.map(c => c.name)}
      />
    </>
  );
};

export default CharacterManager;
