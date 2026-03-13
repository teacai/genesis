// Main game orchestrator
class Game {
  constructor() {
    this.state = 'menu'; // menu, setup, playing, editor, gameover
    this.map = null;
    this.entities = new EntityManager();
    this.pathfinder = null;
    this.combat = null;
    this.fog = null;
    this.players = {};
    this.localPlayerId = 0;
    this.effects = [];
    this.sound = new SoundSystem();
    this.network = new NetworkManager(this);
    this.aiManager = new AIManager();
    this.mapEditor = new MapEditor(this);

    // Camera
    this.camera = {
      x: 0, y: 0, zoom: 1,
      screenW: window.innerWidth,
      screenH: window.innerHeight,
    };

    // Frame timing
    this.lastTime = 0;
    this.tickAccumulator = 0;
    this.tickInterval = 1 / CONFIG.TICK_RATE;
    this.fpsCounter = 0;
    this.fpsTime = 0;
    this.fps = 0;

    // Setup UI
    this.input = null;
    this.renderer = null;
    this.ui = null;

    // Init
    this.renderer = new Renderer(this);
    this.input = new InputHandler(this);
    this.ui = new GameUI(this);

    this.showMenu();
    this._gameLoop = this._gameLoop.bind(this);
    requestAnimationFrame(this._gameLoop);
  }

  showMenu() {
    this.state = 'menu';
    document.getElementById('ui-overlay').style.display = 'none';

    const container = document.getElementById('game-container');
    // Remove existing menu
    const existing = container.querySelector('.menu-screen');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.className = 'menu-screen';
    menu.id = 'main-menu';
    menu.innerHTML = `
      <h1>RED ALERT 2</h1>
      <h2>Browser Clone</h2>
      <button class="menu-btn" id="btn-skirmish">Skirmish</button>
      <button class="menu-btn" id="btn-multiplayer">Multiplayer</button>
      <button class="menu-btn" id="btn-editor">Map Editor</button>
      <button class="menu-btn" id="btn-quick">Quick Match (4 Players)</button>
      <button class="menu-btn" id="btn-massive">Massive Battle (100 Players)</button>
      <div style="margin-top:30px;color:#555;font-size:12px;">
        Controls: Left click select | Right click command | Scroll to zoom | Arrow keys to pan
      </div>
    `;
    container.appendChild(menu);

    document.getElementById('btn-skirmish').onclick = () => this.showSetup();
    document.getElementById('btn-multiplayer').onclick = () => this.showMultiplayerSetup();
    document.getElementById('btn-editor').onclick = () => this.startEditor();
    document.getElementById('btn-quick').onclick = () => this.quickStart(4);
    document.getElementById('btn-massive').onclick = () => this.quickStart(100);
  }

