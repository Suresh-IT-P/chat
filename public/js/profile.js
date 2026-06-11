// =============================================
// PROFILE.JS — Profile & Settings View
// =============================================

const ProfileView = {
  render() {
    const user = App.currentUser || {};
    const theme = user.theme || 'pro';

    return `
      <div class="view" id="profileView">
        <div class="page-header">
          <h1>Profile</h1>
        </div>
        <div class="profile-header">
          <div class="profile-avatar-wrapper">
            <div class="avatar avatar-2xl" id="profileAvatar">
              ${user.avatar_url ? `<img src="${user.avatar_url}" alt="${user.username}">` : (user.username || 'U').charAt(0)}
            </div>
            <label class="profile-avatar-edit" for="avatarUpload">📷</label>
            <input type="file" id="avatarUpload" accept="image/*" style="display:none" onchange="ProfileView.uploadAvatar(event)">
          </div>
          <div class="profile-username">${ChatView.escapeHtml(user.username || 'User')}</div>
          <div class="profile-email">${ChatView.escapeHtml(user.email || '')}</div>
        </div>

        <div class="profile-section">
          <div class="section-title">Theme</div>
          <div class="theme-selector">
            <button class="theme-option ${theme === 'classic' ? 'active' : ''}" onclick="ProfileView.setTheme('classic')">
              <div class="theme-preview theme-preview-classic"></div>
              <div class="theme-name">Classic</div>
            </button>
            <button class="theme-option ${theme === 'pro' ? 'active' : ''}" onclick="ProfileView.setTheme('pro')">
              <div class="theme-preview theme-preview-pro"></div>
              <div class="theme-name">Pro</div>
            </button>
            <button class="theme-option ${theme === 'romantic' ? 'active' : ''}" onclick="ProfileView.setTheme('romantic')">
              <div class="theme-preview theme-preview-romantic"></div>
              <div class="theme-name">Romantic</div>
            </button>
          </div>
        </div>

        <div class="profile-section">
          <div class="section-title">Account</div>
          <div class="settings-item">
            <div class="settings-label">
              <span class="settings-icon">👤</span>
              <span class="settings-text">Username</span>
            </div>
            <span style="color:var(--color-text-secondary);font-size:0.875rem">${ChatView.escapeHtml(user.username || '')}</span>
          </div>
          <div class="settings-item">
            <div class="settings-label">
              <span class="settings-icon">📧</span>
              <span class="settings-text">Email</span>
            </div>
            <span style="color:var(--color-text-secondary);font-size:0.875rem">${ChatView.escapeHtml(user.email || '')}</span>
          </div>
        </div>

        <div class="profile-section">
          <div class="section-title">Preferences</div>
          <div class="settings-item">
            <div class="settings-label">
              <span class="settings-icon">🔕</span>
              <span class="settings-text">Silent Mode (No Notifications)</span>
            </div>
            <label class="switch">
              <input type="checkbox" id="silentModeToggle" ${localStorage.getItem('silent_mode') === 'true' ? 'checked' : ''} onchange="ProfileView.toggleSilentMode(event)">
              <span class="slider round"></span>
            </label>
          </div>
        </div>

        <div class="profile-section" style="padding-bottom: 100px;">
          <button class="btn btn-danger w-full" onclick="ProfileView.logout()">
            🚪 Logout
          </button>
        </div>
      </div>
    `;
  },

  async init() {
    // Refresh user data
    try {
      const user = await API.get('/api/auth/me');
      App.currentUser = user;
      localStorage.setItem('user', JSON.stringify(user));
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  },

  async setTheme(theme) {
    try {
      await API.put('/api/users/me', { theme });
      document.body.className = `theme-${theme}`;
      App.currentUser.theme = theme;
      localStorage.setItem('user', JSON.stringify(App.currentUser));

      // Update theme selectors
      document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
      document.querySelector(`.theme-option[onclick*="${theme}"]`)?.classList.add('active');

      Toast.success(`Theme changed to ${theme.charAt(0).toUpperCase() + theme.slice(1)}! ✨`);

      // Romantic theme hearts
      if (theme === 'romantic') {
        ProfileView.spawnHearts();
      }
    } catch (err) {
      Toast.error('Failed to update theme');
    }
  },

  async uploadAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const data = await API.post('/api/users/avatar', formData);

      App.currentUser.avatar_url = data.avatar_url;
      localStorage.setItem('user', JSON.stringify(App.currentUser));

      const avatar = document.getElementById('profileAvatar');
      avatar.innerHTML = `<img src="${data.avatar_url}" alt="Avatar">`;

      Toast.success('Profile picture updated! 📸');
    } catch (err) {
      Toast.error('Failed to upload avatar');
    }
  },

  logout() {
    API.removeToken();
    localStorage.removeItem('user');
    SocketManager.disconnect();
    App.currentUser = null;
    window.location.hash = '#login';
    Toast.info('Logged out successfully');
  },

  toggleSilentMode(event) {
    const isSilent = event.target.checked;
    localStorage.setItem('silent_mode', isSilent);
    if (isSilent) {
      Toast.info('Silent Mode ON: Notifications disabled');
    } else {
      Toast.success('Silent Mode OFF: Notifications enabled');
    }
  },

  spawnHearts() {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const heart = document.createElement('div');
        heart.className = 'heart-particle';
        heart.textContent = ['❤️', '💕', '💖', '💗', '💘'][Math.floor(Math.random() * 5)];
        heart.style.left = Math.random() * 100 + 'vw';
        heart.style.bottom = '0';
        heart.style.animationDuration = (3 + Math.random() * 3) + 's';
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 6000);
      }, i * 300);
    }
  }
};
