import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { corsMiddleware, requestLogger, errorHandler, rateLimit } from './lib/middleware';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import actRoutes from './routes/acts';
import plotPointRoutes from './routes/plotpoints';
import sceneRoutes from './routes/scenes';
import characterRoutes from './routes/characters';
import settingRoutes from './routes/settings';
import itemRoutes from './routes/items';
import collaboratorRoutes from './routes/collaborators';

// Import environment variables
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(requestLogger);
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
app.use(rateLimit(rateLimitMax, rateLimitWindow));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', actRoutes);
app.use('/api/projects', plotPointRoutes);
app.use('/api/projects', sceneRoutes);
app.use('/api/projects', characterRoutes);
app.use('/api/projects', settingRoutes);
app.use('/api/projects', itemRoutes);
app.use('/api/projects', collaboratorRoutes);

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join project room for real-time collaboration
  socket.on('join-project', (projectId: string) => {
    socket.join(`project:${projectId}`);
    socket.to(`project:${projectId}`).emit('user-joined', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
    console.log(`User ${socket.id} joined project ${projectId}`);
  });

  // Leave project room
  socket.on('leave-project', (projectId: string) => {
    socket.leave(`project:${projectId}`);
    socket.to(`project:${projectId}`).emit('user-left', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
    console.log(`User ${socket.id} left project ${projectId}`);
  });

  // Real-time project updates
  socket.on('project-update', (data: {
    projectId: string;
    type: 'project' | 'act' | 'plotpoint' | 'scene' | 'character' | 'setting' | 'item';
    action: 'create' | 'update' | 'delete';
    entityId: string;
    changes: any;
    userId: string;
  }) => {
    // Broadcast to all users in the project room except sender
    socket.to(`project:${data.projectId}`).emit('project-updated', {
      ...data,
      timestamp: new Date().toISOString(),
      socketId: socket.id
    });
  });

  // Canvas state synchronization
  socket.on('canvas-update', (data: {
    projectId: string;
    actId: string;
    canvasState: {
      zoom: number;
      panPosition: { x: number; y: number };
      selectedNodeIds: string[];
      expandedPlotPointIds: string[];
    };
    userId: string;
  }) => {
    // Broadcast canvas state to other users
    socket.to(`project:${data.projectId}`).emit('canvas-updated', {
      ...data,
      timestamp: new Date().toISOString(),
      socketId: socket.id
    });
  });

  // Live cursor tracking
  socket.on('cursor-move', (data: {
    projectId: string;
    position: { x: number; y: number };
    userId: string;
    userName?: string;
  }) => {
    socket.to(`project:${data.projectId}`).emit('cursor-moved', {
      ...data,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Scene content collaboration
  socket.on('scene-edit-start', (data: {
    projectId: string;
    sceneId: string;
    userId: string;
    userName?: string;
  }) => {
    socket.to(`project:${data.projectId}`).emit('scene-edit-started', {
      ...data,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('scene-edit-end', (data: {
    projectId: string;
    sceneId: string;
    userId: string;
  }) => {
    socket.to(`project:${data.projectId}`).emit('scene-edit-ended', {
      ...data,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Typing indicators
  socket.on('typing-start', (data: {
    projectId: string;
    sceneId: string;
    userId: string;
    userName?: string;
  }) => {
    socket.to(`project:${data.projectId}`).emit('user-typing', {
      ...data,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('typing-stop', (data: {
    projectId: string;
    sceneId: string;
    userId: string;
  }) => {
    socket.to(`project:${data.projectId}`).emit('user-stopped-typing', {
      ...data,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Socket.IO automatically handles leaving rooms on disconnect
  });

  // Error handling for socket events
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Socket.IO enabled for real-time collaboration`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Make io available for other modules
export { io };

export default app;
