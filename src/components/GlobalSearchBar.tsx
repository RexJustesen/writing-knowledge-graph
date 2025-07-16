'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SearchService, SearchResult, SearchFilters } from '@/services/searchService';
import { NavigationService } from '@/services/navigationService';
import { Project } from '@/types/story';

interface GlobalSearchBarProps {
  placeholder?: string;
  currentProjectId?: string;
  currentProject?: Project; // Add current project for client-side search fallback
  onNavigate?: (result: SearchResult) => void;
  className?: string;
}

const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  placeholder = "Search across all projects...",
  currentProjectId,
  currentProject,
  onNavigate,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [filters, setFilters] = useState<SearchFilters>({ types: [] });

  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Client-side search fallback for current project
  const performClientSideSearch = (searchQuery: string): SearchResult[] => {
    if (!currentProject || !searchQuery.trim()) {
      return [];
    }

    const results: SearchResult[] = [];
    const query = searchQuery.toLowerCase();

    // Search plot points
    currentProject.plotPoints.forEach(plotPoint => {
      if (plotPoint.title.toLowerCase().includes(query)) {
        results.push({
          id: plotPoint.id,
          type: 'plotpoint',
          title: plotPoint.title,
          description: `Plot Point in ${currentProject.acts.find(a => a.id === plotPoint.actId)?.name || 'Unknown Act'}`,
          projectId: currentProject.id,
          projectName: currentProject.title,
          actId: plotPoint.actId
        });
      }

      // Search scenes within plot points
      plotPoint.scenes.forEach(scene => {
        if (scene.title.toLowerCase().includes(query)) {
          results.push({
            id: scene.id,
            type: 'scene',
            title: scene.title,
            description: `Scene in "${plotPoint.title}"`,
            projectId: currentProject.id,
            projectName: currentProject.title,
            actId: plotPoint.actId
          });
        }
      });
    });

    // Search characters
    currentProject.characters.forEach(character => {
      if (character.name.toLowerCase().includes(query)) {
        results.push({
          id: character.id,
          type: 'character',
          title: character.name,
          description: `${character.characterType || 'Character'} in ${currentProject.title}`,
          projectId: currentProject.id,
          projectName: currentProject.title
        });
      }
    });

    // Search acts
    currentProject.acts.forEach(act => {
      if (act.name.toLowerCase().includes(query)) {
        results.push({
          id: act.id,
          type: 'act',
          title: act.name,
          description: act.description || `Act in ${currentProject.title}`,
          projectId: currentProject.id,
          projectName: currentProject.title,
          actId: act.id
        });
      }
    });

    return results;
  };

  // Debounced search function
  const performSearch = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      let searchResults: SearchResult[] = [];
      
      // Try backend search first
      if (currentProjectId) {
        searchResults = await SearchService.searchProject(currentProjectId, searchQuery, filters);
      } else {
        searchResults = await SearchService.searchAllProjects(searchQuery, filters);
      }
      
      // If backend search returns no results and we have current project data, 
      // fall back to client-side search
      if (searchResults.length === 0 && currentProject && currentProjectId) {
        console.log('Backend search returned no results, falling back to client-side search...');
        searchResults = performClientSideSearch(searchQuery);
      }
      
      setResults(searchResults);
      setIsOpen(searchResults.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search failed:', error);
      
      // On error, try client-side search as fallback
      if (currentProject && currentProjectId) {
        console.log('Backend search failed, falling back to client-side search...');
        const clientResults = performClientSideSearch(searchQuery);
        setResults(clientResults);
        setIsOpen(clientResults.length > 0);
        setSelectedIndex(-1);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search by 300ms
    debounceRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, 300);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        searchRef.current?.blur();
        break;
    }
  };

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    // Track the navigation
    switch (result.type) {
      case 'project':
        NavigationService.trackProjectAccess(result.id, result.title);
        break;
      case 'plotpoint':
        NavigationService.trackPlotPointAccess(result.id, result.title, result.projectId, result.actId || '', result.projectName);
        break;
      case 'character':
        NavigationService.trackCharacterAccess(result.id, result.title, result.projectId, result.projectName);
        break;
      case 'scene':
        NavigationService.trackSceneAccess(result.id, result.title, result.projectId, result.actId || '', result.projectName);
        break;
      case 'act':
        NavigationService.trackActAccess(result.id, result.title, result.projectId, result.projectName);
        break;
    }

    setIsOpen(false);
    setQuery('');
    searchRef.current?.blur();

    if (onNavigate) {
      onNavigate(result);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node) &&
          searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Types', types: [] },
    { value: 'projects', label: 'Projects', types: ['project'] },
    { value: 'characters', label: 'Characters', types: ['character'] },
    { value: 'plotpoints', label: 'Plot Points', types: ['plotpoint'] },
    { value: 'scenes', label: 'Scenes', types: ['scene'] },
    { value: 'acts', label: 'Acts', types: ['act'] }
  ];

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'project': return '📁';
      case 'character': return '👤';
      case 'plotpoint': return '🎯';
      case 'scene': return '🎬';
      case 'act': return '📖';
      default: return '📄';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
        />
        
        {/* Search icon */}
        <div className="absolute left-3 top-2.5 h-4 w-4 text-gray-400">
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
          ) : (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Search results dropdown */}
      {isOpen && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {/* Filter tabs */}
          <div className="flex border-b border-gray-200 p-2 space-x-1">
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setFilters({ types: option.types as SearchFilters['types'] });
                  if (query.trim().length >= 2) {
                    performSearch(query);
                  }
                }}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  JSON.stringify(filters.types) === JSON.stringify(option.types)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Results */}
          {results.length > 0 ? (
            <div className="py-1">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultSelect(result)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">{getResultIcon(result.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {result.description}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {result.projectName}
                        {result.actName && ` • ${result.actName}`}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 capitalize">
                      {result.type}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 && !isLoading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="text-lg mb-2">🔍</div>
              <div className="text-sm">No results found for "{query}"</div>
              <div className="text-xs text-gray-400 mt-1">
                Try different keywords or check your filters
              </div>
            </div>
          ) : null}

          {/* Keyboard hints */}
          {results.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-400 bg-gray-50">
              <div className="flex items-center justify-between">
                <span>Use ↑↓ to navigate, Enter to select</span>
                <span>ESC to close</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBar;
