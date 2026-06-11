const pool = require('../config/db');

function setupPresence(io, socket, onlineUsers) {
  // Announce online to friends
  announceStatus(io, socket, onlineUsers, true);
}

async function announceStatus(io, socket, onlineUsers, isOnline) {
  try {
    // Update DB
    if (isOnline) {
      await pool.execute('UPDATE users SET is_online = 1, last_seen = CURRENT_TIMESTAMP WHERE id = ?', [socket.userId]);
    } else {
      await pool.execute('UPDATE users SET is_online = 0, last_seen = CURRENT_TIMESTAMP WHERE id = ?', [socket.userId]);
    }

    // Get friends to notify
    const [friends] = await pool.execute(
      'SELECT friend_id FROM friends WHERE user_id = ?',
      [socket.userId]
    );

    friends.forEach(f => {
      io.to(`user:${f.friend_id}`).emit('friend_status', {
        user_id: socket.userId,
        username: socket.username,
        is_online: isOnline,
        last_seen: new Date().toISOString()
      });
    });
  } catch (err) {
    console.error('Presence error:', err);
  }
}

// Static method for disconnect handler
setupPresence.goOffline = async (io, socket, onlineUsers) => {
  await announceStatus(io, socket, onlineUsers, false);
};

module.exports = setupPresence;
