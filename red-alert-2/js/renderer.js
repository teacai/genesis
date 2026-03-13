// Isometric renderer
class Renderer {
  constructor(game) {
    this.game = game;
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.minimapCanvas = document.getElementById('minimap');
    this.minimapCtx = this.minimapCanvas.getContext('2d');
    this.effects = [];

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const sidebar = 200;
    const topBar = 32;
    const bottomBar = 80;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.game.camera.screenW = window.innerWidth;
    this.game.camera.screenH = window.innerHeight;

    // Minimap
    this.minimapCanvas.width = 200;
    this.minimapCanvas.height = 160;
  }

  tileToScreen(tx, ty) {
    const cam = this.game.camera;
    const wx = (tx - ty) * (CONFIG.TILE_WIDTH / 2);
    const wy = (tx + ty) * (CONFIG.TILE_HEIGHT / 2);
    const sx = (wx - cam.x) * cam.zoom + cam.screenW / 2;
    const sy = (wy - cam.y) * cam.zoom + cam.screenH / 2;
    return { x: sx, y: sy };
  }

  render() {
    const ctx = this.ctx;
    const cam = this.game.camera;
    const map = this.game.map;
    const fog = this.game.fog;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!map) return;

    // Calculate visible tile range
    const halfW = (cam.screenW / 2) / cam.zoom;
    const halfH = (cam.screenH / 2) / cam.zoom;
    const tw = CONFIG.TILE_WIDTH;
    const th = CONFIG.TILE_HEIGHT;

    // Determine visible range generously
    const viewTiles = Math.ceil(Math.max(halfW / tw, halfH / th)) + 5;

    // Center tile
    const centerTileX = Math.floor(cam.x / tw + cam.y / th);
    const centerTileY = Math.floor(cam.y / th - cam.x / tw);

    const minTX = centerTileX - viewTiles;
    const maxTX = centerTileX + viewTiles;
    const minTY = centerTileY - viewTiles;
    const maxTY = centerTileY + viewTiles;

