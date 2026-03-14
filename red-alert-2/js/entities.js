// Entity management system
let nextEntityId = 1;

class Entity {
  constructor(type, definitionKey, playerId, tileX, tileY) {
    this.id = nextEntityId++;
    this.type = type; // 'unit' or 'building'
    this.defKey = definitionKey;
    this.playerId = playerId;
    this.tileX = tileX;
    this.tileY = tileY;
    // Pixel position for smooth movement
    this.x = tileX;
    this.y = tileY;
    this.def = type === 'unit' ? UNITS[definitionKey] : BUILDINGS[definitionKey];
    this.hp = this.def.hp;
    this.maxHp = this.def.hp;
    this.selected = false;
    this.dead = false;

    // Movement (units only)
    this.path = null;
    this.pathIndex = 0;
    this.targetX = tileX;
    this.targetY = tileY;
    this.moving = false;
    this.speed = this.def.speed || 0;
    this.facing = 0; // angle in radians

    // Combat
    this.target = null; // target entity
    this.attackCooldown = 0;
    this.weapon = this.def.weapon || null;

    // Building specific
    this.buildProgress = 1; // 1 = complete
    this.rallyPoint = null;
    this.buildQueue = [];
    this.currentBuild = null;
    this.currentBuildProgress = 0;
    this.powered = true;

    // Harvester
    this.oreCarried = 0;
    this.maxOre = CONFIG.HARVESTER_CAPACITY;
    this.harvesting = false;
    this.returningOre = false;
    this.harvestTarget = null;

    // Animation
    this.animFrame = 0;
    this.animTimer = 0;
    this.flashTimer = 0;

    // Visibility
    this.sight = this.def.sight || 5;
    this.visible = true;
    this.cloaked = false;
  }

  update(dt, game) {
    if (this.dead) return;

    this.animTimer += dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;

    if (this.type === 'unit') {
      this._updateUnit(dt, game);
    } else {
      this._updateBuilding(dt, game);
    }
  }

