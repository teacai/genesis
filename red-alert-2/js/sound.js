// Sound system using Web Audio API - procedurally generated sounds
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.3;
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._initialized = true;
    } catch (e) {
      console.warn('Audio not available:', e);
      this.enabled = false;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _createOscillator(freq, type, duration, volume = 0.3) {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume * this.volume;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  _createNoise(duration, volume = 0.2) {
    if (!this.ctx || !this.enabled) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume * this.volume;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = 1;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  }

  playAttack(weaponType) {
    if (!this.ctx || !this.enabled) return;
    switch (weaponType) {
      case 'bullet':
        this._createNoise(0.05, 0.15);
        this._createOscillator(800, 'square', 0.03, 0.1);
        break;
      case 'shell':
        this._createNoise(0.15, 0.25);
        this._createOscillator(150, 'sawtooth', 0.1, 0.15);
        break;
      case 'missile':
        this._createOscillator(600, 'sawtooth', 0.2, 0.1);
        this._createOscillator(400, 'sine', 0.3, 0.08);
        break;
      case 'laser':
        this._createOscillator(1200, 'sine', 0.15, 0.12);
        this._createOscillator(1800, 'sine', 0.1, 0.08);
        break;
      case 'electric':
        this._createOscillator(100, 'sawtooth', 0.2, 0.15);
        this._createNoise(0.1, 0.1);
        break;
      case 'flak':
        this._createNoise(0.08, 0.2);
        this._createOscillator(300, 'square', 0.05, 0.12);
        break;
      case 'bomb':
        this._createNoise(0.3, 0.3);
        this._createOscillator(80, 'sine', 0.4, 0.2);
        break;
      case 'rocket':
        this._createOscillator(200, 'sawtooth', 0.3, 0.12);
        break;
      case 'torpedo':
        this._createOscillator(100, 'sine', 0.4, 0.1);
        break;
    }
  }

  playExplosion(entityType) {
    if (!this.ctx || !this.enabled) return;
    if (entityType === 'building') {
      this._createNoise(0.5, 0.4);
      this._createOscillator(60, 'sine', 0.6, 0.3);
      this._createOscillator(40, 'sine', 0.8, 0.2);
    } else {
      this._createNoise(0.3, 0.3);
      this._createOscillator(100, 'sine', 0.3, 0.2);
    }
  }

  playSelect() {
    if (!this.ctx || !this.enabled) return;
    this._createOscillator(600, 'sine', 0.08, 0.1);
  }

  playBuild() {
    if (!this.ctx || !this.enabled) return;
    this._createOscillator(400, 'sine', 0.1, 0.12);
    setTimeout(() => this._createOscillator(600, 'sine', 0.1, 0.12), 100);
  }

  playError() {
    if (!this.ctx || !this.enabled) return;
    this._createOscillator(200, 'square', 0.15, 0.15);
  }

  playVoice(type) {
    if (!this.ctx || !this.enabled) return;
    switch (type) {
      case 'acknowledged':
        this._createOscillator(300, 'sine', 0.1, 0.08);
        setTimeout(() => this._createOscillator(400, 'sine', 0.1, 0.08), 120);
        break;
      case 'attacking':
        this._createOscillator(400, 'square', 0.08, 0.1);
        setTimeout(() => this._createOscillator(500, 'square', 0.08, 0.1), 100);
        setTimeout(() => this._createOscillator(600, 'square', 0.08, 0.1), 200);
        break;
      case 'construction_complete':
        this._createOscillator(440, 'sine', 0.15, 0.12);
        setTimeout(() => this._createOscillator(550, 'sine', 0.15, 0.12), 180);
        setTimeout(() => this._createOscillator(660, 'sine', 0.2, 0.12), 360);
        break;
      case 'unit_ready':
        this._createOscillator(500, 'sine', 0.1, 0.1);
        setTimeout(() => this._createOscillator(600, 'sine', 0.15, 0.1), 130);
        break;
      case 'insufficient_funds':
        this._createOscillator(200, 'square', 0.2, 0.12);
        setTimeout(() => this._createOscillator(150, 'square', 0.3, 0.12), 220);
        break;
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}
