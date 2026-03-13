// Input handling - mouse, keyboard, selection
class InputHandler {
  constructor(game) {
    this.game = game;
    this.canvas = document.getElementById('game-canvas');
    this.keys = {};
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, tileX: 0, tileY: 0 };
    this.dragStart = null;
    this.isDragging = false;
    this.isRightDragging = false;
    this.selectedEntities = [];
    this.placingBuilding = null;
    this.controlGroups = {}; // 0-9 control groups

    this._bindEvents();
  }

  _bindEvents() {
    // Keyboard
    window.addEventListener('keydown', e => {
      this.keys[e.key.toLowerCase()] = true;
      this._handleKeyDown(e);
    });
    window.addEventListener('keyup', e => {
      const chatInput = document.getElementById('chat-input');
      if (chatInput && document.activeElement === chatInput) return;
      this.keys[e.key.toLowerCase()] = false;
    });

    // Mouse
    this.canvas.addEventListener('mousemove', e => this._onMouseMove(e));
    this.canvas.addEventListener('mousedown', e => this._onMouseDown(e));
    this.canvas.addEventListener('mouseup', e => this._onMouseUp(e));
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    this.canvas.addEventListener('wheel', e => this._onWheel(e));

    // Touch support
    this.canvas.addEventListener('touchstart', e => this._onTouchStart(e));
    this.canvas.addEventListener('touchmove', e => this._onTouchMove(e));
    this.canvas.addEventListener('touchend', e => this._onTouchEnd(e));
  }

  _screenToWorld(sx, sy) {
    const cam = this.game.camera;
    return {
      x: (sx - cam.screenW / 2) / cam.zoom + cam.x,
      y: (sy - cam.screenH / 2) / cam.zoom + cam.y,
    };
  }

  _worldToTile(wx, wy) {
    const tx = Math.floor(wx / CONFIG.TILE_WIDTH + wy / CONFIG.TILE_HEIGHT);
    const ty = Math.floor(wy / CONFIG.TILE_HEIGHT - wx / CONFIG.TILE_WIDTH);
    return { x: tx, y: ty };
  }

  _onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
    const world = this._screenToWorld(this.mouse.x, this.mouse.y);
    this.mouse.worldX = world.x;
    this.mouse.worldY = world.y;
    const tile = this._worldToTile(world.x, world.y);
    this.mouse.tileX = tile.x;
    this.mouse.tileY = tile.y;

    if (this.dragStart && !this.isRightDragging) {
      const dx = this.mouse.x - this.dragStart.sx;
      const dy = this.mouse.y - this.dragStart.sy;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        this.isDragging = true;
      }
    }
  }

  _onMouseDown(e) {
    this.game.sound?.init();
    this.game.sound?.resume();

    if (e.button === 0) { // Left click
      if (this.placingBuilding) {
        this._placeBuilding();
        return;
      }
      this.dragStart = {
        sx: this.mouse.x, sy: this.mouse.y,
        wx: this.mouse.worldX, wy: this.mouse.worldY,
      };
      this.isDragging = false;
    } else if (e.button === 2) { // Right click
      if (this.placingBuilding) {
        this.placingBuilding = null;
        return;
      }
      this._handleRightClick();
    }
  }

  _onMouseUp(e) {
    if (e.button === 0) {
      if (this.isDragging && this.dragStart) {
        this._handleBoxSelect();
      } else if (this.dragStart) {
        this._handleLeftClick();
      }
      this.dragStart = null;
      this.isDragging = false;
    }
  }

  _onWheel(e) {
    e.preventDefault();
    const cam = this.game.camera;
    if (e.deltaY < 0) {
      cam.zoom = Math.min(cam.zoom + CONFIG.ZOOM_STEP, CONFIG.ZOOM_MAX);
    } else {
      cam.zoom = Math.max(cam.zoom - CONFIG.ZOOM_STEP, CONFIG.ZOOM_MIN);
    }
  }

  _onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.mouse.x = touch.clientX;
      this.mouse.y = touch.clientY;
      const world = this._screenToWorld(this.mouse.x, this.mouse.y);
      this.mouse.worldX = world.x;
      this.mouse.worldY = world.y;
      this.dragStart = {
        sx: this.mouse.x, sy: this.mouse.y,
        wx: world.x, wy: world.y,
      };
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.mouse.x = touch.clientX;
      this.mouse.y = touch.clientY;
      const world = this._screenToWorld(this.mouse.x, this.mouse.y);
      this.mouse.worldX = world.x;
      this.mouse.worldY = world.y;
      this.isDragging = true;
    }
  }

  _onTouchEnd(e) {
    if (this.isDragging && this.dragStart) {
      this._handleBoxSelect();
    } else {
      this._handleLeftClick();
    }
    this.dragStart = null;
    this.isDragging = false;
  }

  _handleLeftClick() {
    const world = this._screenToWorld(this.mouse.x, this.mouse.y);
    const tile = this._worldToTile(world.x, world.y);

    // Find entity at click position
    const entities = this.game.entities.getEntitiesNear(tile.x, tile.y, 1.5);
    const clicked = entities.find(e => e.playerId === this.game.localPlayerId);
    const enemyClicked = entities.find(e => e.playerId !== this.game.localPlayerId);

    if (clicked) {
      if (!this.keys['shift']) {
        this._deselectAll();
      }
      clicked.selected = true;
      this.selectedEntities.push(clicked);
      this.game.sound?.playSelect();
      this.game.ui.updateSelection(this.selectedEntities);
    } else if (enemyClicked && this.selectedEntities.length > 0) {
      // Attack-move to enemy
      this._commandAttack(enemyClicked);
    } else {
      if (!this.keys['shift']) {
        this._deselectAll();
        this.game.ui.updateSelection([]);
      }
    }
  }

  _handleRightClick() {
    if (this.selectedEntities.length === 0) return;

    const world = this._screenToWorld(this.mouse.x, this.mouse.y);
    const tile = this._worldToTile(world.x, world.y);

    // Check if right-clicking on enemy
    const entities = this.game.entities.getEntitiesNear(tile.x, tile.y, 1.5);
    const enemy = entities.find(e => e.playerId !== this.game.localPlayerId);

    if (enemy) {
      this._commandAttack(enemy);
    } else {
      // Move command
      this._commandMove(tile.x, tile.y);
    }
  }

  _handleBoxSelect() {
    if (!this.dragStart) return;
    const startTile = this._worldToTile(this.dragStart.wx, this.dragStart.wy);
    const endTile = this._worldToTile(this.mouse.worldX, this.mouse.worldY);

    if (!this.keys['shift']) {
      this._deselectAll();
    }

    const entities = this.game.entities.getEntitiesInRect(
      Math.min(startTile.x, endTile.x), Math.min(startTile.y, endTile.y),
      Math.max(startTile.x, endTile.x), Math.max(startTile.y, endTile.y)
    );

    const myUnits = entities.filter(e =>
      e.playerId === this.game.localPlayerId && e.type === 'unit'
    );

    if (myUnits.length > 0) {
      for (const unit of myUnits) {
        unit.selected = true;
        this.selectedEntities.push(unit);
      }
    } else {
      // Select buildings if no units
      const myBuildings = entities.filter(e =>
        e.playerId === this.game.localPlayerId && e.type === 'building'
      );
      for (const b of myBuildings) {
        b.selected = true;
        this.selectedEntities.push(b);
      }
    }

    this.game.ui.updateSelection(this.selectedEntities);
  }

  _commandMove(tx, ty) {
    const units = this.selectedEntities.filter(e => e.type === 'unit');
    if (units.length === 0) return;

    this.game.sound?.playVoice('acknowledged');

    // Formation movement
    const cols = Math.ceil(Math.sqrt(units.length));
    units.forEach((unit, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const ox = tx + col - Math.floor(cols / 2);
      const oy = ty + row - Math.floor(cols / 2);

      unit.target = null;
      unit.moveTo(ox, oy, this.game);

      // If harvester, set as harvest command
      if (unit.def.isHarvester) {
        const ore = this.game.map.getOre(tx, ty);
        if (ore > 0) {
          unit.harvesting = true;
          unit.harvestTarget = { x: tx, y: ty };
        }
      }
    });

    // Add move effect
    this.game.addEffect({
      type: 'move_marker',
      x: tx, y: ty,
      duration: 0.5, timer: 0,
    });
  }

  _commandAttack(target) {
    const units = this.selectedEntities.filter(e => e.type === 'unit' && e.weapon);
    if (units.length === 0) return;

    this.game.sound?.playVoice('attacking');
    for (const unit of units) {
      unit.target = target;
    }
  }

  _deselectAll() {
    for (const e of this.selectedEntities) {
      e.selected = false;
    }
    this.selectedEntities = [];
  }

  _placeBuilding() {
    const key = this.placingBuilding;
    const def = BUILDINGS[key];
    if (!def) return;

    const tile = this._worldToTile(this.mouse.worldX, this.mouse.worldY);
    const player = this.game.players[this.game.localPlayerId];

    if (!player.canAfford(def.cost)) {
      this.game.notify('Insufficient funds');
      this.game.sound?.playVoice('insufficient_funds');
      return;
    }

    if (!this.game.map.canBuildAt(tile.x, tile.y, def.size)) {
      this.game.notify('Cannot build here');
      this.game.sound?.playError();
      return;
    }

    // Check proximity to own buildings
    const myBuildings = this.game.entities.getPlayerBuildings(player.id);
    let nearBase = false;
    for (const b of myBuildings) {
      const dist = Math.abs(b.tileX - tile.x) + Math.abs(b.tileY - tile.y);
      if (dist < 15) { nearBase = true; break; }
    }
    if (!nearBase && myBuildings.length > 0) {
      this.game.notify('Must build near base');
      this.game.sound?.playError();
      return;
    }

    player.spend(def.cost);
    const building = new Entity('building', key, player.id, tile.x, tile.y);
    building.buildProgress = 0;
    this.game.map.occupy(tile.x, tile.y, def.size, building.id);
    this.game.entities.add(building);
    this.game.sound?.playBuild();

    // Spawn free harvester with refinery
    if (def.givesUnit) {
      const harvester = new Entity('unit', def.givesUnit, player.id, tile.x + def.size, tile.y + def.size);
      this.game.entities.add(harvester);
    }

    if (!this.keys['shift']) {
      this.placingBuilding = null;
    }
  }

  _handleKeyDown(e) {
    const key = e.key.toLowerCase();

    // Enter - toggle chat
    if (key === 'enter' && this.game.state === 'playing') {
      e.preventDefault();
      this.game.toggleChat();
      return;
    }

    // Skip game hotkeys while chat input is focused
    const chatInput = document.getElementById('chat-input');
    if (chatInput && document.activeElement === chatInput) return;

    // Escape - deselect or cancel placement
    if (key === 'escape') {
      if (this.placingBuilding) {
        this.placingBuilding = null;
      } else {
        this._deselectAll();
        this.game.ui.updateSelection([]);
      }
    }

    // Control groups (Ctrl+1-9 to set, 1-9 to recall)
    if (key >= '1' && key <= '9') {
      const groupNum = parseInt(key);
      if (this.keys['control']) {
        // Set control group
        this.controlGroups[groupNum] = this.selectedEntities.map(e => e.id);
      } else {
        // Recall control group
        const group = this.controlGroups[groupNum];
        if (group) {
          this._deselectAll();
          for (const id of group) {
            const entity = this.game.entities.get(id);
            if (entity && !entity.dead) {
              entity.selected = true;
              this.selectedEntities.push(entity);
            }
          }
          this.game.ui.updateSelection(this.selectedEntities);
        }
      }
    }

    // A - attack move
    if (key === 'a') {
      // TODO: attack move cursor
    }

    // S - stop
    if (key === 's' && !this.keys['control']) {
      for (const e of this.selectedEntities) {
        e.moving = false;
        e.path = null;
        e.target = null;
      }
    }

    // Delete - self destruct
    if (key === 'delete') {
      for (const e of this.selectedEntities) {
        if (e.playerId === this.game.localPlayerId) {
          e.takeDamage(e.hp);
        }
      }
    }

    // H - select all harvesters
    if (key === 'h') {
      this._deselectAll();
      const harvesters = this.game.entities.getPlayerUnits(this.game.localPlayerId)
        .filter(u => u.def.isHarvester);
      for (const h of harvesters) {
        h.selected = true;
        this.selectedEntities.push(h);
      }
      this.game.ui.updateSelection(this.selectedEntities);
    }

    // Q - select all combat units
    if (key === 'q') {
      this._deselectAll();
      const combatUnits = this.game.entities.getPlayerUnits(this.game.localPlayerId)
        .filter(u => u.weapon && !u.def.isHarvester);
      for (const u of combatUnits) {
        u.selected = true;
        this.selectedEntities.push(u);
      }
      this.game.ui.updateSelection(this.selectedEntities);
    }

    // F - focus on selected
    if (key === 'f' && this.selectedEntities.length > 0) {
      const e = this.selectedEntities[0];
      const world = this.game.map.tileToWorld(e.tileX, e.tileY);
      this.game.camera.x = world.x;
      this.game.camera.y = world.y;
    }
  }

  update(dt) {
    const cam = this.game.camera;
    const speed = CONFIG.CAMERA_SPEED / cam.zoom;

    // Edge scrolling
    if (this.mouse.x < CONFIG.CAMERA_EDGE_SCROLL) cam.x -= speed;
    if (this.mouse.x > cam.screenW - CONFIG.CAMERA_EDGE_SCROLL) cam.x += speed;
    if (this.mouse.y < CONFIG.CAMERA_EDGE_SCROLL + 32) cam.y -= speed;
    if (this.mouse.y > cam.screenH - CONFIG.CAMERA_EDGE_SCROLL) cam.y += speed;

    // Arrow keys / WASD
    if (this.keys['arrowleft'] || this.keys['a'] && this.keys['control']) cam.x -= speed;
    if (this.keys['arrowright'] || this.keys['d'] && this.keys['control']) cam.x += speed;
    if (this.keys['arrowup'] || this.keys['w'] && this.keys['control']) cam.y -= speed;
    if (this.keys['arrowdown'] || this.keys['s'] && this.keys['control']) cam.y += speed;
  }
}
