// =============================================
// FRIENDS.JS — Friends List & Requests
// =============================================

const FriendsView = {
  activeTab: 'friends',

  render() {
    return `
      <div class="view" id="friendsView">
        <div class="page-header">
          <h1>Friends</h1>
          <button class="btn-icon" onclick="FriendsView.showAddFriend()" title="Add friend">➕</button>
        </div>
        <div class="tabs">
          <button class="tab active" data-tab="friends" onclick="FriendsView.switchTab('friends')">Friends</button>
          <button class="tab" data-tab="requests" onclick="FriendsView.switchTab('requests')">Requests</button>
          <button class="tab" data-tab="online" onclick="FriendsView.switchTab('online')">Online</button>
        </div>
        <div id="friendsContent"></div>
      </div>
    `;
  },

  async init() {
    this.switchTab('friends');
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');

    switch (tab) {
      case 'friends': this.loadFriends(); break;
      case 'requests': this.loadRequests(); break;
      case 'online': this.loadOnline(); break;
    }
  },

  async loadFriends() {
    const content = document.getElementById('friendsContent');
    try {
      const friends = await API.get('/api/friends');

      if (friends.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">👥</div>
            <div class="empty-title">No friends yet</div>
            <div class="empty-desc">Tap the + button to add friends</div>
          </div>
        `;
        return;
      }

      content.innerHTML = friends.map(f => `
        <div class="list-item" onclick="FriendsView.startChat(${f.id}, '${ChatView.escapeHtml(f.username)}', '${f.avatar_url || ''}', ${f.is_online})">
          <div class="avatar-wrapper">
            <div class="avatar avatar-md">
              ${f.avatar_url ? `<img src="${f.avatar_url}" alt="${f.username}">` : f.username.charAt(0)}
            </div>
            <span class="online-indicator ${f.is_online ? '' : 'offline'}"></span>
          </div>
          <div class="list-item-content">
            <div class="name">${ChatView.escapeHtml(f.username)}</div>
            <div class="subtitle">${f.is_online ? '🟢 Online' : 'Offline'}</div>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); FriendsView.startChat(${f.id}, '${ChatView.escapeHtml(f.username)}', '${f.avatar_url || ''}', ${f.is_online})">💬</button>
        </div>
      `).join('');
    } catch (err) {
      console.error('Load friends error:', err);
      content.innerHTML = '<div class="empty-state"><div class="empty-desc">Failed to load friends</div></div>';
    }
  },

  async loadOnline() {
    const content = document.getElementById('friendsContent');
    try {
      const friends = await API.get('/api/friends');
      const online = friends.filter(f => f.is_online);

      if (online.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">😴</div>
            <div class="empty-title">No friends online</div>
            <div class="empty-desc">Your friends are all offline right now</div>
          </div>
        `;
        return;
      }

      content.innerHTML = online.map(f => `
        <div class="list-item" onclick="FriendsView.startChat(${f.id}, '${ChatView.escapeHtml(f.username)}', '${f.avatar_url || ''}', true)">
          <div class="avatar-wrapper">
            <div class="avatar avatar-md">
              ${f.avatar_url ? `<img src="${f.avatar_url}" alt="${f.username}">` : f.username.charAt(0)}
            </div>
            <span class="online-indicator"></span>
          </div>
          <div class="list-item-content">
            <div class="name">${ChatView.escapeHtml(f.username)}</div>
            <div class="subtitle">🟢 Online now</div>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); FriendsView.startChat(${f.id}, '${ChatView.escapeHtml(f.username)}', '${f.avatar_url || ''}', true)">💬</button>
        </div>
      `).join('');
    } catch (err) {
      console.error('Load online error:', err);
    }
  },

  async loadRequests() {
    const content = document.getElementById('friendsContent');
    try {
      const { received, sent } = await API.get('/api/friends/requests');

      if (received.length === 0 && sent.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <div class="empty-title">No pending requests</div>
            <div class="empty-desc">Friend requests will appear here</div>
          </div>
        `;
        return;
      }

      let html = '';

      if (received.length > 0) {
        html += `<div class="section-title">Received</div>`;
        html += received.map(r => `
          <div class="list-item">
            <div class="avatar avatar-md">
              ${r.avatar_url ? `<img src="${r.avatar_url}" alt="${r.username}">` : r.username.charAt(0)}
            </div>
            <div class="list-item-content">
              <div class="name">${ChatView.escapeHtml(r.username)}</div>
              <div class="subtitle">Wants to be friends</div>
            </div>
            <div class="flex gap-xs">
              <button class="btn btn-sm btn-success" onclick="FriendsView.acceptRequest(${r.id})">✓</button>
              <button class="btn btn-sm btn-danger" onclick="FriendsView.rejectRequest(${r.id})">✕</button>
            </div>
          </div>
        `).join('');
      }

      if (sent.length > 0) {
        html += `<div class="section-title">Sent</div>`;
        html += sent.map(r => `
          <div class="list-item">
            <div class="avatar avatar-md">
              ${r.avatar_url ? `<img src="${r.avatar_url}" alt="${r.username}">` : r.username.charAt(0)}
            </div>
            <div class="list-item-content">
              <div class="name">${ChatView.escapeHtml(r.username)}</div>
              <div class="subtitle">Request pending...</div>
            </div>
            <span class="badge badge-primary">Pending</span>
          </div>
        `).join('');
      }

      content.innerHTML = html;
    } catch (err) {
      console.error('Load requests error:', err);
    }
  },

  async acceptRequest(requestId) {
    try {
      await API.put(`/api/friends/request/${requestId}/accept`);
      Toast.success('Friend request accepted! 🎉');
      this.loadRequests();
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async rejectRequest(requestId) {
    try {
      await API.put(`/api/friends/request/${requestId}/reject`);
      Toast.info('Friend request rejected');
      this.loadRequests();
    } catch (err) {
      Toast.error(err.message);
    }
  },

  showAddFriend() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'addFriendModal';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-handle"></div>
        <div class="modal-header">
          <h2>Add Friend</h2>
          <button class="btn-icon" onclick="document.getElementById('addFriendModal').remove()">✕</button>
        </div>
        <div class="search-bar" style="margin:0">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="Search by username..." id="friendSearchInput" oninput="FriendsView.searchUsers()">
        </div>
        <div id="friendSearchResults" style="margin-top: 12px;"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.getElementById('friendSearchInput').focus();
  },

  async searchUsers() {
    const q = document.getElementById('friendSearchInput').value;
    const results = document.getElementById('friendSearchResults');

    if (q.length < 2) {
      results.innerHTML = '';
      return;
    }

    try {
      const users = await API.get(`/api/users/search?q=${encodeURIComponent(q)}`);

      if (users.length === 0) {
        results.innerHTML = '<div style="text-align:center;padding:16px;color:var(--color-text-secondary)">No users found</div>';
        return;
      }

      results.innerHTML = users.map(u => `
        <div class="list-item">
          <div class="avatar-wrapper">
            <div class="avatar avatar-md">
              ${u.avatar_url ? `<img src="${u.avatar_url}" alt="${u.username}">` : u.username.charAt(0)}
            </div>
            <span class="online-indicator ${u.is_online ? '' : 'offline'}"></span>
          </div>
          <div class="list-item-content">
            <div class="name">${ChatView.escapeHtml(u.username)}</div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="FriendsView.sendRequest(${u.id})">Add</button>
        </div>
      `).join('');
    } catch (err) {
      console.error('Search users error:', err);
    }
  },

  async sendRequest(userId) {
    try {
      await API.post(`/api/friends/request/${userId}`);
      Toast.success('Friend request sent! ✉️');
      document.getElementById('addFriendModal')?.remove();
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async startChat(userId, username, avatar, isOnline) {
    try {
      const data = await API.post(`/api/messages/conversations/${userId}`);
      ChatView.currentRecipient = { id: userId, username, avatar, is_online: isOnline };
      window.location.hash = `#chat/${data.conversation_id}`;
    } catch (err) {
      Toast.error('Failed to open chat');
    }
  },

  handleFriendStatus(data) {
    // Refresh if on friends view
    if (window.location.hash === '#friends') {
      FriendsView.switchTab(FriendsView.activeTab);
    }
  }
};
