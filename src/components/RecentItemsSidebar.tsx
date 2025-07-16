'use client';

import React, { useState, useEffect } from 'react';
import { NavigationService, RecentItem } from '@/services/navigationService';

interface RecentItemsSidebarProps {
  onNavigate: (item: RecentItem) => void;
  className?: string;
}

const RecentItemsSidebar: React.FC<RecentItemsSidebarProps> = ({
  onNavigate,
  className = ""
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Load recent items on mount and set up refresh interval
  useEffect(() => {
    const loadRecentItems = () => {
      setRecentItems(NavigationService.getRecentItems());
    };

    loadRecentItems();

    // Refresh recent items every 30 seconds in case other tabs updated them
    const interval = setInterval(loadRecentItems, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Load recent items from localStorage when component becomes visible
  useEffect(() => {
    const handleFocus = () => {
      setRecentItems(NavigationService.getRecentItems());
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleItemClick = (item: RecentItem) => {
    onNavigate(item);
    
    // Refresh the list to show updated access time
    setTimeout(() => {
      setRecentItems(NavigationService.getRecentItems());
    }, 100);
  };

  const handleClearRecent = () => {
    NavigationService.clearRecentItems();
    setRecentItems([]);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Drag and drop handlers (for future reordering functionality)
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    // Future: implement reordering logic here
    setDraggedItem(null);
  };

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className={`font-medium text-gray-900 ${isCollapsed ? 'hidden' : ''}`}>
          Recent Items
        </h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg 
            className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Items list */}
          <div className="flex-1 overflow-y-auto">
            {recentItems.length > 0 ? (
              <div className="p-2 space-y-1">
                {recentItems.map((item, index) => (
                  <button
                    key={`${item.type}-${item.id}-${item.accessedAt.getTime()}`}
                    onClick={() => handleItemClick(item)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, item.id)}
                    className={`w-full p-2 text-left rounded-lg hover:bg-gray-50 transition-colors group ${
                      draggedItem === item.id ? 'opacity-50' : ''
                    }`}
                    title={`${item.title} - ${getTimeAgo(item.accessedAt)}`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getTimeAgo(item.accessedAt)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {index + 1}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <div className="text-2xl mb-2">📝</div>
                <div className="text-sm">No recent items</div>
                <div className="text-xs text-gray-400 mt-1">
                  Items you access will appear here
                </div>
              </div>
            )}
          </div>

          {/* Footer with clear button */}
          {recentItems.length > 0 && (
            <div className="border-t border-gray-200 p-2">
              <button
                onClick={handleClearRecent}
                className="w-full px-3 py-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
              >
                Clear Recent Items
              </button>
            </div>
          )}
        </div>
      )}

      {/* Collapsed state indicator */}
      {isCollapsed && (
        <div className="p-2">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          {recentItems.length > 0 && (
            <div className="text-xs text-gray-400 text-center mt-1">
              {recentItems.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecentItemsSidebar;
