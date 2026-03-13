// Map generation and management
class GameMap {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.oreAmount = []; // ore remaining per tile
    this.occupancy = []; // entity ID occupying tile, or 0
    this.init();
  }

  init() {
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      this.oreAmount[y] = [];
      this.occupancy[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = TERRAIN.GRASS;
        this.oreAmount[y][x] = 0;
        this.occupancy[y][x] = 0;
      }
    }
  }

  getTile(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return TERRAIN.ROCK;
    return this.tiles[y][x];
  }

  setTile(x, y, terrain) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.tiles[y][x] = terrain;
      if (terrain === TERRAIN.ORE) this.oreAmount[y][x] = 100;
      else if (terrain === TERRAIN.GEM) this.oreAmount[y][x] = 200;
      else this.oreAmount[y][x] = 0;
    }
  }

  isWalkable(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    const terrain = this.tiles[y][x];
    return TERRAIN_WALKABLE[terrain] !== false;
  }

  isBuildable(x, y) {
    if (!this.isWalkable(x, y)) return false;
    if (this.occupancy[y][x] !== 0) return false;
    const t = this.tiles[y][x];
    return t === TERRAIN.GRASS || t === TERRAIN.SAND || t === TERRAIN.CONCRETE;
  }

  canBuildAt(x, y, size) {
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        if (!this.isBuildable(x + dx, y + dy)) return false;
      }
    }
    return true;
  }

  occupy(x, y, size, entityId) {
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        if (x + dx >= 0 && x + dx < this.width && y + dy >= 0 && y + dy < this.height) {
          this.occupancy[y + dy][x + dx] = entityId;
        }
      }
    }
  }

  unoccupy(x, y, size) {
    this.occupy(x, y, size, 0);
  }

  getOre(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0;
    return this.oreAmount[y][x];
  }

  mineOre(x, y, amount) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0;
    const available = Math.min(this.oreAmount[y][x], amount);
    this.oreAmount[y][x] -= available;
    if (this.oreAmount[y][x] <= 0) {
      this.tiles[y][x] = TERRAIN.GRASS;
      this.oreAmount[y][x] = 0;
    }
    return available;
  }

  // Convert world coords to tile coords
  worldToTile(wx, wy) {
    const tx = Math.floor(wx / CONFIG.TILE_WIDTH + wy / CONFIG.TILE_HEIGHT) ;
    const ty = Math.floor(wy / CONFIG.TILE_HEIGHT - wx / CONFIG.TILE_WIDTH);
    return { x: tx, y: ty };
  }

  // Convert tile coords to world center
  tileToWorld(tx, ty) {
    const wx = (tx - ty) * (CONFIG.TILE_WIDTH / 2);
    const wy = (tx + ty) * (CONFIG.TILE_HEIGHT / 2);
    return { x: wx, y: wy };
  }

  // Generate a random map
  static generateRandom(width, height, numPlayers, seed = null) {
    const map = new GameMap(width, height);
    const rng = seed !== null ? GameMap.seededRandom(seed) : Math.random;

    // Fill with grass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        map.tiles[y][x] = TERRAIN.GRASS;
      }
    }

    // Generate water bodies
    const numWater = 3 + Math.floor(rng() * 5);
    for (let i = 0; i < numWater; i++) {
      const cx = Math.floor(rng() * width);
      const cy = Math.floor(rng() * height);
      const radius = 4 + Math.floor(rng() * 8);
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy < radius * radius * (0.5 + rng() * 0.5)) {
            const nx = cx + dx, ny = cy + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              map.tiles[ny][nx] = TERRAIN.WATER;
            }
          }
        }
      }
    }

    // Generate ore fields
    const numOre = 8 + Math.floor(rng() * 8);
    for (let i = 0; i < numOre; i++) {
      const cx = Math.floor(rng() * width);
      const cy = Math.floor(rng() * height);
      const radius = 3 + Math.floor(rng() * 4);
      const isGem = rng() < 0.2;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy < radius * radius * rng()) {
            const nx = cx + dx, ny = cy + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && map.tiles[ny][nx] === TERRAIN.GRASS) {
              map.tiles[ny][nx] = isGem ? TERRAIN.GEM : TERRAIN.ORE;
              map.oreAmount[ny][nx] = isGem ? 200 : 100;
            }
          }
        }
      }
    }

    // Generate rock/cliff areas
    const numRock = 5 + Math.floor(rng() * 6);
    for (let i = 0; i < numRock; i++) {
      const cx = Math.floor(rng() * width);
      const cy = Math.floor(rng() * height);
      const radius = 2 + Math.floor(rng() * 4);
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy < radius * radius * rng() * 0.7) {
            const nx = cx + dx, ny = cy + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && map.tiles[ny][nx] === TERRAIN.GRASS) {
              map.tiles[ny][nx] = rng() > 0.5 ? TERRAIN.ROCK : TERRAIN.CLIFF;
            }
          }
        }
      }
    }

    // Generate trees
    const numForests = 6 + Math.floor(rng() * 8);
    for (let i = 0; i < numForests; i++) {
      const cx = Math.floor(rng() * width);
      const cy = Math.floor(rng() * height);
      const radius = 3 + Math.floor(rng() * 5);
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy < radius * radius * rng()) {
            const nx = cx + dx, ny = cy + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && map.tiles[ny][nx] === TERRAIN.GRASS) {
              map.tiles[ny][nx] = TERRAIN.TREE;
            }
          }
        }
      }
    }

    // Find spawn points for players
    map.spawnPoints = [];
    const margin = 10;
    const attempts = 1000;
    for (let p = 0; p < numPlayers; p++) {
      let placed = false;
      for (let a = 0; a < attempts; a++) {
        const sx = margin + Math.floor(rng() * (width - margin * 2));
        const sy = margin + Math.floor(rng() * (height - margin * 2));
        // Check area is clear
        let clear = true;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (!map.isWalkable(sx + dx, sy + dy) || map.tiles[sy + dy]?.[sx + dx] === TERRAIN.ORE || map.tiles[sy + dy]?.[sx + dx] === TERRAIN.GEM) {
              clear = false;
              break;
            }
          }
          if (!clear) break;
        }
        // Check distance from other spawns
        if (clear) {
          let tooClose = false;
          for (const sp of map.spawnPoints) {
            const dist = Math.abs(sp.x - sx) + Math.abs(sp.y - sy);
            if (dist < 20) { tooClose = true; break; }
          }
          if (!tooClose) {
            // Clear area for construction yard
            for (let dy = -3; dy <= 3; dy++) {
              for (let dx = -3; dx <= 3; dx++) {
                if (sx + dx >= 0 && sx + dx < width && sy + dy >= 0 && sy + dy < height) {
                  map.tiles[sy + dy][sx + dx] = TERRAIN.GRASS;
                  map.oreAmount[sy + dy][sx + dx] = 0;
                }
              }
            }
            // Add ore field near spawn
            const oreAngle = rng() * Math.PI * 2;
            const oreDist = 8 + Math.floor(rng() * 4);
            const oreCx = Math.round(sx + Math.cos(oreAngle) * oreDist);
            const oreCy = Math.round(sy + Math.sin(oreAngle) * oreDist);
            for (let dy = -3; dy <= 3; dy++) {
              for (let dx = -3; dx <= 3; dx++) {
                if (dx * dx + dy * dy < 10) {
                  const nx = oreCx + dx, ny = oreCy + dy;
                  if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    map.tiles[ny][nx] = TERRAIN.ORE;
                    map.oreAmount[ny][nx] = 100;
                  }
                }
              }
            }
            map.spawnPoints.push({ x: sx, y: sy });
            placed = true;
            break;
          }
        }
      }
      if (!placed) {
        // Fallback: just pick a spot
        map.spawnPoints.push({ x: margin + p * 15, y: margin + p * 15 });
      }
    }

    return map;
  }

  static seededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  // Serialize for network/saving
  serialize() {
    return {
      width: this.width,
      height: this.height,
      tiles: this.tiles,
      oreAmount: this.oreAmount,
      spawnPoints: this.spawnPoints || [],
    };
  }

  static deserialize(data) {
    const map = new GameMap(data.width, data.height);
    map.tiles = data.tiles;
    map.oreAmount = data.oreAmount;
    map.spawnPoints = data.spawnPoints || [];
    return map;
  }
}
