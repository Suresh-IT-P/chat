// =============================================
// NEVER HAVE I EVER Game
// =============================================
const NeverHaveIEverGame = {
  render(state) {
    const data = state.data;
    if (!data.statement) return '<p>Loading...</p>';

    const myResponse = data.responses[App.currentUser?.id];
    const totalResponses = Object.keys(data.responses).length;

    return `
      <div style="width:100%">
        <div class="nhie-statement">
          <div style="font-size:2rem;margin-bottom:16px">🙈</div>
          <div class="statement-text">${data.statement}</div>
        </div>

        ${!myResponse ? `
          <div class="nhie-actions">
            <button class="nhie-btn have" onclick="GameManager.sendAction({type:'respond', response:'have'})">
              😬 I Have
            </button>
            <button class="nhie-btn never" onclick="GameManager.sendAction({type:'respond', response:'never'})">
              😇 Never
            </button>
          </div>
        ` : `
          <div style="text-align:center;padding:16px">
            <p style="font-size:1.125rem;font-weight:600;margin-bottom:8px">
              You answered: ${myResponse === 'have' ? '😬 I Have' : '😇 Never'}
            </p>
            ${totalResponses < state.players.length 
              ? '<p style="color:var(--color-text-secondary)">Waiting for other player...</p>'
              : `<div style="margin-top:16px">
                  ${Object.entries(data.responses).map(([uid, resp]) => {
                    const player = state.players.find(p => p.id == uid);
                    return `<p style="margin:4px 0">${ChatView.escapeHtml(player?.username || 'Player')}: ${resp === 'have' ? '😬 I Have' : '😇 Never'}</p>`;
                  }).join('')}
                </div>`
            }
          </div>
        `}
      </div>
    `;
  },

  init(state) {}
};