  showSetup() {
    const container = document.getElementById('game-container');
    const menu = document.getElementById('main-menu');
    if (menu) menu.remove();

    const setup = document.createElement('div');
    setup.className = 'menu-screen';
    setup.id = 'setup-screen';
    setup.innerHTML = `
      <div class="setup-panel">
        <h2 style="color:#ffd700;margin-bottom:20px;">Skirmish Setup</h2>
        <div class="setup-row">
          <label>Your Name</label>
          <input type="text" id="player-name" value="Commander" maxlength="20">
        </div>
        <div class="setup-row">
          <label>Faction</label>
          <select id="player-faction">
            <option value="ALLIED">Allied</option>
            <option value="SOVIET">Soviet</option>
          </select>
        </div>
        <div class="setup-row">
          <label>Map Size</label>
          <select id="map-size-setup">
            <option value="48">Small (48x48)</option>
            <option value="64">Medium (64x64)</option>
            <option value="96" selected>Large (96x96)</option>
            <option value="128">Huge (128x128)</option>
          </select>
        </div>
        <div class="setup-row">
          <label>Bot Count</label>
          <input type="range" id="bot-count" min="1" max="99" value="3">
          <span id="bot-count-val" style="color:#fff;width:30px;">3</span>
        </div>
        <div class="setup-row">
          <label>AI Difficulty</label>
          <select id="ai-difficulty">
            <option value="easy">Easy</option>
            <option value="medium" selected>Medium</option>
            <option value="hard">Hard</option>
            <option value="brutal">Brutal</option>
          </select>
        </div>
        <div class="setup-row">
          <label>Starting Credits</label>
          <select id="start-credits">
            <option value="5000" selected>5,000</option>
            <option value="10000">10,000</option>
            <option value="25000">25,000</option>
            <option value="50000">50,000</option>
          </select>
        </div>
        <div style="display:flex;gap:10px;margin-top:20px;">
          <button class="menu-btn" id="btn-start-game" style="background:linear-gradient(180deg,#1a2a1a,#0a1a0a);border-color:#060;">Start Game</button>
          <button class="menu-btn" id="btn-back" style="width:120px;">Back</button>
        </div>
      </div>
    `;
    container.appendChild(setup);

    document.getElementById('bot-count').oninput = (e) => {
      document.getElementById('bot-count-val').textContent = e.target.value;
    };
    document.getElementById('btn-back').onclick = () => {
      setup.remove();
      this.showMenu();
    };
    document.getElementById('btn-start-game').onclick = () => {
      const name = document.getElementById('player-name').value || 'Commander';
      const faction = document.getElementById('player-faction').value;
      const mapSize = parseInt(document.getElementById('map-size-setup').value);
      const botCount = parseInt(document.getElementById('bot-count').value);
      const difficulty = document.getElementById('ai-difficulty').value;
      const startCredits = parseInt(document.getElementById('start-credits').value);

      CONFIG.STARTING_CREDITS = startCredits;
      setup.remove();
      this.startSkirmish(name, faction, mapSize, botCount, difficulty);
    };
  }

  showMultiplayerSetup() {
    const container = document.getElementById('game-container');
    const menu = document.getElementById('main-menu');
    if (menu) menu.remove();

    const setup = document.createElement('div');
    setup.className = 'menu-screen';
    setup.id = 'mp-setup';
    setup.innerHTML = `
      <div class="setup-panel">
        <h2 style="color:#ffd700;margin-bottom:20px;">Multiplayer</h2>
        <p style="color:#aaa;font-size:13px;margin-bottom:15px;">
          WebRTC peer-to-peer connection. Both players must be on the same network or use the same signaling channel.
        </p>
        <div class="setup-row">
          <label>Your Name</label>
          <input type="text" id="mp-name" value="Commander" maxlength="20">
        </div>
        <div class="setup-row">
          <label>Faction</label>
          <select id="mp-faction">
            <option value="ALLIED">Allied</option>
            <option value="SOVIET">Soviet</option>
          </select>
        </div>
        <div style="display:flex;gap:10px;margin-top:20px;">
          <button class="menu-btn" id="btn-host" style="background:linear-gradient(180deg,#1a2a1a,#0a1a0a);border-color:#060;">Host Game</button>
          <button class="menu-btn" id="btn-join">Join Game</button>
        </div>
        <div id="mp-status" style="color:#aaa;font-size:12px;margin-top:15px;"></div>
        <div id="mp-room-code" style="display:none;margin-top:10px;">
          <label style="color:#aaa;font-size:12px;">Room Code:</label>
          <input type="text" id="room-code-input" style="background:#222;border:1px solid #444;color:#ffd700;padding:6px;font-size:18px;text-align:center;width:150px;letter-spacing:3px;" readonly>
        </div>
        <div id="mp-join-input" style="display:none;margin-top:10px;">
          <label style="color:#aaa;font-size:12px;">Enter Room Code:</label>
          <input type="text" id="join-code-input" style="background:#222;border:1px solid #444;color:#fff;padding:6px;font-size:18px;text-align:center;width:150px;letter-spacing:3px;" maxlength="6">
          <button class="menu-btn" id="btn-connect" style="width:120px;margin-top:10px;">Connect</button>
        </div>
        <button class="menu-btn" id="btn-mp-back" style="width:120px;margin-top:15px;">Back</button>
      </div>
    `;
    container.appendChild(setup);

    document.getElementById('btn-mp-back').onclick = () => {
      setup.remove();
      this.showMenu();
    };

    document.getElementById('btn-host').onclick = async () => {
      const code = await this.network.hostGame();
      document.getElementById('mp-room-code').style.display = 'block';
      document.getElementById('room-code-input').value = code;
      document.getElementById('mp-status').textContent = 'Waiting for players to join...';
    };

    document.getElementById('btn-join').onclick = () => {
      document.getElementById('mp-join-input').style.display = 'block';
    };

    document.getElementById('btn-connect')?.addEventListener('click', async () => {
      const code = document.getElementById('join-code-input').value.toUpperCase();
      if (code.length < 4) return;
      document.getElementById('mp-status').textContent = 'Connecting...';
      try {
        await this.network.joinGame(code);
        document.getElementById('mp-status').textContent = 'Connected! Starting game...';
        setup.remove();
        // Game state will be sent by host
      } catch (e) {
        document.getElementById('mp-status').textContent = 'Connection failed: ' + e.message;
      }
    });
  }

