// Fog of War system
class FogOfWar {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    // 0 = unexplored, 1 = explored but not visible, 2 = currently visible
    this.fog = [];
    this.visibility = []; // temporary per-frame visibility
    this.init();
  }

  init() {
    for (let y = 0; y < this.height; y++) {
      this.fog[y] = new Uint8Array(this.width);
      this.visibility[y] = new Uint8Array(this.width);
    }
  }

  reset() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.visibility[y][x] = 0;
        if (this.fog[y][x] === 2) this.fog[y][x] = 1;
      }
    }
  }

  revealCircle(cx, cy, radius) {
    const r2 = radius * radius;
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + radius));
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) {
          this.fog[y][x] = 2;
          this.visibility[y][x] = 1;
        }
      }
    }
  }

  isVisible(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    return this.fog[y][x] === 2;
  }

  isExplored(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    return this.fog[y][x] > 0;
  }

  update(entities, playerId) {
    if (!CONFIG.FOG_ENABLED) return;
    this.reset();
    const playerEntities = entities.getPlayerEntities(playerId);
    for (const entity of playerEntities) {
      this.revealCircle(entity.tileX, entity.tileY, entity.sight);
    }
  }

  // Reveal all (for map editor or debug)
  revealAll() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.fog[y][x] = 2;
        this.visibility[y][x] = 1;
      }
    }
  }
}
