const pool = require('../config/db');

function setupChat(io, socket, onlineUsers) {
  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { conversation_id, content, image_url } = data;

      // Save to DB
      const [result] = await pool.execute(
        'INSERT INTO messages (conversation_id, sender_id, content, image_url) VALUES (?, ?, ?, ?)',
        [conversation_id, socket.userId, content || null, image_url || null]
      );

      // Update conversation timestamp
      await pool.execute(
        'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?',
        [conversation_id]
      );

      // Get conversation to find recipient
      const [conv] = await pool.execute(
        'SELECT user1_id, user2_id FROM conversations WHERE id = ?',
        [conversation_id]
      );

      if (conv.length === 0) return;

      const recipientId = conv[0].user1_id === socket.userId ? conv[0].user2_id : conv[0].user1_id;

      const message = {
        id: result.insertId,
        conversation_id,
        sender_id: socket.userId,
        sender_username: socket.username,
        content: content || null,
        image_url: image_url || null,
        is_read: false,
        created_at: new Date().toISOString(),
        reactions: null
      };

      // Emit to sender
      socket.emit('new_message', message);

      // Emit to recipient
      io.to(`user:${recipientId}`).emit('new_message', message);

    } catch (err) {
      console.error('Send message error:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing_start', (data) => {
    const { conversation_id, recipient_id } = data;
    io.to(`user:${recipient_id}`).emit('user_typing', {
      conversation_id,
      user_id: socket.userId,
      username: socket.username
    });
  });

  socket.on('typing_stop', (data) => {
    const { conversation_id, recipient_id } = data;
    io.to(`user:${recipient_id}`).emit('user_stop_typing', {
      conversation_id,
      user_id: socket.userId
    });
  });

  // Mark as read
  socket.on('mark_read', async (data) => {
    try {
      const { conversation_id } = data;
      await pool.execute(
        'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ? AND is_read = 0',
        [conversation_id, socket.userId]
      );

      // Get the other user
      const [conv] = await pool.execute(
        'SELECT user1_id, user2_id FROM conversations WHERE id = ?',
        [conversation_id]
      );
      if (conv.length > 0) {
        const senderId = conv[0].user1_id === socket.userId ? conv[0].user2_id : conv[0].user1_id;
        io.to(`user:${senderId}`).emit('messages_read', {
          conversation_id,
          reader_id: socket.userId
        });
      }
    } catch (err) {
      console.error('Mark read error:', err);
    }
  });

  // React to message
  socket.on('react_message', async (data) => {
    try {
      const { message_id, emoji, conversation_id } = data;

      // Toggle reaction
      const [existing] = await pool.execute(
        'SELECT id FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
        [message_id, socket.userId, emoji]
      );

      if (existing.length > 0) {
        await pool.execute('DELETE FROM reactions WHERE id = ?', [existing[0].id]);
      } else {
        await pool.execute(
          'INSERT INTO reactions (message_id, user_id, emoji) VALUES (?, ?, ?)',
          [message_id, socket.userId, emoji]
        );
      }

      // Get updated reactions
      const [reactions] = await pool.execute(
        `SELECT r.id, r.emoji, r.user_id, u.username 
         FROM reactions r JOIN users u ON u.id = r.user_id 
         WHERE r.message_id = ?`,
        [message_id]
      );

      // Emit to both users in conversation
      const [conv] = await pool.execute(
        'SELECT user1_id, user2_id FROM conversations WHERE id = ?',
        [conversation_id]
      );
      if (conv.length > 0) {
        io.to(`user:${conv[0].user1_id}`).to(`user:${conv[0].user2_id}`).emit('reaction_updated', {
          message_id,
          reactions
        });
      }
    } catch (err) {
      console.error('React error:', err);
    }
  });
}

module.exports = setupChat;