  startEditor() {
    const menu = document.getElementById('main-menu');
    if (menu) menu.remove();
    document.getElementById('ui-overlay').style.display = '';
    this.state = 'editor';

    // Initialize minimum required game state for editor
    this.map = new GameMap(64, 64);
    this.fog = new FogOfWar(64, 64);
    this.fog.revealAll();
    this.pathfinder = new Pathfinder(this.map);
    this.combat = new CombatSystem(this);

    this.mapEditor.activate();
  }

  quickStart(numPlayers) {
    const menu = document.getElementById('main-menu');
    if (menu) menu.remove();
    const mapSize = numPlayers > 20 ? 128 : numPlayers > 8 ? 96 : 64;
    this.startSkirmish('Commander', 'ALLIED', mapSize, numPlayers - 1, 'medium');
  }

  startSkirmish(name, faction, mapSize, botCount, difficulty) {
    document.getElementById('ui-overlay').style.display = '';

    const totalPlayers = botCount + 1;
    this.map = GameMap.generateRandom(mapSize, mapSize, totalPlayers);
    this.fog = new FogOfWar(mapSize, mapSize);
    this.pathfinder = new Pathfinder(this.map);
    this.combat = new CombatSystem(this);
    this.entities = new EntityManager();
    this.effects = [];
    this.localPlayerId = 0;

    // Create players
    this.players = {};

    // Human player
    this.players[0] = new Player(0, name, faction, TEAM_COLORS[0], false);

    // Bot players
    for (let i = 1; i <= botCount; i++) {
      const botFaction = Math.random() > 0.5 ? 'ALLIED' : 'SOVIET';
      this.players[i] = new Player(i, `Bot ${i}`, botFaction, TEAM_COLORS[i % TEAM_COLORS.length], true);
      this.aiManager.addBot(i, difficulty);
    }

    // Spawn construction yards and initial units for all players
    for (let p = 0; p < totalPlayers; p++) {
      const spawn = this.map.spawnPoints[p];
      if (!spawn) continue;

      const player = this.players[p];
      player.credits = CONFIG.STARTING_CREDITS;

      // Construction yard
      const cy = new Entity('building', 'construction_yard', p, spawn.x, spawn.y);
      cy.buildProgress = 1;
      this.map.occupy(spawn.x, spawn.y, 3, cy.id);
      this.entities.add(cy);

      // Starting units
      const infantryKey = player.faction === 'ALLIED' ? 'gi' : 'conscript';
      for (let u = 0; u < 3; u++) {
        const unit = new Entity('unit', infantryKey, p, spawn.x + 4 + u, spawn.y + 4);
        this.entities.add(unit);
      }
    }

    // Center camera on player spawn
    const playerSpawn = this.map.spawnPoints[0];
    if (playerSpawn) {
      const worldPos = this.map.tileToWorld(playerSpawn.x, playerSpawn.y);
      this.camera.x = worldPos.x;
      this.camera.y = worldPos.y;
    }

    // Preload sprites
    this._preloadSprites();

    // Recalculate power for all players
    for (const player of Object.values(this.players)) {
      player.recalculatePower(this.entities);
    }

    this.state = 'playing';
    this.ui.init();
    this.sound.init();
  }

