'use client';

import React, { useState, useRef, useEffect } from 'react';
import { NavigationService, RecentItem } from '@/services/navigationService';
import { SearchService } from '@/services/searchService';
import { Project } from '@/types/story';

interface QuickNavItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  icon: string;
  path: string;
  projectId: string;
  actId?: string;
}

interface QuickNavPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (item: QuickNavItem) => void;
  currentProject?: Project;
}

const QuickNavPalette: React.FC<QuickNavPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentProject
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [items, setItems] = useState<QuickNavItem[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Build navigation items based on current project and recent items
  useEffect(() => {
    if (!isOpen) return;

    const buildItems = () => {
      const navItems: QuickNavItem[] = [];
      const seenItems = new Set<string>(); // Track unique items to prevent duplicates
      
      // Helper function to add item if not already seen
      const addUniqueItem = (item: QuickNavItem, source: 'recent' | 'current') => {
        const uniqueKey = `${item.type}-${item.id}-${item.projectId}`;
        if (!seenItems.has(uniqueKey)) {
          seenItems.add(uniqueKey);
          navItems.push({
            ...item,
            subtitle: source === 'recent' ? `Recent • ${item.subtitle}` : item.subtitle
          });
        }
      };
      
      // Add recent items first (limited to current project if available)
      const recentItems = NavigationService.getRecentItems();
      const relevantRecentItems = currentProject 
        ? recentItems.filter(item => item.projectId === currentProject.id)
        : recentItems;
        
      relevantRecentItems.slice(0, 5).forEach(item => {
        addUniqueItem({
          id: item.id,
          type: item.type,
          title: item.title,
          subtitle: item.projectId === currentProject?.id ? currentProject.title : 'Other Project',
          icon: item.icon,
          path: NavigationService.generatePath(item.type, item.projectId, item.actId, item.id),
          projectId: item.projectId,
          actId: item.actId
        }, 'recent');
      });

      // Add current project items if available
      if (currentProject) {
        // Add acts
        currentProject.acts.forEach(act => {
          addUniqueItem({
            id: act.id,
            type: 'act',
            title: act.name,
            subtitle: currentProject.title,
            icon: NavigationService.getIconForType('act'),
            path: NavigationService.generatePath('act', currentProject.id, act.id),
            projectId: currentProject.id,
            actId: act.id
          }, 'current');
        });

        // Add characters
        currentProject.characters.forEach(character => {
          addUniqueItem({
            id: character.id,
            type: 'character',
            title: character.name,
            subtitle: `${character.characterType || 'Character'} • ${currentProject.title}`,
            icon: NavigationService.getIconForType('character'),
            path: NavigationService.generatePath('character', currentProject.id, undefined, character.id),
            projectId: currentProject.id
          }, 'current');
        });

        // Add plot points from current act
        const currentActPlotPoints = currentProject.plotPoints.filter(
          pp => pp.actId === currentProject.currentActId
        );
        currentActPlotPoints.forEach(plotPoint => {
          addUniqueItem({
            id: plotPoint.id,
            type: 'plotpoint',
            title: plotPoint.title,
            subtitle: `Plot Point • ${currentProject.title}`,
            icon: NavigationService.getIconForType('plotpoint'),
            path: NavigationService.generatePath('plotpoint', currentProject.id, plotPoint.actId, plotPoint.id),
            projectId: currentProject.id,
            actId: plotPoint.actId
          }, 'current');
        });
      }

      return navItems;
    };

    const allItems = buildItems();
    
    // Filter items based on query
    if (query.trim()) {
      const filtered = allItems.filter(item => 
        SearchService.fuzzyMatch(item.title, query) ||
        SearchService.fuzzyMatch(item.subtitle, query)
      );
      setItems(filtered);
    } else {
      setItems(allItems);
    }
    
    setSelectedIndex(0);
  }, [isOpen, query, currentProject]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (items[selectedIndex]) {
            handleSelect(items[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, selectedIndex, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = (item: QuickNavItem) => {
    // Track the navigation
    switch (item.type) {
      case 'act':
        NavigationService.trackActAccess(item.id, item.title, item.projectId, currentProject?.title || '');
        break;
      case 'character':
        NavigationService.trackCharacterAccess(item.id, item.title, item.projectId, currentProject?.title || '');
        break;
      case 'plotpoint':
        NavigationService.trackPlotPointAccess(item.id, item.title, item.projectId, item.actId || '', currentProject?.title || '');
        break;
    }

    onNavigate(item);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-50"
        onClick={onClose}
      />
      
      {/* Palette */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-lg z-50">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center px-4 py-3 border-b border-gray-200">
            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Quick navigation..."
              className="flex-1 outline-none text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {items.length > 0 ? (
              items.map((item, index) => (
                <button
                  key={`quicknav-${item.type}-${item.id}-${item.projectId}-${index}`}
                  onClick={() => handleSelect(item)}
                  className={`w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {item.subtitle}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 capitalize">
                    {item.type}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <div className="text-lg mb-2">🔍</div>
                <div className="text-sm">No items found</div>
                {query && (
                  <div className="text-xs text-gray-400 mt-1">
                    Try different keywords
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer with shortcuts */}
          <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-400 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span>↑↓ navigate</span>
                <span>↵ select</span>
              </div>
              <span>esc to close</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickNavPalette;
