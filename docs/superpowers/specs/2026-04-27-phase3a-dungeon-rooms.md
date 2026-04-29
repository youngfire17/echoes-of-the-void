# Phase 3A: Dungeon Room Engine + Story Zones
*Date: 2026-04-27*

---

## Overview

Replace the fixed wave-based combat arena with a full dungeon traversal system. The hero auto-moves through procedurally generated rooms and corridors, fighting enemies spatially, collecting loot from the floor, and progressing through multi-floor zones with a boss at the end. This is the core structural change that makes the game feel like Diablo rather than an idle stat-checker.

The wave system is eliminated entirely. All combat happens inside dungeon rooms.

---

## Section 1: Run Structure

### Story Mode Flow
1. Player selects a Zone from MetaHub (e.g. "Ruined Crypt")
2. A dungeon generates — 2 floors, 8–10 rooms per floor
3. Hero spawns at the Start room on floor 1 and begins auto-traversal
4. Hero clears all rooms floor by floor, then descends to floor 2
5. Floor 2 ends with the Zone boss
6. **Win:** Boss dies → rewards screen → gear kept, Echoes banked → return to MetaHub
7. **Die:** Same rewards → restart from floor 1 of the same zone

### Zone Unlock Progression
Zones unlock sequentially. Zone 2 unlocks after Zone 1's boss is killed for the first time. Each zone is replayable indefinitely. Enemy base stats include a zone difficulty multiplier so earlier zones remain relevant at higher power levels.

### What Disappears
- Wave counter ("Wave 4/10")
- Fixed 800×500 arena with hero fixed at center
- `WaveSpawner.js` and its 10-wave zone definitions

### What Stays the Same
- Gear persistence between runs
- Echoes earned per run (committed to playerStore at run end)
- Gold earned per run
- Tactical pause (spacebar freezes hero + all enemies)
- Active abilities fire at hero's current position
- All stores, MetaHub, Vault, Blacksmith

---

## Section 2: Dungeon Layout Generation

### Floor Structure
Each floor is a procedurally generated grid of connected rooms. Generation rules:
- Grid canvas: 5 columns × 4 rows of potential room slots
- 8–10 rooms placed per floor (not all slots filled)
- One guaranteed critical path from Start → Boss (player can never get stuck)
- Branch rooms (off critical path) are optional — chest rooms, optional elites, empty junctions
- Each room connects to 1–3 neighbors via corridors

### Room Types

| Type | Contents | % of rooms |
|---|---|---|
| **Start** | Empty, hero spawns here | 1 per floor |
| **Standard** | 3–8 normal enemies (scales with tier) | ~50% |
| **Elite** | 1–2 champion enemies with affixes | ~20% |
| **Chest** | No enemies, guaranteed item drop | ~15% |
| **Empty** | No enemies, corridor junction only | ~10% |
| **Boss** | Zone boss, always last room on floor 2 | 1 per run |

### Room Sizes
Room dimensions are variable. All sizes in dungeon world-space pixels:

| Size | Dimensions | Used for |
|---|---|---|
| Small | 200 × 200 | Empty junctions, chest rooms |
| Medium | 350 × 350 | Standard enemy packs |
| Large | 500 × 500 | Elite encounters, dense packs |
| Massive | 800 × 600 | Boss arenas, high-density flood rooms at high tiers |

At high difficulty, massive rooms can contain 100+ enemies simultaneously, enabling D3-style kill chains when AoE abilities chain on-kill effects across dense packs.

### Corridors
Corridors are 60px wide, variable length (80–200px). They connect room doorways. The hero traverses a corridor in ~0.8 seconds of walking animation.

