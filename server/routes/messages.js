const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// Multer for chat images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `chat-${uuidv4()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const [conversations] = await pool.execute(
      `SELECT c.id, c.last_message_at,
        CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END as other_user_id,
        u.username as other_username, u.avatar_url as other_avatar, u.is_online as other_online,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
       FROM conversations c
       JOIN users u ON u.id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
       WHERE c.user1_id = ? OR c.user2_id = ?
       ORDER BY c.last_message_at DESC`,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
    );
    res.json(conversations);
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get or create conversation with a user
router.post('/conversations/:userId', auth, async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.userId);
    const minId = Math.min(req.user.id, otherUserId);
    const maxId = Math.max(req.user.id, otherUserId);

    // Check existing
    const [existing] = await pool.execute(
      'SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?',
      [minId, maxId]
    );

    if (existing.length > 0) {
      return res.json({ conversation_id: existing[0].id });
    }

    // Create new
    const [result] = await pool.execute(
      'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)',
      [minId, maxId]
    );

    res.status(201).json({ conversation_id: result.insertId });
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages for conversation (paginated)
router.get('/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Verify user is part of conversation
    const [conv] = await pool.execute(
      'SELECT id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
      [conversationId, req.user.id, req.user.id]
    );
    if (conv.length === 0) {
      return res.status(403).json({ error: 'Not your conversation' });
    }

    const [messages] = await pool.execute(
      `SELECT m.*, u.username as sender_username, u.avatar_url as sender_avatar,
        (SELECT json_group_array(json_object('id', r.id, 'emoji', r.emoji, 'user_id', r.user_id, 'username', ru.username))
         FROM reactions r JOIN users ru ON ru.id = r.user_id WHERE r.message_id = m.id) as reactions
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [conversationId, limit, offset]
    );

    res.json(messages.reverse());
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search messages
router.get('/search/all', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const [messages] = await pool.execute(
      `SELECT m.id, m.content, m.created_at, m.conversation_id,
              u.username as sender_username,
              CASE WHEN c.user1_id = ? THEN ou2.username ELSE ou1.username END as other_username
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       JOIN conversations c ON c.id = m.conversation_id
       JOIN users ou1 ON ou1.id = c.user1_id
       JOIN users ou2 ON ou2.id = c.user2_id
       WHERE (c.user1_id = ? OR c.user2_id = ?) AND m.content LIKE ?
       ORDER BY m.created_at DESC
       LIMIT 30`,
      [req.user.id, req.user.id, req.user.id, `%${q}%`]
    );

    res.json(messages);
  } catch (err) {
    console.error('Search messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload chat image
router.post('/image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ image_url: `/uploads/${req.file.filename}` });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add reaction
router.post('/:messageId/react', auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ error: 'Emoji required' });

    // Check if reaction exists (toggle)
    const [existing] = await pool.execute(
      'SELECT id FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
      [req.params.messageId, req.user.id, emoji]
    );

    if (existing.length > 0) {
      await pool.execute('DELETE FROM reactions WHERE id = ?', [existing[0].id]);
      return res.json({ action: 'removed' });
    }

    await pool.execute(
      'INSERT INTO reactions (message_id, user_id, emoji) VALUES (?, ?, ?)',
      [req.params.messageId, req.user.id, emoji]
    );

    res.json({ action: 'added' });
  } catch (err) {
    console.error('Reaction error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
