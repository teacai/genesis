// Game configuration and constants
const CONFIG = {
  TILE_WIDTH: 60,
  TILE_HEIGHT: 30,
  MAP_DEFAULT_WIDTH: 128,
  MAP_DEFAULT_HEIGHT: 128,
  CAMERA_SPEED: 8,
  CAMERA_EDGE_SCROLL: 30,
  ZOOM_MIN: 0.3,
  ZOOM_MAX: 2.0,
  ZOOM_STEP: 0.1,
  MAX_PLAYERS: 100,
  MAX_UNITS_PER_PLAYER: 200,
  STARTING_CREDITS: 5000,
  ORE_VALUE: 25,
  GEM_VALUE: 75,
  HARVESTER_CAPACITY: 20,
  HARVESTER_GATHER_RATE: 0.5,
  FOG_ENABLED: true,
  TICK_RATE: 20,
  RENDER_FPS: 60,
  FRAME_RATE_CAP: 60, // 60-120 FPS cap
  GAME_SPEED: 1.0, // 0.5x to 1.5x
};

const TERRAIN = {
  GRASS: 0,
  WATER: 1,
  ORE: 2,
  GEM: 3,
  ROCK: 4,
  SAND: 5,
  CONCRETE: 6,
  BRIDGE: 7,
  CLIFF: 8,
  TREE: 9,
};

const TERRAIN_COLORS = {
  [TERRAIN.GRASS]: '#3a6b35',
  [TERRAIN.WATER]: '#1a3a6b',
  [TERRAIN.ORE]: '#8a7a3a',
  [TERRAIN.GEM]: '#5a3a8a',
  [TERRAIN.ROCK]: '#5a5a5a',
  [TERRAIN.SAND]: '#c2a64e',
  [TERRAIN.CONCRETE]: '#777',
  [TERRAIN.BRIDGE]: '#6a5a3a',
  [TERRAIN.CLIFF]: '#4a3a2a',
  [TERRAIN.TREE]: '#2a5a25',
};

const TERRAIN_WALKABLE = {
  [TERRAIN.GRASS]: true,
  [TERRAIN.WATER]: false,
  [TERRAIN.ORE]: true,
  [TERRAIN.GEM]: true,
  [TERRAIN.ROCK]: false,
  [TERRAIN.SAND]: true,
  [TERRAIN.CONCRETE]: true,
  [TERRAIN.BRIDGE]: true,
  [TERRAIN.CLIFF]: false,
  [TERRAIN.TREE]: false,
};

// Player team colors
const TEAM_COLORS = [
  '#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261',
  '#264653', '#023e8a', '#9d4edd', '#ff6b6b', '#4ecdc4',
  '#ff9f1c', '#6a994e', '#bc4749', '#5f0f40', '#0b525b',
  '#3a0ca3', '#7209b7', '#f72585', '#4361ee', '#4cc9f0',
];

// Extended colors for up to 100 players
for (let i = TEAM_COLORS.length; i < CONFIG.MAX_PLAYERS; i++) {
  const hue = (i * 37) % 360;
  TEAM_COLORS.push(`hsl(${hue}, 70%, 50%)`);
}

// Faction definitions
const FACTIONS = {
  ALLIED: {
    name: 'Allied',
    units: ['gi', 'engineer', 'spy', 'seal', 'grizzly', 'ifv', 'mirage', 'prism', 'harrier', 'destroyer', 'harvester'],
    buildings: ['construction_yard', 'power_plant', 'barracks', 'refinery', 'war_factory', 'air_force_command', 'naval_yard', 'battle_lab', 'ore_purifier', 'wall', 'pillbox', 'prism_tower', 'patriot'],
  },
  SOVIET: {
    name: 'Soviet',
    units: ['conscript', 'engineer', 'tesla_trooper', 'crazy_ivan', 'rhino', 'flak_track', 'apocalypse', 'v3_launcher', 'kirov', 'typhoon', 'harvester'],
    buildings: ['construction_yard', 'tesla_reactor', 'barracks', 'refinery', 'war_factory', 'radar_tower', 'naval_yard', 'battle_lab', 'industrial_plant', 'wall', 'sentry_gun', 'tesla_coil', 'flak_cannon'],
  },
};