    // Draw terrain
    for (let ty = minTY; ty <= maxTY; ty++) {
      for (let tx = minTX; tx <= maxTX; tx++) {
        if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) continue;

        // Fog check
        if (CONFIG.FOG_ENABLED && !fog.isExplored(tx, ty)) continue;

        const screen = this.tileToScreen(tx, ty);
        const terrain = map.tiles[ty][tx];
        const isVisible = !CONFIG.FOG_ENABLED || fog.isVisible(tx, ty);

        this._drawTile(ctx, screen.x, screen.y, terrain, isVisible, tx, ty);
      }
    }

    // Draw buildings (sorted by Y for depth)
    const buildings = this.game.entities.getAllBuildings();
    buildings.sort((a, b) => (a.tileX + a.tileY) - (b.tileX + b.tileY));
    for (const building of buildings) {
      if (CONFIG.FOG_ENABLED && !fog.isVisible(building.tileX, building.tileY)) {
        if (fog.isExplored(building.tileX, building.tileY)) {
          this._drawEntity(ctx, building, true); // ghost
        }
        continue;
      }
      this._drawEntity(ctx, building, false);
    }

    // Draw units (sorted by Y for depth)
    const units = this.game.entities.getAllUnits();
    units.sort((a, b) => (a.x + a.y) - (b.x + b.y));
    for (const unit of units) {
      if (CONFIG.FOG_ENABLED && !fog.isVisible(Math.round(unit.x), Math.round(unit.y))) continue;
      this._drawEntity(ctx, unit, false);
    }

    // Draw projectiles
    this._drawProjectiles(ctx);

    // Draw effects
    this._drawEffects(ctx);

    // Draw selection box
    if (this.game.input.isDragging && this.game.input.dragStart) {
      this._drawSelectionBox(ctx);
    }

    // Draw building placement ghost
    if (this.game.input.placingBuilding) {
      this._drawBuildingGhost(ctx);
    }

    // Draw minimap
    this._drawMinimap();
  }

  _drawTile(ctx, sx, sy, terrain, isVisible, tx, ty) {
    const hw = CONFIG.TILE_WIDTH / 2 * this.game.camera.zoom;
    const hh = CONFIG.TILE_HEIGHT / 2 * this.game.camera.zoom;

    ctx.beginPath();
    ctx.moveTo(sx, sy - hh);
    ctx.lineTo(sx + hw, sy);
    ctx.lineTo(sx, sy + hh);
    ctx.lineTo(sx - hw, sy);
    ctx.closePath();

    let color = TERRAIN_COLORS[terrain] || '#333';
    ctx.fillStyle = color;
    ctx.fill();

    // Add subtle grid
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Ore/gem overlay
    if (terrain === TERRAIN.ORE || terrain === TERRAIN.GEM) {
      const oreAmount = this.game.map.oreAmount[ty]?.[tx] || 0;
      const alpha = Math.min(oreAmount / 100, 1) * 0.6;
      ctx.fillStyle = terrain === TERRAIN.GEM ? `rgba(150,80,200,${alpha})` : `rgba(200,180,80,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(sx, sy - hh);
      ctx.lineTo(sx + hw, sy);
      ctx.lineTo(sx, sy + hh);
      ctx.lineTo(sx - hw, sy);
      ctx.closePath();
      ctx.fill();

      // Ore crystal shapes
      const size = hw * 0.3;
      ctx.fillStyle = terrain === TERRAIN.GEM ? '#a060d0' : '#c0a030';
      for (let i = 0; i < 3; i++) {
        const ox = sx + (Math.sin(tx * 3 + i * 2) * hw * 0.4);
        const oy = sy + (Math.cos(ty * 3 + i * 2) * hh * 0.4);
        ctx.beginPath();
        ctx.moveTo(ox, oy - size);
        ctx.lineTo(ox + size * 0.6, oy);
        ctx.lineTo(ox, oy + size * 0.3);
        ctx.lineTo(ox - size * 0.6, oy);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Tree overlay
    if (terrain === TERRAIN.TREE) {
      const sprite = SpriteCache.get('tree', null, 24, 28);
      if (sprite && sprite.ready) {
        const s = this.game.camera.zoom;
        ctx.drawImage(sprite.canvas, sx - 12 * s, sy - 22 * s, 24 * s, 28 * s);
      } else {
        // Fallback tree
        ctx.fillStyle = '#2a5a25';
        ctx.beginPath();
        ctx.arc(sx, sy - hh * 0.5, hw * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(sx - 1, sy - hh * 0.2, 2, hh * 0.5);
      }
    }

    // Fog of war darkening
    if (!isVisible && CONFIG.FOG_ENABLED) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.moveTo(sx, sy - hh);
      ctx.lineTo(sx + hw, sy);
      ctx.lineTo(sx, sy + hh);
      ctx.lineTo(sx - hw, sy);
      ctx.closePath();
      ctx.fill();
    }
  }

  _drawEntity(ctx, entity, ghost) {
    const screen = this.tileToScreen(entity.x, entity.y);
    const zoom = this.game.camera.zoom;
    const color = this.game.players[entity.playerId]?.color || '#fff';

    // Size based on entity type
    let spriteW, spriteH;
    if (entity.type === 'building') {
      const s = entity.def.size;
      spriteW = 32 * s * zoom;
      spriteH = 32 * s * zoom;
    } else {
      spriteW = 32 * zoom;
      spriteH = 32 * zoom;
      if (entity.def.type === 'vehicle') { spriteW = 40 * zoom; spriteH = 28 * zoom; }
      if (entity.def.type === 'air') { spriteW = 36 * zoom; spriteH = 36 * zoom; }
    }

    const sprite = SpriteCache.get(entity.defKey, color, Math.ceil(spriteW / zoom * 2), Math.ceil(spriteH / zoom * 2));

    if (ghost) ctx.globalAlpha = 0.4;

    if (sprite && sprite.ready) {
      ctx.drawImage(sprite.canvas, screen.x - spriteW / 2, screen.y - spriteH, spriteW, spriteH);
    } else {
      // Fallback rendering
      ctx.fillStyle = color;
      if (entity.type === 'building') {
        ctx.fillRect(screen.x - spriteW / 2, screen.y - spriteH, spriteW, spriteH);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(screen.x - spriteW / 2, screen.y - spriteH, spriteW, spriteH);
      } else {
        ctx.beginPath();
        ctx.arc(screen.x, screen.y - spriteH / 2, spriteW / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    if (ghost) { ctx.globalAlpha = 1; return; }

    // Flash when damaged
    if (entity.flashTimer > 0) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#fff';
      if (entity.type === 'building') {
        ctx.fillRect(screen.x - spriteW / 2, screen.y - spriteH, spriteW, spriteH);
      } else {
        ctx.beginPath();
        ctx.arc(screen.x, screen.y - spriteH / 2, spriteW / 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Building construction progress
    if (entity.type === 'building' && entity.buildProgress < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      const uncovered = spriteH * (1 - entity.buildProgress);
      ctx.fillRect(screen.x - spriteW / 2, screen.y - spriteH, spriteW, uncovered);

      ctx.fillStyle = '#4a4';
      ctx.fillRect(screen.x - spriteW / 4, screen.y - 4, spriteW / 2 * entity.buildProgress, 3);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(screen.x - spriteW / 4, screen.y - 4, spriteW / 2, 3);
    }

    // Health bar
    if (entity.hp < entity.maxHp || entity.selected) {
      const barW = Math.max(spriteW, 20 * zoom);
      const barH = 3 * zoom;
      const barY = screen.y - spriteH - 6 * zoom;
      const hpRatio = entity.hp / entity.maxHp;

      ctx.fillStyle = '#000';
      ctx.fillRect(screen.x - barW / 2 - 1, barY - 1, barW + 2, barH + 2);
      ctx.fillStyle = hpRatio > 0.5 ? '#4a4' : hpRatio > 0.25 ? '#aa4' : '#a44';
      ctx.fillRect(screen.x - barW / 2, barY, barW * hpRatio, barH);
    }

    // Selection indicator
    if (entity.selected) {
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 1.5;
      if (entity.type === 'building') {
        ctx.strokeRect(screen.x - spriteW / 2 - 2, screen.y - spriteH - 2, spriteW + 4, spriteH + 4);
      } else {
        ctx.beginPath();
        ctx.ellipse(screen.x, screen.y, spriteW / 2 + 2, spriteH / 4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Harvester ore indicator
    if (entity.def?.isHarvester && entity.oreCarried > 0) {
      const barW = 20 * zoom;
      const barY = screen.y + 2;
      const ratio = entity.oreCarried / entity.maxOre;
      ctx.fillStyle = '#000';
      ctx.fillRect(screen.x - barW / 2 - 1, barY, barW + 2, 3 * zoom + 1);
      ctx.fillStyle = '#c90';
      ctx.fillRect(screen.x - barW / 2, barY + 0.5, barW * ratio, 3 * zoom);
    }

    // Unit facing indicator for vehicles
    if (entity.type === 'unit' && entity.def?.type === 'vehicle' && entity.weapon) {
      const gunLen = 10 * zoom;
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2 * zoom;
      ctx.beginPath();
      ctx.moveTo(screen.x, screen.y - spriteH / 2);
      ctx.lineTo(
        screen.x + Math.cos(entity.facing) * gunLen,
        screen.y - spriteH / 2 + Math.sin(entity.facing) * gunLen
      );
      ctx.stroke();
    }
  }

  _drawProjectiles(ctx) {
    const zoom = this.game.camera.zoom;
    for (const p of this.game.combat.projectiles) {
      const screen = this.tileToScreen(p.x, p.y);

      switch (p.type) {
        case 'shell':
          ctx.fillStyle = '#ff0';
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, 2 * zoom, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'missile':
          ctx.fillStyle = '#f80';
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, 2 * zoom, 0, Math.PI * 2);
          ctx.fill();
          // Trail
          ctx.strokeStyle = 'rgba(200,200,200,0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(screen.x, screen.y);
          const ts = this.tileToScreen(p.x - (p.targetX - p.x) * 0.2, p.y - (p.targetY - p.y) * 0.2);
          ctx.lineTo(ts.x, ts.y);
          ctx.stroke();
          break;
        case 'rocket':
          ctx.fillStyle = '#f44';
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, 3 * zoom, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'torpedo':
          ctx.fillStyle = '#4af';
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, 2 * zoom, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'bomb':
          ctx.fillStyle = '#a00';
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, 3 * zoom, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
    }
  }

  _drawEffects(ctx) {
    const zoom = this.game.camera.zoom;
    for (let i = this.game.effects.length - 1; i >= 0; i--) {
      const effect = this.game.effects[i];
      effect.timer += 1 / 60;
      if (effect.timer >= effect.duration) {
        this.game.effects.splice(i, 1);
        continue;
      }

      const screen = this.tileToScreen(effect.x, effect.y);
      const progress = effect.timer / effect.duration;

      switch (effect.type) {
        case 'explosion': {
          const size = (effect.size || 1) * 20 * zoom * (1 + progress);
          const alpha = 1 - progress;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#ff0';
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, size * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f80';
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, size * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f44';
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          break;
        }
        case 'hit': {
          const alpha = 1 - progress;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#ff0';
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, 4 * zoom, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          break;
        }
        case 'muzzle_flash': {
          const alpha = 1 - progress;
          ctx.globalAlpha = alpha * 0.8;
          ctx.fillStyle = '#ff8';
          ctx.beginPath();
          ctx.arc(screen.x, screen.y - 10 * zoom, 5 * zoom, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          break;
        }
        case 'move_marker': {
          const alpha = 1 - progress;
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = '#0f0';
          ctx.lineWidth = 1.5;
          const r = 8 * zoom * (1 + progress * 0.5);
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          break;
        }
      }
    }
  }

  _drawSelectionBox(ctx) {
    const start = this.game.input.dragStart;
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(0,255,0,0.1)';
    const x = Math.min(start.sx, this.game.input.mouse.x);
    const y = Math.min(start.sy, this.game.input.mouse.y);
    const w = Math.abs(this.game.input.mouse.x - start.sx);
    const h = Math.abs(this.game.input.mouse.y - start.sy);
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }

  _drawBuildingGhost(ctx) {
    const key = this.game.input.placingBuilding;
    const def = BUILDINGS[key];
    if (!def) return;

    const mouse = this.game.input.mouse;
    const tile = { x: mouse.tileX, y: mouse.tileY };
    const screen = this.tileToScreen(tile.x, tile.y);
    const zoom = this.game.camera.zoom;
    const size = def.size;
    const canBuild = this.game.map.canBuildAt(tile.x, tile.y, size);

    // Draw footprint
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const ts = this.tileToScreen(tile.x + dx, tile.y + dy);
        const hw = CONFIG.TILE_WIDTH / 2 * zoom;
        const hh = CONFIG.TILE_HEIGHT / 2 * zoom;
        ctx.fillStyle = canBuild ? 'rgba(0,200,0,0.3)' : 'rgba(200,0,0,0.3)';
        ctx.beginPath();
        ctx.moveTo(ts.x, ts.y - hh);
        ctx.lineTo(ts.x + hw, ts.y);
        ctx.lineTo(ts.x, ts.y + hh);
        ctx.lineTo(ts.x - hw, ts.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = canBuild ? 'rgba(0,200,0,0.6)' : 'rgba(200,0,0,0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Draw building ghost
    const color = this.game.players[this.game.localPlayerId]?.color || '#fff';
    ctx.globalAlpha = 0.6;
    const spriteW = 32 * size * zoom;
    const spriteH = 32 * size * zoom;
    const sprite = SpriteCache.get(key, color, 64 * size, 64 * size);
    if (sprite && sprite.ready) {
      ctx.drawImage(sprite.canvas, screen.x - spriteW / 2, screen.y - spriteH, spriteW, spriteH);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(screen.x - spriteW / 2, screen.y - spriteH, spriteW, spriteH);
    }
    ctx.globalAlpha = 1;
  }

  _drawMinimap() {
    const mCtx = this.minimapCtx;
    const map = this.game.map;
    const fog = this.game.fog;
    if (!map) return;

    mCtx.fillStyle = '#0a0a0a';
    mCtx.fillRect(0, 0, 200, 160);

    const scaleX = 200 / map.width;
    const scaleY = 160 / map.height;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (200 - map.width * scale) / 2;
    const offsetY = (160 - map.height * scale) / 2;

    // Terrain (low-res)
    const step = Math.max(1, Math.floor(1 / scale));
    for (let y = 0; y < map.height; y += step) {
      for (let x = 0; x < map.width; x += step) {
        if (CONFIG.FOG_ENABLED && !fog.isExplored(x, y)) continue;
        const terrain = map.tiles[y][x];
        mCtx.fillStyle = TERRAIN_COLORS[terrain] || '#333';
        if (CONFIG.FOG_ENABLED && !fog.isVisible(x, y)) {
          mCtx.globalAlpha = 0.4;
        }
        mCtx.fillRect(offsetX + x * scale, offsetY + y * scale, Math.max(scale * step, 1), Math.max(scale * step, 1));
        mCtx.globalAlpha = 1;
      }
    }

    // Entities
    for (const entity of this.game.entities.getAll()) {
      if (CONFIG.FOG_ENABLED && !fog.isVisible(entity.tileX, entity.tileY)) continue;
      const color = this.game.players[entity.playerId]?.color || '#fff';
      mCtx.fillStyle = color;
      const size = entity.type === 'building' ? Math.max(3, entity.def.size * scale) : 2;
      mCtx.fillRect(
        offsetX + entity.tileX * scale - size / 2,
        offsetY + entity.tileY * scale - size / 2,
        size, size
      );
    }

    // Camera viewport
    const cam = this.game.camera;
    const viewW = cam.screenW / (cam.zoom * CONFIG.TILE_WIDTH) * 2;
    const viewH = cam.screenH / (cam.zoom * CONFIG.TILE_HEIGHT) * 2;
    const centerTX = cam.x / CONFIG.TILE_WIDTH + cam.y / CONFIG.TILE_HEIGHT;
    const centerTY = cam.y / CONFIG.TILE_HEIGHT - cam.x / CONFIG.TILE_WIDTH;

    mCtx.strokeStyle = '#fff';
    mCtx.lineWidth = 1;
    mCtx.strokeRect(
      offsetX + (centerTX - viewW / 2) * scale,
      offsetY + (centerTY - viewH / 2) * scale,
      viewW * scale,
      viewH * scale
    );

    // Click on minimap to move camera
    this.minimapCanvas.onclick = (e) => {
      const rect = this.minimapCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const tileX = (mx - offsetX) / scale;
      const tileY = (my - offsetY) / scale;
      cam.x = (tileX - tileY) * (CONFIG.TILE_WIDTH / 2);
      cam.y = (tileX + tileY) * (CONFIG.TILE_HEIGHT / 2);
    };
  }
}