  startGameWithMap(map) {
    const numPlayers = map.spawnPoints.length;
    document.getElementById('ui-overlay').style.display = '';

    this.map = map;
    this.fog = new FogOfWar(map.width, map.height);
    this.pathfinder = new Pathfinder(this.map);
    this.combat = new CombatSystem(this);
    this.entities = new EntityManager();
    this.effects = [];
    this.localPlayerId = 0;

    this.players = {};
    this.players[0] = new Player(0, 'Commander', 'ALLIED', TEAM_COLORS[0], false);

    for (let i = 1; i < numPlayers; i++) {
      const faction = Math.random() > 0.5 ? 'ALLIED' : 'SOVIET';
      this.players[i] = new Player(i, `Bot ${i}`, faction, TEAM_COLORS[i % TEAM_COLORS.length], true);
      this.aiManager.addBot(i, 'medium');
    }

    // Spawn construction yards
    for (let p = 0; p < numPlayers; p++) {
      const spawn = map.spawnPoints[p];
      if (!spawn) continue;

      const player = this.players[p];
      player.credits = CONFIG.STARTING_CREDITS;

      const cy = new Entity('building', 'construction_yard', p, spawn.x, spawn.y);
      cy.buildProgress = 1;
      this.map.occupy(spawn.x, spawn.y, 3, cy.id);
      this.entities.add(cy);

      const infantryKey = player.faction === 'ALLIED' ? 'gi' : 'conscript';
      for (let u = 0; u < 3; u++) {
        const unit = new Entity('unit', infantryKey, p, spawn.x + 4 + u, spawn.y + 4);
        this.entities.add(unit);
      }
    }

    const playerSpawn = map.spawnPoints[0];
    if (playerSpawn) {
      const worldPos = this.map.tileToWorld(playerSpawn.x, playerSpawn.y);
      this.camera.x = worldPos.x;
      this.camera.y = worldPos.y;
    }

    this._preloadSprites();
    for (const player of Object.values(this.players)) {
      player.recalculatePower(this.entities);
    }

    this.state = 'playing';
    this.ui.init();
    CONFIG.FOG_ENABLED = true;
  }

  _preloadSprites() {
    // Preload all unit/building sprites for each player color
    for (const player of Object.values(this.players)) {
      for (const key of Object.keys(UNITS)) {
        SpriteCache.preload(key, player.color, 96, 64);
      }
      for (const key of Object.keys(BUILDINGS)) {
        SpriteCache.preload(key, player.color, 128, 128);
      }
    }
    SpriteCache.preload('tree', null, 24, 28);
  }

  // Game loop
  _gameLoop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    // FPS counter
    this.fpsCounter++;
    this.fpsTime += dt;
    if (this.fpsTime >= 1) {
      this.fps = this.fpsCounter;
      this.fpsCounter = 0;
      this.fpsTime = 0;
      document.getElementById('fps-display').textContent = this.fps;
    }

    if (this.state === 'playing') {
      this._updateGame(dt);
    }

    // Render
    this.renderer.render();

    // Map editor overlay
    if (this.state === 'editor' && this.mapEditor.active) {
      this.mapEditor.render(this.renderer.ctx);
    }

    // Input (camera movement) always runs
    this.input.update(dt);

