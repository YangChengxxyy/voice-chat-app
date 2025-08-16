const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: false,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['polling', 'websocket'],
  allowUpgrades: true,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

// 存储房间和用户信息
const rooms = new Map();
const users = new Map();

// 房间最大用户数
const MAX_USERS_PER_ROOM = 4;

// 工具函数
function createUser(id, name, socketId) {
  return {
    id,
    name,
    socketId,
    isConnected: true,
    isMuted: false,
    isSpeaking: false,
    joinedAt: new Date()
  };
}

function createRoom(id, name) {
  return {
    id,
    name,
    users: [],
    maxUsers: MAX_USERS_PER_ROOM,
    createdAt: new Date(),
    isActive: true
  };
}

function getUsersInRoom(roomId) {
  const room = rooms.get(roomId);
  return room ? room.users : [];
}

function addUserToRoom(roomId, user) {
  let room = rooms.get(roomId);

  if (!room) {
    room = createRoom(roomId, `Room ${roomId}`);
    rooms.set(roomId, room);
  }

  if (room.users.length >= room.maxUsers) {
    return { success: false, error: 'Room is full' };
  }

  // 检查用户是否已在房间中
  const existingUserIndex = room.users.findIndex(u => u.id === user.id);
  if (existingUserIndex !== -1) {
    // 更新现有用户信息
    room.users[existingUserIndex] = { ...room.users[existingUserIndex], ...user };
  } else {
    room.users.push(user);
  }

  users.set(user.id, { ...user, roomId });
  return { success: true, room, user };
}

function removeUserFromRoom(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room) return null;

  const userIndex = room.users.findIndex(u => u.id === userId);
  if (userIndex === -1) return null;

  const user = room.users[userIndex];
  room.users.splice(userIndex, 1);
  users.delete(userId);

  // 如果房间为空，删除房间
  if (room.users.length === 0) {
    rooms.delete(roomId);
  }

  return user;
}

function updateUserInRoom(roomId, userId, updates) {
  const room = rooms.get(roomId);
  if (!room) return null;

  const userIndex = room.users.findIndex(u => u.id === userId);
  if (userIndex === -1) return null;

  room.users[userIndex] = { ...room.users[userIndex], ...updates };

  // 同步更新users Map
  const user = users.get(userId);
  if (user) {
    users.set(userId, { ...user, ...updates });
  }

  return room.users[userIndex];
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id} at ${new Date().toISOString()}`);

  // 发送连接确认
  socket.emit('connection-confirmed', {
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });

  // 处理连接错误
  socket.on('error', (error) => {
    console.error(`Socket ${socket.id} error:`, error);
  });

  // 加入房间
  socket.on('join-room', ({ roomId, userName }) => {
    try {
      const userId = uuidv4();
      const user = createUser(userId, userName, socket.id);

      const result = addUserToRoom(roomId, user);

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      // 加入Socket.io房间
      socket.join(roomId);

      // 发送房间信息给新用户
      socket.emit('room-joined', {
        room: result.room,
        user: result.user
      });

      // 通知房间内其他用户
      socket.to(roomId).emit('user-joined', result.user);

      console.log(`User ${userName} (${userId}) joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // 离开房间
  socket.on('leave-room', ({ roomId, userId }) => {
    try {
      const user = removeUserFromRoom(roomId, userId);

      if (user) {
        socket.leave(roomId);
        socket.to(roomId).emit('user-left', userId);
        console.log(`User ${user.name} (${userId}) left room ${roomId}`);
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  // 切换静音状态
  socket.on('toggle-mute', ({ roomId, userId, isMuted }) => {
    try {
      const updatedUser = updateUserInRoom(roomId, userId, { isMuted });

      if (updatedUser) {
        // 通知房间内所有用户
        io.to(roomId).emit('user-updated', updatedUser);
        console.log(`User ${updatedUser.name} ${isMuted ? 'muted' : 'unmuted'}`);
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  });

  // WebRTC信令处理
  socket.on('webrtc-offer', ({ roomId, targetUserId, offer }) => {
    try {
      const targetUser = users.get(targetUserId);
      if (targetUser && targetUser.socketId) {
        const senderUser = Array.from(users.values()).find(u => u.socketId === socket.id);
        if (senderUser) {
          io.to(targetUser.socketId).emit('webrtc-offer-received', {
            fromUserId: senderUser.id,
            offer
          });
        }
      }
    } catch (error) {
      console.error('Error handling WebRTC offer:', error);
    }
  });

  socket.on('webrtc-answer', ({ roomId, targetUserId, answer }) => {
    try {
      const targetUser = users.get(targetUserId);
      if (targetUser && targetUser.socketId) {
        const senderUser = Array.from(users.values()).find(u => u.socketId === socket.id);
        if (senderUser) {
          io.to(targetUser.socketId).emit('webrtc-answer-received', {
            fromUserId: senderUser.id,
            answer
          });
        }
      }
    } catch (error) {
      console.error('Error handling WebRTC answer:', error);
    }
  });

  socket.on('webrtc-ice-candidate', ({ roomId, targetUserId, candidate }) => {
    try {
      const targetUser = users.get(targetUserId);
      if (targetUser && targetUser.socketId) {
        const senderUser = Array.from(users.values()).find(u => u.socketId === socket.id);
        if (senderUser) {
          io.to(targetUser.socketId).emit('webrtc-ice-candidate-received', {
            fromUserId: senderUser.id,
            candidate
          });
        }
      }
    } catch (error) {
      console.error('Error handling WebRTC ICE candidate:', error);
    }
  });

  // 处理断开连接
  socket.on('disconnect', (reason) => {
    console.log(`Client ${socket.id} disconnected: ${reason} at ${new Date().toISOString()}`);

    try {
      // 查找并移除断开连接的用户
      const user = Array.from(users.values()).find(u => u.socketId === socket.id);

      if (user) {
        const roomId = user.roomId;
        removeUserFromRoom(roomId, user.id);
        socket.to(roomId).emit('user-left', user.id);
        console.log(`User ${user.name} (${user.id}) disconnected from room ${roomId} at ${new Date().toISOString()}`);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  // 处理重连
  socket.on('reconnect', () => {
    console.log(`Client ${socket.id} reconnected at ${new Date().toISOString()}`);
    socket.emit('connection-confirmed', {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
      reconnected: true
    });
  });
});

// 定期清理空房间和离线用户
setInterval(() => {
  const now = new Date();
  const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30分钟

  // 清理长时间未活动的房间
  for (const [roomId, room] of rooms.entries()) {
    if (room.users.length === 0 && (now - room.createdAt) > CLEANUP_INTERVAL) {
      rooms.delete(roomId);
      console.log(`Cleaned up empty room: ${roomId}`);
    }
  }
}, 10 * 60 * 1000); // 每10分钟运行一次清理

const PORT = process.env.PORT || 3001;

// 错误处理
httpServer.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
  }
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Voice chat server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server started at: ${new Date().toISOString()}`);
  console.log(`CORS origins: ${process.env.NODE_ENV === 'production' ? 'production origins' : 'http://localhost:3000'}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Process terminated');
  });
});
