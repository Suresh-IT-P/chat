// =============================================
// QUIZ BATTLE Game
// =============================================
const QuizBattleGame = {
  timerInterval: null,

  render(state) {
    const data = state.data;
    if (!data.question) return '<p>Loading...</p>';

    const myAnswer = data.answers[App.currentUser?.id];
    const allAnswered = Object.keys(data.answers).length >= state.players.length;

    return `
      <div style="width:100%">
        <div class="quiz-timer" id="quizTimer">15</div>
        
        <div class="quiz-question">
          <div class="question-text">${data.question.q}</div>
        </div>

        <div class="quiz-options">
          ${data.question.options.map((opt, i) => {
            let cls = 'quiz-option';
            if (myAnswer) {
              if (i === data.question.correct) cls += ' correct';
              else if (i === myAnswer.answer && !myAnswer.correct) cls += ' wrong';
              else cls += ' ' + (myAnswer ? '' : '');
            }
            return `
              <button class="${cls}" 
                onclick="${!myAnswer ? `GameManager.sendAction({type:'answer', answer:${i}})` : ''}"
                ${myAnswer ? 'style="cursor:default;pointer-events:none"' : ''}>
                ${opt}
              </button>
            `;
          }).join('')}
        </div>

        ${myAnswer ? `
          <div style="text-align:center;margin-top:16px">
            <p style="font-weight:600;color:${myAnswer.correct ? 'var(--color-success)' : 'var(--color-error)'}">
              ${myAnswer.correct ? '✅ Correct!' : '❌ Wrong!'}
            </p>
            ${!allAnswered ? '<p style="color:var(--color-text-secondary);font-size:0.875rem;margin-top:4px">Waiting for other player...</p>' : ''}
          </div>
        ` : ''}

        ${allAnswered ? `
          <div style="margin-top:16px">
            ${Object.entries(data.answers).map(([uid, a]) => `
              <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:0.875rem">
                <span>${ChatView.escapeHtml(a.username)}</span>
                <span style="color:${a.correct ? 'var(--color-success)' : 'var(--color-error)'}">
                  ${a.correct ? `✅ ${a.time.toFixed(1)}s` : '❌'}
                </span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },

  init(state) {
    // Start countdown timer
    if (this.timerInterval) clearInterval(this.timerInterval);

    const startTime = state.data.questionStartTime;
    const timer = document.getElementById('quizTimer');
    if (!timer) return;

    this.timerInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, Math.ceil(15 - elapsed));
      if (timer) timer.textContent = remaining;

      if (remaining <= 0) {
        clearInterval(this.timerInterval);
        // Auto submit if not answered
        const myAnswer = state.data.answers[App.currentUser?.id];
        if (!myAnswer) {
          GameManager.sendAction({ type: 'answer', answer: -1 });
        }
      }

      // Color change warning
      if (remaining <= 5 && timer) {
        timer.style.borderColor = 'var(--color-error)';
        timer.style.color = 'var(--color-error)';
      }
    }, 100);
  }
};
