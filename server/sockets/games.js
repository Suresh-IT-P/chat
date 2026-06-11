const pool = require('../config/db');

// ==================== GAME DATA BANKS ====================

const truthQuestions = [
  "What's your most embarrassing moment?", "Have you ever lied to your best friend?",
  "What's the last lie you told?", "What's your biggest fear?",
  "Have you ever had a crush on a teacher?", "What's the most childish thing you still do?",
  "What's your guilty pleasure?", "Have you ever stalked someone on social media?",
  "What's the worst date you've ever been on?", "What's a secret you've never told anyone?",
  "Have you ever pretended to be sick to avoid something?", "What's your most bizarre habit?",
  "Who was your first crush?", "Have you ever cheated in a game?",
  "What's the most embarrassing thing in your phone?", "Have you ever been caught talking to yourself?",
  "What's your weirdest dream?", "Have you ever re-gifted a present?",
  "What's something you're afraid to try?", "What's the longest you've gone without showering?",
  "Have you ever accidentally sent a text to the wrong person?", "What's your most unpopular opinion?",
  "Have you ever eaten food off the floor?", "What's the pettiest thing you've done?",
  "What's your most irrational fear?"
];

const dares = [
  "Send a funny selfie right now!", "Type with your eyes closed for the next 30 seconds",
  "Use only emojis for the next 3 messages", "Share the last photo in your gallery",
  "Tell a joke and make the other person laugh", "Speak in a fake accent for 2 minutes",
  "Send a voice message singing your favorite song", "Do 10 pushups and prove it!",
  "Text your last contact 'I love you'", "Change your profile pic to something silly for 1 hour",
  "Make up a rap about the other player", "Compliment the other player 5 times in a row",
  "Share your screen time report", "Send the 5th photo in your gallery",
  "Type a message with your nose", "Do your best impression of a celebrity",
  "Let the other player change your bio for 1 hour", "Send a message to your crush right now",
  "Do the chicken dance and send a video", "Speak only in questions for 5 minutes"
];

const wouldYouRatherOptions = [
  { a: "Be able to fly", b: "Be invisible" },
  { a: "Live in the past", b: "Live in the future" },
  { a: "Have unlimited money", b: "Have unlimited knowledge" },
  { a: "Never use social media again", b: "Never watch a movie again" },
  { a: "Always be 10 minutes late", b: "Always be 20 minutes early" },
  { a: "Have no phone for a year", b: "Have no friends for a year" },
  { a: "Be famous but hated", b: "Be unknown but loved" },
  { a: "Have super strength", b: "Have super speed" },
  { a: "Read minds", b: "See the future" },
  { a: "Never eat pizza again", b: "Never eat chocolate again" },
  { a: "Live without music", b: "Live without movies" },
  { a: "Be a genius but ugly", b: "Be attractive but average" },
  { a: "Travel to space", b: "Travel to the deep ocean" },
  { a: "Be able to talk to animals", b: "Speak every language" },
  { a: "Have a rewind button", b: "Have a pause button for life" }
];

const neverHaveIEverStatements = [
  "Never have I ever ghosted someone", "Never have I ever pulled an all-nighter",
  "Never have I ever eaten an entire pizza alone", "Never have I ever cried during a movie",
  "Never have I ever been on a blind date", "Never have I ever lied about my age",
  "Never have I ever sung in the shower", "Never have I ever skipped school/work",
  "Never have I ever broken a bone", "Never have I ever traveled alone",
  "Never have I ever gotten lost in a new city", "Never have I ever forgotten someone's name",
  "Never have I ever binge-watched an entire season in one day",
  "Never have I ever accidentally liked an old photo while stalking",
  "Never have I ever danced in public", "Never have I ever sent a text to the wrong person",
  "Never have I ever laughed so hard I cried", "Never have I ever pretended to text to avoid someone",
  "Never have I ever re-read my own texts", "Never have I ever had a food fight"
];

