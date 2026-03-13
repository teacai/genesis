// AI Bot system - handles computer-controlled players
class AIBot {
  constructor(playerId, difficulty = 'medium') {
    this.playerId = playerId;
    this.difficulty = difficulty;
    this.timer = 0;
    this.buildTimer = 0;
    this.attackTimer = 0;
    this.scoutTimer = 0;
    this.expandTimer = 0;
    this.state = 'building'; // building, expanding, attacking, defending
    this.targetPlayerId = null;
    this.buildOrder = [];
    this._initBuildOrder();

    // Difficulty settings
    const diffSettings = {
      easy: { buildInterval: 5, attackInterval: 120, creditBonus: 0 },
      medium: { buildInterval: 3, attackInterval: 80, creditBonus: 5 },
      hard: { buildInterval: 1.5, attackInterval: 45, creditBonus: 15 },
      brutal: { buildInterval: 0.8, attackInterval: 30, creditBonus: 30 },
    };
    this.settings = diffSettings[difficulty] || diffSettings.medium;
  }

  _initBuildOrder() {
    this.buildOrder = [
      { type: 'building', key: 'power_plant' },
      { type: 'building', key: 'barracks' },
      { type: 'building', key: 'refinery' },
      { type: 'unit', key: null, count: 3, unitType: 'infantry' },
      { type: 'building', key: 'war_factory' },
      { type: 'unit', key: null, count: 2, unitType: 'vehicle' },
      { type: 'building', key: null, powerBuilding: true },
      { type: 'unit', key: null, count: 5, unitType: 'vehicle' },
    ];
    this.buildOrderIndex = 0;
  }

  update(dt, game) {
    const player = game.players[this.playerId];
    if (!player || player.isDefeated) return;

    this.timer += dt;
    this.buildTimer += dt;
    this.attackTimer += dt;
    this.scoutTimer += dt;

    // Credit bonus based on difficulty
    if (this.settings.creditBonus > 0) {
      player.credits += this.settings.creditBonus * dt;
    }

    // Build logic
    if (this.buildTimer >= this.settings.buildInterval) {
      this.buildTimer = 0;
      this._doBuildLogic(game, player);
    }

    // Attack logic
    if (this.attackTimer >= this.settings.attackInterval) {
      this.attackTimer = 0;
      this._doAttackLogic(game, player);
    }

    // Manage harvesters
    this._manageHarvesters(game, player);

    // Defend base
    this._defendBase(game, player);
  }

  _doBuildLogic(game, player) {
    const buildings = game.entities.getPlayerBuildings(this.playerId);
    const units = game.entities.getPlayerUnits(this.playerId);

    // Fix power deficit first
    if (player.isLowPower) {
      const powerKey = player.faction === 'ALLIED' ? 'power_plant' : 'tesla_reactor';
      if (player.canBuild(powerKey)) {
        this._buildStructure(game, player, powerKey);
        return;
      }
    }

    // Follow build order
    if (this.buildOrderIndex < this.buildOrder.length) {
      const order = this.buildOrder[this.buildOrderIndex];
      if (order.type === 'building') {
        let key = order.key;
        if (order.powerBuilding) {
          key = player.faction === 'ALLIED' ? 'power_plant' : 'tesla_reactor';
        }
        if (key && player.canBuild(key)) {
          if (this._buildStructure(game, player, key)) {
            this.buildOrderIndex++;
          }
        } else {
          this.buildOrderIndex++; // Skip if can't build
        }
      } else if (order.type === 'unit') {
        const availableUnits = player.getAvailableUnits().filter(k => {
          const def = UNITS[k];
          return !order.unitType || def.type === order.unitType;
        });
        if (availableUnits.length > 0 && units.length < (order.count || 5)) {
          const key = availableUnits[Math.floor(Math.random() * availableUnits.length)];
          this._trainUnit(game, player, key);
        } else {
          this.buildOrderIndex++;
        }
      }
      return;
    }

    // Continue building after build order
    // Build more units
    if (units.length < CONFIG.MAX_UNITS_PER_PLAYER) {
      const available = player.getAvailableUnits();
      if (available.length > 0) {
        // Prefer combat units
        const combatUnits = available.filter(k => UNITS[k].weapon);
        const key = combatUnits.length > 0 ?
          combatUnits[Math.floor(Math.random() * combatUnits.length)] :
          available[Math.floor(Math.random() * available.length)];
        this._trainUnit(game, player, key);
      }
    }

    // Build defenses
    if (buildings.length > 4 && Math.random() < 0.3) {
      const defenseKey = player.faction === 'ALLIED' ? 'pillbox' : 'sentry_gun';
      if (player.canBuild(defenseKey)) {
        this._buildStructure(game, player, defenseKey);
      }
    }

    // Build additional refineries
    const refineries = buildings.filter(b => b.defKey === 'refinery');
    if (refineries.length < 2 && player.canBuild('refinery') && player.credits > 3000) {
      this._buildStructure(game, player, 'refinery');
    }
  }