  _updateUnit(dt, game) {
    // Harvester logic
    if (this.def.isHarvester) {
      this._updateHarvester(dt, game);
      return;
    }

    // Attack logic
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    if (this.target) {
      if (this.target.dead) {
        this.target = null;
      } else {
        const dist = this._distTo(this.target);
        const range = this.weapon ? this.weapon.range : 0;
        if (dist <= range) {
          this.moving = false;
          this.path = null;
          this._faceTarget(this.target);
          if (this.attackCooldown <= 0 && this.weapon) {
            game.combat.attack(this, this.target);
            this.attackCooldown = this.weapon.rate;
          }
          return;
        } else {
          // Move toward target
          this.moveTo(this.target.x, this.target.y, game);
        }
      }
    }

    // Auto-attack nearby enemies
    if (!this.target && !this.moving && this.weapon) {
      const enemy = game.findNearestEnemy(this, this.sight);
      if (enemy) {
        this.target = enemy;
      }
    }

    // Movement
    if (this.moving && this.path && this.pathIndex < this.path.length) {
      const target = this.path[this.pathIndex];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.1) {
        this.x = target.x;
        this.y = target.y;
        this.tileX = Math.round(this.x);
        this.tileY = Math.round(this.y);
        this.pathIndex++;
        if (this.pathIndex >= this.path.length) {
          this.moving = false;
          this.path = null;
        }
      } else {
        const moveSpeed = this.speed * dt;
        const moveRatio = Math.min(moveSpeed / dist, 1);
        this.x += dx * moveRatio;
        this.y += dy * moveRatio;
        this.tileX = Math.round(this.x);
        this.tileY = Math.round(this.y);
        this.facing = Math.atan2(dy, dx);
      }
    }
  }

  _updateHarvester(dt, game) {
    // If full, return to refinery
    if (this.oreCarried >= this.maxOre && !this.returningOre) {
      this.returningOre = true;
      this.harvesting = false;
      const refinery = game.findNearestBuilding(this.playerId, 'refinery');
      if (refinery) {
        this.moveTo(refinery.x, refinery.y, game);
      }
      return;
    }

    // If returning ore and near refinery
    if (this.returningOre) {
      const refinery = game.findNearestBuilding(this.playerId, 'refinery');
      if (refinery) {
        const dist = this._distTo(refinery);
        if (dist < 2) {
          const player = game.players[this.playerId];
          const value = this.oreCarried * CONFIG.ORE_VALUE;
          const bonus = player.hasOrePurifier ? 1.25 : 1.0;
          player.credits += Math.floor(value * bonus);
          this.oreCarried = 0;
          this.returningOre = false;
          // Go back to harvest
          if (this.harvestTarget) {
            this.moveTo(this.harvestTarget.x, this.harvestTarget.y, game);
            this.harvesting = true;
          }
          return;
        }
      }
      // Continue moving to refinery
      if (!this.moving) {
        if (refinery) this.moveTo(refinery.x, refinery.y, game);
      }
    }

    // Harvest ore
    if (this.harvesting && !this.moving) {
      const ore = game.map.getOre(this.tileX, this.tileY);
      if (ore > 0) {
        const mined = game.map.mineOre(this.tileX, this.tileY, CONFIG.HARVESTER_GATHER_RATE * dt);
        this.oreCarried += mined;
      } else {
        // Find nearest ore
        const nearest = game.findNearestOre(this.tileX, this.tileY);
        if (nearest) {
          this.harvestTarget = nearest;
          this.moveTo(nearest.x, nearest.y, game);
        } else {
          this.harvesting = false;
        }
      }
    }

    // Movement
    if (this.moving && this.path && this.pathIndex < this.path.length) {
      const target = this.path[this.pathIndex];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.15) {
        this.x = target.x;
        this.y = target.y;
        this.tileX = Math.round(this.x);
        this.tileY = Math.round(this.y);
        this.pathIndex++;
        if (this.pathIndex >= this.path.length) {
          this.moving = false;
          this.path = null;
          if (this.harvesting || (!this.returningOre && this.oreCarried < this.maxOre)) {
            this.harvesting = true;
          }
        }
      } else {
        const moveSpeed = this.speed * dt;
        const moveRatio = Math.min(moveSpeed / dist, 1);
        this.x += dx * moveRatio;
        this.y += dy * moveRatio;
        this.tileX = Math.round(this.x);
        this.tileY = Math.round(this.y);
        this.facing = Math.atan2(dy, dx);
      }
    }
  }

  _updateBuilding(dt, game) {
    // Building construction progress
    if (this.buildProgress < 1) {
      this.buildProgress += dt / (this.def.buildTime || 10);
      if (this.buildProgress >= 1) {
        this.buildProgress = 1;
      }
      return;
    }

    // Auto-repair if repairing flag set
    if (this._repairing && this.hp < this.maxHp) {
      const player = game.players[this.playerId];
      const repairCost = this.def.cost * 0.005 * dt; // costs ~50% of building cost to fully repair
      const repairAmount = this.maxHp * 0.02 * dt; // ~2% max HP per second
      if (player && player.credits >= repairCost) {
        player.credits -= repairCost;
        this.repair(repairAmount);
      }
      if (this.hp >= this.maxHp) {
        this._repairing = false;
      }
    }

    // Defense weapon
    if (this.weapon && this.powered) {
      if (this.attackCooldown > 0) this.attackCooldown -= dt;
      if (!this.target || this.target.dead) {
        this.target = game.findNearestEnemy(this, this.weapon.range);
      }
      if (this.target && !this.target.dead) {
        const dist = this._distTo(this.target);
        if (dist <= this.weapon.range) {
          if (this.attackCooldown <= 0) {
            game.combat.attack(this, this.target);
            this.attackCooldown = this.weapon.rate;
          }
        } else {
          this.target = null;
        }
      }
    }

    // Production queue
    if (this.currentBuild) {
      if (!this.powered) return;
      const buildDef = UNITS[this.currentBuild] || BUILDINGS[this.currentBuild];
      if (buildDef) {
        this.currentBuildProgress += dt / (buildDef.buildTime || 10);
        if (this.currentBuildProgress >= 1) {
          game.completeProduction(this, this.currentBuild);
          this.currentBuild = null;
          this.currentBuildProgress = 0;
          // Next in queue
          if (this.buildQueue.length > 0) {
            this.currentBuild = this.buildQueue.shift();
            this.currentBuildProgress = 0;
          }
        }
      }
    }
  }

  moveTo(tx, ty, game) {
    const unitType = this.def.type === 'air' ? 'air' :
                     this.def.type === 'naval' ? 'naval' :
                     this.def.canSwim ? 'amphibious' : 'vehicle';
    const path = game.pathfinder.findPath(
      Math.round(this.x), Math.round(this.y),
      Math.round(tx), Math.round(ty), unitType
    );
    if (path && path.length > 0) {
      this.path = path;
      this.pathIndex = 0;
      this.moving = true;
    }
  }

  queueBuild(unitKey) {
    if (this.currentBuild === null) {
      this.currentBuild = unitKey;
      this.currentBuildProgress = 0;
    } else {
      this.buildQueue.push(unitKey);
    }
  }

  cancelBuild() {
    if (this.currentBuild) {
      const def = UNITS[this.currentBuild] || BUILDINGS[this.currentBuild];
      this.currentBuild = null;
      this.currentBuildProgress = 0;
      return def ? Math.floor(def.cost * 0.5) : 0; // refund half
    }
    return 0;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.flashTimer = 0.15;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
  }

  repair(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHp);
  }

  _distTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  _faceTarget(target) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    this.facing = Math.atan2(dy, dx);
  }
}