const emojiPuzzles = [
  { emojis: "🎬🦁👑", answer: "the lion king" },
  { emojis: "🕷️🧑", answer: "spider man" },
  { emojis: "❄️👸", answer: "frozen" },
  { emojis: "🧙‍♂️💍", answer: "lord of the rings" },
  { emojis: "🦇🧑", answer: "batman" },
  { emojis: "⭐️⚔️", answer: "star wars" },
  { emojis: "🧊🚢", answer: "titanic" },
  { emojis: "🔍🐠", answer: "finding nemo" },
  { emojis: "👻👻🔫", answer: "ghostbusters" },
  { emojis: "🦖🌴", answer: "jurassic park" },
  { emojis: "🧪👨‍🔬💚", answer: "breaking bad" },
  { emojis: "👑🎮", answer: "game of thrones" },
  { emojis: "🏠⬆️🎈", answer: "up" },
  { emojis: "🤖❤️🌱", answer: "wall-e" },
  { emojis: "🐀👨‍🍳", answer: "ratatouille" },
  { emojis: "🦸‍♂️🔨⚡", answer: "thor" },
  { emojis: "🐍✈️", answer: "snakes on a plane" },
  { emojis: "👩‍🚀🌍🚀", answer: "interstellar" },
  { emojis: "🧟‍♂️🌎", answer: "world war z" },
  { emojis: "🎩🐇✨", answer: "alice in wonderland" }
];

const typingTexts = [
  "The quick brown fox jumps over the lazy dog near the riverbank.",
  "Pack my box with five dozen liquor jugs and ship them today.",
  "How vexingly quick daft zebras jump over the wooden fence!",
  "The five boxing wizards jump quickly across the narrow bridge.",
  "Bright vixens jump across the frozen lakes in winter mornings.",
  "A journey of a thousand miles begins with a single step forward.",
  "To be or not to be that is the question we must all face.",
  "All that glitters is not gold but some things are worth keeping.",
  "In the middle of difficulty lies opportunity waiting for us.",
  "Life is what happens when you are busy making other plans."
];