### Minimap
Always visible in the bottom-right corner of the screen. Shows:
- All rooms as small rectangular nodes
- Corridors as lines between nodes
- **Unvisited rooms:** dark fill, grey border
- **Current room:** blue fill, pulsing blue border
- **Cleared rooms:** dark fill, green border
- **Chest rooms:** green fill (visible before entry — player can see it's a chest room)
- **Elite rooms:** orange border (visible before entry)
- **Boss room:** always marked with skull icon, purple border

---

## Section 3: Hero Movement & Combat

### Hero Position
Hero has `{ x, y }` coordinates in dungeon world-space. No longer fixed at screen center. The camera viewport tracks the hero.

### Within a Room
- Hero auto-moves toward the nearest living enemy in the current room
- Enemies also auto-move toward the hero (mutual pursuit)
- Both sides have movement speeds; hero uses a `moveSpeed` stat (default: 120 px/sec, added to `CLASSES.warden.baseStats`)
- When hero reaches attack range, hero stops moving and begins auto-attacking
- When current target dies, hero re-targets next nearest enemy
- Loot drops land at the enemy's death `{ x, y }` position on the floor
- Loot auto-collects after a 2-second delay (item floats toward hero)

### Between Rooms
- When all enemies in a room are dead, room state becomes `cleared`
- Hero auto-walks toward the nearest uncleared room via corridor
- On entering a new room, enemies activate (spawn from room edges)
- Hero engages immediately

### Pathfinding Order
Hero visits rooms in this priority:
1. Any adjacent room on the critical path (toward the boss)
2. Adjacent branch rooms (chest/elite/empty) before advancing on critical path
3. Hero never revisits a cleared room

### Camera System
- Dungeon world-space is large (e.g. 2400 × 1800px for a full floor)
- Viewport is 800 × 500px
- Camera offset `{ x, y }` is updated each frame to keep hero centered
- Camera is clamped to dungeon bounds (won't scroll past the edge)
- All canvas draw calls offset by `(-camera.x, -camera.y)`

### AoE Kill Chains
In dense rooms, AoE abilities (Consecration) hit multiple enemies simultaneously. Combined with on-kill effects (on_kill_heal, thorns chains, future explosive death affixes), this creates cascading kill chains — the D3 power fantasy moment. Room size directly enables this: a massive room with 80+ enemies packed together is where builds truly shine.

---

## Section 4: Zone Definitions

### Zone Table

| # | Name | Floors | Enemy Pool | Boss |
|---|---|---|---|---|
| 1 | Ruined Crypt | 2 | skeleton, zombie, ghoul, bone_archer, skeleton_knight | The Lich Lord |
| 2 | Blighted Wastes | 2 | TBD — demons, plague beasts | TBD |
| 3 | Ashen Fortress | 3 | TBD — armored soldiers, constructs | TBD |
| 4 | Sunken Cathedral | 3 | TBD — corrupted holy, spectres | TBD |
| 5 | The Void | 3 | TBD — eldritch horrors | TBD |

Zone 1 uses all existing enemy definitions. Zones 2–5 enemy data is out of scope for this spec — placeholder entries in `zones.js` with Zone 1's enemy pool until Phase 3C/4.

### Zone Data Structure (`src/data/zones.js`)
Replace the current wave array format with a room pool format:

```js
{
  id: 1,
  name: 'Ruined Crypt',
  floors: 2,
  backgroundColor: '#0d0d1a',
  difficultyMultiplier: 1.0,
  enemyPool: {
    standard: ['skeleton', 'zombie', 'ghoul'],
    ranged: ['bone_archer'],
    elite: ['skeleton_knight'],
    boss: 'lich_lord',
  },
  roomSizeWeights: {
    small: 0.15,
    medium: 0.55,
    large: 0.25,
    massive: 0.05,
  },
}
```

### Elite Champion Affixes
Elite rooms contain champion enemies with 1–2 named affixes. Affixes modify behavior and stats:

| Affix | Effect |
|---|---|
| **Molten** | Leaves fire patches on death, deals damage to hero |
| **Vortex** | Periodically pulls hero toward enemy |
| **Arcane** | Fires arcane beams that rotate around the enemy |
| **Shielded** | Immune to damage from the front; must be flanked |
| **Fast** | +50% movement speed |
| **Waller** | Summons blocking walls around the hero |

Affixes are drawn from a pool; elite rooms draw 1–2 randomly. These create build-relevant moments — "this build counters Molten elites."

---

## Section 5: Tech Architecture

### New Files

**`src/combat/DungeonGenerator.js`**
Pure function: `generateFloor(zoneData, floorNumber, seed?)` → `FloorLayout`

```
FloorLayout = {
  rooms: Room[],
  corridors: Corridor[],
  startRoomId: string,
  bossRoomId: string,
  criticalPath: string[],  // ordered room IDs from start to boss
}

Room = {
  id: string,
  type: 'start' | 'standard' | 'elite' | 'chest' | 'empty' | 'boss',
  x: number,         // world-space top-left
  y: number,
  width: number,
  height: number,
  neighborIds: string[],
  enemyPack: SpawnEntry[],   // populated by RoomSpawner
  state: 'locked' | 'active' | 'cleared',
}

Corridor = {
  fromRoomId: string,
  toRoomId: string,
  path: { x, y }[],   // polyline connecting the two doorways
}
```

**`src/combat/RoomSpawner.js`**
`populateRoom(room, zoneData, floorNumber)` → room with `enemyPack` filled.
Replaces `WaveSpawner.js`.

**`src/combat/Camera.js`**
```js
class Camera {
  constructor(viewportW, viewportH) { ... }
  follow(targetX, targetY, dungeonBounds) { ... }
  get offsetX() { ... }
  get offsetY() { ... }
  worldToScreen(x, y) { ... }
  screenToWorld(x, y) { ... }
}
```

### Major Rewrites

**`src/combat/CombatEngine.js`**
- Hero gains `hero.x`, `hero.y`, `hero.moveSpeed`
- Hero movement: moves toward nearest enemy (same math as `EnemyAI.moveEnemyTowardHero`, reversed)
- Room state machine: `FloorLayout` stored in engine; `currentRoomId` tracks active room
- Between-room logic: when `currentRoom.state === 'cleared'`, find next uncleared room, set hero target to corridor exit
- Floor transition: when all rooms on floor 1 cleared, load floor 2
- `hero_died` and `run_complete` events unchanged (still emitted to GameCanvas)

**`src/combat/ArenaRenderer.js`**
- Accepts `camera: Camera` instance
- Renders: dungeon floor tiles, room walls, corridor walls, hero, enemies, loot on floor, minimap overlay
- All world-space coordinates offset by `camera.worldToScreen()` before drawing
- Minimap drawn last (screen-space, fixed position, not affected by camera)

### Minor Updates

**`src/combat/EnemyAI.js`**
- `moveEnemyTowardHero(enemy, hero.x, hero.y, dt)` — no change to function signature
- Enemies in rooms that are not `active` do not tick (optimization)

**`src/data/zones.js`**
- Replace wave array format with room pool format (see Section 4)
- Zone 1 fully defined; Zones 2–5 stubbed with Zone 1's enemy pool

**`src/components/HUD.jsx`**
- Replace "Zone X / Wave Y/10" with "Zone Name — Floor X"
- Add room counter: "Room 4/9"

**`src/components/GameCanvas.jsx`**
- Updated engine wiring for new `startRun(heroStats, zoneId)` signature

### Unchanged
`DamageCalculator.js`, `LootGenerator.js`, all Zustand stores, `MetaHub`, `InventoryPanel`, `VaultPanel`, `BlacksmithPanel`, `CharacterPanel`, `RunEndScreen`, `SaveManager`, `OfflineSimulator`

---

## Section 6: Tests

New test files:
- `tests/DungeonGenerator.test.js` — critical path always exists, room counts in range, boss room always present, no orphaned rooms
- `tests/RoomSpawner.test.js` — enemy pack counts match room type, all enemy IDs valid

Existing tests unchanged: `DamageCalculator`, `LootGenerator`, `SaveManager`, `OfflineSimulator`, `metaStore`

`tests/WaveSpawner.test.js` and `src/combat/WaveSpawner.js` are **deleted** as part of this spec — they read from `zones.js` wave format which no longer exists. All wave-based tests are superseded by `RoomSpawner.test.js`.

---

## MVP Scope (this spec)

- [ ] `DungeonGenerator.js` with TDD (critical path, room types, corridors)
- [ ] `RoomSpawner.js` replacing WaveSpawner for room population
- [ ] `Camera.js` viewport tracking system
- [ ] `CombatEngine.js` rewritten: hero has x/y position, moves toward enemies, room state machine, floor transitions
- [ ] `ArenaRenderer.js` rewritten: dungeon rendering + camera offset + minimap
- [ ] Zone 1 (Ruined Crypt) fully playable as a dungeon run
- [ ] Elite champion affixes (6 types defined, applied to elite rooms)
- [ ] HUD updated for dungeon context
- [ ] All existing 37 tests still pass

**Out of scope:**
- Zones 2–5 enemy pools and bosses (stubs only)
- Void Rift mode (Phase 3B)
- Character leveling + skill tree (Phase 2B, still pending)
- Visual art pass
- Pylon system
- Map fishing / dungeon re-roll
