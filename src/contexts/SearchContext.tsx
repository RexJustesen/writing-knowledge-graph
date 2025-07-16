'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavigationService } from '@/services/navigationService';
import { SearchResult } from '@/services/searchService';
import { Project } from '@/types/story';

interface SearchContextType {
  // Quick navigation state
  isQuickNavOpen: boolean;
  openQuickNav: () => void;
  closeQuickNav: () => void;
  
  // Global search state
  isGlobalSearchFocused: boolean;
  focusGlobalSearch: () => void;
  blurGlobalSearch: () => void;
  
  // Navigation handlers
  handleSearchNavigation: (result: SearchResult) => void;
  handleQuickNavigation: (item: any) => void;
  
  // Act switching
  switchToAct: (actNumber: number) => void;
  
  // Current project context
  currentProject?: Project;
  setCurrentProject: (project: Project | undefined) => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: React.ReactNode;
  onNavigate?: (path: string) => void;
  onActSwitch?: (actNumber: number) => void;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({
  children,
  onNavigate,
  onActSwitch
}) => {
  const [isQuickNavOpen, setIsQuickNavOpen] = useState(false);
  const [isGlobalSearchFocused, setIsGlobalSearchFocused] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | undefined>();

  // Keyboard shortcut handling
  useEffect(() => {
    const handleKeyboard = NavigationService.createKeyboardHandler(
      (actNumber: number) => {
        if (onActSwitch) {
          onActSwitch(actNumber);
        } else {
          switchToAct(actNumber);
        }
      },
      () => setIsQuickNavOpen(true),
      () => setIsGlobalSearchFocused(true)
    );

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [onActSwitch]);

  // Close quick nav on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsQuickNavOpen(false);
        setIsGlobalSearchFocused(false);
      }
    };

    if (isQuickNavOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isQuickNavOpen]);

  const openQuickNav = () => setIsQuickNavOpen(true);
  const closeQuickNav = () => setIsQuickNavOpen(false);
  
  const focusGlobalSearch = () => setIsGlobalSearchFocused(true);
  const blurGlobalSearch = () => setIsGlobalSearchFocused(false);

  const handleSearchNavigation = (result: SearchResult) => {
    // Generate navigation path based on result type
    let path = '';
    
    switch (result.type) {
      case 'project':
        path = `/project/${result.projectId}`;
        break;
      case 'act':
        path = `/project/${result.projectId}?act=${result.id}`;
        break;
      case 'plotpoint':
      case 'scene':
        path = `/project/${result.projectId}?act=${result.actId}&focus=${result.id}`;
        break;
      case 'character':
        path = `/project/${result.projectId}?character=${result.id}`;
        break;
      default:
        path = `/project/${result.projectId}`;
    }

    if (onNavigate) {
      onNavigate(path);
    } else {
      // Default navigation behavior
      window.location.href = path;
    }
  };

  const handleQuickNavigation = (item: any) => {
    if (onNavigate) {
      onNavigate(item.path);
    } else {
      // Default navigation behavior
      window.location.href = item.path;
    }
  };

  const switchToAct = (actNumber: number) => {
    if (!currentProject) return;
    
    // Find act by order/number
    const targetAct = currentProject.acts.find(act => act.order === actNumber);
    if (targetAct && onActSwitch) {
      onActSwitch(actNumber);
      
      // Track the act access
      NavigationService.trackActAccess(
        targetAct.id,
        targetAct.name,
        currentProject.id,
        currentProject.title
      );
    }
  };

  const value: SearchContextType = {
    isQuickNavOpen,
    openQuickNav,
    closeQuickNav,
    isGlobalSearchFocused,
    focusGlobalSearch,
    blurGlobalSearch,
    handleSearchNavigation,
    handleQuickNavigation,
    switchToAct,
    currentProject,
    setCurrentProject
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};
