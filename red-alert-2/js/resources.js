// Player and resource management
class Player {
  constructor(id, name, faction, color, isBot = false, country = null) {
    this.id = id;
    this.name = name;
    this.faction = faction; // 'ALLIED' or 'SOVIET'
    this.country = country; // Country key (e.g., 'america', 'russia') or null for random
    this.color = color;
    this.isBot = isBot;
    this.credits = CONFIG.STARTING_CREDITS;
    this.powerProduced = 0;
    this.powerConsumed = 0;
    this.isDefeated = false;
    this.hasOrePurifier = false;
    this.hasIndustrialPlant = false;
    this.hasBattleLab = false;
    this.hasRadar = false;
    this.unitCount = 0;
    this.buildingsOwned = new Set();
  }

  get countryDef() {
    return this.country ? COUNTRIES[this.country] : null;
  }

  get countryName() {
    const def = this.countryDef;
    return def ? def.name : FACTIONS[this.faction]?.name || this.faction;
  }

  get power() {
    return this.powerProduced - this.powerConsumed;
  }

  get isLowPower() {
    return this.powerConsumed > this.powerProduced;
  }

  canAfford(cost) {
    return this.credits >= cost;
  }

  spend(amount) {
    if (this.credits >= amount) {
      this.credits -= amount;
      return true;
    }
    return false;
  }

  recalculatePower(entities) {
    this.powerProduced = 0;
    this.powerConsumed = 0;
    this.buildingsOwned = new Set();
    this.hasOrePurifier = false;
    this.hasIndustrialPlant = false;
    this.hasBattleLab = false;
    this.hasRadar = false;
    this.unitCount = 0;

    const playerEntities = entities.getPlayerEntities(this.id);
    for (const e of playerEntities) {
      if (e.type === 'building' && e.buildProgress >= 1) {
        this.buildingsOwned.add(e.defKey);
        const power = e.def.power || 0;
        if (power > 0) this.powerProduced += power;
        else this.powerConsumed += Math.abs(power);

        if (e.defKey === 'ore_purifier') this.hasOrePurifier = true;
        if (e.defKey === 'industrial_plant') this.hasIndustrialPlant = true;
        if (e.defKey === 'battle_lab') this.hasBattleLab = true;
        if (e.defKey === 'radar_tower' || e.defKey === 'air_force_command') this.hasRadar = true;
      }
      if (e.type === 'unit') this.unitCount++;
    }
  }

  canBuild(defKey) {
    const def = BUILDINGS[defKey] || UNITS[defKey];
    if (!def) return false;
    if (def.faction && def.faction !== this.faction) return false;
    if (!this.canAfford(this._getAdjustedCost(def))) return false;
    if (def.prerequisite) {
      for (const prereq of def.prerequisite) {
        if (!this.buildingsOwned.has(prereq)) return false;
      }
    }
    return true;
  }

  _getAdjustedCost(def) {
    let cost = def.cost;
    if (this.hasIndustrialPlant && (UNITS[def] || def.type === 'vehicle')) {
      cost = Math.floor(cost * 0.75);
    }
    return cost;
  }

  getAvailableBuildings() {
    const factionDef = FACTIONS[this.faction];
    if (!factionDef) return [];
    return factionDef.buildings.filter(key => {
      const def = BUILDINGS[key];
      if (!def) return false;
      if (def.faction && def.faction !== this.faction) return false;
      if (def.prerequisite) {
        return def.prerequisite.every(p => this.buildingsOwned.has(p));
      }
      return true;
    });
  }

  getAvailableUnits() {
    const factionDef = FACTIONS[this.faction];
    if (!factionDef) return [];
    return factionDef.units.filter(key => {
      const def = UNITS[key];
      if (!def) return false;
      if (def.faction && def.faction !== this.faction) return false;
      if (def.prerequisite) {
        return def.prerequisite.every(p => this.buildingsOwned.has(p));
      }
      return true;
    });
  }

  checkDefeat(entities) {
    const buildings = entities.getPlayerBuildings(this.id);
    if (buildings.length === 0) {
      const units = entities.getPlayerUnits(this.id);
      if (units.length === 0) {
        this.isDefeated = true;
        return true;
      }
    }
    return false;
  }
}
