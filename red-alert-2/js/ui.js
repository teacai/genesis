// UI management - sidebar, build menu, selection info
class GameUI {
  constructor(game) {
    this.game = game;
    this.sidebar = document.getElementById('sidebar');
    this.selectionInfo = document.getElementById('selection-info');
    this.activeTab = 'structures';
    this.buildingProducers = {};
  }

  init() {
    this._buildSidebar();
  }

  _buildSidebar() {
    const player = this.game.players[this.game.localPlayerId];
    if (!player) return;

    this.sidebar.innerHTML = '';

    // Tab buttons
    const tabRow = document.createElement('div');
    tabRow.className = 'tab-row';
    ['Structures', 'Defense', 'Infantry', 'Vehicles'].forEach(tab => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (this.activeTab === tab.toLowerCase() ? ' active' : '');
      btn.textContent = tab;
      btn.onclick = () => {
        this.activeTab = tab.toLowerCase();
        this._buildSidebar();
      };
      tabRow.appendChild(btn);
    });
    this.sidebar.appendChild(tabRow);

    const grid = document.createElement('div');
    grid.className = 'build-grid';

    let items = [];
    if (this.activeTab === 'structures') {
      items = this._getAvailableStructures(player, false);
    } else if (this.activeTab === 'defense') {
      items = this._getAvailableStructures(player, true);
    } else if (this.activeTab === 'infantry') {
      items = this._getAvailableUnits(player, 'infantry');
    } else if (this.activeTab === 'vehicles') {
      items = this._getAvailableUnits(player, 'vehicle');
    }

    for (const item of items) {
      const btn = this._createBuildButton(item, player);
      grid.appendChild(btn);
    }

    this.sidebar.appendChild(grid);

