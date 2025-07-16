// Navigation service for handling app-wide navigation, keyboard shortcuts, and recent items tracking

export interface NavigationItem {
  id: string;
  type: 'project' | 'character' | 'plotpoint' | 'scene' | 'act';
  title: string;
  subtitle: string;
  icon: string;
  path: string;
  projectId: string;
  actId?: string;
}

export interface RecentItem {
  id: string;
  type: string;
  title: string;
  projectId: string;
  actId?: string;
  accessedAt: Date;
  icon: string;
}

export class NavigationService {
  private static readonly RECENT_ITEMS_KEY = 'writingGraph_recentItems';
  private static readonly MAX_RECENT_ITEMS = 15;

  // Get recent items from localStorage
  static getRecentItems(): RecentItem[] {
    try {
      const stored = localStorage.getItem(this.RECENT_ITEMS_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((item: any) => ({
        ...item,
        accessedAt: new Date(item.accessedAt)
      })).sort((a: RecentItem, b: RecentItem) => 
        b.accessedAt.getTime() - a.accessedAt.getTime()
      );
    } catch (error) {
      console.error('Failed to load recent items:', error);
      return [];
    }
  }

  // Add an item to recent items
  static addRecentItem(item: Omit<RecentItem, 'accessedAt'>): void {
    try {
      const recent = this.getRecentItems();
      
      // Remove duplicate if exists
      const filtered = recent.filter(existing => 
        !(existing.id === item.id && existing.type === item.type)
      );
      
      // Add new item at beginning
      const newItem: RecentItem = {
        ...item,
        accessedAt: new Date()
      };
      
      filtered.unshift(newItem);
      
      // Keep only the most recent items
      const trimmed = filtered.slice(0, this.MAX_RECENT_ITEMS);
      
      localStorage.setItem(this.RECENT_ITEMS_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to save recent item:', error);
    }
  }

  // Clear recent items
  static clearRecentItems(): void {
    try {
      localStorage.removeItem(this.RECENT_ITEMS_KEY);
    } catch (error) {
      console.error('Failed to clear recent items:', error);
    }
  }

  // Get icon for different item types
  static getIconForType(type: string): string {
    switch (type) {
      case 'project':
        return '📁';
      case 'character':
        return '👤';
      case 'plotpoint':
        return '🎯';
      case 'scene':
        return '🎬';
      case 'act':
        return '📖';
      default:
        return '📄';
    }
  }

  // Generate navigation path for different item types
  static generatePath(type: string, projectId: string, actId?: string, itemId?: string): string {
    switch (type) {
      case 'project':
        return `/project/${projectId}`;
      case 'act':
        return `/project/${projectId}?act=${actId}`;
      case 'plotpoint':
      case 'scene':
        return `/project/${projectId}?act=${actId}&focus=${itemId}`;
      case 'character':
        return `/project/${projectId}?character=${itemId}`;
      default:
        return `/project/${projectId}`;
    }
  }

  // Keyboard shortcut handler
  static createKeyboardHandler(
    onActSwitch: (actNumber: number) => void,
    onQuickNav: () => void,
    onGlobalSearch: () => void
  ) {
    return (e: KeyboardEvent) => {
      // Check if we're in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Only handle certain shortcuts in input fields
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          onQuickNav();
        }
        return;
      }

      // Global shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
            e.preventDefault();
            onActSwitch(parseInt(e.key));
            break;
          case 'k':
            e.preventDefault();
            onQuickNav();
            break;
          case '/':
            e.preventDefault();
            onGlobalSearch();
            break;
        }
      }

      // Escape key handling
      if (e.key === 'Escape') {
        // Let components handle their own escape logic
        return;
      }
    };
  }

  // Track project access for recent projects
  static trackProjectAccess(projectId: string, projectTitle: string): void {
    this.addRecentItem({
      id: projectId,
      type: 'project',
      title: projectTitle,
      projectId,
      icon: this.getIconForType('project')
    });
  }

  // Track act access
  static trackActAccess(actId: string, actName: string, projectId: string, projectTitle: string): void {
    this.addRecentItem({
      id: actId,
      type: 'act',
      title: `${projectTitle} - ${actName}`,
      projectId,
      actId,
      icon: this.getIconForType('act')
    });
  }

  // Track plot point access
  static trackPlotPointAccess(plotPointId: string, plotPointTitle: string, projectId: string, actId: string, projectTitle: string): void {
    this.addRecentItem({
      id: plotPointId,
      type: 'plotpoint',
      title: plotPointTitle,
      projectId,
      actId,
      icon: this.getIconForType('plotpoint')
    });
  }

  // Track character access
  static trackCharacterAccess(characterId: string, characterName: string, projectId: string, projectTitle: string): void {
    this.addRecentItem({
      id: characterId,
      type: 'character',
      title: `${characterName} (${projectTitle})`,
      projectId,
      icon: this.getIconForType('character')
    });
  }

  // Track scene access
  static trackSceneAccess(sceneId: string, sceneTitle: string, projectId: string, actId: string, projectTitle: string): void {
    this.addRecentItem({
      id: sceneId,
      type: 'scene',
      title: sceneTitle,
      projectId,
      actId,
      icon: this.getIconForType('scene')
    });
  }
}
