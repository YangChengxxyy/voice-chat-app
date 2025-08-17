const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const httpServer = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // Default response for other paths
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      // 允许的源列表
      const allowedOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://host.docker.internal:3000",
        "http://0.0.0.0:3000"
      ];

      // 从环境变量获取额外的允许源
      if (process.env.CORS_ORIGIN) {
        const envOrigins = process.env.CORS_ORIGIN.split(',');
        allowedOrigins.push(...envOrigins);
      }

      // 如果没有 origin（比如同源请求或某些工具），允许访问
      if (!origin) return callback(null, true);

      // 检查 origin 是否在允许列表中
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
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
  const existingUser = room.users.find(u => u.id === user.id);
  if (existingUser) {
    existingUser.socketId = user.socketId;
    existingUser.isConnected = true;
    users.set(user.id, existingUser);
    return { success: true, room, user: existingUser };
  }

  room.users.push(user);
  users.set(user.id, user);

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

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 加入房间
  socket.on('join-room', ({ roomId, userName }) => {
    try {
      const userId = uuidv4();
      const user = createUser(userId, userName, socket.id);

      const result = addUserToRoom(roomId, user);

      if (!result.success) {
        socket.emit('join-error', { error: result.error });
        return;
      }

      socket.join(roomId);

      // 发送用户自己的信息
      socket.emit('user-joined', {
        user: result.user,
        room: result.room,
        users: result.room.users
      });

      // 通知房间内其他用户
      socket.to(roomId).emit('user-connected', {
        user: result.user,
        users: result.room.users
      });

      console.log(`User ${userName} (${userId}) joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('join-error', { error: 'Failed to join room' });
    }
  });

  // 用户状态更新
  socket.on('user-state-change', ({ roomId, updates }) => {
    try {
      const user = Array.from(users.values()).find(u => u.socketId === socket.id);
      if (!user) return;

      const updatedUser = updateUserInRoom(roomId, user.id, updates);
      if (updatedUser) {
        // 广播给房间内所有用户（包括自己）
        io.to(roomId).emit('user-state-updated', {
          userId: user.id,
          updates: updates
        });
      }
    } catch (error) {
      console.error('Error updating user state:', error);
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
      console.error('Error handling ICE candidate:', error);
    }
  });

  // 离开房间
  socket.on('leave-room', ({ roomId }) => {
    try {
      const user = Array.from(users.values()).find(u => u.socketId === socket.id);
      if (user) {
        const removedUser = removeUserFromRoom(roomId, user.id);
        if (removedUser) {
          socket.leave(roomId);
          socket.to(roomId).emit('user-disconnected', {
            user: removedUser,
            users: getUsersInRoom(roomId)
          });
          console.log(`User ${removedUser.name} left room ${roomId}`);
        }
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  // 断开连接处理
  socket.on('disconnect', () => {
    try {
      const user = Array.from(users.values()).find(u => u.socketId === socket.id);
      if (user) {
        // 找到用户所在的房间
        for (const [roomId, room] of rooms.entries()) {
          const userInRoom = room.users.find(u => u.id === user.id);
          if (userInRoom) {
            const removedUser = removeUserFromRoom(roomId, user.id);
            if (removedUser) {
              socket.to(roomId).emit('user-disconnected', {
                user: removedUser,
                users: getUsersInRoom(roomId)
              });
              console.log(`User ${removedUser.name} disconnected from room ${roomId}`);
            }
            break;
          }
        }
      }
      console.log(`User disconnected: ${socket.id}`);
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// 定期清理空房间
setInterval(() => {
  try {
    for (const [roomId, room] of rooms.entries()) {
      if (room.users.length === 0) {
        const roomAge = Date.now() - room.createdAt.getTime();
        // 删除创建超过30分钟的空房间
        if (roomAge > (process.env.ROOM_CLEANUP_INTERVAL || 1800000)) {
          rooms.delete(roomId);
          console.log(`Cleaned up empty room: ${roomId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error during room cleanup:', error);
  }
}, 300000); // 每5分钟检查一次

// 启动服务器
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Voice chat server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server started at: ${new Date().toISOString()}`);
  console.log(`CORS origins: ${process.env.CORS_ORIGIN || 'localhost development origins'}`);
});
