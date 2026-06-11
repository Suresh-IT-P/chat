// =============================================
// GAME MANAGER — Launcher & Shared Utilities
// =============================================

const GameManager = {
  currentConversation: null,
  currentGame: null,
  activeGameState: null,

  games: [
    { type: 'truth_or_dare', name: 'Truth or Dare', icon: '🎯', desc: 'Fun questions & dares' },
    { type: 'would_you_rather', name: 'Would You Rather', icon: '🤔', desc: 'Make tough choices' },
    { type: 'never_have_i_ever', name: 'Never Have I Ever', icon: '🙈', desc: 'Reveal your secrets' },
    { type: 'emoji_guess', name: 'Emoji Guess', icon: '🧩', desc: 'Guess the meaning' },
    { type: 'typing_race', name: 'Typing Race', icon: '⌨️', desc: 'Speed competition' },
    { type: 'tic_tac_toe', name: 'Tic-Tac-Toe', icon: '❌⭕', desc: 'Classic board game' },
    { type: 'quiz_battle', name: 'Quiz Battle', icon: '🧠', desc: 'Test your knowledge' }
  ],

  showGamePicker() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'gamePicker';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-handle"></div>
        <div class="modal-header">
          <h2>🎮 Play a Game</h2>
          <button class="btn-icon" onclick="document.getElementById('gamePicker').remove()">✕</button>
        </div>
        <div class="game-grid">
          ${this.games.map(g => `
            <div class="game-card card-interactive" onclick="GameManager.createGame('${g.type}')">
              <div class="game-icon">${g.icon}</div>
              <div class="game-name">${g.name}</div>
              <div class="game-desc">${g.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  },

  async createGame(gameType) {
    document.getElementById('gamePicker')?.remove();
    SocketManager.emit('game_create', {
      game_type: gameType,
      conversation_id: this.currentConversation
    });
    Toast.info('Game created! Waiting for friend to join...');
  },

  getGameModule(type) {
    switch (type) {
      case 'truth_or_dare': return TruthOrDareGame;
      case 'would_you_rather': return WouldYouRatherGame;
      case 'never_have_i_ever': return NeverHaveIEverGame;
      case 'emoji_guess': return EmojiGuessGame;
      case 'typing_race': return TypingRaceGame;
      case 'tic_tac_toe': return TicTacToeGame;
      case 'quiz_battle': return QuizBattleGame;
      default: return null;
    }
  },

  renderGame(gameState) {
    this.activeGameState = gameState;
    const game = this.games.find(g => g.type === gameState.type);
    const module = this.getGameModule(gameState.type);

    if (gameState.status === 'finished') {
      return this.renderGameResult(gameState, game);
    }

    if (gameState.status === 'waiting') {
      return `
        <div class="game-container">
          <div class="game-header">
            <button class="btn-icon" onclick="GameManager.leaveGame()">←</button>
            <span class="game-title">${game?.icon || '🎮'} ${game?.name || 'Game'}</span>
          </div>
          <div class="game-body">
            <div class="game-waiting">
              <div class="waiting-icon">⏳</div>
              <div class="waiting-text">Waiting for friend to join...</div>
              <div class="waiting-dots"><span></span><span></span><span></span></div>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="game-container">
        <div class="game-header">
          <button class="btn-icon" onclick="GameManager.leaveGame()">←</button>
          <span class="game-title">${game?.icon || '🎮'} ${game?.name || 'Game'}</span>
          <span class="round-indicator">Round ${gameState.currentRound}/${gameState.maxRounds}</span>
        </div>
        <div class="game-body">
          ${this.renderScoreBar(gameState)}
          ${module ? module.render(gameState) : '<p>Unknown game type</p>'}
        </div>
      </div>
    `;
  },

  renderScoreBar(state) {
    if (state.players.length < 2) return '';
    return `
      <div class="score-bar">
        <div class="score-player">
          <div class="score-name">${ChatView.escapeHtml(state.players[0]?.username || 'P1')}</div>
          <div class="score-value">${state.players[0]?.score || 0}</div>
        </div>
        <div class="score-vs">VS</div>
        <div class="score-player" style="text-align:right">
          <div class="score-value">${state.players[1]?.score || 0}</div>
          <div class="score-name">${ChatView.escapeHtml(state.players[1]?.username || 'P2')}</div>
        </div>
      </div>
    `;
  },

  renderGameResult(state, game) {
    const results = state.data.finalResults || state.players.sort((a, b) => b.score - a.score);
    const winnerId = state.data.winnerId;
    const isDraw = state.data.winner === 'draw' || (results.length > 1 && results[0].score === results[1].score);

    let resultIcon = '🏆';
    let resultTitle = 'Game Over!';

    if (isDraw) {
      resultIcon = '🤝';
      resultTitle = "It's a Draw!";
    } else if (winnerId === App.currentUser?.id) {
      resultIcon = '🎉';
      resultTitle = 'You Won!';
    } else if (winnerId) {
      resultIcon = '😅';
      resultTitle = `${state.data.winnerName || 'Opponent'} Won!`;
    }

    return `
      <div class="game-container">
        <div class="game-header">
          <button class="btn-icon" onclick="GameManager.leaveGame()">←</button>
          <span class="game-title">${game?.icon || '🎮'} ${game?.name || 'Game'}</span>
        </div>
        <div class="game-body">
          <div class="game-result">
            <div class="result-icon">${resultIcon}</div>
            <div class="result-title">${resultTitle}</div>
            <div class="result-subtitle">${game?.name || 'Game'} Complete</div>
            <div class="final-scores">
              ${results.map((p, i) => `
                <div class="final-score-row ${p.id === winnerId ? 'winner' : ''}">
                  <span class="player-name">${i === 0 ? '👑 ' : ''}${ChatView.escapeHtml(p.username)}</span>
                  <span class="player-score">${p.score}</span>
                </div>
              `).join('')}
            </div>
            <button class="btn btn-primary" onclick="GameManager.leaveGame()">Back to Chat</button>
          </div>
        </div>
      </div>
    `;
  },

  leaveGame() {
    if (this.activeGameState) {
      SocketManager.emit('game_leave', { game_id: this.activeGameState.id });
    }
    this.currentGame = null;
    this.activeGameState = null;
    
    NotificationManager.releaseWakeLock();
    
    const targetHash = `#chat/${this.currentConversation}`;
    if (window.location.hash === targetHash) {
      App.route();
    } else {
      window.location.hash = targetHash;
    }
  },

  sendAction(action) {
    if (!this.activeGameState) return;
    SocketManager.emit('game_action', {
      game_id: this.activeGameState.id,
      action
    });
  },

  // Confetti effect
  showConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    const colors = ['#7c3aed', '#2dd4bf', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 2 + 's';
      piece.style.animationDuration = (2 + Math.random() * 2) + 's';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      piece.style.width = (5 + Math.random() * 10) + 'px';
      piece.style.height = (5 + Math.random() * 10) + 'px';
      container.appendChild(piece);
    }

    document.body.appendChild(container);
    setTimeout(() => container.remove(), 5000);
  },

  // Socket handlers
  handleGameInvite(data) {
    const game = GameManager.games.find(g => g.type === data.game_type);
    NotificationManager.notify('Game Invite', { body: `${data.invited_by} invited you to play ${game?.name}!` });
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'gameInviteModal';
    overlay.innerHTML = `
      <div class="modal" style="text-align:center; padding: 32px;">
        <div style="font-size: 3rem; margin-bottom: 16px">${game?.icon || '🎮'}</div>
        <h2 style="margin-bottom: 8px; font-family: Outfit, sans-serif">${game?.name || 'Game'}</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: 24px">${data.invited_by} wants to play!</p>
        <div class="flex gap-md" style="justify-content: center">
          <button class="btn btn-primary" onclick="GameManager.acceptInvite(${data.game_id}, '${data.game_type}', ${data.conversation_id})">Join Game</button>
          <button class="btn btn-secondary" onclick="document.getElementById('gameInviteModal').remove()">Decline</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  acceptInvite(gameId, gameType, conversationId) {
    document.getElementById('gameInviteModal')?.remove();
    this.currentConversation = conversationId;
    this.currentGame = gameId;
    SocketManager.emit('game_join', { game_id: gameId });
  },

  handleGameStarted(data) {
    GameManager.activeGameState = data.game_state;
    GameManager.currentGame = data.game_state.id;
    const app = document.getElementById('app');
    app.innerHTML = GameManager.renderGame(data.game_state);
    document.getElementById('bottomNav').style.display = 'none';
    
    NotificationManager.requestWakeLock();

    const module = GameManager.getGameModule(data.game_state.type);
    if (module && module.init) module.init(data.game_state);
  },

  handleGameUpdate(data) {
    GameManager.activeGameState = data.game_state;
    const gameBody = document.querySelector('.game-body');
    if (!gameBody) return;

    const module = GameManager.getGameModule(data.game_state.type);

    // Re-render score bar and game content
    gameBody.innerHTML = `
      ${GameManager.renderScoreBar(data.game_state)}
      ${module ? module.render(data.game_state) : ''}
    `;

    // Update round indicator
    const roundEl = document.querySelector('.round-indicator');
    if (roundEl) {
      roundEl.textContent = `Round ${data.game_state.currentRound}/${data.game_state.maxRounds}`;
    }

    if (module && module.init) module.init(data.game_state);
  },

  handleGameEnded(data) {
    GameManager.activeGameState = data.game_state;
    const app = document.getElementById('app');
    const game = GameManager.games.find(g => g.type === data.game_state.type);
    app.innerHTML = GameManager.renderGameResult(data.game_state, game);

    NotificationManager.releaseWakeLock();

    // Show confetti if winner
    if (data.game_state.data.winnerId === App.currentUser?.id) {
      GameManager.showConfetti();
    }
  },

  handleGameCreated(data) {
    GameManager.activeGameState = data.game_state;
    GameManager.currentGame = data.game_id;
    const app = document.getElementById('app');
    app.innerHTML = GameManager.renderGame(data.game_state);
    document.getElementById('bottomNav').style.display = 'none';
  }
};
