// WebRTC multiplayer synchronization
// Uses a star topology: one host, many clients
// Lock-step simulation with command synchronization

class NetworkManager {
  constructor(game) {
    this.game = game;
    this.isHost = false;
    this.isConnected = false;
    this.peers = new Map(); // peerId -> { connection, dataChannel, playerId }
    this.pendingConnections = new Map();
    this.localId = this._generateId();
    this.commands = []; // commands to send
    this.receivedCommands = []; // commands received
    this.tick = 0;
    this.commandBuffer = new Map(); // tick -> commands[]
    this.signalServer = null;
    this.roomCode = null;

    // WebRTC config
    this.rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    };
  }

  _generateId() {
    return Math.random().toString(36).substring(2, 10);
  }

  generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // === Host mode ===
  async hostGame() {
    this.isHost = true;
    this.roomCode = this.generateRoomCode();
    this.isConnected = true;

    // Use BroadcastChannel for same-browser testing,
    // and manual signaling for cross-browser
    this._setupSignaling();

    this.game.notify(`Room code: ${this.roomCode}`);
    return this.roomCode;
  }

  // === Client mode ===
  async joinGame(roomCode) {
    this.roomCode = roomCode;
    this.isHost = false;

    this._setupSignaling();
    // Send join request
    this._sendSignal({ type: 'join', from: this.localId, room: roomCode });

    return new Promise((resolve, reject) => {
      this._joinResolve = resolve;
      this._joinReject = reject;
      setTimeout(() => reject(new Error('Connection timeout')), 30000);
    });
  }

  _setupSignaling() {
    // Use BroadcastChannel API for same-origin signaling
    // In production, replace with a WebSocket signaling server
    try {
      this.signalChannel = new BroadcastChannel(`ra2-signal-${this.roomCode}`);
      this.signalChannel.onmessage = (event) => {
        this._handleSignal(event.data);
      };
    } catch (e) {
      console.warn('BroadcastChannel not available, using localStorage fallback');
      this._useLocalStorageFallback();
    }
  }

  _useLocalStorageFallback() {
    const key = `ra2-signal-${this.roomCode}`;
    window.addEventListener('storage', (e) => {
      if (e.key === key && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.from !== this.localId) {
            this._handleSignal(data);
          }
        } catch (err) {}
      }
    });
  }

  _sendSignal(data) {
    data.from = this.localId;
    if (this.signalChannel) {
      this.signalChannel.postMessage(data);
    } else {
      localStorage.setItem(`ra2-signal-${this.roomCode}`, JSON.stringify(data));
    }
  }

  async _handleSignal(data) {
    if (data.from === this.localId) return;

    switch (data.type) {
      case 'join':
        if (this.isHost) {
          await this._createPeerConnection(data.from, true);
        }
        break;

      case 'offer':
        if (data.target === this.localId) {
          await this._handleOffer(data.from, data.offer);
        }
        break;

      case 'answer':
        if (data.target === this.localId) {
          await this._handleAnswer(data.from, data.answer);
        }
        break;

      case 'ice-candidate':
        if (data.target === this.localId) {
          await this._handleIceCandidate(data.from, data.candidate);
        }
        break;

      case 'game-state':
        if (!this.isHost) {
          this._handleGameState(data);
        }
        break;
    }
  }

  async _createPeerConnection(peerId, isInitiator) {
    const pc = new RTCPeerConnection(this.rtcConfig);
    const peer = { connection: pc, dataChannel: null, playerId: null, peerId };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this._sendSignal({
          type: 'ice-candidate',
          target: peerId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this._handleDisconnect(peerId);
      }
    };

    if (isInitiator) {
      const dc = pc.createDataChannel('game', { ordered: true });
      dc.onopen = () => this._onDataChannelOpen(peerId, dc);
      dc.onmessage = (e) => this._onDataChannelMessage(peerId, e.data);
      dc.onclose = () => this._handleDisconnect(peerId);
      peer.dataChannel = dc;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this._sendSignal({ type: 'offer', target: peerId, offer });
    } else {
      pc.ondatachannel = (event) => {
        const dc = event.channel;
        dc.onopen = () => this._onDataChannelOpen(peerId, dc);
        dc.onmessage = (e) => this._onDataChannelMessage(peerId, e.data);
        dc.onclose = () => this._handleDisconnect(peerId);
        peer.dataChannel = dc;
      };
    }

    this.peers.set(peerId, peer);
    return peer;
  }

  async _handleOffer(peerId, offer) {
    const peer = await this._createPeerConnection(peerId, false);
    await peer.connection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.connection.createAnswer();
    await peer.connection.setLocalDescription(answer);
    this._sendSignal({ type: 'answer', target: peerId, answer });
  }

  async _handleAnswer(peerId, answer) {
    const peer = this.peers.get(peerId);
    if (peer) {
      await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  async _handleIceCandidate(peerId, candidate) {
    const peer = this.peers.get(peerId);
    if (peer) {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  _onDataChannelOpen(peerId, dataChannel) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.dataChannel = dataChannel;
    }
    this.isConnected = true;

    if (this.isHost) {
      // Assign player ID and send game state
      const playerId = this.peers.size; // host is 0
      if (peer) peer.playerId = playerId;
      this._sendToPeer(peerId, {
        type: 'welcome',
        playerId,
        gameState: this._serializeGameState(),
      });
      this.game.notify(`Player ${playerId} connected`);
    } else {
      this.game.notify('Connected to host');
      if (this._joinResolve) this._joinResolve();
    }
  }

  _onDataChannelMessage(peerId, data) {
    try {
      const msg = JSON.parse(data);
      this._handleGameMessage(peerId, msg);
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  }

  _handleGameMessage(peerId, msg) {
    switch (msg.type) {
      case 'welcome':
        this.game.localPlayerId = msg.playerId;
        this._loadGameState(msg.gameState);
        break;

      case 'command':
        this.receivedCommands.push(msg.command);
        if (this.isHost) {
          // Broadcast to all other peers
          this._broadcastExcept(peerId, msg);
        }
        break;

      case 'sync':
        // Periodic state sync from host
        if (!this.isHost) {
          this._applySyncState(msg.state);
        }
        break;

      case 'tick':
        // Tick acknowledgment
        break;
    }
  }

  _handleDisconnect(peerId) {
    const peer = this.peers.get(peerId);
    if (peer) {
      this.game.notify(`Player ${peer.playerId} disconnected`);
      this.peers.delete(peerId);
    }
  }

  // === Message sending ===
  sendCommand(command) {
    command.playerId = this.game.localPlayerId;
    command.tick = this.tick;

    if (this.isHost) {
      this.receivedCommands.push(command);
      this._broadcast({ type: 'command', command });
    } else {
      this._sendToHost({ type: 'command', command });
    }
  }

  _sendToPeer(peerId, data) {
    const peer = this.peers.get(peerId);
    if (peer?.dataChannel?.readyState === 'open') {
      peer.dataChannel.send(JSON.stringify(data));
    }
  }

  _sendToHost(data) {
    // In star topology, first peer is the host
    for (const [peerId, peer] of this.peers) {
      if (peer.dataChannel?.readyState === 'open') {
        peer.dataChannel.send(JSON.stringify(data));
        break;
      }
    }
  }

  _broadcast(data) {
    const json = JSON.stringify(data);
    for (const [peerId, peer] of this.peers) {
      if (peer.dataChannel?.readyState === 'open') {
        peer.dataChannel.send(json);
      }
    }
  }

  _broadcastExcept(excludePeerId, data) {
    const json = JSON.stringify(data);
    for (const [peerId, peer] of this.peers) {
      if (peerId !== excludePeerId && peer.dataChannel?.readyState === 'open') {
        peer.dataChannel.send(json);
      }
    }
  }

  // === State sync ===
  _serializeGameState() {
    return {
      map: this.game.map.serialize(),
      players: Object.fromEntries(
        Object.entries(this.game.players).map(([id, p]) => [id, {
          id: p.id, name: p.name, faction: p.faction,
          color: p.color, credits: p.credits, isBot: p.isBot,
        }])
      ),
      tick: this.tick,
    };
  }

  _loadGameState(state) {
    // Recreate game state from host
    if (state.map) {
      this.game.map = GameMap.deserialize(state.map);
    }
  }

  _applySyncState(state) {
    // Apply incremental state updates
    if (state.entities) {
      for (const eData of state.entities) {
        const entity = this.game.entities.get(eData.id);
        if (entity) {
          entity.hp = eData.hp;
          entity.x = eData.x;
          entity.y = eData.y;
          entity.tileX = eData.tileX;
          entity.tileY = eData.tileY;
        }
      }
    }
    if (state.credits) {
      for (const [pid, credits] of Object.entries(state.credits)) {
        if (this.game.players[pid]) {
          this.game.players[pid].credits = credits;
        }
      }
    }
  }

  // === Tick ===
  processTick() {
    const commands = this.receivedCommands.splice(0);
    this.tick++;
    return commands;
  }

  getPlayerCount() {
    return this.peers.size + 1; // +1 for self
  }

  destroy() {
    for (const [peerId, peer] of this.peers) {
      peer.dataChannel?.close();
      peer.connection?.close();
    }
    this.peers.clear();
    this.signalChannel?.close();
  }
}