// Country definitions (subfactions within each faction)
const COUNTRIES = {
  // Allied countries
  america: {
    name: 'America', faction: 'ALLIED', color: '#3366cc',
    specialUnit: 'gi', // Paratroopers (bonus: GIs have +25% HP)
    bonus: { unitKey: 'gi', hpMult: 1.25 },
    description: 'Paratroopers. GIs have 25% more health.',
  },
  korea: {
    name: 'Korea', faction: 'ALLIED', color: '#cc6633',
    specialUnit: 'harrier', // Black Eagle (bonus: Harriers deal +30% damage)
    bonus: { unitKey: 'harrier', damageMult: 1.3 },
    description: 'Black Eagles. Harriers deal 30% more damage.',
  },
  france: {
    name: 'France', faction: 'ALLIED', color: '#6633cc',
    specialUnit: 'prism_tower', // Grand Cannon (bonus: Prism Towers have +50% range)
    bonus: { buildingKey: 'prism_tower', rangeMult: 1.5 },
    description: 'Grand Cannon. Prism Towers have 50% more range.',
  },
  germany: {
    name: 'Germany', faction: 'ALLIED', color: '#666666',
    specialUnit: 'grizzly', // Tank Destroyer (bonus: Grizzlies deal +20% damage)
    bonus: { unitKey: 'grizzly', damageMult: 1.2 },
    description: 'Tank Destroyer. Grizzly Tanks deal 20% more damage.',
  },
  britain: {
    name: 'Great Britain', faction: 'ALLIED', color: '#cc3333',
    specialUnit: 'seal', // Sniper (bonus: SEALs have +40% range)
    bonus: { unitKey: 'seal', rangeMult: 1.4 },
    description: 'Snipers. Navy SEALs have 40% more range.',
  },
  // Soviet countries
  russia: {
    name: 'Russia', faction: 'SOVIET', color: '#cc0000',
    specialUnit: 'tesla_coil', // Tesla Troopers (bonus: Tesla Coils deal +25% damage)
    bonus: { buildingKey: 'tesla_coil', damageMult: 1.25 },
    description: 'Tesla power. Tesla Coils deal 25% more damage.',
  },
  cuba: {
    name: 'Cuba', faction: 'SOVIET', color: '#33cc33',
    specialUnit: 'crazy_ivan', // Terrorists (bonus: Crazy Ivan bombs do +30% damage)
    bonus: { unitKey: 'crazy_ivan', damageMult: 1.3 },
    description: 'Terrorists. Crazy Ivan bombs deal 30% more damage.',
  },
  iraq: {
    name: 'Iraq', faction: 'SOVIET', color: '#cccc33',
    specialUnit: 'tesla_trooper', // Desolator (bonus: Tesla Troopers have +30% HP)
    bonus: { unitKey: 'tesla_trooper', hpMult: 1.3 },
    description: 'Desolators. Tesla Troopers have 30% more health.',
  },
  libya: {
    name: 'Libya', faction: 'SOVIET', color: '#cc6600',
    specialUnit: 'v3_launcher', // Demolition Truck (bonus: V3s deal +25% damage)
    bonus: { unitKey: 'v3_launcher', damageMult: 1.25 },
    description: 'Demo Trucks. V3 Launchers deal 25% more damage.',
  },
};

