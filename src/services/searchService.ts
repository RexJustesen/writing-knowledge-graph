import { ApiClient } from './api';
import { Project, Character, PlotPoint, Scene, Act } from './projectApiService';

// Search result interface as defined in Sprint 1
export interface SearchResult {
  id: string;
  type: 'project' | 'character' | 'plotpoint' | 'scene' | 'act';
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  actId?: string;
  actName?: string;
  // Additional metadata for context
  lastModified?: string;
  relevanceScore?: number;
}

// Search filters interface
export interface SearchFilters {
  types: ('character' | 'plotpoint' | 'scene' | 'project' | 'act')[];
  projectId?: string;
  actId?: string;
}

// Recent search item interface
export interface RecentSearchItem {
  query: string;
  timestamp: Date;
  resultCount: number;
}

export class SearchService {
  private static readonly RECENT_SEARCHES_KEY = 'writingGraph_recentSearches';
  private static readonly MAX_RECENT_SEARCHES = 10;

  // Global search across all projects
  static async searchAllProjects(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      
      if (filters?.types && filters.types.length > 0) {
        params.append('types', filters.types.join(','));
      }
      
      if (filters?.projectId) {
        params.append('projectId', filters.projectId);
      }
      
      if (filters?.actId) {
        params.append('actId', filters.actId);
      }

      const response = await ApiClient.authenticatedRequest<{ results: SearchResult[] }>(
        'GET',
        `/api/search?${params.toString()}`
      );

      // Store this search in recent searches
      this.addRecentSearch(query, response.results.length);

      return response.results;
    } catch (error) {
      console.error('Search failed:', error);
      // Return empty results on error rather than throwing
      return [];
    }
  }

  // Search within a specific project
  static async searchProject(projectId: string, query: string, filters?: Omit<SearchFilters, 'projectId'>): Promise<SearchResult[]> {
    const projectFilters: SearchFilters = {
      types: filters?.types || [],
      projectId,
      actId: filters?.actId
    };
    return this.searchAllProjects(query, projectFilters);
  }

  // Get recent searches from localStorage
  static getRecentSearches(): RecentSearchItem[] {
    try {
      const stored = localStorage.getItem(this.RECENT_SEARCHES_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    } catch (error) {
      console.error('Failed to load recent searches:', error);
      return [];
    }
  }

  // Add a search to recent searches
  static addRecentSearch(query: string, resultCount: number): void {
    try {
      const recent = this.getRecentSearches();
      
      // Remove duplicate if exists
      const filtered = recent.filter(item => item.query !== query);
      
      // Add new search at beginning
      const newItem: RecentSearchItem = {
        query,
        timestamp: new Date(),
        resultCount
      };
      
      filtered.unshift(newItem);
      
      // Keep only the most recent searches
      const trimmed = filtered.slice(0, this.MAX_RECENT_SEARCHES);
      
      localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  }

  // Clear recent searches
  static clearRecentSearches(): void {
    try {
      localStorage.removeItem(this.RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }

  // Fuzzy search for local filtering (used in quick nav)
  static fuzzyMatch(text: string, query: string): boolean {
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    
    // Simple fuzzy matching - check if all query characters appear in order
    let queryIndex = 0;
    for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
      if (normalizedText[i] === normalizedQuery[queryIndex]) {
        queryIndex++;
      }
    }
    
    return queryIndex === normalizedQuery.length;
  }
}