  _buildStructure(game, player, key) {
    const def = BUILDINGS[key];
    if (!def || !player.canAfford(def.cost)) return false;

    // Find a place to build near existing buildings
    const buildings = game.entities.getPlayerBuildings(this.playerId);
    if (buildings.length === 0) return false;

    const base = buildings[0];
    const size = def.size;

    for (let attempt = 0; attempt < 50; attempt++) {
      const offsetX = Math.floor(Math.random() * 16) - 8;
      const offsetY = Math.floor(Math.random() * 16) - 8;
      const bx = base.tileX + offsetX;
      const by = base.tileY + offsetY;

      if (game.map.canBuildAt(bx, by, size)) {
        player.spend(def.cost);
        const building = new Entity('building', key, this.playerId, bx, by);
        building.buildProgress = 0;
        game.map.occupy(bx, by, size, building.id);
        game.entities.add(building);

        // Spawn free harvester with refinery
        if (def.givesUnit) {
          const harvester = new Entity('unit', def.givesUnit, this.playerId, bx + size, by + size);
          game.entities.add(harvester);
          harvester.harvesting = true;
          const ore = game.findNearestOre(harvester.tileX, harvester.tileY);
          if (ore) {
            harvester.harvestTarget = ore;
            harvester.moveTo(ore.x, ore.y, game);
          }
        }
        return true;
      }
    }
    return false;
  }

  _trainUnit(game, player, key) {
    const def = UNITS[key];
    if (!def || !player.canAfford(def.cost)) return;

    // Find appropriate production building
    const buildings = game.entities.getPlayerBuildings(this.playerId);
    let producer = null;

    if (def.type === 'infantry') {
      producer = buildings.find(b => b.defKey === 'barracks' && !b.currentBuild);
    } else if (def.type === 'vehicle') {
      producer = buildings.find(b => b.defKey === 'war_factory' && !b.currentBuild);
    } else if (def.type === 'air') {
      producer = buildings.find(b => b.defKey === 'air_force_command' && !b.currentBuild);
    } else if (def.type === 'naval') {
      producer = buildings.find(b => b.defKey === 'naval_yard' && !b.currentBuild);
    }

    if (producer) {
      player.spend(def.cost);
      producer.queueBuild(key);
    }
  }

  _doAttackLogic(game, player) {
    const units = game.entities.getPlayerUnits(this.playerId);
    const combatUnits = units.filter(u => u.weapon && !u.def.isHarvester);

    if (combatUnits.length < 5) return; // Don't attack with too few units

    // Find a target player
    const enemies = Object.values(game.players).filter(p =>
      p.id !== this.playerId && !p.isDefeated
    );
    if (enemies.length === 0) return;

    const target = enemies[Math.floor(Math.random() * enemies.length)];
    const targetBuildings = game.entities.getPlayerBuildings(target.id);
    if (targetBuildings.length === 0) return;

    const targetBuilding = targetBuildings[Math.floor(Math.random() * targetBuildings.length)];

    // Send attack force
    const attackForce = combatUnits.slice(0, Math.ceil(combatUnits.length * 0.6));
    for (const unit of attackForce) {
      unit.target = null;
      unit.moveTo(targetBuilding.x, targetBuilding.y, game);
    }
  }

  _manageHarvesters(game, player) {
    const units = game.entities.getPlayerUnits(this.playerId);
    const harvesters = units.filter(u => u.def.isHarvester);

    for (const h of harvesters) {
      if (!h.moving && !h.harvesting && !h.returningOre && h.oreCarried < h.maxOre) {
        const ore = game.findNearestOre(h.tileX, h.tileY);
        if (ore) {
          h.harvestTarget = ore;
          h.harvesting = true;
          h.moveTo(ore.x, ore.y, game);
        }
      }
    }
  }

  _defendBase(game, player) {
    const buildings = game.entities.getPlayerBuildings(this.playerId);
    if (buildings.length === 0) return;

    const base = buildings[0];
    // Check for enemies near base
    const nearbyEnemies = game.entities.getEntitiesNear(base.x, base.y, 15)
      .filter(e => e.playerId !== this.playerId && e.type === 'unit');

    if (nearbyEnemies.length > 0) {
      const units = game.entities.getPlayerUnits(this.playerId);
      const defenders = units.filter(u => u.weapon && !u.def.isHarvester && !u.target);
      for (const defender of defenders.slice(0, nearbyEnemies.length + 2)) {
        defender.target = nearbyEnemies[0];
      }
    }
  }
}

class AIManager {
  constructor() {
    this.bots = new Map(); // playerId -> AIBot
  }

  addBot(playerId, difficulty = 'medium') {
    this.bots.set(playerId, new AIBot(playerId, difficulty));
  }

  removeBot(playerId) {
    this.bots.delete(playerId);
  }

  update(dt, game) {
    for (const bot of this.bots.values()) {
      bot.update(dt, game);
    }
  }
}