class EntityManager {
  constructor() {
    this.entities = new Map();
    this.byPlayer = new Map(); // playerId -> Set<entityId>
    this.byType = { unit: new Set(), building: new Set() };
  }

  add(entity) {
    this.entities.set(entity.id, entity);
    if (!this.byPlayer.has(entity.playerId)) {
      this.byPlayer.set(entity.playerId, new Set());
    }
    this.byPlayer.get(entity.playerId).add(entity.id);
    this.byType[entity.type].add(entity.id);
    return entity;
  }

  remove(entityId) {
    const entity = this.entities.get(entityId);
    if (!entity) return;
    this.entities.delete(entityId);
    this.byPlayer.get(entity.playerId)?.delete(entityId);
    this.byType[entity.type]?.delete(entityId);
  }

  get(entityId) {
    return this.entities.get(entityId);
  }

  getPlayerEntities(playerId) {
    const ids = this.byPlayer.get(playerId);
    if (!ids) return [];
    return Array.from(ids).map(id => this.entities.get(id)).filter(e => e && !e.dead);
  }

  getPlayerBuildings(playerId) {
    return this.getPlayerEntities(playerId).filter(e => e.type === 'building');
  }

  getPlayerUnits(playerId) {
    return this.getPlayerEntities(playerId).filter(e => e.type === 'unit');
  }

  getAllUnits() {
    return Array.from(this.byType.unit).map(id => this.entities.get(id)).filter(e => e && !e.dead);
  }

  getAllBuildings() {
    return Array.from(this.byType.building).map(id => this.entities.get(id)).filter(e => e && !e.dead);
  }

  getAll() {
    return Array.from(this.entities.values()).filter(e => !e.dead);
  }

  update(dt, game) {
    for (const entity of this.entities.values()) {
      if (!entity.dead) {
        entity.update(dt, game);
      }
    }
    // Clean up dead entities
    for (const [id, entity] of this.entities) {
      if (entity.dead) {
        if (entity.type === 'building') {
          game.map.unoccupy(entity.tileX, entity.tileY, entity.def.size);
        }
        this.remove(id);
      }
    }
  }

  getEntitiesInRect(x1, y1, x2, y2) {
    const result = [];
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    for (const entity of this.entities.values()) {
      if (entity.dead) continue;
      if (entity.x >= minX && entity.x <= maxX && entity.y >= minY && entity.y <= maxY) {
        result.push(entity);
      }
    }
    return result;
  }

  getEntitiesNear(x, y, radius) {
    const result = [];
    const r2 = radius * radius;
    for (const entity of this.entities.values()) {
      if (entity.dead) continue;
      const dx = entity.x - x;
      const dy = entity.y - y;
      if (dx * dx + dy * dy <= r2) {
        result.push(entity);
      }
    }
    return result;
  }
}
