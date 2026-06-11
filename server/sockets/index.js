const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const setupChat = require('./chat');
const setupPresence = require('./presence');
const setupGames = require('./games');
const setupWebRTC = require('./webrtc');

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_for_development');
      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 ${socket.username} connected (${socket.id})`);

    // Track online user
    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, new Set());
    }
    onlineUsers.get(socket.userId).add(socket.id);

    // Join personal room for direct events
    socket.join(`user:${socket.userId}`);

    // Setup handlers
    setupChat(io, socket, onlineUsers);
    setupPresence(io, socket, onlineUsers);
    setupGames(io, socket, onlineUsers);
    setupWebRTC(io, socket, onlineUsers);

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ ${socket.username} disconnected (${socket.id})`);
      const userSockets = onlineUsers.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(socket.userId);
          // Emit offline status
          setupPresence.goOffline(io, socket, onlineUsers);
        }
      }
    });
  });

  return io;
}

module.exports = { setupSocket, onlineUsers };