const quizQuestions = [
  { q: "What is the capital of France?", options: ["London", "Paris", "Berlin", "Madrid"], correct: 1 },
  { q: "Which planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Saturn"], correct: 2 },
  { q: "What is the largest ocean?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3 },
  { q: "Who painted the Mona Lisa?", options: ["Picasso", "Da Vinci", "Van Gogh", "Michelangelo"], correct: 1 },
  { q: "What year did the Titanic sink?", options: ["1910", "1912", "1914", "1916"], correct: 1 },
  { q: "Which element has the symbol 'O'?", options: ["Gold", "Osmium", "Oxygen", "Oganesson"], correct: 2 },
  { q: "What is the fastest land animal?", options: ["Lion", "Cheetah", "Horse", "Gazelle"], correct: 1 },
  { q: "How many continents are there?", options: ["5", "6", "7", "8"], correct: 2 },
  { q: "What is the smallest country?", options: ["Monaco", "Vatican City", "Nauru", "Malta"], correct: 1 },
  { q: "Who wrote Romeo and Juliet?", options: ["Dickens", "Austen", "Shakespeare", "Hemingway"], correct: 2 },
  { q: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond", "Platinum"], correct: 2 },
  { q: "Which country invented pizza?", options: ["France", "Spain", "Italy", "Greece"], correct: 2 },
  { q: "What gas do plants absorb?", options: ["Oxygen", "Nitrogen", "CO2", "Hydrogen"], correct: 2 },
  { q: "How many bones are in the adult human body?", options: ["186", "196", "206", "216"], correct: 2 },
  { q: "Which animal is the tallest?", options: ["Elephant", "Giraffe", "Horse", "Camel"], correct: 1 },
  { q: "What is the boiling point of water in °C?", options: ["90", "95", "100", "110"], correct: 2 },
  { q: "Who discovered gravity?", options: ["Einstein", "Newton", "Galileo", "Hawking"], correct: 1 },
  { q: "What is the largest planet?", options: ["Saturn", "Jupiter", "Neptune", "Uranus"], correct: 1 },
  { q: "Which instrument has 88 keys?", options: ["Guitar", "Violin", "Piano", "Harp"], correct: 2 },
  { q: "How many colors in a rainbow?", options: ["5", "6", "7", "8"], correct: 2 }
];

// ==================== ACTIVE GAMES STORE ====================
const activeGames = new Map();

function setupGames(io, socket, onlineUsers) {

  // Create/Start game
  socket.on('game_create', async (data) => {
    try {
      const { game_type, conversation_id } = data;

      // Create game in DB
      const [result] = await pool.execute(
        "INSERT INTO games (game_type, conversation_id, created_by, status, game_data) VALUES (?, ?, ?, 'waiting', ?)",
        [game_type, conversation_id, socket.userId, JSON.stringify({})]
      );

      await pool.execute(
        'INSERT INTO game_scores (game_id, user_id) VALUES (?, ?)',
        [result.insertId, socket.userId]
      );

      const gameId = result.insertId;
      const gameRoom = `game:${gameId}`;
      socket.join(gameRoom);

      const gameState = initGameState(game_type, gameId, socket.userId, socket.username);
      activeGames.set(gameId, gameState);

      // Get the other user in conversation
      const [conv] = await pool.execute(
        'SELECT user1_id, user2_id FROM conversations WHERE id = ?',
        [conversation_id]
      );
      if (conv.length > 0) {
        const otherUserId = conv[0].user1_id === socket.userId ? conv[0].user2_id : conv[0].user1_id;
        io.to(`user:${otherUserId}`).emit('game_invite', {
          game_id: gameId,
          game_type,
          conversation_id,
          invited_by: socket.username
        });
      }

      socket.emit('game_created', { game_id: gameId, game_state: gameState });
    } catch (err) {
      console.error('Game create error:', err);
      socket.emit('error', { message: 'Failed to create game' });
    }
  });

  // Join game
  socket.on('game_join', async (data) => {
    try {
      const { game_id } = data;
      const gameRoom = `game:${game_id}`;
      socket.join(gameRoom);

      let gameState = activeGames.get(game_id);
      if (!gameState) {
        const [games] = await pool.execute('SELECT * FROM games WHERE id = ?', [game_id]);
        if (games.length === 0) return socket.emit('error', { message: 'Game not found' });
        gameState = initGameState(games[0].game_type, game_id, games[0].created_by, '');
        activeGames.set(game_id, gameState);
      }

      gameState.players.push({ id: socket.userId, username: socket.username, score: 0 });
      gameState.status = 'active';

      // Add score entry
      try {
        await pool.execute('INSERT INTO game_scores (game_id, user_id) VALUES (?, ?)', [game_id, socket.userId]);
      } catch (e) { /* Ignore duplicate */ }

      await pool.execute("UPDATE games SET status = 'active' WHERE id = ?", [game_id]);

      // Start the game
      startGame(gameState);
      io.to(gameRoom).emit('game_started', { game_state: gameState });
    } catch (err) {
      console.error('Game join error:', err);
    }
  });

  // Game action
  socket.on('game_action', async (data) => {
    try {
      const { game_id, action } = data;
      const gameState = activeGames.get(game_id);
      if (!gameState) return;

      const gameRoom = `game:${game_id}`;
      processGameAction(gameState, socket.userId, socket.username, action);
      io.to(gameRoom).emit('game_update', { game_state: gameState });

      // Check if game is over
      if (gameState.status === 'finished') {
        await endGame(gameState, game_id, io);
        io.to(gameRoom).emit('game_ended', { game_state: gameState });
        activeGames.delete(game_id);
      }
    } catch (err) {
      console.error('Game action error:', err);
    }
  });

  // Leave game
  socket.on('game_leave', (data) => {
    const { game_id } = data;
    socket.leave(`game:${game_id}`);
    const gameState = activeGames.get(game_id);
    if (gameState) {
      gameState.players = gameState.players.filter(p => p.id !== socket.userId);
      if (gameState.players.length === 0) {
        activeGames.delete(game_id);
      }
    }
  });
}

// ==================== GAME INIT ====================
function initGameState(type, gameId, creatorId, creatorUsername) {
  const base = {
    id: gameId,
    type,
    status: 'waiting',
    players: [{ id: creatorId, username: creatorUsername, score: 0 }],
    currentRound: 0,
    maxRounds: 10,
    data: {}
  };

  switch (type) {
    case 'truth_or_dare':
      base.maxRounds = 10;
      base.data = { currentType: null, currentContent: null, currentPlayer: 0, completed: [] };
      break;
    case 'would_you_rather':
      base.maxRounds = 10;
      base.data = { options: null, votes: {}, revealed: false };
      break;
    case 'never_have_i_ever':
      base.maxRounds = 10;
      base.data = { statement: null, responses: {} };
      break;
    case 'emoji_guess':
      base.maxRounds = 10;
      base.data = { puzzle: null, guesses: {}, hintsUsed: 0 };
      break;
    case 'typing_race':
      base.maxRounds = 5;
      base.data = { text: null, progress: {}, startTime: null, finished: {} };
      break;
    case 'tic_tac_toe':
      base.maxRounds = 1;
      base.data = { board: Array(9).fill(null), currentTurn: 0, symbols: ['X', 'O'] };
      break;
    case 'quiz_battle':
      base.maxRounds = 10;
      base.data = { question: null, answers: {}, questionIndex: 0, usedQuestions: [] };
      break;
  }
  return base;
}

// ==================== START GAME ====================
function startGame(state) {
  state.currentRound = 1;
  generateRound(state);
}

function generateRound(state) {
  switch (state.type) {
    case 'truth_or_dare':
      state.data.currentType = null;
      state.data.currentContent = null;
      state.data.currentPlayer = (state.currentRound - 1) % state.players.length;
      break;
    case 'would_you_rather': {
      const idx = Math.floor(Math.random() * wouldYouRatherOptions.length);
      state.data.options = wouldYouRatherOptions[idx];
      state.data.votes = {};
      state.data.revealed = false;
      break;
    }
    case 'never_have_i_ever': {
      const idx = Math.floor(Math.random() * neverHaveIEverStatements.length);
      state.data.statement = neverHaveIEverStatements[idx];
      state.data.responses = {};
      break;
    }
    case 'emoji_guess': {
      const unused = emojiPuzzles.filter((_, i) => !state.data.usedPuzzles?.includes(i));
      const idx = Math.floor(Math.random() * unused.length);
      const puzzleIdx = emojiPuzzles.indexOf(unused[idx] || emojiPuzzles[0]);
      state.data.puzzle = { emojis: emojiPuzzles[puzzleIdx].emojis, index: puzzleIdx };
      state.data.guesses = {};
      state.data.hintsUsed = 0;
      if (!state.data.usedPuzzles) state.data.usedPuzzles = [];
      state.data.usedPuzzles.push(puzzleIdx);
      break;
    }
    case 'typing_race': {
      const idx = Math.floor(Math.random() * typingTexts.length);
      state.data.text = typingTexts[idx];
      state.data.progress = {};
      state.data.finished = {};
      state.data.startTime = Date.now();
      break;
    }
    case 'tic_tac_toe':
      state.data.board = Array(9).fill(null);
      state.data.currentTurn = 0;
      break;
    case 'quiz_battle': {
      const unused = quizQuestions.filter((_, i) => !state.data.usedQuestions.includes(i));
      if (unused.length === 0) { state.status = 'finished'; return; }
      const idx = Math.floor(Math.random() * unused.length);
      const qIdx = quizQuestions.indexOf(unused[idx]);
      state.data.question = { ...quizQuestions[qIdx], index: qIdx };
      state.data.answers = {};
      state.data.usedQuestions.push(qIdx);
      state.data.questionStartTime = Date.now();
      break;
    }
  }
}

// ==================== PROCESS ACTION ====================
function processGameAction(state, userId, username, action) {
  switch (state.type) {
    case 'truth_or_dare': {
      if (action.type === 'choose') {
        // Player chose truth or dare
        if (action.choice === 'truth') {
          const idx = Math.floor(Math.random() * truthQuestions.length);
          state.data.currentType = 'truth';
          state.data.currentContent = truthQuestions[idx];
        } else {
          const idx = Math.floor(Math.random() * dares.length);
          state.data.currentType = 'dare';
          state.data.currentContent = dares[idx];
        }
      } else if (action.type === 'complete') {
        const player = state.players.find(p => p.id === userId);
        if (player) player.score += 10;
        state.data.completed.push({ userId, round: state.currentRound });
        nextRound(state);
      } else if (action.type === 'skip') {
        nextRound(state);
      }
      break;
    }

    case 'would_you_rather': {
      if (action.type === 'vote') {
        state.data.votes[userId] = action.choice; // 'a' or 'b'
        if (Object.keys(state.data.votes).length >= state.players.length) {
          state.data.revealed = true;
          state.players.forEach(p => { p.score += 5; });
          // After short delay, next round
          setTimeout(() => nextRound(state), 100);
        }
      }
      break;
    }

    case 'never_have_i_ever': {
      if (action.type === 'respond') {
        state.data.responses[userId] = action.response; // 'have' or 'never'
        if (Object.keys(state.data.responses).length >= state.players.length) {
          state.players.forEach(p => { p.score += 5; });
          setTimeout(() => nextRound(state), 100);
        }
      }
      break;
    }

    case 'emoji_guess': {
      if (action.type === 'guess') {
        const answer = emojiPuzzles[state.data.puzzle.index].answer;
        const guess = action.guess.toLowerCase().trim();
        const isCorrect = guess === answer || answer.includes(guess);
        state.data.guesses[userId] = { guess, correct: isCorrect, username };
        if (isCorrect) {
          const player = state.players.find(p => p.id === userId);
          if (player) player.score += (3 - state.data.hintsUsed) * 10;
          setTimeout(() => nextRound(state), 100);
        }
      } else if (action.type === 'hint') {
        state.data.hintsUsed++;
        const answer = emojiPuzzles[state.data.puzzle.index].answer;
        state.data.hint = answer.substring(0, state.data.hintsUsed * 2) + '...';
      } else if (action.type === 'skip') {
        state.data.answer = emojiPuzzles[state.data.puzzle.index].answer;
        setTimeout(() => nextRound(state), 100);
      }
      break;
    }

    case 'typing_race': {
      if (action.type === 'progress') {
        state.data.progress[userId] = { chars: action.chars, total: state.data.text.length, username };
      } else if (action.type === 'finish') {
        const elapsed = (Date.now() - state.data.startTime) / 1000;
        const words = state.data.text.split(' ').length;
        const wpm = Math.round((words / elapsed) * 60);
        state.data.finished[userId] = { wpm, time: elapsed, accuracy: action.accuracy || 100, username };
        const player = state.players.find(p => p.id === userId);
        if (player) player.score += wpm;
        if (Object.keys(state.data.finished).length >= state.players.length) {
          setTimeout(() => nextRound(state), 100);
        }
      }
      break;
    }

    case 'tic_tac_toe': {
      if (action.type === 'move') {
        const playerIdx = state.players.findIndex(p => p.id === userId);
        if (playerIdx !== state.data.currentTurn) return; // Not their turn
        if (state.data.board[action.cell] !== null) return; // Cell taken

        state.data.board[action.cell] = state.data.symbols[playerIdx];
        const winner = checkTicTacToeWinner(state.data.board);
        if (winner) {
          state.data.winner = winner;
          const winnerPlayer = state.players[state.data.symbols.indexOf(winner)];
          if (winnerPlayer) winnerPlayer.score += 100;
          state.data.winLine = getWinLine(state.data.board);
          state.status = 'finished';
        } else if (state.data.board.every(cell => cell !== null)) {
          state.data.winner = 'draw';
          state.players.forEach(p => { p.score += 25; });
          state.status = 'finished';
        } else {
          state.data.currentTurn = 1 - state.data.currentTurn;
        }
      }
      break;
    }

    case 'quiz_battle': {
      if (action.type === 'answer') {
        const elapsed = (Date.now() - state.data.questionStartTime) / 1000;
        const isCorrect = action.answer === state.data.question.correct;
        state.data.answers[userId] = { answer: action.answer, correct: isCorrect, time: elapsed, username };
        if (isCorrect) {
          const player = state.players.find(p => p.id === userId);
          const timeBonus = Math.max(0, Math.round((15 - elapsed) * 2));
          if (player) player.score += 10 + timeBonus;
        }
        if (Object.keys(state.data.answers).length >= state.players.length) {
          setTimeout(() => nextRound(state), 100);
        }
      }
      break;
    }
  }
}

function nextRound(state) {
  state.currentRound++;
  if (state.currentRound > state.maxRounds) {
    state.status = 'finished';
    // Determine winner
    const sorted = [...state.players].sort((a, b) => b.score - a.score);
    state.data.finalResults = sorted;
    if (sorted.length > 1 && sorted[0].score > sorted[1].score) {
      state.data.winnerId = sorted[0].id;
      state.data.winnerName = sorted[0].username;
    }
    return;
  }
  generateRound(state);
}

// ==================== TIC-TAC-TOE HELPERS ====================
const winPatterns = [
  [0,1,2], [3,4,5], [6,7,8], // rows
  [0,3,6], [1,4,7], [2,5,8], // cols
  [0,4,8], [2,4,6]           // diags
];

function checkTicTacToeWinner(board) {
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function getWinLine(board) {
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return pattern;
    }
  }
  return null;
}

