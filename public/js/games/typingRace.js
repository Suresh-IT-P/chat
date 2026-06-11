// =============================================
// TYPING RACE Game
// =============================================
const TypingRaceGame = {
  inputListener: null,

  render(state) {
    const data = state.data;
    if (!data.text) return '<p>Loading...</p>';

    const myFinish = data.finished[App.currentUser?.id];
    const myProgress = data.progress[App.currentUser?.id];

    // Render text with character coloring
    const charProgress = myProgress?.chars || 0;

    return `
      <div style="width:100%">
        <div class="race-text-display" id="raceText">
          ${data.text.split('').map((char, i) => {
            let cls = 'pending-char';
            if (i < charProgress) cls = 'correct-char';
            else if (i === charProgress) cls = 'current-char';
            return `<span class="${cls}">${char === ' ' ? '&nbsp;' : ChatView.escapeHtml(char)}</span>`;
          }).join('')}
        </div>

        <!-- Progress bars -->
        <div class="race-progress">
          ${state.players.map(p => {
            const prog = data.progress[p.id];
            const fin = data.finished[p.id];
            const pct = fin ? 100 : (prog ? Math.round((prog.chars / data.text.length) * 100) : 0);
            return `
              <div class="race-progress-player">
                <span class="progress-name">${ChatView.escapeHtml(p.username)}</span>
                <div class="race-progress-bar">
                  <div class="race-progress-fill" style="width:${pct}%"></div>
                </div>
                <span style="font-size:0.75rem;min-width:35px;text-align:right">${pct}%</span>
              </div>
            `;
          }).join('')}
        </div>

        ${!myFinish ? `
          <input type="text" class="race-input" id="raceInput" placeholder="Start typing..."
            autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
        ` : ''}

        <!-- Stats -->
        <div class="race-stats">
          ${Object.entries(data.finished).map(([uid, f]) => `
            <div class="race-stat">
              <div class="stat-value">${f.wpm}</div>
              <div class="stat-label">${ChatView.escapeHtml(f.username)} WPM</div>
            </div>
          `).join('')}
          ${!myFinish && myProgress ? `
            <div class="race-stat">
              <div class="stat-value">${Math.round((myProgress.chars / data.text.length) * 100)}%</div>
              <div class="stat-label">Progress</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  init(state) {
    const input = document.getElementById('raceInput');
    if (!input) return;

    const text = state.data.text;
    let charIndex = 0;

    input.addEventListener('input', (e) => {
      const typed = input.value;
      charIndex = 0;

      // Count correct chars from beginning
      for (let i = 0; i < typed.length && i < text.length; i++) {
        if (typed[i] === text[i]) {
          charIndex = i + 1;
        } else {
          break;
        }
      }

      // Update progress
      GameManager.sendAction({ type: 'progress', chars: charIndex });

      // Update visual
      const spans = document.querySelectorAll('#raceText span');
      spans.forEach((span, i) => {
        if (i < charIndex) span.className = 'correct-char';
        else if (i === charIndex) span.className = 'current-char';
        else span.className = 'pending-char';
      });

      // Check completion
      if (charIndex >= text.length) {
        const accuracy = Math.round((charIndex / typed.length) * 100);
        GameManager.sendAction({ type: 'finish', accuracy });
        input.disabled = true;
        input.placeholder = '✅ Finished!';
      }
    });

    setTimeout(() => input.focus(), 100);
  }
};
