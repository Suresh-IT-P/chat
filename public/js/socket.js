// =============================================
// SOCKET.JS — Socket.IO Client Manager
// =============================================

const SocketManager = {
  socket: null,
  connected: false,
  handlers: {},

  connect() {
    const token = API.getToken();
    if (!token) return;

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io({
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
      if (err.message === 'Invalid token' || err.message === 'Authentication required') {
        API.removeToken();
        window.location.hash = '#login';
      }
    });

    // Register stored handlers
    Object.entries(this.handlers).forEach(([event, callbacks]) => {
      callbacks.forEach(cb => this.socket.on(event, cb));
    });
  },

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  },

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  },

  on(event, callback) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  },

  off(event, callback) {
    if (this.handlers[event]) {
      this.handlers[event] = this.handlers[event].filter(cb => cb !== callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  },

  removeAllListeners(event) {
    delete this.handlers[event];
    if (this.socket) {
      this.socket.removeAllListeners(event);
    }
  }
};
