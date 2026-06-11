const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// Send friend request
router.post('/request/:userId', auth, async (req, res) => {
  try {
    const receiverId = parseInt(req.params.userId);
    if (receiverId === req.user.id) {
      return res.status(400).json({ error: "You can't add yourself" });
    }

    // Check if already friends
    const [existing] = await pool.execute(
      'SELECT id FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [req.user.id, receiverId, receiverId, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Check existing request
    const [existingReq] = await pool.execute(
      `SELECT id FROM friend_requests 
       WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) 
       AND status = 'pending'`,
      [req.user.id, receiverId, receiverId, req.user.id]
    );
    if (existingReq.length > 0) {
      return res.status(400).json({ error: 'Friend request already exists' });
    }

    await pool.execute(
      'INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)',
      [req.user.id, receiverId]
    );

    res.status(201).json({ message: 'Friend request sent' });
  } catch (err) {
    console.error('Send request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept friend request
router.put('/request/:requestId/accept', auth, async (req, res) => {
  try {
    const [requests] = await pool.execute(
      "SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = 'pending'",
      [req.params.requestId, req.user.id]
    );
    if (requests.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requests[0];

    // Update request status
    await pool.execute(
      "UPDATE friend_requests SET status = 'accepted' WHERE id = ?",
      [request.id]
    );

    // Create friendship (bidirectional)
    await pool.execute(
      'INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)',
      [request.sender_id, request.receiver_id, request.receiver_id, request.sender_id]
    );

    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    console.error('Accept request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject friend request
router.put('/request/:requestId/reject', auth, async (req, res) => {
  try {
    const [result] = await pool.execute(
      "UPDATE friend_requests SET status = 'rejected' WHERE id = ? AND receiver_id = ? AND status = 'pending'",
      [req.params.requestId, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json({ message: 'Friend request rejected' });
  } catch (err) {
    console.error('Reject request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get friends list
router.get('/', auth, async (req, res) => {
  try {
    const [friends] = await pool.execute(
      `SELECT u.id, u.username, u.avatar_url, u.is_online, u.last_seen
       FROM friends f
       JOIN users u ON u.id = f.friend_id
       WHERE f.user_id = ?
       ORDER BY u.is_online DESC, u.username ASC`,
      [req.user.id]
    );
    res.json(friends);
  } catch (err) {
    console.error('Get friends error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending requests
router.get('/requests', auth, async (req, res) => {
  try {
    const [received] = await pool.execute(
      `SELECT fr.id, fr.created_at, u.id as sender_id, u.username, u.avatar_url
       FROM friend_requests fr
       JOIN users u ON u.id = fr.sender_id
       WHERE fr.receiver_id = ? AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
      [req.user.id]
    );
    const [sent] = await pool.execute(
      `SELECT fr.id, fr.created_at, u.id as receiver_id, u.username, u.avatar_url
       FROM friend_requests fr
       JOIN users u ON u.id = fr.receiver_id
       WHERE fr.sender_id = ? AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
      [req.user.id]
    );
    res.json({ received, sent });
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove friend
router.delete('/:friendId', auth, async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [req.user.id, req.params.friendId, req.params.friendId, req.user.id]
    );
    res.json({ message: 'Friend removed' });
  } catch (err) {
    console.error('Remove friend error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