// Building definitions
const BUILDINGS = {
  construction_yard: {
    name: 'Construction Yard', cost: 0, power: 0, hp: 1000, size: 3,
    sight: 8, buildTime: 0, prerequisite: [],
    description: 'Main base building. Allows construction of other structures.',
  },
  power_plant: {
    name: 'Power Plant', cost: 800, power: 200, hp: 750, size: 2,
    sight: 4, buildTime: 15, prerequisite: ['construction_yard'],
    description: 'Provides power to your base.',
    faction: 'ALLIED',
  },
  tesla_reactor: {
    name: 'Tesla Reactor', cost: 600, power: 150, hp: 600, size: 2,
    sight: 4, buildTime: 12, prerequisite: ['construction_yard'],
    description: 'Provides power to your base.',
    faction: 'SOVIET',
  },
  barracks: {
    name: 'Barracks', cost: 500, power: -20, hp: 500, size: 2,
    sight: 5, buildTime: 12, prerequisite: ['construction_yard'],
    description: 'Trains infantry units.',
  },
  refinery: {
    name: 'Ore Refinery', cost: 2000, power: -50, hp: 900, size: 3,
    sight: 5, buildTime: 30, prerequisite: ['construction_yard'],
    description: 'Processes ore into credits. Comes with a harvester.',
    givesUnit: 'harvester',
  },
  war_factory: {
    name: 'War Factory', cost: 2000, power: -50, hp: 1000, size: 3,
    sight: 5, buildTime: 30, prerequisite: ['refinery'],
    description: 'Builds vehicles.',
  },
  air_force_command: {
    name: 'Air Force Command', cost: 1000, power: -50, hp: 600, size: 2,
    sight: 8, buildTime: 20, prerequisite: ['war_factory'],
    description: 'Enables air units.',
    faction: 'ALLIED',
  },
  radar_tower: {
    name: 'Radar Tower', cost: 1000, power: -50, hp: 600, size: 2,
    sight: 10, buildTime: 20, prerequisite: ['war_factory'],
    description: 'Reveals map radar.',
    faction: 'SOVIET',
  },
  naval_yard: {
    name: 'Naval Yard', cost: 1000, power: -30, hp: 800, size: 3,
    sight: 6, buildTime: 25, prerequisite: ['war_factory'],
    description: 'Builds naval units.',
    requiresWater: true,
  },
  battle_lab: {
    name: 'Battle Lab', cost: 2000, power: -100, hp: 500, size: 2,
    sight: 5, buildTime: 40, prerequisite: ['war_factory'],
    description: 'Unlocks advanced units and structures.',
  },
  ore_purifier: {
    name: 'Ore Purifier', cost: 2500, power: -200, hp: 900, size: 3,
    sight: 4, buildTime: 45, prerequisite: ['battle_lab'],
    description: 'Increases ore processing output by 25%.',
    faction: 'ALLIED',
  },
  industrial_plant: {
    name: 'Industrial Plant', cost: 2500, power: -200, hp: 900, size: 3,
    sight: 4, buildTime: 45, prerequisite: ['battle_lab'],
    description: 'Reduces vehicle costs by 25%.',
    faction: 'SOVIET',
  },
  wall: {
    name: 'Wall', cost: 100, power: 0, hp: 300, size: 1,
    sight: 1, buildTime: 2, prerequisite: ['barracks'],
    description: 'Basic defensive wall.',
  },
  pillbox: {
    name: 'Pillbox', cost: 500, power: -10, hp: 400, size: 1,
    sight: 6, buildTime: 10, prerequisite: ['barracks'],
    description: 'Anti-infantry defense.',
    faction: 'ALLIED', weapon: { damage: 20, range: 5, rate: 0.5, type: 'bullet' },
  },
  sentry_gun: {
    name: 'Sentry Gun', cost: 500, power: -10, hp: 400, size: 1,
    sight: 6, buildTime: 10, prerequisite: ['barracks'],
    description: 'Anti-infantry defense.',
    faction: 'SOVIET', weapon: { damage: 25, range: 5, rate: 0.4, type: 'bullet' },
  },
  prism_tower: {
    name: 'Prism Tower', cost: 1500, power: -75, hp: 600, size: 1,
    sight: 8, buildTime: 25, prerequisite: ['air_force_command'],
    description: 'Powerful laser defense.',
    faction: 'ALLIED', weapon: { damage: 100, range: 7, rate: 2, type: 'laser' },
  },
  tesla_coil: {
    name: 'Tesla Coil', cost: 1500, power: -75, hp: 600, size: 1,
    sight: 8, buildTime: 25, prerequisite: ['radar_tower'],
    description: 'Powerful electric defense.',
    faction: 'SOVIET', weapon: { damage: 110, range: 6, rate: 2.5, type: 'electric' },
  },
  patriot: {
    name: 'Patriot Missile', cost: 1000, power: -50, hp: 500, size: 1,
    sight: 10, buildTime: 15, prerequisite: ['air_force_command'],
    description: 'Anti-air defense.',
    faction: 'ALLIED', weapon: { damage: 80, range: 10, rate: 1.5, type: 'missile', antiAir: true },
  },
  flak_cannon: {
    name: 'Flak Cannon', cost: 1000, power: -50, hp: 500, size: 1,
    sight: 8, buildTime: 15, prerequisite: ['radar_tower'],
    description: 'Anti-air defense.',
    faction: 'SOVIET', weapon: { damage: 60, range: 8, rate: 0.8, type: 'flak', antiAir: true },
  },
};