// ==================== END GAME ====================
async function endGame(state, gameId, io) {
  try {
    const winnerId = state.data.winnerId || null;
    await pool.execute(
      "UPDATE games SET status = 'finished', finished_at = CURRENT_TIMESTAMP, winner_id = ?, game_data = ? WHERE id = ?",
      [winnerId, JSON.stringify(state.data), gameId]
    );
    // Update scores in DB
    for (const player of state.players) {
      await pool.execute(
        'UPDATE game_scores SET score = ? WHERE game_id = ? AND user_id = ?',
        [player.score, gameId, player.id]
      );
    }
    
    // Insert system message for game history
    const [games] = await pool.execute('SELECT conversation_id FROM games WHERE id = ?', [gameId]);
    if (games.length > 0) {
      const convId = games[0].conversation_id;
      const senderId = state.players[0]?.id;
      const isDraw = state.data.winner === 'draw' || (state.data.finalResults && state.data.finalResults.length > 1 && state.data.finalResults[0].score === state.data.finalResults[1].score);
      const content = JSON.stringify({ 
        system: 'game', 
        status: isDraw ? 'draw' : 'finished', 
        game_type: state.type,
        winner_id: state.data.winnerId || null,
        winner_name: state.data.winnerName || null
      });
      
      const [res] = await pool.execute(
        'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)',
        [convId, senderId, content]
      );
      
      const [msgs] = await pool.execute(
        `SELECT m.*, u.username as sender_username, u.avatar_url as sender_avatar FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?`,
        [res.insertId]
      );
      
      if (msgs.length > 0 && io) {
        state.players.forEach(p => {
          io.to(`user:${p.id}`).emit('new_message', { message: msgs[0] });
        });
      }
    }
  } catch (err) {
    console.error('End game DB error:', err);
  }
}

module.exports = setupGames;
