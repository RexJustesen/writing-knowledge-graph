import { io, Socket } from 'socket.io-client';
import { AuthService } from './authService';

export interface SocketEvents {
  // Project collaboration events
  'project-update': {
    projectId: string;
    type: 'project' | 'act' | 'plotpoint' | 'scene' | 'character' | 'setting' | 'item';
    action: 'create' | 'update' | 'delete';
    entityId: string;
    changes: any;
    userId: string;
  };

  'project-updated': {
    projectId: string;
    type: 'project' | 'act' | 'plotpoint' | 'scene' | 'character' | 'setting' | 'item';
    action: 'create' | 'update' | 'delete';
    entityId: string;
    changes: any;
    userId: string;
    timestamp: string;
    socketId: string;
  };

  // Canvas state synchronization
  'canvas-update': {
    projectId: string;
    actId: string;
    canvasState: {
      zoom: number;
      panPosition: { x: number; y: number };
      selectedNodeIds: string[];
      expandedPlotPointIds: string[];
    };
    userId: string;
  };

  'canvas-updated': {
    projectId: string;
    actId: string;
    canvasState: {
      zoom: number;
      panPosition: { x: number; y: number };
      selectedNodeIds: string[];
      expandedPlotPointIds: string[];
    };
    userId: string;
    timestamp: string;
    socketId: string;
  };

  // Live cursor tracking
  'cursor-move': {
    projectId: string;
    position: { x: number; y: number };
    userId: string;
    userName?: string;
  };

  'cursor-moved': {
    projectId: string;
    position: { x: number; y: number };
    userId: string;
    userName?: string;
    socketId: string;
    timestamp: string;
  };

  // Scene content collaboration
  'scene-edit-start': {
    projectId: string;
    sceneId: string;
    userId: string;
    userName?: string;
  };

  'scene-edit-started': {
    projectId: string;
    sceneId: string;
    userId: string;
    userName?: string;
    socketId: string;
    timestamp: string;
  };

  'scene-edit-end': {
    projectId: string;
    sceneId: string;
    userId: string;
  };

  'scene-edit-ended': {
    projectId: string;
    sceneId: string;
    userId: string;
    socketId: string;
    timestamp: string;
  };

  // Typing indicators
  'typing-start': {
    projectId: string;
    sceneId: string;
    userId: string;
    userName?: string;
  };

  'user-typing': {
    projectId: string;
    sceneId: string;
    userId: string;
    userName?: string;
    socketId: string;
    timestamp: string;
  };

  'typing-stop': {
    projectId: string;
    sceneId: string;
    userId: string;
  };

  'user-stopped-typing': {
    projectId: string;
    sceneId: string;
    userId: string;
    socketId: string;
    timestamp: string;
  };

  // Connection events
  'user-joined': {
    socketId: string;
    timestamp: string;
  };

  'user-left': {
    socketId: string;
    timestamp: string;
  };
}

export type SocketEventName = keyof SocketEvents;

export class SocketService {
  private static instance: SocketService | null = null;
  private socket: Socket | null = null;
  private currentProjectId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners = new Map<string, Set<Function>>();

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    
    this.socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentProjectId = null;
    this.reconnectAttempts = 0;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket.IO connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      
      // Rejoin current project if we were in one
      if (this.currentProjectId) {
        this.joinProject(this.currentProjectId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // Set up all event listeners
    Object.keys(this.eventListeners).forEach(eventName => {
      this.socket?.on(eventName, (...args) => {
        const listeners = this.eventListeners.get(eventName);
        if (listeners) {
          listeners.forEach(listener => listener(...args));
        }
      });
    });
  }

  joinProject(projectId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot join project');
      return;
    }

    if (this.currentProjectId && this.currentProjectId !== projectId) {
      this.leaveProject(this.currentProjectId);
    }

    this.currentProjectId = projectId;
    this.socket.emit('join-project', projectId);
  }

  leaveProject(projectId?: string): void {
    if (!this.socket?.connected) return;

    const targetProjectId = projectId || this.currentProjectId;
    if (targetProjectId) {
      this.socket.emit('leave-project', targetProjectId);
      if (targetProjectId === this.currentProjectId) {
        this.currentProjectId = null;
      }
    }
  }

  // Generic emit method
  emit<T extends SocketEventName>(eventName: T, data: SocketEvents[T]): void {
    if (!this.socket?.connected) {
      console.warn(`Socket not connected, cannot emit ${eventName}`);
      return;
    }

    this.socket.emit(eventName, data);
  }