// Unit definitions
const UNITS = {
  // Allied infantry
  gi: {
    name: 'GI', cost: 200, hp: 125, speed: 2, sight: 5,
    buildTime: 5, prerequisite: ['barracks'], type: 'infantry',
    weapon: { damage: 15, range: 4, rate: 0.3, type: 'bullet' },
    faction: 'ALLIED', description: 'Basic infantry.',
  },
  conscript: {
    name: 'Conscript', cost: 100, hp: 100, speed: 2, sight: 5,
    buildTime: 3, prerequisite: ['barracks'], type: 'infantry',
    weapon: { damage: 12, range: 4, rate: 0.25, type: 'bullet' },
    faction: 'SOVIET', description: 'Cheap basic infantry.',
  },
  engineer: {
    name: 'Engineer', cost: 500, hp: 75, speed: 2, sight: 4,
    buildTime: 8, prerequisite: ['barracks'], type: 'infantry',
    weapon: null, canCapture: true,
    description: 'Captures enemy buildings.',
  },
  spy: {
    name: 'Spy', cost: 1000, hp: 100, speed: 2.5, sight: 6,
    buildTime: 12, prerequisite: ['battle_lab'], type: 'infantry',
    weapon: null, canDisguise: true,
    faction: 'ALLIED', description: 'Infiltrates enemy buildings.',
  },
  seal: {
    name: 'Navy SEAL', cost: 1000, hp: 150, speed: 3, sight: 6,
    buildTime: 12, prerequisite: ['battle_lab'], type: 'infantry',
    weapon: { damage: 35, range: 5, rate: 0.2, type: 'bullet' },
    canSwim: true, faction: 'ALLIED', description: 'Elite commando.',
  },
  tesla_trooper: {
    name: 'Tesla Trooper', cost: 500, hp: 200, speed: 1.5, sight: 5,
    buildTime: 10, prerequisite: ['radar_tower'], type: 'infantry',
    weapon: { damage: 50, range: 3, rate: 1, type: 'electric' },
    faction: 'SOVIET', description: 'Armored electric soldier.',
  },
  crazy_ivan: {
    name: 'Crazy Ivan', cost: 600, hp: 125, speed: 2, sight: 5,
    buildTime: 8, prerequisite: ['radar_tower'], type: 'infantry',
    weapon: { damage: 200, range: 1, rate: 3, type: 'bomb' },
    faction: 'SOVIET', description: 'Plants bombs on units and buildings.',
  },
  // Vehicles
  grizzly: {
    name: 'Grizzly Tank', cost: 700, hp: 400, speed: 4, sight: 6,
    buildTime: 15, prerequisite: ['war_factory'], type: 'vehicle',
    weapon: { damage: 60, range: 5, rate: 1, type: 'shell' },
    faction: 'ALLIED', description: 'Medium battle tank.',
  },
  rhino: {
    name: 'Rhino Tank', cost: 900, hp: 500, speed: 3.5, sight: 6,
    buildTime: 18, prerequisite: ['war_factory'], type: 'vehicle',
    weapon: { damage: 80, range: 5.5, rate: 1.2, type: 'shell' },
    faction: 'SOVIET', description: 'Heavy battle tank.',
  },
  ifv: {
    name: 'IFV', cost: 600, hp: 200, speed: 5, sight: 7,
    buildTime: 10, prerequisite: ['war_factory'], type: 'vehicle',
    weapon: { damage: 40, range: 6, rate: 0.8, type: 'missile', antiAir: true },
    faction: 'ALLIED', description: 'Fast anti-air vehicle.',
  },
  flak_track: {
    name: 'Flak Track', cost: 500, hp: 180, speed: 5, sight: 7,
    buildTime: 10, prerequisite: ['war_factory'], type: 'vehicle',
    weapon: { damage: 30, range: 6, rate: 0.5, type: 'flak', antiAir: true },
    faction: 'SOVIET', description: 'Fast anti-air vehicle.',
  },
  mirage: {
    name: 'Mirage Tank', cost: 1000, hp: 300, speed: 3.5, sight: 7,
    buildTime: 20, prerequisite: ['battle_lab'], type: 'vehicle',
    weapon: { damage: 70, range: 6, rate: 1.5, type: 'laser' },
    canCloak: true, faction: 'ALLIED', description: 'Disguises as tree.',
  },
  prism: {
    name: 'Prism Tank', cost: 1200, hp: 200, speed: 3, sight: 8,
    buildTime: 22, prerequisite: ['battle_lab'], type: 'vehicle',
    weapon: { damage: 120, range: 8, rate: 2.5, type: 'laser' },
    faction: 'ALLIED', description: 'Long-range laser tank.',
  },
  apocalypse: {
    name: 'Apocalypse Tank', cost: 1750, hp: 800, speed: 2.5, sight: 6,
    buildTime: 35, prerequisite: ['battle_lab'], type: 'vehicle',
    weapon: { damage: 120, range: 6, rate: 1.5, type: 'shell' },
    weapon2: { damage: 80, range: 8, rate: 2, type: 'missile', antiAir: true },
    faction: 'SOVIET', description: 'Ultimate heavy tank.',
  },
  v3_launcher: {
    name: 'V3 Rocket Launcher', cost: 800, hp: 150, speed: 2, sight: 5,
    buildTime: 15, prerequisite: ['radar_tower'], type: 'vehicle',
    weapon: { damage: 200, range: 14, rate: 5, type: 'rocket', splash: 2 },
    faction: 'SOVIET', description: 'Long-range rocket artillery.',
  },
  harvester: {
    name: 'Ore Miner', cost: 1400, hp: 600, speed: 2.5, sight: 4,
    buildTime: 20, prerequisite: ['refinery'], type: 'vehicle',
    weapon: null, isHarvester: true,
    description: 'Collects ore and gems.',
  },
  // Air
  harrier: {
    name: 'Harrier', cost: 1200, hp: 200, speed: 10, sight: 8,
    buildTime: 15, prerequisite: ['air_force_command'], type: 'air',
    weapon: { damage: 100, range: 1, rate: 0.5, type: 'missile', strikes: 2 },
    faction: 'ALLIED', description: 'Fighter-bomber aircraft.',
  },
  kirov: {
    name: 'Kirov Airship', cost: 2000, hp: 2000, speed: 2, sight: 8,
    buildTime: 45, prerequisite: ['battle_lab'], type: 'air',
    weapon: { damage: 250, range: 1, rate: 1, type: 'bomb', splash: 2 },
    faction: 'SOVIET', description: 'Heavy bombing airship.',
  },
  // Naval
  destroyer: {
    name: 'Destroyer', cost: 1000, hp: 600, speed: 4, sight: 8,
    buildTime: 20, prerequisite: ['naval_yard'], type: 'naval',
    weapon: { damage: 70, range: 7, rate: 1, type: 'shell' },
    faction: 'ALLIED', description: 'Anti-ship and anti-sub vessel.',
  },
  typhoon: {
    name: 'Typhoon Sub', cost: 1000, hp: 400, speed: 3, sight: 6,
    buildTime: 20, prerequisite: ['naval_yard'], type: 'naval',
    weapon: { damage: 80, range: 6, rate: 2, type: 'torpedo' },
    canSubmerge: true, faction: 'SOVIET', description: 'Attack submarine.',
  },
};
