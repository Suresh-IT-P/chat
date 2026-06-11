// =============================================
// TRUTH OR DARE Game
// =============================================
const TruthOrDareGame = {
  render(state) {
    const data = state.data;
    const currentPlayer = state.players[data.currentPlayer];
    const isMyTurn = currentPlayer?.id === App.currentUser?.id;

    if (!data.currentType) {
      return `
        <div style="width:100%;text-align:center">
          <div class="ttt-turn-indicator">
            ${isMyTurn ? "🎯 It's your turn! Choose wisely..." : `⏳ ${ChatView.escapeHtml(currentPlayer?.username || '')}'s turn`}
          </div>
          ${isMyTurn ? `
            <div class="tod-choice">
              <button class="tod-btn truth" onclick="GameManager.sendAction({type:'choose', choice:'truth'})">
                🔮 Truth
              </button>
              <button class="tod-btn dare" onclick="GameManager.sendAction({type:'choose', choice:'dare'})">
                🔥 Dare
              </button>
            </div>
          ` : `
            <div style="padding:40px;color:var(--color-text-secondary)">
              Waiting for ${ChatView.escapeHtml(currentPlayer?.username || '')} to choose...
            </div>
          `}
        </div>
      `;
    }

    return `
      <div style="width:100%">
        <div class="tod-content">
          <div class="tod-type">${data.currentType === 'truth' ? '🔮 Truth' : '🔥 Dare'}</div>
          <div class="tod-text">${data.currentContent}</div>
        </div>
        <div style="display:flex;gap:12px;margin-top:24px;justify-content:center">
          ${isMyTurn ? `
            <button class="btn btn-success" onclick="GameManager.sendAction({type:'complete'})">✅ Done!</button>
            <button class="btn btn-secondary" onclick="GameManager.sendAction({type:'skip'})">⏭️ Skip</button>
          ` : `
            <div style="padding:16px;color:var(--color-text-secondary);text-align:center">
              Waiting for ${ChatView.escapeHtml(currentPlayer?.username || '')} to complete...
            </div>
          `}
        </div>
      </div>
    `;
  },

  init(state) {}
};
