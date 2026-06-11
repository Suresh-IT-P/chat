// =============================================
// APP.JS — SPA Router, Theme Manager, Init
// =============================================

const NotificationManager = {
  wakeLock: null,

  async requestPermission() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (e) {
        console.error('Service Worker registration failed:', e);
      }
    }
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.error('Notification permission request failed', e);
      }
    }
  },

  async notify(title, options = {}) {
    if (localStorage.getItem('silent_mode') === 'true') return;
    if ('Notification' in window && Notification.permission === 'granted') {
      const opts = {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true, // High accuracy/persistence
        ...options
      };

      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          return registration.showNotification(title, opts);
        }
      }

      // Fallback
      const notification = new Notification(title, opts);
      notification.onclick = function() {
        window.focus();
        this.close();
      };
    }
  },

  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          console.log('Wake Lock was released');
        });
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  },

  releaseWakeLock() {
    if (this.wakeLock !== null) {
      this.wakeLock.release()
        .then(() => {
          this.wakeLock = null;
        });
    }
  },

  // Hack to prevent browser from sleeping/throttling the tab in background 24/7
  enable247KeepAlive() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      // Make it completely silent
      gainNode.gain.value = 0;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      console.log('24/7 Background keep-alive activated (Silent Audio)');

      // Also request screen wake lock
      this.requestWakeLock();
    } catch (e) {
      console.error('Keep-alive failed:', e);
    }
  }
};

const App = {
  currentUser: null,
  currentView: null,

  init() {
    // Load user from storage
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        document.body.className = `theme-${this.currentUser.theme || 'pro'}`;
      } catch (e) {}
    }

    // Setup router
    window.addEventListener('hashchange', () => this.route());
    this.route();

    // Request permissions on init and activate 24/7 keep-alive
    document.addEventListener('click', () => {
      NotificationManager.requestPermission();
      NotificationManager.enable247KeepAlive();
    }, { once: true });

    // Initialize Voice Manager
    VoiceManager.init();

    // Setup socket event listeners
    this.setupSocketListeners();

    // Connect socket if logged in
    if (API.getToken()) {
      SocketManager.connect();
    }
  },

  route() {
    const hash = window.location.hash || '#login';
    const [path, param] = hash.slice(1).split('/');

    const isAuthenticated = !!API.getToken();
    const bottomNav = document.getElementById('bottomNav');
    const app = document.getElementById('app');

    // Auth guard
    if (!isAuthenticated && path !== 'login' && path !== 'register') {
      window.location.hash = '#login';
      return;
    }

    // Redirect if already logged in
    if (isAuthenticated && (path === 'login' || path === 'register')) {
      window.location.hash = '#chats';
      return;
    }

    // Show/hide bottom nav
    const showNav = ['chats', 'friends', 'profile'].includes(path);
    bottomNav.style.display = showNav ? 'flex' : 'none';

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === path);
    });

    // Render view
    switch (path) {
      case 'login':
        app.innerHTML = AuthView.renderLogin();
        AuthView.initLogin();
        break;

      case 'register':
        app.innerHTML = AuthView.renderRegister();
        AuthView.initRegister();
        break;

      case 'chats':
        app.innerHTML = ChatView.renderConversationsList();
        ChatView.initConversationsList();
        break;

      case 'chat':
        if (param) {
          app.innerHTML = ChatView.renderChat();
          ChatView.initChat(param);
        }
        break;

      case 'friends':
        app.innerHTML = FriendsView.render();
        FriendsView.init();
        break;

      case 'profile':
        app.innerHTML = ProfileView.render();
        ProfileView.init();
        break;

      default:
        window.location.hash = isAuthenticated ? '#chats' : '#login';
    }

    this.currentView = path;
  },

  setupSocketListeners() {
    // Chat events
    SocketManager.on('new_message', ChatView.handleNewMessage);
    SocketManager.on('user_typing', ChatView.handleTypingEvent);
    SocketManager.on('user_stop_typing', ChatView.handleStopTypingEvent);
    SocketManager.on('messages_read', ChatView.handleMessagesRead);
    SocketManager.on('reaction_updated', ChatView.handleReactionUpdated);

    // Friend status
    SocketManager.on('friend_status', FriendsView.handleFriendStatus);

    // Friend request notification
    SocketManager.on('friend_request', (data) => {
      Toast.info(`${data.username} sent you a friend request! 👋`);
      NotificationManager.notify('New Friend Request', { body: `${data.username} wants to be your friend.` });
      const badge = document.getElementById('friendBadge');
      if (badge) {
        badge.classList.remove('hidden');
        badge.textContent = parseInt(badge.textContent || 0) + 1;
      }
    });

    // Game events
    SocketManager.on('game_invite', GameManager.handleGameInvite);
    SocketManager.on('game_created', GameManager.handleGameCreated);
    SocketManager.on('game_started', GameManager.handleGameStarted);
    SocketManager.on('game_update', GameManager.handleGameUpdate);
    SocketManager.on('game_ended', GameManager.handleGameEnded);

    // Error handler
    SocketManager.on('error', (data) => {
      Toast.error(data.message || 'Something went wrong');
    });
  }
};

// Bottom nav click handlers
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    window.location.hash = `#${item.dataset.view}`;
  });
});

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('app_unlocked') !== 'true') {
    renderAppLock();
  } else {
    App.init();
  }
});

function renderAppLock() {
  document.getElementById('bottomNav').style.display = 'none';
  document.getElementById('app').innerHTML = `
    <div class="auth-view">
      <div class="auth-card">
        <div class="auth-logo">
          <h1>🔒 Secure Access</h1>
          <p>Please enter the master password.</p>
        </div>
        <form onsubmit="unlockApp(event)" style="display:flex; flex-direction:column; gap:var(--sp-md);">
          <input type="password" id="masterPassword" class="input" placeholder="Password" required autofocus style="width: 100%; padding: var(--sp-md); border-radius: var(--r-lg); border: 2px solid var(--color-border); background: var(--input-bg); color: var(--color-text);">
          <button type="submit" class="btn btn-primary" style="width: 100%">Unlock App</button>
        </form>
      </div>
    </div>
  `;
}

window.unlockApp = function(e) {
  e.preventDefault();
  const pwd = document.getElementById('masterPassword').value.trim();
  if (pwd.toLowerCase() === 'rowdy') {
    localStorage.setItem('app_unlocked', 'true');
    App.init();
  } else {
    Toast.error('Incorrect password');
  }
};