    // Production queue display
    this._updateProductionDisplay();
  }

  _getAvailableStructures(player, defenseOnly) {
    const factionDef = FACTIONS[player.faction];
    if (!factionDef) return [];
    const defenseKeys = ['wall', 'pillbox', 'sentry_gun', 'prism_tower', 'tesla_coil', 'patriot', 'flak_cannon'];

    return factionDef.buildings.filter(key => {
      const def = BUILDINGS[key];
      if (!def) return false;
      if (def.faction && def.faction !== player.faction) return false;
      if (key === 'construction_yard') return false;
      const isDefense = defenseKeys.includes(key);
      if (defenseOnly !== isDefense) return false;
      return true;
    }).map(key => ({ key, def: BUILDINGS[key], type: 'building' }));
  }

  _getAvailableUnits(player, unitType) {
    const factionDef = FACTIONS[player.faction];
    if (!factionDef) return [];

    return factionDef.units.filter(key => {
      const def = UNITS[key];
      if (!def) return false;
      if (def.faction && def.faction !== player.faction) return false;
      if (unitType === 'vehicle') {
        return def.type === 'vehicle' || def.type === 'air' || def.type === 'naval';
      }
      return def.type === unitType;
    }).map(key => ({ key, def: UNITS[key], type: 'unit' }));
  }

  _createBuildButton(item, player) {
    const btn = document.createElement('div');
    btn.className = 'build-btn';
    const canBuild = player.canBuild(item.key);
    if (!canBuild) btn.classList.add('disabled');

    const color = player.color;

    // SVG preview
    const svgContainer = document.createElement('div');
    if (SPRITES[item.key]) {
      svgContainer.innerHTML = SPRITES[item.key](color);
    }
    btn.appendChild(svgContainer);

    // Label
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = item.def.name;
    btn.appendChild(label);

    // Cost
    const cost = document.createElement('div');
    cost.className = 'cost';
    cost.textContent = `$${item.def.cost}`;
    btn.appendChild(cost);

    // Click handler
    btn.onclick = () => {
      if (!canBuild) {
        this.game.sound?.playError();
        // Show why can't build
        if (!player.canAfford(item.def.cost)) {
          this.game.notify('Insufficient funds');
        } else {
          this.game.notify('Prerequisites not met');
        }
        return;
      }

      if (item.type === 'building') {
        this.game.input.placingBuilding = item.key;
        this.game.sound?.playSelect();
      } else {
        // Train unit
        this._trainUnit(item.key, player);
      }
    };

    return btn;
  }

  _trainUnit(key, player) {
    const def = UNITS[key];
    if (!def || !player.canAfford(def.cost)) {
      this.game.sound?.playVoice('insufficient_funds');
      this.game.notify('Insufficient funds');
      return;
    }

    // Find production building
    const buildings = this.game.entities.getPlayerBuildings(player.id);
    let producer = null;

    if (def.type === 'infantry') {
      producer = buildings.find(b => b.defKey === 'barracks' && b.buildProgress >= 1);
    } else if (def.type === 'vehicle') {
      producer = buildings.find(b => b.defKey === 'war_factory' && b.buildProgress >= 1);
    } else if (def.type === 'air') {
      producer = buildings.find(b => b.defKey === 'air_force_command' && b.buildProgress >= 1);
    } else if (def.type === 'naval') {
      producer = buildings.find(b => b.defKey === 'naval_yard' && b.buildProgress >= 1);
    }

    if (!producer) {
      this.game.sound?.playError();
      this.game.notify('No production building available');
      return;
    }

    player.spend(def.cost);
    producer.queueBuild(key);
    this.game.sound?.playBuild();
    this._buildSidebar();
  }

  _updateProductionDisplay() {
    const player = this.game.players[this.game.localPlayerId];
    if (!player) return;

    const buildings = this.game.entities.getPlayerBuildings(player.id);
    const producing = buildings.filter(b => b.currentBuild);

    if (producing.length > 0) {
      const section = document.createElement('div');
      section.className = 'sidebar-section';
      const title = document.createElement('div');
      title.className = 'sidebar-title';
      title.textContent = 'Production';
      section.appendChild(title);

      for (const b of producing) {
        const row = document.createElement('div');
        row.style.cssText = 'padding:4px 8px;color:#ccc;font-size:11px;';
        const def = UNITS[b.currentBuild] || BUILDINGS[b.currentBuild];
        row.innerHTML = `
          <div>${def?.name || b.currentBuild}</div>
          <div class="build-progress">
            <div class="build-progress-fill" style="width:${b.currentBuildProgress * 100}%"></div>
          </div>
        `;
        section.appendChild(row);
      }
      this.sidebar.appendChild(section);
    }
  }

  updateSelection(entities) {
    this.selectionInfo.innerHTML = '';
    if (entities.length === 0) return;

    if (entities.length === 1) {
      const entity = entities[0];
      const color = this.game.players[entity.playerId]?.color || '#fff';
      const hpPercent = (entity.hp / entity.maxHp * 100).toFixed(0);

      let portraitSvg = '';
      if (SPRITES[entity.defKey]) {
        portraitSvg = SPRITES[entity.defKey](color);
      }

      this.selectionInfo.innerHTML = `
        <div class="sel-portrait">${portraitSvg}</div>
        <div class="sel-details">
          <div class="sel-name">${entity.def.name}</div>
          <div class="sel-hp">
            HP: ${entity.hp}/${entity.maxHp}
            <div class="hp-bar"><div class="hp-fill" style="width:${hpPercent}%;background:${hpPercent > 50 ? '#4a4' : hpPercent > 25 ? '#aa4' : '#a44'}"></div></div>
          </div>
          ${entity.def.weapon ? `<div style="font-size:11px;color:#aaa">DMG: ${entity.def.weapon.damage} | RNG: ${entity.def.weapon.range}</div>` : ''}
          ${entity.def.isHarvester ? `<div style="font-size:11px;color:#c90">Ore: ${entity.oreCarried}/${entity.maxOre}</div>` : ''}
          ${entity.type === 'building' && entity.currentBuild ? `<div style="font-size:11px;color:#4a4">Building: ${(UNITS[entity.currentBuild] || BUILDINGS[entity.currentBuild])?.name} (${(entity.currentBuildProgress * 100).toFixed(0)}%)</div>` : ''}
        </div>
      `;
    } else {
      // Multi-selection
      const container = document.createElement('div');
      container.className = 'sel-multi';
      for (const entity of entities.slice(0, 20)) {
        const color = this.game.players[entity.playerId]?.color || '#fff';
        const icon = document.createElement('div');
        icon.className = 'sel-multi-icon';
        if (SPRITES[entity.defKey]) {
          icon.innerHTML = SPRITES[entity.defKey](color);
        }
        icon.title = `${entity.def.name} (${entity.hp}/${entity.maxHp})`;
        icon.onclick = () => {
          // Click to focus on this unit
          const world = this.game.map.tileToWorld(entity.tileX, entity.tileY);
          this.game.camera.x = world.x;
          this.game.camera.y = world.y;
        };
        container.appendChild(icon);
      }
      if (entities.length > 20) {
        const more = document.createElement('div');
        more.style.cssText = 'color:#888;font-size:11px;padding:8px;';
        more.textContent = `+${entities.length - 20} more`;
        container.appendChild(more);
      }
      this.selectionInfo.appendChild(container);
    }
  }

  updateResources() {
    const player = this.game.players[this.game.localPlayerId];
    if (!player) return;

    document.getElementById('credits-display').textContent = Math.floor(player.credits);
    const powerEl = document.getElementById('power-display');
    powerEl.textContent = `${player.powerProduced}/${player.powerConsumed}`;
    powerEl.style.color = player.isLowPower ? '#f44' : '#4f4';
    document.getElementById('unit-count-display').textContent = `${player.unitCount}/${CONFIG.MAX_UNITS_PER_PLAYER}`;
  }

  refreshSidebar() {
    this._buildSidebar();
  }
}
