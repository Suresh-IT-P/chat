const pool = require('../config/db');

module.exports = function setupWebRTC(io, socket, onlineUsers) {
  // Initiate a call
  socket.on('call_initiate', (data) => {
    const targetSockets = onlineUsers.get(data.recipient_id);
    if (!targetSockets) {
      // User is offline
      socket.emit('call_error', { message: 'User is offline' });
      return;
    }

    // Send incoming call alert to the target user
    io.to(`user:${data.recipient_id}`).emit('call_incoming', {
      caller_id: socket.userId,
      caller_username: socket.username,
      conversation_id: data.conversation_id
    });
  });

  // Accept a call
  socket.on('call_accept', (data) => {
    // Notify the caller that the call was accepted
    io.to(`user:${data.caller_id}`).emit('call_accepted', {
      accepter_id: socket.userId,
      conversation_id: data.conversation_id
    });
  });

  // Reject a call
  socket.on('call_reject', async (data) => {
    io.to(`user:${data.caller_id}`).emit('call_rejected', {
      rejecter_id: socket.userId
    });

    if (data.conversation_id) {
      try {
        const content = JSON.stringify({ system: 'call', status: 'rejected' });
        const [res] = await pool.execute(
          'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)',
          [data.conversation_id, data.caller_id, content]
        );
        const [msgs] = await pool.execute(
          `SELECT m.*, u.username as sender_username, u.avatar_url as sender_avatar FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?`,
          [res.insertId]
        );
        if (msgs.length > 0) {
          io.to(`user:${socket.userId}`).emit('new_message', { message: msgs[0] });
          io.to(`user:${data.caller_id}`).emit('new_message', { message: msgs[0] });
        }
      } catch (err) {
        console.error('Call reject msg error:', err);
      }
    }
  });

  // End a call
  socket.on('call_end', async (data) => {
    io.to(`user:${data.target_id}`).emit('call_ended', {
      ender_id: socket.userId
    });

    if (data.conversation_id) {
      try {
        const content = JSON.stringify({ system: 'call', status: 'ended', duration: data.duration || 0 });
        const [res] = await pool.execute(
          'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)',
          [data.conversation_id, socket.userId, content]
        );
        const [msgs] = await pool.execute(
          `SELECT m.*, u.username as sender_username, u.avatar_url as sender_avatar FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?`,
          [res.insertId]
        );
        if (msgs.length > 0) {
          io.to(`user:${socket.userId}`).emit('new_message', { message: msgs[0] });
          io.to(`user:${data.target_id}`).emit('new_message', { message: msgs[0] });
        }
      } catch (err) {
        console.error('Call end msg error:', err);
      }
    }
  });

  // WebRTC signaling
  socket.on('webrtc_offer', (data) => {
    io.to(`user:${data.target_id}`).emit('webrtc_offer', {
      offer: data.offer,
      sender_id: socket.userId
    });
  });

  socket.on('webrtc_answer', (data) => {
    io.to(`user:${data.target_id}`).emit('webrtc_answer', {
      answer: data.answer,
      sender_id: socket.userId
    });
  });

  socket.on('webrtc_ice_candidate', (data) => {
    io.to(`user:${data.target_id}`).emit('webrtc_ice_candidate', {
      candidate: data.candidate,
      sender_id: socket.userId
    });
  });
};
