// =============================================
// WOULD YOU RATHER Game
// =============================================
const WouldYouRatherGame = {
  render(state) {
    const data = state.data;
    if (!data.options) return '<p>Loading...</p>';

    const myVote = data.votes[App.currentUser?.id];
    const totalVotes = Object.keys(data.votes).length;
    const votesA = Object.values(data.votes).filter(v => v === 'a').length;
    const votesB = totalVotes - votesA;
    const percentA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 0;
    const percentB = totalVotes > 0 ? 100 - percentA : 0;

    return `
      <div class="wyr-options">
        <div class="wyr-option ${myVote === 'a' ? 'selected' : ''}" 
          onclick="${!myVote ? "GameManager.sendAction({type:'vote', choice:'a'})" : ''}"
          style="${myVote ? 'cursor:default' : ''}">
          <div style="font-size:1.5rem;margin-bottom:8px">🅰️</div>
          ${data.options.a}
          ${data.revealed || myVote ? `
            <div class="wyr-results">
              <div class="wyr-bar"><div class="wyr-bar-fill" style="width:${percentA}%"></div></div>
              <span class="wyr-percent">${percentA}%</span>
            </div>
          ` : ''}
        </div>
        
        <div class="wyr-vs">— OR —</div>
        
        <div class="wyr-option ${myVote === 'b' ? 'selected' : ''}"
          onclick="${!myVote ? "GameManager.sendAction({type:'vote', choice:'b'})" : ''}"
          style="${myVote ? 'cursor:default' : ''}">
          <div style="font-size:1.5rem;margin-bottom:8px">🅱️</div>
          ${data.options.b}
          ${data.revealed || myVote ? `
            <div class="wyr-results">
              <div class="wyr-bar"><div class="wyr-bar-fill" style="width:${percentB}%"></div></div>
              <span class="wyr-percent">${percentB}%</span>
            </div>
          ` : ''}
        </div>
      </div>
      ${myVote && !data.revealed ? '<p style="text-align:center;color:var(--color-text-secondary);margin-top:16px">Waiting for other player...</p>' : ''}
    `;
  },

  init(state) {}
};
