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
      caller_username: socket.username
    });
  });

  // Accept a call
  socket.on('call_accept', (data) => {
    // Notify the caller that the call was accepted
    io.to(`user:${data.caller_id}`).emit('call_accepted', {
      accepter_id: socket.userId
    });
  });

  // Reject a call
  socket.on('call_reject', (data) => {
    io.to(`user:${data.caller_id}`).emit('call_rejected', {
      rejecter_id: socket.userId
    });
  });

  // End a call
  socket.on('call_end', (data) => {
    io.to(`user:${data.target_id}`).emit('call_ended', {
      ender_id: socket.userId
    });
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
