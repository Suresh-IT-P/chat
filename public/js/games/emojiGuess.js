// =============================================
// EMOJI GUESS Game
// =============================================
const EmojiGuessGame = {
  render(state) {
    const data = state.data;
    if (!data.puzzle) return '<p>Loading...</p>';

    const myGuess = data.guesses[App.currentUser?.id];

    return `
      <div style="width:100%">
        <div class="emoji-display">${data.puzzle.emojis}</div>
        
        ${data.hint ? `<p style="text-align:center;color:var(--color-primary);font-weight:600;margin-bottom:12px">💡 Hint: ${data.hint}</p>` : ''}
        
        ${data.answer ? `
          <div class="guess-result wrong" style="margin-bottom:16px">
            Answer: ${data.answer}
          </div>
        ` : ''}

        ${myGuess?.correct ? `
          <div class="guess-result correct">
            🎉 ${ChatView.escapeHtml(myGuess.username)} got it right!
          </div>
        ` : !data.answer ? `
          <div class="guess-input-area">
            <input type="text" id="guessInput" placeholder="Type your guess..." 
              onkeydown="if(event.key==='Enter')EmojiGuessGame.submitGuess()">
            <button class="btn btn-primary" onclick="EmojiGuessGame.submitGuess()">Guess</button>
          </div>
          <div style="display:flex;gap:8px;margin-top:12px;justify-content:center">
            <button class="btn btn-sm btn-secondary" onclick="GameManager.sendAction({type:'hint'})">💡 Hint</button>
            <button class="btn btn-sm btn-ghost" onclick="GameManager.sendAction({type:'skip'})">⏭️ Skip</button>
          </div>
          ${myGuess && !myGuess.correct ? `
            <div class="guess-result wrong" style="margin-top:12px">
              ❌ "${ChatView.escapeHtml(myGuess.guess)}" is wrong. Try again!
            </div>
          ` : ''}
        ` : ''}

        ${Object.entries(data.guesses).filter(([_, g]) => g.correct).map(([_, g]) =>
          `<div class="guess-result correct" style="margin-top:12px">🎉 ${ChatView.escapeHtml(g.username)} guessed it!</div>`
        ).join('')}
      </div>
    `;
  },

  submitGuess() {
    const input = document.getElementById('guessInput');
    if (!input || !input.value.trim()) return;
    GameManager.sendAction({ type: 'guess', guess: input.value });
    input.value = '';
  },

  init(state) {
    setTimeout(() => {
      const input = document.getElementById('guessInput');
      if (input) input.focus();
    }, 100);
  }
};
