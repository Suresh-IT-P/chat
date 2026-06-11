const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a game
router.post('/create', auth, async (req, res) => {
  try {
    const { game_type, conversation_id } = req.body;
    const validTypes = ['truth_or_dare', 'would_you_rather', 'never_have_i_ever',
                        'emoji_guess', 'typing_race', 'tic_tac_toe', 'quiz_battle'];

    if (!validTypes.includes(game_type)) {
      return res.status(400).json({ error: 'Invalid game type' });
    }

    // Verify conversation access
    const [conv] = await pool.execute(
      'SELECT id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
      [conversation_id, req.user.id, req.user.id]
    );
    if (conv.length === 0) {
      return res.status(403).json({ error: 'Not your conversation' });
    }

    const [result] = await pool.execute(
      'INSERT INTO games (game_type, conversation_id, created_by, game_data) VALUES (?, ?, ?, ?)',
      [game_type, conversation_id, req.user.id, JSON.stringify({})]
    );

    // Create score entry for creator
    await pool.execute(
      'INSERT INTO game_scores (game_id, user_id) VALUES (?, ?)',
      [result.insertId, req.user.id]
    );

    res.status(201).json({ game_id: result.insertId });
  } catch (err) {
    console.error('Create game error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get game state
router.get('/:gameId', auth, async (req, res) => {
  try {
    const [games] = await pool.execute(
      `SELECT g.*, gs.score, gs.user_id as score_user_id
       FROM games g
       LEFT JOIN game_scores gs ON gs.game_id = g.id
       WHERE g.id = ?`,
      [req.params.gameId]
    );
    if (games.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(games[0]);
  } catch (err) {
    console.error('Get game error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get leaderboard for a conversation
router.get('/scores/:conversationId', auth, async (req, res) => {
  try {
    const [scores] = await pool.execute(
      `SELECT u.username, u.avatar_url, SUM(gs.score) as total_score, COUNT(DISTINCT g.id) as games_played,
              SUM(CASE WHEN g.winner_id = gs.user_id THEN 1 ELSE 0 END) as wins
       FROM game_scores gs
       JOIN games g ON g.id = gs.game_id
       JOIN users u ON u.id = gs.user_id
       WHERE g.conversation_id = ?
       GROUP BY gs.user_id
       ORDER BY total_score DESC`,
      [req.params.conversationId]
    );
    res.json(scores);
  } catch (err) {
    console.error('Get scores error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
