# Red Alert 2 - Browser Clone: Development Log

Complete record of every step, decision, and parameter used to build this game.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Step-by-Step Build Log](#step-by-step-build-log)
3. [Core Configuration Parameters](#core-configuration-parameters)
4. [Terrain System](#terrain-system)
5. [Faction & Country System](#faction--country-system)
6. [Building Parameters](#building-parameters)
7. [Unit Parameters](#unit-parameters)
8. [Combat System](#combat-system)
9. [AI System](#ai-system)
10. [Map Generation](#map-generation)
11. [Pathfinding](#pathfinding)
12. [Fog of War](#fog-of-war)
13. [Rendering & Sprites](#rendering--sprites)
14. [Input & Controls](#input--controls)
15. [Sound System](#sound-system)
16. [Networking / Multiplayer](#networking--multiplayer)
17. [UI System](#ui-system)
18. [Map Editor](#map-editor)
19. [Room Setup & Country Selection](#room-setup--country-selection)
20. [Chat System](#chat-system)
21. [File Structure](#file-structure)

---

## Architecture Overview

### Technology Decisions
- **Language:** Vanilla JavaScript (no frameworks, no build tools)
- **Rendering:** HTML5 Canvas 2D with isometric projection
- **Audio:** Web Audio API with procedurally generated sounds (no audio files)
- **Sprites:** SVG-based, generated inline via JavaScript functions (no image files)
- **Networking:** WebRTC peer-to-peer with BroadcastChannel signaling
- **Pathfinding:** A* with binary heap priority queue and path smoothing
- **Game loop:** requestAnimationFrame at 60fps render, 20 tick/sec fixed-step simulation
- **Topology:** Star (host connects to all clients)
- **No external dependencies:** Zero npm packages, zero CDN links

### Why These Choices
- Single HTML file + JS scripts = zero build complexity, instant deployment
- SVG sprites avoid asset loading, scale perfectly, and are team-colorable
- WebRTC avoids needing a server for gameplay (signaling uses BroadcastChannel for same-browser testing)
- Procedural audio avoids loading sound files and keeps the project self-contained
- Fixed-step simulation ensures deterministic gameplay across different frame rates

---

## Step-by-Step Build Log

### Commit 1: Initial Game Implementation
**Files created:** `index.html`, `js/sprites.js`, `js/config.js`, `js/map.js`, `js/pathfinding.js`, `js/entities.js`, `js/combat.js`, `js/resources.js`, `js/fog.js`, `js/ai.js`, `js/ui.js`, `js/input.js`, `js/renderer.js`, `js/network.js`, `js/mapeditor.js`, `js/sound.js`, `js/game.js`

**Steps taken:**
1. Designed the isometric tile grid system (60x30 pixel diamond tiles)
2. Defined all terrain types (grass, water, ore, gem, rock, sand, concrete, bridge, cliff, tree)
3. Implemented the GameMap class with random procedural generation
4. Built the A* pathfinder with binary heap, 8-directional movement, diagonal wall prevention, and path smoothing via line-of-sight
5. Created the Entity system (units + buildings) with full property sets
6. Created the EntityManager with indexed lookups (by player, by type, spatial queries)
7. Defined all 17 buildings with costs, power, HP, size, build time, prerequisites, weapons, and faction locks
8. Defined all 17 units with costs, HP, speed, sight, weapons, abilities, and faction locks
9. Implemented the Player class with credits, power tracking, build prerequisites, faction filtering
10. Built the combat system with projectile physics, damage modifiers, splash damage, and visual effects
11. Implemented fog of war (unexplored / explored / visible states)
12. Created the AI bot system with 4 difficulty levels, build orders, attack logic, harvester management, base defense
13. Built the isometric renderer with terrain, entities, projectiles, effects, health bars, selection indicators, minimap
14. Implemented input handling: left-click select, right-click command, box select, control groups, keyboard shortcuts
15. Created the sidebar UI with build tabs (Structures, Defense, Infantry, Vehicles), production queue display
16. Built the resource bar (credits, power, unit count, FPS)
17. Implemented the WebRTC networking layer with room codes, offer/answer/ICE exchange, command sync
18. Created SVG sprite definitions for all units and buildings (team-colorable)
19. Built the map editor with terrain painting and spawn point placement
20. Implemented the procedural sound system with Web Audio API
21. Created the main menu with Skirmish, Multiplayer, Map Editor, Quick Match, Massive Battle options
22. Wired up the game loop with fixed-step simulation, rendering, AI updates

### Commit 2: Username Limit & Chat
**Changes:**
1. Added 10-character `maxlength` to the player name input
2. Implemented broadcast text chat system:
   - Chat log with 100-message rolling buffer
   - Enter key toggles chat focus
   - Messages broadcast via WebRTC data channel
   - System messages (italic, gray) vs player messages (team-colored name)
   - Chat input prevents game hotkey interference (stopPropagation)

### Commit 3: Country Selection & Room Setup
**Changes:**
1. Added 9 country definitions (5 Allied, 4 Soviet) to config.js with unique bonuses
2. Extended Player class with `country`, `countryDef`, `countryName` properties
3. Redesigned skirmish setup UI:
   - Country selector (determines faction automatically)
   - Human player seats slider (1-8)
   - Bot seats slider (0-99)
   - Country enable/disable checkboxes (controls bot country pool)
   - Country bonus descriptions shown in UI
4. Updated startSkirmish to create open human slots (AI-controlled placeholders) and assign bot countries from the enabled pool

### Commit 4: Game Speed & Multiplayer Country Selection
**Changes:**
1. Added `GAME_SPEED` to CONFIG (default 1.0, range 0.5x-1.5x)
2. Applied game speed multiplier in `_updateGame()` — multiplies delta time before feeding into fixed-step simulation accumulator, so all game systems (movement, combat, AI, building, harvesting) scale uniformly
3. Added game speed slider (0.5x to 1.5x, step 0.1) to skirmish setup UI
4. Completely redesigned multiplayer setup UI:
   - Replaced simple "Faction" dropdown with full "Your Country" selector (same as skirmish)
   - Added country bonus description display
   - Added enabled countries checkbox grid (Allied + Soviet columns)
   - Added game speed slider
   - Host and join buttons apply game speed + country settings before connecting
5. Decision: Game speed works by scaling the simulation dt, not the tick rate — this means at 0.5x everything runs at half speed (units move slower, buildings build slower, AI thinks at same intervals but game time passes slower), and at 1.5x everything runs 50% faster

---

## Core Configuration Parameters

```
TILE_WIDTH:           60          pixels (isometric diamond width)
TILE_HEIGHT:          30          pixels (isometric diamond height)
MAP_DEFAULT_WIDTH:    128         tiles
MAP_DEFAULT_HEIGHT:   128         tiles
CAMERA_SPEED:         8           tiles/sec
CAMERA_EDGE_SCROLL:   30          pixels from edge to trigger scroll
ZOOM_MIN:             0.3
ZOOM_MAX:             2.0
ZOOM_STEP:            0.1
MAX_PLAYERS:          100
MAX_UNITS_PER_PLAYER: 200
STARTING_CREDITS:     5000        (configurable: 5000/10000/25000/50000)
ORE_VALUE:            25          credits per ore unit
GEM_VALUE:            75          credits per gem unit
HARVESTER_CAPACITY:   20          ore units
HARVESTER_GATHER_RATE:0.5         ore units per second
FOG_ENABLED:          true
TICK_RATE:            20          simulation ticks per second
RENDER_FPS:           60          frames per second
GAME_SPEED:           1.0         multiplier (range: 0.5x to 1.5x, step 0.1)
```

### Map Size Options
| Label | Size | Best For |
|-------|------|----------|
| Small | 48x48 | 2-4 players |
| Medium | 64x64 | 4-8 players |
| Large | 96x96 | 8-20 players (default) |
| Huge | 128x128 | 20-100 players |

### Team Colors
20 predefined hex colors for first 20 players, then auto-generated HSL colors for players 21-100:
```
#e63946, #457b9d, #2a9d8f, #e9c46a, #f4a261,
#264653, #023e8a, #9d4edd, #ff6b6b, #4ecdc4,
#ff9f1c, #6a994e, #bc4749, #5f0f40, #0b525b,
#3a0ca3, #7209b7, #f72585, #4361ee, #4cc9f0
```
Extended colors: `hsl((i * 37) % 360, 70%, 50%)` for i >= 20

---

## Terrain System

| ID | Name | Color | Walkable | Buildable | Notes |
|----|------|-------|----------|-----------|-------|
| 0 | Grass | #3a6b35 | Yes | Yes | Default terrain |
| 1 | Water | #1a3a6b | No | No | Naval units only |
| 2 | Ore | #8a7a3a | Yes | No | 100 ore per tile |
| 3 | Gem | #5a3a8a | Yes | No | 200 ore per tile |
| 4 | Rock | #5a5a5a | No | No | Impassable obstacle |
| 5 | Sand | #c2a64e | Yes | Yes | Walkable variant |
| 6 | Concrete | #777 | Yes | Yes | Built foundation |
| 7 | Bridge | #6a5a3a | Yes | No | Over water |
| 8 | Cliff | #4a3a2a | No | No | Elevated obstacle |
| 9 | Tree | #2a5a25 | No | No | Rendered with SVG sprite |

### Buildable surfaces: Grass, Sand, Concrete (plus must not be occupied)

---

## Faction & Country System

### Factions

| Faction | Power Building | Basic Infantry | Main Tank | Advanced Defense | Special Building |
|---------|---------------|----------------|-----------|-----------------|-----------------|
| Allied | Power Plant ($800, +200 power) | GI ($200) | Grizzly ($700) | Prism Tower ($1500) | Ore Purifier (+25% ore) |
| Soviet | Tesla Reactor ($600, +150 power) | Conscript ($100) | Rhino ($900) | Tesla Coil ($1500) | Industrial Plant (-25% vehicle cost) |

### Allied Buildings
`construction_yard, power_plant, barracks, refinery, war_factory, air_force_command, naval_yard, battle_lab, ore_purifier, wall, pillbox, prism_tower, patriot`

### Soviet Buildings
`construction_yard, tesla_reactor, barracks, refinery, war_factory, radar_tower, naval_yard, battle_lab, industrial_plant, wall, sentry_gun, tesla_coil, flak_cannon`

### Allied Units
`gi, engineer, spy, seal, grizzly, ifv, mirage, prism, harrier, destroyer, harvester`

### Soviet Units
`conscript, engineer, tesla_trooper, crazy_ivan, rhino, flak_track, apocalypse, v3_launcher, kirov, typhoon, harvester`

### Countries (Subfactions)

#### Allied Countries

| Country | Color | Bonus Unit | Bonus Effect |
|---------|-------|------------|--------------|
| America | #3366cc | GI | GIs have +25% HP |
| Korea | #cc6633 | Harrier | Harriers deal +30% damage |
| France | #6633cc | Prism Tower | Prism Towers have +50% range |
| Germany | #666666 | Grizzly Tank | Grizzly Tanks deal +20% damage |
| Great Britain | #cc3333 | Navy SEAL | Navy SEALs have +40% range |

#### Soviet Countries

| Country | Color | Bonus Unit | Bonus Effect |
|---------|-------|------------|--------------|
| Russia | #cc0000 | Tesla Coil | Tesla Coils deal +25% damage |
| Cuba | #33cc33 | Crazy Ivan | Crazy Ivan bombs deal +30% damage |
| Iraq | #cccc33 | Tesla Trooper | Tesla Troopers have +30% HP |
| Libya | #cc6600 | V3 Launcher | V3 Launchers deal +25% damage |

---

## Building Parameters

### Shared Buildings (Both Factions)

| Building | Cost | Power | HP | Size | Sight | Build Time | Prerequisites | Notes |
|----------|------|-------|----|------|-------|-----------|---------------|-------|
| Construction Yard | 0 | 0 | 1000 | 3x3 | 8 | 0s | — | Main base, can't be built |
| Barracks | 500 | -20 | 500 | 2x2 | 5 | 12s | Construction Yard | Trains infantry |
| Ore Refinery | 2000 | -50 | 900 | 3x3 | 5 | 30s | Construction Yard | Gives free harvester |
| War Factory | 2000 | -50 | 1000 | 3x3 | 5 | 30s | Refinery | Builds vehicles |
| Naval Yard | 1000 | -30 | 800 | 3x3 | 6 | 25s | War Factory | Requires nearby water |
| Battle Lab | 2000 | -100 | 500 | 2x2 | 5 | 40s | War Factory | Unlocks advanced tech |
| Wall | 100 | 0 | 300 | 1x1 | 1 | 2s | Barracks | Basic barrier |

### Allied-Only Buildings

| Building | Cost | Power | HP | Size | Sight | Build Time | Prerequisites | Weapon |
|----------|------|-------|----|------|-------|-----------|---------------|--------|
| Power Plant | 800 | +200 | 750 | 2x2 | 4 | 15s | Construction Yard | — |
| Air Force Command | 1000 | -50 | 600 | 2x2 | 8 | 20s | War Factory | — |
| Ore Purifier | 2500 | -200 | 900 | 3x3 | 4 | 45s | Battle Lab | — (+25% ore income) |
| Pillbox | 500 | -10 | 400 | 1x1 | 6 | 10s | Barracks | 20 dmg, 5 rng, 0.5s rate, bullet |
| Prism Tower | 1500 | -75 | 600 | 1x1 | 8 | 25s | Air Force Command | 100 dmg, 7 rng, 2s rate, laser |
| Patriot Missile | 1000 | -50 | 500 | 1x1 | 10 | 15s | Air Force Command | 80 dmg, 10 rng, 1.5s rate, missile (anti-air) |

### Soviet-Only Buildings

| Building | Cost | Power | HP | Size | Sight | Build Time | Prerequisites | Weapon |
|----------|------|-------|----|------|-------|-----------|---------------|--------|
| Tesla Reactor | 600 | +150 | 600 | 2x2 | 4 | 12s | Construction Yard | — |
| Radar Tower | 1000 | -50 | 600 | 2x2 | 10 | 20s | War Factory | — (reveals map) |
| Industrial Plant | 2500 | -200 | 900 | 3x3 | 4 | 45s | Battle Lab | — (-25% vehicle cost) |
| Sentry Gun | 500 | -10 | 400 | 1x1 | 6 | 10s | Barracks | 25 dmg, 5 rng, 0.4s rate, bullet |
| Tesla Coil | 1500 | -75 | 600 | 1x1 | 8 | 25s | Radar Tower | 110 dmg, 6 rng, 2.5s rate, electric |
| Flak Cannon | 1000 | -50 | 500 | 1x1 | 8 | 15s | Radar Tower | 60 dmg, 8 rng, 0.8s rate, flak (anti-air) |

---

## Unit Parameters

### Infantry

| Unit | Faction | Cost | HP | Speed | Sight | Build Time | Prerequisites | Weapon | Special |
|------|---------|------|----|-------|-------|-----------|---------------|--------|---------|
| GI | Allied | 200 | 125 | 2 | 5 | 5s | Barracks | 15 dmg, 4 rng, 0.3s, bullet | — |
| Conscript | Soviet | 100 | 100 | 2 | 5 | 3s | Barracks | 12 dmg, 4 rng, 0.25s, bullet | — |
| Engineer | Both | 500 | 75 | 2 | 4 | 8s | Barracks | None | canCapture |
| Spy | Allied | 1000 | 100 | 2.5 | 6 | 12s | Battle Lab | None | canDisguise |
| Navy SEAL | Allied | 1000 | 150 | 3 | 6 | 12s | Battle Lab | 35 dmg, 5 rng, 0.2s, bullet | canSwim |
| Tesla Trooper | Soviet | 500 | 200 | 1.5 | 5 | 10s | Radar Tower | 50 dmg, 3 rng, 1s, electric | — |
| Crazy Ivan | Soviet | 600 | 125 | 2 | 5 | 8s | Radar Tower | 200 dmg, 1 rng, 3s, bomb | — |

### Vehicles

| Unit | Faction | Cost | HP | Speed | Sight | Build Time | Prerequisites | Weapon | Special |
|------|---------|------|----|-------|-------|-----------|---------------|--------|---------|
| Grizzly Tank | Allied | 700 | 400 | 4 | 6 | 15s | War Factory | 60 dmg, 5 rng, 1s, shell | — |
| Rhino Tank | Soviet | 900 | 500 | 3.5 | 6 | 18s | War Factory | 80 dmg, 5.5 rng, 1.2s, shell | — |
| IFV | Allied | 600 | 200 | 5 | 7 | 10s | War Factory | 40 dmg, 6 rng, 0.8s, missile | Anti-air |
| Flak Track | Soviet | 500 | 180 | 5 | 7 | 10s | War Factory | 30 dmg, 6 rng, 0.5s, flak | Anti-air |
| Mirage Tank | Allied | 1000 | 300 | 3.5 | 7 | 20s | Battle Lab | 70 dmg, 6 rng, 1.5s, laser | canCloak |
| Prism Tank | Allied | 1200 | 200 | 3 | 8 | 22s | Battle Lab | 120 dmg, 8 rng, 2.5s, laser | — |
| Apocalypse Tank | Soviet | 1750 | 800 | 2.5 | 6 | 35s | Battle Lab | Primary: 120 dmg, 6 rng, 1.5s, shell; Secondary: 80 dmg, 8 rng, 2s, missile (anti-air) | Dual weapons |
| V3 Launcher | Soviet | 800 | 150 | 2 | 5 | 15s | Radar Tower | 200 dmg, 14 rng, 5s, rocket | Splash radius 2 |
| Ore Miner | Both | 1400 | 600 | 2.5 | 4 | 20s | Refinery | None | isHarvester, capacity 20 |

### Air

| Unit | Faction | Cost | HP | Speed | Sight | Build Time | Prerequisites | Weapon | Special |
|------|---------|------|----|-------|-------|-----------|---------------|--------|---------|
| Harrier | Allied | 1200 | 200 | 10 | 8 | 15s | Air Force Command | 100 dmg, 1 rng, 0.5s, missile | 2 strikes |
| Kirov Airship | Soviet | 2000 | 2000 | 2 | 8 | 45s | Battle Lab | 250 dmg, 1 rng, 1s, bomb | Splash radius 2 |

### Naval

| Unit | Faction | Cost | HP | Speed | Sight | Build Time | Prerequisites | Weapon | Special |
|------|---------|------|----|-------|-------|-----------|---------------|--------|---------|
| Destroyer | Allied | 1000 | 600 | 4 | 8 | 20s | Naval Yard | 70 dmg, 7 rng, 1s, shell | — |
| Typhoon Sub | Soviet | 1000 | 400 | 3 | 6 | 20s | Naval Yard | 80 dmg, 6 rng, 2s, torpedo | canSubmerge |

---

## Combat System

### Projectile Speeds (tiles/sec)
| Type | Speed | Notes |
|------|-------|-------|
| bullet | 0 (instant) | Hit scan |
| electric | 0 (instant) | Hit scan |
| laser | 0 (instant) | Hit scan |
| flak | 0 (instant) | Hit scan |
| shell | 15 | Tracked to target |
| missile | 12 | Tracked to target |
| rocket | 8 | Tracked, long range |
| torpedo | 6 | Tracked, water only |
| bomb | 5 | Tracked, air-to-ground |

### Damage Modifiers
| Attacker Weapon | Target Type | Multiplier |
|----------------|-------------|------------|
| shell, bomb | infantry | 1.5x (explosive bonus) |
| bullet | vehicle | 0.5x (bullet resistance) |
| non-missile, non-anti-air | air | 0.1x (can barely hit) |
| anti-air weapons | air | 1.0x (normal) |

### Splash Damage
- Applies to weapons with `splash` property (V3: radius 2, Kirov: radius 2)
- Damage = base damage * (1 - distance/splash_radius) * 0.5
- No friendly fire on splash
- Projectiles that miss their target still apply splash at impact location

### Death Effects
- Buildings: 1.0s explosion, size 2
- Units: 0.5s explosion, size 1
- Projectile ground hit: 0.3s explosion, size 0.5

---

## AI System

### Difficulty Settings

| Setting | Build Interval | Attack Interval | Credit Bonus/sec |
|---------|---------------|-----------------|-------------------|
| Easy | 5.0s | 120s | 0 |
| Medium | 3.0s | 80s | 5 |
| Hard | 1.5s | 45s | 15 |
| Brutal | 0.8s | 30s | 30 |

### Build Order (8 Steps)
1. Power Plant / Tesla Reactor
2. Barracks
3. Refinery
4. Train 3x infantry (random available infantry)
5. War Factory
6. Train 2x vehicles (random available vehicles)
7. Additional power building
8. Train 5x vehicles

### AI Behavior After Build Order
- **Unit production:** Continues building combat units (prefers armed units) up to MAX_UNITS_PER_PLAYER
- **Defense construction:** 30% chance per build tick to add Pillbox/Sentry Gun (if 4+ buildings exist)
- **Refinery expansion:** Builds up to 2 refineries (if credits > 3000)
- **Power management:** Prioritizes power buildings when in deficit
- **Attack logic:** Sends 60% of combat units to a random enemy building when 5+ combat units available
- **Harvester management:** Redirects idle harvesters to nearest ore
- **Base defense:** Detects enemies within 15 tiles of base, assigns idle defenders

### AI Building Placement
- Random offset within 16 tiles of base building
- Up to 50 attempts to find valid placement
- Auto-spawns free harvester with refinery (sends to nearest ore)

---

## Map Generation

### Algorithm (GameMap.generateRandom)

1. **Fill with grass** (all tiles start as TERRAIN.GRASS)

2. **Water bodies:** 3-8 bodies
   - Random center position
   - Radius: 4-12 tiles
   - Shape: Circular with noise (dx*dx + dy*dy < radius*radius * (0.5 + random*0.5))

3. **Ore fields:** 8-16 fields
   - Random center position
   - Radius: 3-7 tiles
   - 20% chance to be gems (200 ore) vs regular ore (100 ore)
   - Only placed on grass tiles

4. **Rock/cliff areas:** 5-11 areas
   - Random center position
   - Radius: 2-6 tiles
   - 50/50 rock vs cliff
   - Only placed on grass tiles

5. **Forests:** 6-14 forests
   - Random center position
   - Radius: 3-8 tiles
   - Only placed on grass tiles

6. **Spawn points:** One per player
   - Margin: 10 tiles from edges
   - Minimum distance: 20 tiles (Manhattan) from other spawns
   - Clear 5x5 area check (no water/ore/rocks)
   - Clears 7x7 area around spawn to grass
   - Auto-generates ore field 8-12 tiles away from each spawn (radius ~3)
   - Up to 1000 attempts per spawn point
   - Fallback: grid placement at (margin + p*15, margin + p*15)

### Seeded Random
Linear congruential generator: `s = (s * 1103515245 + 12345) & 0x7FFFFFFF`

---

## Pathfinding

### Algorithm: A* with Binary Heap

- **8-directional movement:** Cardinal cost 1.0, diagonal cost 1.41
- **Max iterations:** 2000 (prevents lag on impossible paths)
- **Diagonal wall prevention:** Can't cut through two adjacent walls diagonally

### Passability Rules by Unit Type
| Unit Type | Passable Terrain |
|-----------|-----------------|
| vehicle | All walkable terrain (not water, rock, cliff, tree) |
| naval | Water only |
| air | All terrain (unrestricted) |
| amphibious | Everything except rock and cliff |

### Path Smoothing
After A* finds a path, line-of-sight smoothing removes unnecessary waypoints:
1. Start at first waypoint
2. Find the furthest waypoint with clear line of sight (Bresenham's line)
3. Skip all intermediate waypoints
4. Repeat until end

### Nearest Passable Fallback
If target tile is impassable, searches outward in expanding rings (radius 1-9) for the nearest passable tile.

---

## Fog of War

### Three States
| State | Value | Meaning |
|-------|-------|---------|
| Unexplored | 0 | Never seen, not rendered |
| Explored | 1 | Previously seen, rendered darkened (50% black overlay) |
| Visible | 2 | Currently in sight, fully rendered |

### Update Cycle (Every Tick)
1. Reset all visible tiles (2) to explored (1)
2. For each entity owned by local player:
   - Reveal circle of radius `entity.sight` tiles
   - Set all tiles in circle to visible (2)

### Performance
- Uses `Uint8Array` for fog and visibility grids
- Bounds-clamped circle iteration (no out-of-bounds checks per pixel)

---

## Rendering & Sprites

### Isometric Projection
```
Tile to World:
  wx = (tx - ty) * (TILE_WIDTH / 2)
  wy = (tx + ty) * (TILE_HEIGHT / 2)

World to Tile:
  tx = floor(wx / TILE_WIDTH + wy / TILE_HEIGHT)
  ty = floor(wy / TILE_HEIGHT - wx / TILE_WIDTH)

World to Screen:
  sx = (wx - camera.x) * zoom + screenW / 2
  sy = (wy - camera.y) * zoom + screenH / 2
```

### Render Order
1. Terrain tiles (sorted by tile position, skipping unexplored)
2. Buildings (sorted by tileX + tileY for depth)
3. Units (sorted by x + y for depth)
4. Projectiles
5. Effects (explosions, muzzle flashes, hit markers, move markers)
6. Selection box (if dragging)
7. Building placement ghost (if placing)
8. Minimap (separate canvas)

### Entity Rendering
- **Sprites:** SVG-based, pre-rendered to offscreen canvas via SpriteCache
- **Team coloring:** SVG functions accept a color parameter
- **Buildings:** Size = 32 * def.size * zoom
- **Infantry:** 32x32 * zoom
- **Vehicles:** 40x28 * zoom
- **Air:** 36x36 * zoom
- **Ghost buildings** (explored but not visible): 40% opacity
- **Damage flash:** 50% white overlay for 0.15 seconds when hit
- **Construction progress:** Dark overlay over unbuilt portion + green progress bar
- **Health bar:** Shown when damaged or selected (green > 50%, yellow > 25%, red otherwise)
- **Selection indicator:** Green rectangle (buildings) or green ellipse (units)
- **Harvester ore bar:** Orange bar below unit when carrying ore
- **Vehicle turret:** Gray line showing facing direction

### Minimap
- 200x160 pixel canvas
- Scales map to fit with aspect ratio preserved
- Terrain rendered at low resolution (skips tiles if scale < 1)
- Entities shown as colored dots (buildings = 3px, units = 2px)
- Camera viewport shown as white rectangle
- Click to move camera

### Tile Rendering Details
- Isometric diamond shape (4 points)
- Subtle grid lines (rgba(0,0,0,0.15), 0.5px)
- Ore/gem: Colored overlay + 3 crystal shapes per tile
- Trees: SVG sprite or fallback (green circle + brown trunk)
- Fog darkening: 50% black overlay on explored-but-not-visible tiles

### Effect Types
| Effect | Duration | Visual |
|--------|----------|--------|
| explosion | 0.5-1.0s | Expanding circles: yellow core, orange mid, red outer |
| hit | 0.15s | Yellow dot, fading |
| muzzle_flash | 0.1s | Yellow-white flash at attacker |
| move_marker | 0.5s | Expanding green circle at destination |

---

## Input & Controls

### Mouse
| Action | Effect |
|--------|--------|
| Left click (empty) | Deselect all |
| Left click (own entity) | Select entity (Shift: add to selection) |
| Left click (enemy, with selection) | Attack-move to enemy |
| Left drag | Box select own units (prefers units over buildings) |
| Right click (ground) | Move selected units (formation: sqrt grid) |
| Right click (enemy) | Attack target |
| Right click (while placing) | Cancel building placement |
| Scroll wheel | Zoom in/out |
| Edge scrolling | Pan camera (30px threshold) |

### Keyboard
| Key | Action |
|-----|--------|
| Arrow keys | Pan camera |
| WASD + Ctrl | Pan camera |
| 1-9 | Recall control group |
| Ctrl+1-9 | Set control group |
| Enter | Toggle chat |
| Escape | Cancel placement or deselect |
| S | Stop selected units |
| Delete | Self-destruct selected units |
| H | Select all harvesters |
| Q | Select all combat units |
| F | Focus camera on first selected entity |
| Shift+click | Multi-select / keep placement |

### Touch Support
- Single touch start = drag start
- Single touch move = box select
- Touch end = select or box select

### Building Placement
1. Click build button in sidebar
2. Mouse shows green/red footprint overlay
3. Left click to place (if valid)
4. Must be within 15 tiles (Manhattan) of existing buildings
5. Shift+click keeps placement mode active

---

## Sound System

### Procedural Audio (Web Audio API)
All sounds generated from oscillators and white noise buffers. No audio files.

### Attack Sounds
| Weapon Type | Components |
|-------------|-----------|
| bullet | Noise 0.05s + 800Hz square 0.03s |
| shell | Noise 0.15s + 150Hz sawtooth 0.1s |
| missile | 600Hz sawtooth 0.2s + 400Hz sine 0.3s |
| laser | 1200Hz sine 0.15s + 1800Hz sine 0.1s |
| electric | 100Hz sawtooth 0.2s + noise 0.1s |
| flak | Noise 0.08s + 300Hz square 0.05s |
| bomb | Noise 0.3s + 80Hz sine 0.4s |
| rocket | 200Hz sawtooth 0.3s |
| torpedo | 100Hz sine 0.4s |

### Voice Cues
| Cue | Sound Pattern |
|-----|--------------|
| acknowledged | 300Hz sine 0.1s -> 400Hz sine 0.1s |
| attacking | 400Hz square -> 500Hz -> 600Hz (escalating) |
| construction_complete | 440Hz -> 550Hz -> 660Hz (fanfare) |
| unit_ready | 500Hz -> 600Hz (rising) |
| insufficient_funds | 200Hz -> 150Hz (descending, somber) |

### Other Sounds
- **Select:** 600Hz sine 0.08s
- **Build placed:** 400Hz sine -> 600Hz sine (rising)
- **Error:** 200Hz square 0.15s
- **Explosion (building):** Noise 0.5s + 60Hz sine 0.6s + 40Hz sine 0.8s
- **Explosion (unit):** Noise 0.3s + 100Hz sine 0.3s

### Audio Parameters
- Master volume: 0.3
- Envelope: exponentialRampToValueAtTime for decay
- AudioContext initialized on first user interaction

---

## Networking / Multiplayer

### Architecture
- **Topology:** Star (host = player 0, all clients connect to host)
- **Protocol:** WebRTC RTCDataChannel (ordered, reliable)
- **Signaling:** BroadcastChannel API (same-browser) with localStorage fallback

### Room Codes
- 6-character alphanumeric: `Math.random().toString(36).substring(2, 8).toUpperCase()`

### ICE Servers
```
stun:stun.l.google.com:19302
stun:stun1.l.google.com:19302
```

### Message Types
| Type | Direction | Purpose |
|------|-----------|---------|
| join | Client -> Broadcast | Request to join room |
| offer | Host -> Client | WebRTC SDP offer |
| answer | Client -> Host | WebRTC SDP answer |
| ice-candidate | Bidirectional | NAT traversal candidates |
| welcome | Host -> Client | Assigns playerId, sends game state |
| command | Bidirectional | Game actions (move, attack, build, chat) |
| sync | Host -> Clients | Periodic entity/credit state sync |
| tick | Bidirectional | Tick acknowledgment |

### Chat over Network
- Chat messages sent as `command` type with `{ type: 'chat', name, color, text }`
- Host rebroadcasts chat to all other peers
- Handled separately from game commands (not queued for simulation)

### State Serialization
Game state includes: map (tiles, ore, spawn points), players (id, name, faction, color, credits, isBot), tick number.

---

## UI System

### Resource Bar (top, 32px height)
- Credits display
- Power display (green if OK, red if low power)
- Unit count / max
- FPS counter (right-aligned)

### Sidebar (right, 200px width)
#### Tabs
1. **Structures** — Non-defense buildings (excludes construction_yard)
2. **Defense** — wall, pillbox, sentry_gun, prism_tower, tesla_coil, patriot, flak_cannon
3. **Infantry** — Infantry-type units
4. **Vehicles** — Vehicle, air, and naval units

#### Build Buttons
- SVG sprite preview (team-colored)
- Name label
- Cost label (gold text)
- Click: buildings enter placement mode, units queue at appropriate producer
- Disabled state (40% opacity) if can't afford or missing prerequisites
- Error messages: "Insufficient funds" or "Prerequisites not met"

#### Production Queue
- Shows currently building items with progress bars
- Auto-refreshes every 2 seconds

### Selection Info (bottom center, 80px height)
- **Single selection:** Portrait (SVG), name, HP bar (120px wide), weapon stats, harvester ore bar, current production
- **Multi-selection:** Grid of 36x36 thumbnails (max 20 shown, "+N more" for excess), click to focus camera

### Minimap (bottom-left, 200x160px)
- See Rendering section for details

### Notifications (top-center)
- Gold-bordered black boxes
- 3-second duration with fade-out animation
- Used for: game events, build completion, defeat/victory, errors

### Tooltip
- Hidden by default
- Max 200px width
- Position follows mouse

---

## Map Editor

### Features
- Terrain painting (all 10 terrain types)
- Spawn point placement
- Variable brush sizes
- Load/save maps (serialized)
- Test play from editor (launches skirmish with edited map)

### Activation
- Initializes a 64x64 blank map
- Reveals all fog of war
- Shows editor-specific sidebar tools

---

## Room Setup & Country Selection

### Skirmish Setup UI (game.js: showSetup)

#### Player Configuration
- **Your Name:** Text input, max 10 characters, default "Commander"
- **Your Country:** Dropdown with optgroups (Allied / Soviet), auto-determines faction
- **Country Bonus:** Shown below dropdown in green text

#### Room Seats
- **Human Player Seats:** Range slider 1-8, default 1
  - Additional human slots run as "easy" AI placeholders
  - Marked with `isOpenSlot = true` on player object
- **Bot Seats:** Range slider 0-99, default 3
  - Bots randomly assigned from enabled countries
  - AI difficulty as selected
- **Total players:** Shown dynamically (humans + bots)

#### Enabled Countries
- Checkbox grid split into Allied (5) and Soviet (4) columns
- All enabled by default
- Tooltips show country bonus description
- Fallback: if all unchecked, all countries are enabled
- Bots only assigned countries from the enabled pool

#### Game Settings
- **Map Size:** 48x48 / 64x64 / 96x96 (default) / 128x128
- **AI Difficulty:** Easy / Medium (default) / Hard / Brutal
- **Starting Credits:** 5,000 (default) / 10,000 / 25,000 / 50,000
- **Game Speed:** Range slider 0.5x to 1.5x (step 0.1, default 1.0x)
  - Applies to all simulation: movement, combat, building, AI, harvesting
  - Works by multiplying dt in `_updateGame()` before fixed-step accumulator

### Multiplayer Setup UI (game.js: showMultiplayerSetup)

#### Player Configuration
- **Your Name:** Text input, max 10 characters, default "Commander"
- **Your Country:** Dropdown with optgroups (Allied / Soviet), auto-determines faction
- **Country Bonus:** Shown below dropdown in green text

#### Enabled Countries
- Same checkbox grid as skirmish (Allied + Soviet columns)
- All enabled by default
- Tooltips show country bonus description

#### Game Speed
- Range slider 0.5x to 1.5x (step 0.1, default 1.0x)
- Applied by both host and client on connect

#### Connection
- **Host Game:** Generates room code, applies game speed setting
- **Join Game:** Enter 6-char room code, applies game speed setting
- WebRTC peer-to-peer with BroadcastChannel signaling

### Quick Start
- Quick Match (4 Players): 64x64 map, medium difficulty, 3 bots
- Massive Battle (100 Players): 128x128 map, medium difficulty, 99 bots

---

## Chat System

### Components
- **Chat container:** Positioned at bottom-left (above minimap), 320px wide
- **Chat log:** Max 160px height, scrollable, max 100 messages
- **Chat input:** Text field, max 200 characters
- **Send button:** "Send" label

### Message Types
- **System messages:** Gray italic text (e.g., "Game started. Press Enter to chat.")
- **Player messages:** Team-colored name + white text

### Behavior
- Enter key toggles chat focus (if focused: send + blur, if not: focus)
- Chat input captures keydown/keyup events (stops propagation to prevent game hotkeys)
- Messages broadcast to all peers via network
- Rolling buffer: oldest messages removed when exceeding 100

---

## File Structure

```
red-alert-2/
  index.html          — HTML structure + all CSS (~270 lines)
  js/
    sprites.js        — SVG sprite functions for all units/buildings (~16KB)
    config.js         — CONFIG, TERRAIN, FACTIONS, COUNTRIES, BUILDINGS, UNITS (~392 lines)
    map.js            — GameMap class, random generation, serialization (~286 lines)
    pathfinding.js    — BinaryHeap, Pathfinder with A* and smoothing (~213 lines)
    entities.js       — Entity class, EntityManager (~441 lines)
    combat.js         — CombatSystem, projectiles, damage modifiers (~169 lines)
    resources.js      — Player class, credits, power, prerequisites (~139 lines)
    fog.js            — FogOfWar system (~76 lines)
    ai.js             — AIBot, AIManager, build orders, attack logic (~290 lines)
    ui.js             — GameUI sidebar, build menu, selection info (~281 lines)
    input.js          — InputHandler, mouse/keyboard/touch (~467 lines)
    renderer.js       — Isometric renderer, minimap, effects (~573 lines)
    network.js        — WebRTC NetworkManager (~393 lines)
    mapeditor.js      — MapEditor tools (~varies)
    sound.js          — Procedural SoundSystem (~160 lines)
    game.js           — Game orchestrator, menus, game loop (~812 lines)
```

### Script Load Order (matters — no modules)
1. sprites.js (defines SPRITES object)
2. config.js (defines CONFIG, TERRAIN, FACTIONS, COUNTRIES, BUILDINGS, UNITS)
3. map.js (uses CONFIG, TERRAIN)
4. pathfinding.js (uses TERRAIN, TERRAIN_WALKABLE)
5. entities.js (uses BUILDINGS, UNITS, CONFIG)
6. combat.js (uses entities)
7. resources.js (uses CONFIG, FACTIONS, BUILDINGS, UNITS, COUNTRIES)
8. fog.js (uses CONFIG)
9. ai.js (uses BUILDINGS, UNITS, CONFIG, Entity)
10. ui.js (uses FACTIONS, BUILDINGS, UNITS, SPRITES)
11. input.js (uses CONFIG, BUILDINGS)
12. renderer.js (uses CONFIG, TERRAIN_COLORS, SpriteCache)
13. network.js (uses GameMap)
14. mapeditor.js (uses TERRAIN, GameMap)
15. sound.js (standalone)
16. game.js (orchestrates everything, entry point via DOMContentLoaded)

---

*Last updated: 2026-03-14 (commit 4)*
