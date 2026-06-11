// =============================================
// CHAT.JS — Conversations & Messaging
// =============================================

const ChatView = {
  currentConversation: null,
  currentRecipient: null,
  typingTimeout: null,
  pendingImage: null,

  // ============ CONVERSATIONS LIST ============
  renderConversationsList() {
    return `
      <div class="view" id="chatsView">
        <div class="page-header">
          <h1>Chats</h1>
          <div class="flex gap-sm">
            <button class="btn-icon" onclick="ChatView.showSearch()" title="Search messages">🔍</button>
          </div>
        </div>
        <div class="search-bar hidden" id="messageSearchBar">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="Search messages..." id="messageSearchInput" oninput="ChatView.searchMessages()">
        </div>
        <div id="searchResults" class="hidden"></div>
        <div id="conversationsList"></div>
      </div>
    `;
  },

  async initConversationsList() {
    try {
      const conversations = await API.get('/api/messages/conversations');
      const list = document.getElementById('conversationsList');

      if (conversations.length === 0) {
        list.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">💬</div>
            <div class="empty-title">No conversations yet</div>
            <div class="empty-desc">Add friends and start chatting!</div>
          </div>
        `;
        return;
      }

      list.innerHTML = conversations.map(c => `
        <div class="list-item" onclick="ChatView.openChat(${c.id}, ${c.other_user_id}, '${this.escapeHtml(c.other_username)}', '${c.other_avatar || ''}', ${c.other_online})">
          <div class="avatar-wrapper">
            <div class="avatar avatar-md">
              ${c.other_avatar
                ? `<img src="${c.other_avatar}" alt="${c.other_username}">`
                : c.other_username.charAt(0)
              }
            </div>
            <span class="online-indicator ${c.other_online ? '' : 'offline'}"></span>
          </div>
          <div class="list-item-content">
            <div class="name">${this.escapeHtml(c.other_username)}</div>
            <div class="subtitle truncate">${c.last_message ? this.escapeHtml(c.last_message) : 'Start chatting...'}</div>
          </div>
          <div class="list-item-meta">
            <span class="time">${this.formatTime(c.last_message_at)}</span>
            ${c.unread_count > 0 ? `<span class="badge">${c.unread_count}</span>` : ''}
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Load conversations error:', err);
    }
  },

  showSearch() {
    const bar = document.getElementById('messageSearchBar');
    bar.classList.toggle('hidden');
    if (!bar.classList.contains('hidden')) {
      document.getElementById('messageSearchInput').focus();
    }
  },

  async searchMessages() {
    const q = document.getElementById('messageSearchInput').value;
    const results = document.getElementById('searchResults');

    if (q.length < 2) {
      results.classList.add('hidden');
      return;
    }

    try {
      const messages = await API.get(`/api/messages/search/all?q=${encodeURIComponent(q)}`);
      results.classList.remove('hidden');

      if (messages.length === 0) {
        results.innerHTML = '<div class="empty-state" style="padding:24px"><div class="empty-desc">No messages found</div></div>';
        return;
      }

      results.innerHTML = messages.map(m => `
        <div class="list-item" onclick="ChatView.openChatById(${m.conversation_id})">
          <div class="list-item-content">
            <div class="name text-sm">${this.escapeHtml(m.sender_username)} → ${this.escapeHtml(m.other_username)}</div>
            <div class="subtitle truncate">${this.highlightSearch(m.content, q)}</div>
          </div>
          <div class="list-item-meta">
            <span class="time">${this.formatTime(m.created_at)}</span>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Search error:', err);
    }
  },

  highlightSearch(text, query) {
    if (!text) return '';
    const escaped = this.escapeHtml(text);
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escaped.replace(regex, '<strong style="color:var(--color-primary)">$1</strong>');
  },

  // ============ CHAT VIEW ============
  renderChat() {
    return `
      <div class="chat-view" id="chatView">
        <div class="chat-header">
          <button class="back-btn" onclick="window.location.hash='#chats'">←</button>
          <div class="avatar-wrapper">
            <div class="avatar avatar-md" id="chatAvatar"></div>
            <span class="online-indicator" id="chatOnline"></span>
          </div>
          <div class="chat-header-info">
            <div class="name" id="chatName"></div>
            <div class="status" id="chatStatus">Online</div>
          </div>
          <div class="chat-header-actions">
            <button class="btn-icon" onclick="VoiceManager.startCall(ChatView.currentRecipient?.id, ChatView.currentRecipient?.username)" title="Voice Call">📞</button>
            <button class="btn-icon" onclick="GameManager.showGamePicker()" title="Play games">🎮</button>
          </div>
        </div>
        <div class="messages-container" id="messagesContainer"></div>
        <div class="typing-indicator hidden" id="typingIndicator">
          <div class="typing-dots"><span></span><span></span><span></span></div>
          <span id="typingText">typing...</span>
        </div>
        <div class="image-preview-bar hidden" id="imagePreview">
          <img id="previewImg" src="" alt="Preview">
          <span style="flex:1;font-size:0.8rem;color:var(--color-text-secondary)">Image attached</span>
          <button class="remove-btn" onclick="ChatView.removeImage()">✕</button>
        </div>
        <div class="message-input-area">
          <div class="message-input-wrapper">
            <div class="input-actions">
              <button class="emoji-trigger" onclick="EmojiPicker.toggle(ChatView.insertEmoji)" title="Emoji">😊</button>
              <button onclick="document.getElementById('imageUpload').click()" title="Send image">📷</button>
            </div>
            <textarea id="messageInput" rows="1" placeholder="Type a message..." 
              oninput="ChatView.handleTyping()" 
              onkeydown="ChatView.handleKeyDown(event)"></textarea>
          </div>
          <button class="send-btn" onclick="ChatView.sendMessage()" id="sendBtn" disabled>➤</button>
        </div>
        <input type="file" id="imageUpload" accept="image/*" style="display:none" onchange="ChatView.handleImageSelect(event)">
      </div>
    `;
  },

  async openChat(conversationId, userId, username, avatar, isOnline) {
    this.currentConversation = conversationId;
    this.currentRecipient = { id: userId, username, avatar, is_online: isOnline };
    window.location.hash = `#chat/${conversationId}`;
  },

  async openChatById(conversationId) {
    window.location.hash = `#chat/${conversationId}`;
  },

  async initChat(conversationId) {
    this.currentConversation = parseInt(conversationId);

    if (!this.currentRecipient) {
      try {
        const convs = await API.get('/api/messages/conversations');
        const conv = convs.find(c => c.id === this.currentConversation);
        if (conv) {
          this.currentRecipient = { 
            id: conv.other_user_id, 
            username: conv.other_username, 
            avatar: conv.other_avatar, 
            is_online: conv.other_online 
          };
        }
      } catch (err) {
        console.error('Failed to load conversation details:', err);
      }
    }

    // Set header info
    const nameEl = document.getElementById('chatName');
    const avatarEl = document.getElementById('chatAvatar');
    const statusEl = document.getElementById('chatStatus');
    const onlineEl = document.getElementById('chatOnline');

    if (this.currentRecipient) {
      nameEl.textContent = this.currentRecipient.username;
      avatarEl.innerHTML = this.currentRecipient.avatar
        ? `<img src="${this.currentRecipient.avatar}" alt="${this.currentRecipient.username}">`
        : this.currentRecipient.username.charAt(0);
      if (this.currentRecipient.is_online) {
        statusEl.textContent = 'Online';
        statusEl.className = 'status';
        onlineEl.className = 'online-indicator';
      } else {
        statusEl.textContent = 'Offline';
        statusEl.className = 'status offline';
        onlineEl.className = 'online-indicator offline';
      }
    } else {
      nameEl.textContent = 'Chat';
    }

    // Load messages
    await this.loadMessages();

    // Mark as read
    SocketManager.emit('mark_read', { conversation_id: this.currentConversation });

    // Auto-resize textarea
    const input = document.getElementById('messageInput');
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      document.getElementById('sendBtn').disabled = !input.value.trim() && !this.pendingImage;
    });

    // Store game conversation
    GameManager.currentConversation = this.currentConversation;
  },

  async loadMessages() {
    try {
      const messages = await API.get(`/api/messages/${this.currentConversation}`);
      const container = document.getElementById('messagesContainer');

      if (messages.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">👋</div>
            <div class="empty-title">Say hello!</div>
            <div class="empty-desc">Start the conversation</div>
          </div>
        `;
        return;
      }

      container.innerHTML = messages.map(m => this.renderMessage(m)).join('');
      container.scrollTop = container.scrollHeight;
    } catch (err) {
      console.error('Load messages error:', err);
    }
  },

  renderMessage(msg) {
    let isSystem = false;
    let systemText = '';
    
    try {
      if (msg.content && msg.content.startsWith('{"system"')) {
        const data = JSON.parse(msg.content);
        isSystem = true;
        if (data.system === 'call') {
          const action = data.status === 'rejected' ? 'rejected' : 'ended';
          const duration = data.duration ? ` • ${Math.floor(data.duration/60)}m ${data.duration%60}s` : '';
          systemText = `📞 Voice call ${action}${duration}`;
        } else if (data.system === 'game') {
          const gameNames = {
            'truth_or_dare': 'Truth or Dare', 'would_you_rather': 'Would You Rather',
            'never_have_i_ever': 'Never Have I Ever', 'emoji_guess': 'Emoji Guess',
            'typing_race': 'Typing Race', 'tic_tac_toe': 'Tic-Tac-Toe', 'quiz_battle': 'Quiz Battle'
          };
          const gameName = gameNames[data.game_type] || 'Game';
          let resultText = 'finished';
          if (data.winner_id === App.currentUser?.id) resultText = '• You won! 🎉';
          else if (data.winner_id) resultText = `• ${data.winner_name || 'Opponent'} won!`;
          else if (data.status === 'draw') resultText = '• Draw 🤝';
          systemText = `🎮 ${gameName} ${resultText}`;
        }
      }
    } catch (e) {
      // Not a valid system message, fallback to normal rendering
    }

    if (isSystem) {
      return `
        <div class="date-separator">
          <span>${ChatView.escapeHtml(systemText)}</span>
        </div>
      `;
    }

    const isSent = msg.sender_id === App.currentUser?.id;
    const reactions = msg.reactions ? (typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : msg.reactions) : [];

    // Group reactions by emoji
    const reactionGroups = {};
    if (reactions && Array.isArray(reactions)) {
      reactions.forEach(r => {
        if (!r) return;
        if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = [];
        reactionGroups[r.emoji].push(r.username);
      });
    }

    return `
      <div class="message-group ${isSent ? 'sent' : 'received'}" data-msg-id="${msg.id}">
        <div class="message-bubble" oncontextmenu="ChatView.showReactionPicker(event, ${msg.id})" onclick="ChatView.showReactionPicker(event, ${msg.id})">
          ${msg.image_url ? `<img src="${msg.image_url}" class="message-image" onclick="event.stopPropagation(); ImageViewer.show('${msg.image_url}')" alt="Shared image">` : ''}
          ${msg.content ? `<div class="message-text">${this.escapeHtml(msg.content)}</div>` : ''}
          <div class="message-meta">
            <span class="message-time">${this.formatMessageTime(msg.created_at)}</span>
            ${isSent ? `<span class="message-read-receipt">${msg.is_read ? '✓✓' : '✓'}</span>` : ''}
          </div>
          ${Object.keys(reactionGroups).length > 0 ? `
            <div class="message-reactions">
              ${Object.entries(reactionGroups).map(([emoji, users]) =>
                `<span class="reaction-chip" onclick="event.stopPropagation(); ChatView.toggleReaction(${msg.id}, '${emoji}')" title="${users.join(', ')}">
                  ${emoji}<span class="count">${users.length}</span>
                </span>`
              ).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  showReactionPicker(event, messageId) {
    event.preventDefault();
    event.stopPropagation();

    // Remove existing picker
    document.querySelectorAll('.reaction-picker').forEach(p => p.remove());

    const reactions = ['❤️', '😂', '😮', '😢', '😡', '👍'];
    const bubble = event.currentTarget;
    const picker = document.createElement('div');
    picker.className = 'reaction-picker';
    picker.innerHTML = reactions.map(r =>
      `<button onclick="event.stopPropagation(); ChatView.toggleReaction(${messageId}, '${r}')">${r}</button>`
    ).join('');

    bubble.appendChild(picker);

    // Auto close
    setTimeout(() => {
      document.addEventListener('click', function handler() {
        picker.remove();
        document.removeEventListener('click', handler);
      });
    }, 100);
  },

  toggleReaction(messageId, emoji) {
    SocketManager.emit('react_message', {
      message_id: messageId,
      emoji,
      conversation_id: this.currentConversation
    });
    document.querySelectorAll('.reaction-picker').forEach(p => p.remove());
  },

  // ============ SEND MESSAGE ============
  async sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();

    if (!content && !this.pendingImage) return;

    let image_url = null;

    // Upload image if pending
    if (this.pendingImage) {
      try {
        const formData = new FormData();
        formData.append('image', this.pendingImage);
        const result = await API.post('/api/messages/image', formData);
        image_url = result.image_url;
      } catch (err) {
        Toast.error('Failed to upload image');
        return;
      }
    }

    SocketManager.emit('send_message', {
      conversation_id: this.currentConversation,
      content: content || null,
      image_url
    });

    input.value = '';
    input.style.height = 'auto';
    document.getElementById('sendBtn').disabled = true;
    this.removeImage();

    // Stop typing
    if (this.currentRecipient) {
      SocketManager.emit('typing_stop', {
        conversation_id: this.currentConversation,
        recipient_id: this.currentRecipient.id
      });
    }
  },

  handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  },

  handleTyping() {
    if (!this.currentRecipient) return;

    SocketManager.emit('typing_start', {
      conversation_id: this.currentConversation,
      recipient_id: this.currentRecipient.id
    });

    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      SocketManager.emit('typing_stop', {
        conversation_id: this.currentConversation,
        recipient_id: this.currentRecipient.id
      });
    }, 2000);
  },

  insertEmoji(emoji) {
    const input = document.getElementById('messageInput');
    if (input) {
      input.value += emoji;
      input.focus();
      document.getElementById('sendBtn').disabled = false;
    }
  },

  handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    this.pendingImage = file;
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    previewImg.src = URL.createObjectURL(file);
    preview.classList.remove('hidden');
    document.getElementById('sendBtn').disabled = false;
  },

  removeImage() {
    this.pendingImage = null;
    const preview = document.getElementById('imagePreview');
    if (preview) preview.classList.add('hidden');
    document.getElementById('imageUpload').value = '';
  },

  // ============ SOCKET EVENT HANDLERS ============
  handleNewMessage(msg) {
    if (msg.conversation_id === ChatView.currentConversation) {
      const container = document.getElementById('messagesContainer');
      if (container) {
        // Remove empty state
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        container.insertAdjacentHTML('beforeend', ChatView.renderMessage(msg));
        container.scrollTop = container.scrollHeight;

        // Mark as read or notify
        if (msg.sender_id !== App.currentUser?.id) {
          if (document.hidden) {
            NotificationManager.notify(`New message from ${msg.sender_username}`, { body: msg.content || 'Sent an image' });
          } else {
            SocketManager.emit('mark_read', { conversation_id: msg.conversation_id });
          }
        }
      }
    } else {
      // Show notification for other conversation
      if (msg.sender_id !== App.currentUser?.id) {
        Toast.info(`💬 ${msg.sender_username}: ${msg.content || '📷 Image'}`);
        NotificationManager.notify(`New message from ${msg.sender_username}`, { body: msg.content || 'Sent an image' });
      }
    }

    // Refresh conversation list if on chats view
    if (window.location.hash === '#chats') {
      ChatView.initConversationsList();
    }
  },

  handleTypingEvent(data) {
    if (data.conversation_id === ChatView.currentConversation) {
      const indicator = document.getElementById('typingIndicator');
      const text = document.getElementById('typingText');
      if (indicator && text) {
        indicator.classList.remove('hidden');
        text.textContent = `${data.username} is typing...`;
      }
    }
  },

  handleStopTypingEvent(data) {
    if (data.conversation_id === ChatView.currentConversation) {
      const indicator = document.getElementById('typingIndicator');
      if (indicator) {
        indicator.classList.add('hidden');
      }
    }
  },

  handleMessagesRead(data) {
    if (data.conversation_id === ChatView.currentConversation) {
      document.querySelectorAll('.message-group.sent .message-read-receipt').forEach(el => {
        el.textContent = '✓✓';
      });
    }
  },

  handleReactionUpdated(data) {
    const msgEl = document.querySelector(`[data-msg-id="${data.message_id}"]`);
    if (!msgEl) return;

    // Group reactions
    const reactionGroups = {};
    data.reactions.forEach(r => {
      if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = [];
      reactionGroups[r.emoji].push(r.username);
    });

    let reactionsEl = msgEl.querySelector('.message-reactions');
    if (!reactionsEl) {
      reactionsEl = document.createElement('div');
      reactionsEl.className = 'message-reactions';
      msgEl.querySelector('.message-bubble').appendChild(reactionsEl);
    }

    if (Object.keys(reactionGroups).length === 0) {
      reactionsEl.remove();
      return;
    }

    reactionsEl.innerHTML = Object.entries(reactionGroups).map(([emoji, users]) =>
      `<span class="reaction-chip" onclick="event.stopPropagation(); ChatView.toggleReaction(${data.message_id}, '${emoji}')" title="${users.join(', ')}">
        ${emoji}<span class="count">${users.length}</span>
      </span>`
    ).join('');
  },

  // ============ UTILITIES ============
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return date.toLocaleDateString('en', { weekday: 'short' });
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  },

  formatMessageTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
};
