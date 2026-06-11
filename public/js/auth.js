// =============================================
// AUTH.JS — Login & Register Views
// =============================================

const AuthView = {
  renderLogin() {
    return `
      <div class="auth-view">
        <div class="auth-card glass-panel">
          <div class="auth-logo">
            <h1>ChatVibe ✨</h1>
            <p>Chat, play, connect with friends</p>
          </div>
          <form id="loginForm">
            <div class="input-group">
              <label for="loginEmail">Email</label>
              <input type="email" id="loginEmail" placeholder="Enter your email" required autocomplete="email">
            </div>
            <div class="input-group">
              <label for="loginPassword">Password</label>
              <input type="password" id="loginPassword" placeholder="Enter your password" required autocomplete="current-password">
            </div>
            <button type="submit" class="btn btn-primary w-full btn-lg" id="loginBtn">
              Sign In
            </button>
          </form>
          <div class="auth-footer">
            Don't have an account? <a onclick="window.location.hash='#register'">Sign Up</a>
          </div>
        </div>
      </div>
    `;
  },

  renderRegister() {
    return `
      <div class="auth-view">
        <div class="auth-card glass-panel">
          <div class="auth-logo">
            <h1>Join ChatVibe ✨</h1>
            <p>Create your account</p>
          </div>
          <form id="registerForm">
            <div class="input-group">
              <label for="regUsername">Username</label>
              <input type="text" id="regUsername" placeholder="Choose a username" required minlength="3" maxlength="30" autocomplete="username">
            </div>
            <div class="input-group">
              <label for="regEmail">Email</label>
              <input type="email" id="regEmail" placeholder="Enter your email" required autocomplete="email">
            </div>
            <div class="input-group">
              <label for="regPassword">Password</label>
              <input type="password" id="regPassword" placeholder="Create a password (min 6 chars)" required minlength="6" autocomplete="new-password">
            </div>
            <button type="submit" class="btn btn-primary w-full btn-lg" id="registerBtn">
              Create Account
            </button>
          </form>
          <div class="auth-footer">
            Already have an account? <a onclick="window.location.hash='#login'">Sign In</a>
          </div>
        </div>
      </div>
    `;
  },

  initLogin() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('loginBtn');
      btn.disabled = true;
      btn.textContent = 'Signing in...';

      try {
        const data = await API.post('/api/auth/login', {
          email: document.getElementById('loginEmail').value,
          password: document.getElementById('loginPassword').value
        });

        API.setToken(data.token);
        App.currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));

        SocketManager.connect();
        Toast.success(`Welcome back, ${data.user.username}! 🎉`);

        // Apply user's theme
        document.body.className = `theme-${data.user.theme || 'pro'}`;
        
        NotificationManager.requestPermission();
        window.location.hash = '#chats';
      } catch (err) {
        Toast.error(err.message);
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });
  },

  initRegister() {
    const form = document.getElementById('registerForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('registerBtn');
      btn.disabled = true;
      btn.textContent = 'Creating account...';

      try {
        const data = await API.post('/api/auth/register', {
          username: document.getElementById('regUsername').value,
          email: document.getElementById('regEmail').value,
          password: document.getElementById('regPassword').value
        });

        API.setToken(data.token);
        App.currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));

        SocketManager.connect();
        Toast.success(`Account created! Welcome, ${data.user.username}! 🎉`);

        document.body.className = `theme-${data.user.theme || 'pro'}`;
        
        NotificationManager.requestPermission();
        window.location.hash = '#chats';
      } catch (err) {
        Toast.error(err.message);
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }
};
