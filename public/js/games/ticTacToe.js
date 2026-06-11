// =============================================
// TIC-TAC-TOE Game
// =============================================
const TicTacToeGame = {
  render(state) {
    const data = state.data;
    const myIndex = state.players.findIndex(p => p.id === App.currentUser?.id);
    const isMyTurn = data.currentTurn === myIndex;
    const mySymbol = data.symbols[myIndex];
    const winner = data.winner;

    return `
      <div style="width:100%;text-align:center">
        ${winner ? `
          <div class="ttt-turn-indicator" style="font-size:1.125rem">
            ${winner === 'draw' ? "🤝 It's a draw!" : 
              (state.players[data.symbols.indexOf(winner)]?.id === App.currentUser?.id 
                ? '🎉 You won!' 
                : `😅 ${ChatView.escapeHtml(state.players[data.symbols.indexOf(winner)]?.username || '')} won!`
              )
            }
          </div>
        ` : `
          <div class="ttt-turn-indicator">
            ${isMyTurn ? `Your turn (${mySymbol})` : `${ChatView.escapeHtml(state.players[data.currentTurn]?.username || '')}'s turn`}
          </div>
        `}

        <div class="ttt-board">
          ${data.board.map((cell, i) => {
            const isWinCell = data.winLine && data.winLine.includes(i);
            return `
              <button class="ttt-cell ${cell ? 'taken' : ''} ${cell === 'X' ? 'x' : cell === 'O' ? 'o' : ''} ${isWinCell ? 'win' : ''}"
                onclick="${!cell && isMyTurn && !winner ? `GameManager.sendAction({type:'move', cell:${i}})` : ''}"
                ${cell || !isMyTurn || winner ? 'style="cursor:default"' : ''}>
                ${cell || ''}
              </button>
            `;
          }).join('')}
        </div>

        <div style="margin-top:16px">
          <p style="font-size:0.875rem;color:var(--color-text-secondary)">
            You are <strong style="color:var(--color-primary)">${mySymbol || '?'}</strong>
          </p>
        </div>
      </div>
    `;
  },

  init(state) {}
};
