import { useState, useEffect } from 'react';

const SIDEBAR_STATE_KEY = 'writing-planner-sidebar-collapsed';

export const useSidebarState = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial state from localStorage on component mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
      if (savedState !== null) {
        setIsCollapsed(JSON.parse(savedState));
      }
    } catch (error) {
      console.error('Failed to load sidebar state from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(isCollapsed));
      } catch (error) {
        console.error('Failed to save sidebar state to localStorage:', error);
      }
    }
  }, [isCollapsed, isLoaded]);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  return {
    isCollapsed,
    isLoaded,
    toggleSidebar,
    setSidebarCollapsed: setIsCollapsed
  };
};