    requestAnimationFrame(this._gameLoop);
  }

  _updateGame(dt) {
    // Fixed timestep simulation
    this.tickAccumulator += dt;
    while (this.tickAccumulator >= this.tickInterval) {
      this.tickAccumulator -= this.tickInterval;
      this._simulationTick(this.tickInterval);
    }

    // UI updates (not every tick)
    this.ui.updateResources();

    // Periodic sidebar refresh
    if (Math.floor(this.lastTime / 2000) !== Math.floor((this.lastTime - dt * 1000) / 2000)) {
      this.ui.refreshSidebar();
      this.ui.updateSelection(this.input.selectedEntities);
    }

    // Periodic power recalculation
    if (Math.floor(this.lastTime / 3000) !== Math.floor((this.lastTime - dt * 1000) / 3000)) {
      for (const player of Object.values(this.players)) {
        player.recalculatePower(this.entities);
        // Check defeat
        if (!player.isDefeated && player.checkDefeat(this.entities)) {
          if (player.id === this.localPlayerId) {
            this.notify('You have been defeated!');
          } else {
            this.notify(`${player.name} has been defeated!`);
          }
        }
      }

      // Update building power status
      for (const building of this.entities.getAllBuildings()) {
        const player = this.players[building.playerId];
        building.powered = player && !player.isLowPower;
      }

      // Check win condition
      const alive = Object.values(this.players).filter(p => !p.isDefeated);
      if (alive.length === 1) {
        if (alive[0].id === this.localPlayerId) {
          this.notify('Victory! You are the last one standing!');
        }
      }
    }
  }

  _simulationTick(dt) {
    // Update fog of war
    if (this.fog) {
      this.fog.update(this.entities, this.localPlayerId);
    }

    // Update entities
    this.entities.update(dt, this);

    // Update combat (projectiles)
    if (this.combat) {
      this.combat.update(dt);
    }

    // Update AI
    this.aiManager.update(dt, this);
  }

  // === Helper methods used by entities and AI ===

  findNearestEnemy(entity, range) {
    const entities = this.entities.getEntitiesNear(entity.x, entity.y, range);
    let nearest = null;
    let nearestDist = Infinity;
    for (const e of entities) {
      if (e.playerId === entity.playerId) continue;
      if (e.dead) continue;
      if (entity.weapon?.antiAir && e.def?.type !== 'air') continue; // Anti-air only targets air
      const dx = e.x - entity.x;
      const dy = e.y - entity.y;
      const dist = dx * dx + dy * dy;
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = e;
      }
    }
    return nearest;
  }

  findNearestBuilding(playerId, defKey) {
    const buildings = this.entities.getPlayerBuildings(playerId);
    return buildings.find(b => b.defKey === defKey && b.buildProgress >= 1) || null;
  }

  findNearestOre(tx, ty) {
    let nearest = null;
    let nearestDist = Infinity;
    const searchRadius = 30;
    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        const nx = tx + dx;
        const ny = ty + dy;
        if (this.map.getOre(nx, ny) > 0) {
          const dist = dx * dx + dy * dy;
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = { x: nx, y: ny };
          }
        }
      }
    }
    return nearest;
  }

  completeProduction(producer, unitKey) {
    const def = UNITS[unitKey];
    if (!def) return;

    // Find a clear spot near the producer
    const spawnX = producer.tileX + (producer.def.size || 1) + 1;
    const spawnY = producer.tileY + (producer.def.size || 1) + 1;

    let placed = false;
    for (let r = 0; r < 5; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) === r || Math.abs(dy) === r) {
            const tx = spawnX + dx;
            const ty = spawnY + dy;
            if (this.map.isWalkable(tx, ty)) {
              const unit = new Entity('unit', unitKey, producer.playerId, tx, ty);
              this.entities.add(unit);

              // Auto-harvest for harvesters
              if (def.isHarvester) {
                unit.harvesting = true;
                const ore = this.findNearestOre(tx, ty);
                if (ore) {
                  unit.harvestTarget = ore;
                  unit.moveTo(ore.x, ore.y, this);
                }
              }

              // Rally point
              if (producer.rallyPoint) {
                unit.moveTo(producer.rallyPoint.x, producer.rallyPoint.y, this);
              }

              placed = true;
              break;
            }
          }
        }
        if (placed) break;
      }
      if (placed) break;
    }

    if (placed) {
      if (producer.playerId === this.localPlayerId) {
        this.sound?.playVoice('unit_ready');
        this.notify(`${def.name} ready`);
      }
    }
  }

  addEffect(effect) {
    this.effects.push(effect);
  }

  notify(message) {
    const container = document.getElementById('notifications');
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    container.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
  }
}

// Start the game when page loads
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