  // Generic listener method
  on<T extends SocketEventName>(
    eventName: T, 
    listener: (data: SocketEvents[T]) => void
  ): () => void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }

    const listeners = this.eventListeners.get(eventName)!;
    listeners.add(listener);

    // Set up the actual socket listener if this is the first listener for this event
    if (listeners.size === 1 && this.socket) {
      this.socket.on(eventName as string, listener as any);
    }

    // Return cleanup function
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.socket?.off(eventName as string, listener as any);
        this.eventListeners.delete(eventName);
      }
    };
  }

  // Project update methods
  emitProjectUpdate(data: SocketEvents['project-update']): void {
    this.emit('project-update', data);
  }

  onProjectUpdate(listener: (data: SocketEvents['project-updated']) => void): () => void {
    return this.on('project-updated', listener);
  }

  // Canvas state methods
  emitCanvasUpdate(data: SocketEvents['canvas-update']): void {
    this.emit('canvas-update', data);
  }

  onCanvasUpdate(listener: (data: SocketEvents['canvas-updated']) => void): () => void {
    return this.on('canvas-updated', listener);
  }

  // Cursor tracking methods
  emitCursorMove(data: SocketEvents['cursor-move']): void {
    this.emit('cursor-move', data);
  }

  onCursorMove(listener: (data: SocketEvents['cursor-moved']) => void): () => void {
    return this.on('cursor-moved', listener);
  }

  // Scene editing methods
  emitSceneEditStart(data: SocketEvents['scene-edit-start']): void {
    this.emit('scene-edit-start', data);
  }

  onSceneEditStart(listener: (data: SocketEvents['scene-edit-started']) => void): () => void {
    return this.on('scene-edit-started', listener);
  }

  emitSceneEditEnd(data: SocketEvents['scene-edit-end']): void {
    this.emit('scene-edit-end', data);
  }

  onSceneEditEnd(listener: (data: SocketEvents['scene-edit-ended']) => void): () => void {
    return this.on('scene-edit-ended', listener);
  }

  // Typing indicator methods
  emitTypingStart(data: SocketEvents['typing-start']): void {
    this.emit('typing-start', data);
  }

  onTypingStart(listener: (data: SocketEvents['user-typing']) => void): () => void {
    return this.on('user-typing', listener);
  }

  emitTypingStop(data: SocketEvents['typing-stop']): void {
    this.emit('typing-stop', data);
  }

  onTypingStop(listener: (data: SocketEvents['user-stopped-typing']) => void): () => void {
    return this.on('user-stopped-typing', listener);
  }

  // Connection event listeners
  onUserJoined(listener: (data: SocketEvents['user-joined']) => void): () => void {
    return this.on('user-joined', listener);
  }

  onUserLeft(listener: (data: SocketEvents['user-left']) => void): () => void {
    return this.on('user-left', listener);
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentProjectId(): string | null {
    return this.currentProjectId;
  }

  // Get current user info for events
  private getCurrentUserInfo() {
    const user = AuthService.getCurrentUser();
    return {
      userId: user?.id || '',
      userName: user?.username || user?.email || 'Anonymous'
    };
  }

  // Convenience methods that include user info
  emitProjectUpdateWithUser(
    projectId: string,
    type: SocketEvents['project-update']['type'],
    action: SocketEvents['project-update']['action'],
    entityId: string,
    changes: any
  ): void {
    const { userId } = this.getCurrentUserInfo();
    this.emitProjectUpdate({
      projectId,
      type,
      action,
      entityId,
      changes,
      userId
    });
  }

  emitCanvasUpdateWithUser(
    projectId: string,
    actId: string,
    canvasState: SocketEvents['canvas-update']['canvasState']
  ): void {
    const { userId } = this.getCurrentUserInfo();
    this.emitCanvasUpdate({
      projectId,
      actId,
      canvasState,
      userId
    });
  }

  emitCursorMoveWithUser(
    projectId: string,
    position: { x: number; y: number }
  ): void {
    const { userId, userName } = this.getCurrentUserInfo();
    this.emitCursorMove({
      projectId,
      position,
      userId,
      userName
    });
  }

  emitSceneEditStartWithUser(projectId: string, sceneId: string): void {
    const { userId, userName } = this.getCurrentUserInfo();
    this.emitSceneEditStart({
      projectId,
      sceneId,
      userId,
      userName
    });
  }

  emitSceneEditEndWithUser(projectId: string, sceneId: string): void {
    const { userId } = this.getCurrentUserInfo();
    this.emitSceneEditEnd({
      projectId,
      sceneId,
      userId
    });
  }

  emitTypingStartWithUser(projectId: string, sceneId: string): void {
    const { userId, userName } = this.getCurrentUserInfo();
    this.emitTypingStart({
      projectId,
      sceneId,
      userId,
      userName
    });
  }

  emitTypingStopWithUser(projectId: string, sceneId: string): void {
    const { userId } = this.getCurrentUserInfo();
    this.emitTypingStop({
      projectId,
      sceneId,
      userId
    });
  }
}

// Export singleton instance
export const socketService = SocketService.getInstance();
