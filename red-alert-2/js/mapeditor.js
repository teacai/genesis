// Map Editor
class MapEditor {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.currentTool = 'terrain';
    this.currentTerrain = TERRAIN.GRASS;
    this.brushSize = 1;
    this.isPainting = false;
    this.spawnPoints = [];
    this.mapWidth = 64;
    this.mapHeight = 64;
  }

  activate() {
    this.active = true;
    CONFIG.FOG_ENABLED = false;

    // Create a blank map
    this.game.map = new GameMap(this.mapWidth, this.mapHeight);
    this.game.map.spawnPoints = [];
    this.game.fog.revealAll();

    // Center camera
    const center = this.game.map.tileToWorld(this.mapWidth / 2, this.mapHeight / 2);
    this.game.camera.x = center.x;
    this.game.camera.y = center.y;

    this._buildUI();
    this._bindEvents();
  }

  deactivate() {
    this.active = false;
    this._unbindEvents();
    document.getElementById('sidebar').innerHTML = '';
  }

  _buildUI() {
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = '';

    // Title
    const title = document.createElement('div');
    title.className = 'sidebar-title';
    title.textContent = 'Map Editor';
    sidebar.appendChild(title);

    // Map size controls
    const sizeSection = document.createElement('div');
    sizeSection.style.cssText = 'padding:8px;border-bottom:1px solid #333;';
    sizeSection.innerHTML = `
      <div style="color:#aaa;font-size:11px;margin-bottom:4px;">Map Size</div>
      <div style="display:flex;gap:4px;">
        <select id="map-size" style="flex:1;background:#222;border:1px solid #444;color:#fff;padding:4px;font-size:11px;border-radius:3px;">
          <option value="32">32x32 (Small)</option>
          <option value="64" selected>64x64 (Medium)</option>
          <option value="96">96x96 (Large)</option>
          <option value="128">128x128 (Huge)</option>
        </select>
      </div>
    `;
    sidebar.appendChild(sizeSection);

    document.getElementById('map-size').onchange = (e) => {
      const size = parseInt(e.target.value);
      this.mapWidth = size;
      this.mapHeight = size;
      this.game.map = new GameMap(size, size);
      this.game.map.spawnPoints = this.spawnPoints;
      this.game.fog = new FogOfWar(size, size);
      this.game.fog.revealAll();
    };

    // Terrain tools
    const terrainSection = document.createElement('div');
    terrainSection.className = 'sidebar-section';
    const terrainTitle = document.createElement('div');
    terrainTitle.className = 'sidebar-title';
    terrainTitle.textContent = 'Terrain';
    terrainSection.appendChild(terrainTitle);

    const terrainGrid = document.createElement('div');
    terrainGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:2px;padding:4px;';

    const terrainTypes = [
      { key: TERRAIN.GRASS, name: 'Grass', color: TERRAIN_COLORS[TERRAIN.GRASS] },
      { key: TERRAIN.WATER, name: 'Water', color: TERRAIN_COLORS[TERRAIN.WATER] },
      { key: TERRAIN.ORE, name: 'Ore', color: TERRAIN_COLORS[TERRAIN.ORE] },
      { key: TERRAIN.GEM, name: 'Gems', color: TERRAIN_COLORS[TERRAIN.GEM] },
      { key: TERRAIN.ROCK, name: 'Rock', color: TERRAIN_COLORS[TERRAIN.ROCK] },
      { key: TERRAIN.SAND, name: 'Sand', color: TERRAIN_COLORS[TERRAIN.SAND] },
      { key: TERRAIN.TREE, name: 'Trees', color: TERRAIN_COLORS[TERRAIN.TREE] },
      { key: TERRAIN.CLIFF, name: 'Cliff', color: TERRAIN_COLORS[TERRAIN.CLIFF] },
    ];

    for (const tt of terrainTypes) {
      const btn = document.createElement('div');
      btn.className = 'editor-tool' + (this.currentTerrain === tt.key ? ' active' : '');
      btn.innerHTML = `<span style="display:inline-block;width:12px;height:12px;background:${tt.color};border:1px solid #000;vertical-align:middle;margin-right:4px;"></span>${tt.name}`;
      btn.onclick = () => {
        this.currentTool = 'terrain';
        this.currentTerrain = tt.key;
        this._buildUI();
      };
      terrainGrid.appendChild(btn);
    }
    terrainSection.appendChild(terrainGrid);
    sidebar.appendChild(terrainSection);

    // Brush size
    const brushSection = document.createElement('div');
    brushSection.style.cssText = 'padding:8px;border-bottom:1px solid #333;';
    brushSection.innerHTML = `
      <div style="color:#aaa;font-size:11px;margin-bottom:4px;">Brush Size: <span id="brush-size-val">${this.brushSize}</span></div>
      <input type="range" id="brush-size" min="1" max="8" value="${this.brushSize}" style="width:100%;">
    `;
    sidebar.appendChild(brushSection);

    document.getElementById('brush-size').oninput = (e) => {
      this.brushSize = parseInt(e.target.value);
      document.getElementById('brush-size-val').textContent = this.brushSize;
    };

    // Spawn points tool
    const spawnSection = document.createElement('div');
    spawnSection.className = 'sidebar-section';
    const spawnTitle = document.createElement('div');
    spawnTitle.className = 'sidebar-title';
    spawnTitle.textContent = 'Spawn Points';
    spawnSection.appendChild(spawnTitle);

    const spawnBtn = document.createElement('div');
    spawnBtn.className = 'editor-tool' + (this.currentTool === 'spawn' ? ' active' : '');
    spawnBtn.textContent = `Place Spawn (${this.spawnPoints.length})`;
    spawnBtn.onclick = () => {
      this.currentTool = 'spawn';
      this._buildUI();
    };
    spawnSection.appendChild(spawnBtn);

    const clearSpawnsBtn = document.createElement('div');
    clearSpawnsBtn.className = 'editor-tool';
    clearSpawnsBtn.textContent = 'Clear Spawns';
    clearSpawnsBtn.onclick = () => {
      this.spawnPoints = [];
      this.game.map.spawnPoints = [];
      this._buildUI();
    };
    spawnSection.appendChild(clearSpawnsBtn);
    sidebar.appendChild(spawnSection);

    // Random generation
    const genSection = document.createElement('div');
    genSection.className = 'sidebar-section';
    const genTitle = document.createElement('div');
    genTitle.className = 'sidebar-title';
    genTitle.textContent = 'Generate';
    genSection.appendChild(genTitle);

    const randomBtn = document.createElement('div');
    randomBtn.className = 'editor-tool';
    randomBtn.textContent = 'Random Map';
    randomBtn.onclick = () => {
      const numPlayers = Math.max(2, this.spawnPoints.length || 4);
      this.game.map = GameMap.generateRandom(this.mapWidth, this.mapHeight, numPlayers);
      this.spawnPoints = this.game.map.spawnPoints || [];
      this.game.fog = new FogOfWar(this.mapWidth, this.mapHeight);
      this.game.fog.revealAll();
      this._buildUI();
    };
    genSection.appendChild(randomBtn);
    sidebar.appendChild(genSection);

    // Save/Load
    const fileSection = document.createElement('div');
    fileSection.className = 'sidebar-section';
    const fileTitle = document.createElement('div');
    fileTitle.className = 'sidebar-title';
    fileTitle.textContent = 'File';
    fileSection.appendChild(fileTitle);

    const saveBtn = document.createElement('div');
    saveBtn.className = 'editor-tool';
    saveBtn.textContent = 'Save Map';
    saveBtn.onclick = () => this._saveMap();
    fileSection.appendChild(saveBtn);

    const loadBtn = document.createElement('div');
    loadBtn.className = 'editor-tool';
    loadBtn.textContent = 'Load Map';
    loadBtn.onclick = () => this._loadMap();
    fileSection.appendChild(loadBtn);

    const playBtn = document.createElement('div');
    playBtn.className = 'editor-tool';
    playBtn.style.cssText = 'color:#4f4;font-weight:bold;';
    playBtn.textContent = 'Play This Map';
    playBtn.onclick = () => this._playMap();
    fileSection.appendChild(playBtn);

    const backBtn = document.createElement('div');
    backBtn.className = 'editor-tool';
    backBtn.style.cssText = 'color:#f88;';
    backBtn.textContent = 'Back to Menu';
    backBtn.onclick = () => {
      this.deactivate();
      this.game.showMenu();
    };
    fileSection.appendChild(backBtn);

    sidebar.appendChild(fileSection);
  }

  _bindEvents() {
    this._mousedownHandler = (e) => {
      if (e.button === 0) {
        this.isPainting = true;
        this._paint();
      }
    };
    this._mousemoveHandler = () => {
      if (this.isPainting) this._paint();
    };
    this._mouseupHandler = () => {
      this.isPainting = false;
    };

    this.game.renderer.canvas.addEventListener('mousedown', this._mousedownHandler);
    this.game.renderer.canvas.addEventListener('mousemove', this._mousemoveHandler);
    window.addEventListener('mouseup', this._mouseupHandler);
  }

  _unbindEvents() {
    if (this._mousedownHandler) {
      this.game.renderer.canvas.removeEventListener('mousedown', this._mousedownHandler);
      this.game.renderer.canvas.removeEventListener('mousemove', this._mousemoveHandler);
      window.removeEventListener('mouseup', this._mouseupHandler);
    }
  }

  _paint() {
    const mouse = this.game.input.mouse;
    const tx = mouse.tileX;
    const ty = mouse.tileY;
    const r = this.brushSize - 1;

    if (this.currentTool === 'terrain') {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy <= r * r + r) {
            this.game.map.setTile(tx + dx, ty + dy, this.currentTerrain);
          }
        }
      }
    } else if (this.currentTool === 'spawn') {
      if (!this.isPainting) return; // Only place on click, not drag
      // Check not too close to existing
      const tooClose = this.spawnPoints.some(sp =>
        Math.abs(sp.x - tx) + Math.abs(sp.y - ty) < 10
      );
      if (!tooClose) {
        this.spawnPoints.push({ x: tx, y: ty });
        this.game.map.spawnPoints = this.spawnPoints;
        this._buildUI();
      }
      this.isPainting = false; // Only one per click
    }
  }

  _saveMap() {
    this.game.map.spawnPoints = this.spawnPoints;
    const data = JSON.stringify(this.game.map.serialize());
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ra2-map-${this.mapWidth}x${this.mapHeight}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.game.notify('Map saved!');
  }

  _loadMap() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          this.game.map = GameMap.deserialize(data);
          this.mapWidth = this.game.map.width;
          this.mapHeight = this.game.map.height;
          this.spawnPoints = this.game.map.spawnPoints || [];
          this.game.fog = new FogOfWar(this.mapWidth, this.mapHeight);
          this.game.fog.revealAll();
          this._buildUI();
          this.game.notify('Map loaded!');
        } catch (err) {
          this.game.notify('Failed to load map');
          console.error(err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  _playMap() {
    if (this.spawnPoints.length < 2) {
      this.game.notify('Need at least 2 spawn points!');
      return;
    }
    this.game.map.spawnPoints = this.spawnPoints;
    this.deactivate();
    this.game.startGameWithMap(this.game.map);
  }

  render(ctx) {
    if (!this.active) return;

    // Draw spawn points
    for (let i = 0; i < this.spawnPoints.length; i++) {
      const sp = this.spawnPoints[i];
      const screen = this.game.renderer.tileToScreen(sp.x, sp.y);
      const zoom = this.game.camera.zoom;
      const color = TEAM_COLORS[i] || '#fff';

      ctx.fillStyle = color;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, 8 * zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = `${12 * zoom}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`P${i + 1}`, screen.x, screen.y);
    }

    // Draw brush preview
    if (this.currentTool === 'terrain') {
      const mouse = this.game.input.mouse;
      const r = this.brushSize - 1;
      const zoom = this.game.camera.zoom;

      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy <= r * r + r) {
            const screen = this.game.renderer.tileToScreen(mouse.tileX + dx, mouse.tileY + dy);
            const hw = CONFIG.TILE_WIDTH / 2 * zoom;
            const hh = CONFIG.TILE_HEIGHT / 2 * zoom;
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(screen.x, screen.y - hh);
            ctx.lineTo(screen.x + hw, screen.y);
            ctx.lineTo(screen.x, screen.y + hh);
            ctx.lineTo(screen.x - hw, screen.y);
            ctx.closePath();
            ctx.stroke();
          }
        }
      }
    }
  }
}
