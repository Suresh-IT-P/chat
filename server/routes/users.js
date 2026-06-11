const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// Multer config for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uuidv4()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// Update profile
router.put('/me', auth, async (req, res) => {
  try {
    const { username, theme } = req.body;
    const updates = [];
    const values = [];

    if (username) {
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, req.user.id]
      );
      if (existing.length > 0) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      updates.push('username = ?');
      values.push(username);
    }
    if (theme && ['classic', 'pro', 'romantic'].includes(theme)) {
      updates.push('theme = ?');
      values.push(theme);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.user.id);
    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [users] = await pool.execute(
      'SELECT id, username, email, avatar_url, theme FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json(users[0]);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatar_url = `/uploads/${req.file.filename}`;
    await pool.execute('UPDATE users SET avatar_url = ? WHERE id = ?', [avatar_url, req.user.id]);

    res.json({ avatar_url });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const [users] = await pool.execute(
      `SELECT id, username, avatar_url, is_online 
       FROM users 
       WHERE username LIKE ? AND id != ?
       LIMIT 20`,
      [`%${q}%`, req.user.id]
    );

    res.json(users);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
