// =============================================
// VOICE MANAGER — WebRTC Audio Calls
// =============================================

const VoiceManager = {
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  isCalling: false,
  isMuted: false,
  callTimer: null,
  callDuration: 0,
  currentCallUser: null,
  
  // STUN servers
  rtcConfig: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  },

  init() {
    this.createAudioElement();
    this.setupSocketListeners();
  },

  createAudioElement() {
    // Hidden audio element for remote stream playback
    const audio = document.createElement('audio');
    audio.id = 'remoteAudio';
    audio.autoplay = true;
    document.body.appendChild(audio);
  },

  setupSocketListeners() {
    SocketManager.on('call_incoming', (data) => this.handleIncomingCall(data));
    SocketManager.on('call_accepted', (data) => this.handleCallAccepted(data));
    SocketManager.on('call_rejected', (data) => this.handleCallRejected(data));
    SocketManager.on('call_ended', () => this.handleCallEnded());
    SocketManager.on('webrtc_offer', (data) => this.handleWebRTCOffer(data));
    SocketManager.on('webrtc_answer', (data) => this.handleWebRTCAnswer(data));
    SocketManager.on('webrtc_ice_candidate', (data) => this.handleICECandidate(data));
    SocketManager.on('call_error', (data) => Toast.error(data.message));
  },

  async startCall(recipientId, recipientUsername) {
    if (this.isCalling) return Toast.info('Already in a call');
    
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.isCalling = true;
      this.currentCallUser = { id: recipientId, username: recipientUsername };
      
      NotificationManager.requestWakeLock();
      
      SocketManager.emit('call_initiate', { recipient_id: recipientId });
      this.showCallOverlay(recipientUsername, 'Calling...');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      Toast.error('Microphone access denied or unavailable');
      this.cleanupCall();
    }
  },

  handleIncomingCall(data) {
    if (this.isCalling) {
      // Busy
      SocketManager.emit('call_reject', { caller_id: data.caller_id });
      return;
    }

    NotificationManager.notify('Incoming Call', { body: `${data.caller_username} is calling you...` });

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'incomingCallModal';
    overlay.innerHTML = `
      <div class="modal" style="text-align:center; padding: 32px;">
        <div style="font-size: 3rem; margin-bottom: 16px; animation: pulse 1.5s infinite">📞</div>
        <h2 style="margin-bottom: 8px; font-family: Outfit, sans-serif">Incoming Call</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: 24px">${data.caller_username} is calling you</p>
        <div class="flex gap-md" style="justify-content: center">
          <button class="btn btn-primary" onclick="VoiceManager.acceptCall(${data.caller_id}, '${data.caller_username}')" style="background: #10b981; border-color: #10b981">Answer</button>
          <button class="btn btn-secondary" onclick="VoiceManager.rejectCall(${data.caller_id})" style="color: #ef4444; border-color: #ef4444">Decline</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  async acceptCall(callerId, callerUsername) {
    document.getElementById('incomingCallModal')?.remove();
    
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.isCalling = true;
      this.currentCallUser = { id: callerId, username: callerUsername };
      
      NotificationManager.requestWakeLock();
      
      SocketManager.emit('call_accept', { caller_id: callerId });
      this.showCallOverlay(callerUsername, 'Connecting...');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      Toast.error('Microphone access denied');
      SocketManager.emit('call_reject', { caller_id: callerId });
      this.cleanupCall();
    }
  },

  rejectCall(callerId) {
    document.getElementById('incomingCallModal')?.remove();
    SocketManager.emit('call_reject', { caller_id: callerId });
  },

  async handleCallAccepted(data) {
    // Caller receives this when callee answers. Caller initiates WebRTC offer.
    this.createPeerConnection(data.accepter_id);
    
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      SocketManager.emit('webrtc_offer', { 
        target_id: data.accepter_id, 
        offer: this.peerConnection.localDescription 
      });
    } catch (err) {
      console.error('Error creating offer:', err);
      this.endCall();
    }
  },

  handleCallRejected(data) {
    Toast.info('Call declined');
    this.cleanupCall();
  },

  async handleWebRTCOffer(data) {
    // Callee receives offer
    this.createPeerConnection(data.sender_id);
    
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      SocketManager.emit('webrtc_answer', {
        target_id: data.sender_id,
        answer: this.peerConnection.localDescription
      });
    } catch (err) {
      console.error('Error handling offer:', err);
      this.endCall();
    }
  },

  async handleWebRTCAnswer(data) {
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  },

  async handleICECandidate(data) {
    if (this.peerConnection) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    }
  },

  createPeerConnection(targetId) {
    this.peerConnection = new RTCPeerConnection(this.rtcConfig);

    // Add local tracks
    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        SocketManager.emit('webrtc_ice_candidate', {
          target_id: targetId,
          candidate: event.candidate
        });
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      const remoteAudio = document.getElementById('remoteAudio');
      if (remoteAudio.srcObject !== event.streams[0]) {
        remoteAudio.srcObject = event.streams[0];
        this.startCallTimer();
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection.connectionState === 'disconnected' || 
          this.peerConnection.connectionState === 'failed') {
        this.endCall();
      }
    };
  },

  showCallOverlay(username, status) {
    let overlay = document.getElementById('activeCallOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'activeCallOverlay';
      overlay.className = 'active-call-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="call-info">
        <div class="call-avatar" style="animation: ${status === 'Calling...' ? 'pulse 1.5s infinite' : 'none'}">📞</div>
        <div class="call-details">
          <div class="call-name">${username}</div>
          <div class="call-status" id="callStatusText">${status}</div>
        </div>
      </div>
      <div class="call-actions">
        <button class="btn-icon call-mute-btn" onclick="VoiceManager.toggleMute()" id="callMuteBtn">
          ${this.isMuted ? '🔇' : '🎤'}
        </button>
        <button class="btn-icon call-end-btn" onclick="VoiceManager.endCall()">
          ✕
        </button>
      </div>
    `;
    overlay.style.display = 'flex';
  },

  startCallTimer() {
    this.callDuration = 0;
    const statusText = document.getElementById('callStatusText');
    const overlayAvatar = document.querySelector('.call-avatar');
    if (overlayAvatar) overlayAvatar.style.animation = 'none';

    this.callTimer = setInterval(() => {
      this.callDuration++;
      const mins = String(Math.floor(this.callDuration / 60)).padStart(2, '0');
      const secs = String(this.callDuration % 60).padStart(2, '0');
      if (statusText) statusText.textContent = `${mins}:${secs}`;
    }, 1000);
  },

  toggleMute() {
    if (this.localStream) {
      this.isMuted = !this.isMuted;
      this.localStream.getAudioTracks()[0].enabled = !this.isMuted;
      const btn = document.getElementById('callMuteBtn');
      if (btn) btn.innerHTML = this.isMuted ? '🔇' : '🎤';
      if (this.isMuted) btn.classList.add('muted');
      else btn.classList.remove('muted');
    }
  },

  endCall() {
    if (this.currentCallUser) {
      SocketManager.emit('call_end', { target_id: this.currentCallUser.id });
    }
    this.cleanupCall();
  },

  handleCallEnded() {
    Toast.info('Call ended');
    this.cleanupCall();
  },

  cleanupCall() {
    clearInterval(this.callTimer);
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    const remoteAudio = document.getElementById('remoteAudio');
    if (remoteAudio) remoteAudio.srcObject = null;
    
    const overlay = document.getElementById('activeCallOverlay');
    if (overlay) overlay.style.display = 'none';
    
    const incomingModal = document.getElementById('incomingCallModal');
    if (incomingModal) incomingModal.remove();

    NotificationManager.releaseWakeLock();

    this.isCalling = false;
    this.currentCallUser = null;
    this.isMuted = false;
  }
};
