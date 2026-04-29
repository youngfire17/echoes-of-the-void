# Phase 3A: Dungeon Room Engine + Story Zones

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed wave-based arena with a full dungeon traversal system where the hero auto-moves through procedurally generated rooms and corridors, fighting enemies spatially with a camera that follows the hero.

**Architecture:** DungeonGenerator produces a FloorLayout (rooms + corridors as geometric objects). RoomSpawner populates rooms with enemies from zone data. CombatEngine is rewritten so the hero has x/y position and a room state machine. ArenaRenderer is rewritten to draw dungeon world-space offset by a Camera viewport. WaveSpawner and its tests are deleted.

**Tech Stack:** React, Vite, Zustand, HTML5 Canvas — same as existing codebase.

---

## File Map

```
src/
  combat/
    DungeonGenerator.js   CREATE  — generateFloor(floorNumber, totalFloors) → FloorLayout
    RoomSpawner.js        CREATE  — populateRoom(room, zoneData) → room with enemyPack
    Camera.js             CREATE  — viewport tracking, worldToScreen/screenToWorld
    WaveSpawner.js        DELETE
    CombatEngine.js       REWRITE — hero has x/y; room state machine; floor transitions
    ArenaRenderer.js      REWRITE — dungeon rendering + camera + minimap
  data/
    zones.js              REWRITE — room pool format (replaces wave array format)
    classes.js            MODIFY  — add moveSpeed: 120 to warden baseStats
  store/
    runStore.js           MODIFY  — replace wave/phase fields with floor/roomsCleared
  components/
    HUD.jsx               MODIFY  — show floor + room progress instead of wave counter
    GameCanvas.jsx        MODIFY  — updated engine wiring, camera instance

tests/
  DungeonGenerator.test.js  CREATE  — 6 tests
  RoomSpawner.test.js       CREATE  — 4 tests
  WaveSpawner.test.js       DELETE
```

---

## Shared Type Reference

These shapes are used across multiple tasks. Read this before implementing any task.

```js
// FloorLayout — returned by generateFloor()
{
  rooms: Room[],
  corridors: Corridor[],
  startRoomId: string,
  bossRoomId: string | null,   // null on non-final floors
  criticalPath: string[],      // ordered room IDs from start toward boss/exit
}

// Room
{
  id: string,                  // e.g. "room_0_2"
  type: 'start' | 'standard' | 'elite' | 'chest' | 'empty' | 'boss',
  col: number,                 // grid column (0-4)
  row: number,                 // grid row (0-3)
  x: number,                  // world-space top-left x
  y: number,                  // world-space top-left y
  width: number,
  height: number,
  neighborIds: string[],       // adjacent connected rooms
  state: 'locked' | 'active' | 'cleared',
  enemyPack: EnemyInstance[],  // populated by RoomSpawner
}

// Corridor
{
  id: string,
  fromRoomId: string,
  toRoomId: string,
  x: number,      // world-space top-left of corridor rect
  y: number,
  width: number,
  height: number,
}

// EnemyInstance — same as before but no spawnDelay
{
  ...ENEMIES[id],               // spread of static enemy def
  instanceId: string,
  currentHp: number,
  stats: { ...baseStats },
  attackTimer: number,
  x: number,                    // set when room activates
  y: number,
  isElite?: boolean,
  isBoss?: boolean,
  affix?: string,               // e.g. 'molten', 'fast', 'vortex'
}
```

---

## Task 1: Data Layer — zones.js, classes.js, delete WaveSpawner

**Files:**
- Rewrite: `src/data/zones.js`
- Modify: `src/data/classes.js`
- Delete: `src/combat/WaveSpawner.js`
- Delete: `tests/WaveSpawner.test.js`

- [ ] **Step 1: Rewrite `src/data/zones.js`**

```js
// src/data/zones.js
export const ZONES = {
  1: {
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
    roomSizeWeights: { small: 0.15, medium: 0.55, large: 0.25, massive: 0.05 },
  },
  2: {
    id: 2,
    name: 'Blighted Wastes',
    floors: 2,
    backgroundColor: '#1a0a05',
    difficultyMultiplier: 1.8,
    enemyPool: {
      standard: ['skeleton', 'zombie', 'ghoul'],
      ranged: ['bone_archer'],
      elite: ['skeleton_knight'],
      boss: 'lich_lord',
    },
    roomSizeWeights: { small: 0.15, medium: 0.55, large: 0.25, massive: 0.05 },
  },
  3: {
    id: 3,
    name: 'Ashen Fortress',
    floors: 3,
    backgroundColor: '#1a1005',
    difficultyMultiplier: 3.0,
    enemyPool: {
      standard: ['skeleton', 'zombie', 'ghoul'],
      ranged: ['bone_archer'],
      elite: ['skeleton_knight'],
      boss: 'lich_lord',
    },
    roomSizeWeights: { small: 0.10, medium: 0.50, large: 0.30, massive: 0.10 },
  },
  4: {
    id: 4,
    name: 'Sunken Cathedral',
    floors: 3,
    backgroundColor: '#050a1a',
    difficultyMultiplier: 5.0,
    enemyPool: {
      standard: ['skeleton', 'zombie', 'ghoul'],
      ranged: ['bone_archer'],
      elite: ['skeleton_knight'],
      boss: 'lich_lord',
    },
    roomSizeWeights: { small: 0.10, medium: 0.45, large: 0.35, massive: 0.10 },
  },
  5: {
    id: 5,
    name: 'The Void',
    floors: 3,
    backgroundColor: '#050005',
    difficultyMultiplier: 8.0,
    enemyPool: {
      standard: ['skeleton', 'zombie', 'ghoul'],
      ranged: ['bone_archer'],
      elite: ['skeleton_knight'],
      boss: 'lich_lord',
    },
    roomSizeWeights: { small: 0.05, medium: 0.35, large: 0.40, massive: 0.20 },
  },
}
```

- [ ] **Step 2: Add `moveSpeed` to Warden in `src/data/classes.js`**

Find `baseStats` inside the `warden` object and add `moveSpeed: 120` after `attackRange: 65`:

```js
attackRange: 65,
moveSpeed: 120,     // pixels per second hero moves between targets/rooms
damageFlat: 8,
```

- [ ] **Step 3: Delete WaveSpawner**

```bash
rm "src/combat/WaveSpawner.js"
rm "tests/WaveSpawner.test.js"
```

- [ ] **Step 4: Run existing tests to confirm only WaveSpawner tests are gone**

```bash
npx vitest run
```

Expected: 29 tests pass (37 total minus 8 WaveSpawner tests). If any non-WaveSpawner test fails, fix it before continuing.

- [ ] **Step 5: Commit**

```bash
git add src/data/zones.js src/data/classes.js
git rm src/combat/WaveSpawner.js tests/WaveSpawner.test.js
git commit -m "feat: replace zone wave format with room pool format, add hero moveSpeed, remove WaveSpawner"
```

---

## Task 2: DungeonGenerator (TDD)

**Files:**
- Create: `src/combat/DungeonGenerator.js`
- Create: `tests/DungeonGenerator.test.js`

### The Algorithm

`generateFloor(floorNumber, totalFloors)` produces a floor layout using a 5×4 grid:
1. Place `start` room at col 0, random row
2. If `floorNumber === totalFloors`, place `boss` room at col 4, random row (the final floor has a boss)
3. Random walk right from start to boss/exit creating critical path — at each step, move +1 col and randomly ±1 row
4. Add 3 branch rooms: random empty adjacent slots off the critical path
5. Assign room types: branch rooms get 'chest' (40%), 'elite' (30%), or 'empty' (30%); critical path rooms get 'standard' (70%), 'elite' (20%), 'empty' (10%) — except start and boss
6. Assign room sizes (used later for rendering): standard rooms get medium (350×350), elite/boss get large (500×500), chest/empty get small (200×200), some standard rooms get massive (700×550) at 5% chance
7. Calculate world-space position: each grid slot is 750px wide × 650px tall; room is centered in slot
8. Build corridor list: any two adjacent rooms in the grid get a corridor connecting their facing edges

### Room sizes in world pixels:
- small: 200 × 200
- medium: 350 × 350
- large: 500 × 500
- massive: 700 × 550

### Grid slot spacing:
- Col spacing: 750px (room max width ~700 + 50px gap)
- Row spacing: 650px (room max height ~550 + 100px gap)
- Room world position: `x = col * 750 + (750 - roomW) / 2`, `y = row * 650 + (650 - roomH) / 2`

### Corridor calculation:
Given two adjacent rooms (horizontal or vertical neighbors), the corridor is the rectangular gap between their facing edges:
- For horizontal neighbors (same row, adjacent cols): corridor spans from `fromRoom.x + fromRoom.width` to `toRoom.x`, centered on their shared y midpoint, 60px tall
- For vertical neighbors (same col, adjacent rows): corridor spans from `fromRoom.y + fromRoom.height` to `toRoom.y`, centered on their shared x midpoint, 60px wide

- [ ] **Step 1: Write failing tests**

Create `tests/DungeonGenerator.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { generateFloor } from '../src/combat/DungeonGenerator'

function bfsReachable(rooms, startRoomId) {
  const roomMap = Object.fromEntries(rooms.map(r => [r.id, r]))
  const visited = new Set()
  const queue = [startRoomId]
  while (queue.length > 0) {
    const id = queue.shift()
    if (visited.has(id)) continue
    visited.add(id)
    roomMap[id].neighborIds.forEach(nid => { if (!visited.has(nid)) queue.push(nid) })
  }
  return visited
}

describe('generateFloor', () => {
  it('produces 8–10 rooms', () => {
    const floor = generateFloor(1, 2)
    expect(floor.rooms.length).toBeGreaterThanOrEqual(8)
    expect(floor.rooms.length).toBeLessThanOrEqual(10)
  })

  it('has exactly one start room', () => {
    const floor = generateFloor(1, 2)
    expect(floor.rooms.filter(r => r.type === 'start')).toHaveLength(1)
  })

  it('final floor has exactly one boss room', () => {
    const floor = generateFloor(2, 2)
    expect(floor.rooms.filter(r => r.type === 'boss')).toHaveLength(1)
  })

  it('non-final floor has no boss room', () => {
    const floor = generateFloor(1, 2)
    expect(floor.rooms.filter(r => r.type === 'boss')).toHaveLength(0)
  })

  it('all rooms are reachable from start', () => {
    const floor = generateFloor(1, 2)
    const reachable = bfsReachable(floor.rooms, floor.startRoomId)
    expect(reachable.size).toBe(floor.rooms.length)
  })

  it('criticalPath starts at startRoomId', () => {
    const floor = generateFloor(1, 2)
    expect(floor.criticalPath[0]).toBe(floor.startRoomId)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/DungeonGenerator.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/combat/DungeonGenerator.js`**

```js
// src/combat/DungeonGenerator.js

const ROOM_SIZES = {
  small:   { width: 200, height: 200 },
  medium:  { width: 350, height: 350 },
  large:   { width: 500, height: 500 },
  massive: { width: 700, height: 550 },
}

const COL_SPACING = 750
const ROW_SPACING = 650
const CORRIDOR_THICKNESS = 60
const GRID_COLS = 5
const GRID_ROWS = 4

function randomRow() {
  return Math.floor(Math.random() * GRID_ROWS)
}

function roomId(col, row) {
  return `room_${col}_${row}`
}

function roomWorldPos(col, row, size) {
  const { width, height } = ROOM_SIZES[size]
  return {
    x: col * COL_SPACING + (COL_SPACING - width) / 2,
    y: row * ROW_SPACING + (ROW_SPACING - height) / 2,
  }
}

function pickRoomSize(type) {
  if (type === 'boss' || type === 'elite') return 'large'
  if (type === 'chest' || type === 'empty') return 'small'
  // standard — 5% massive, 95% medium
  return Math.random() < 0.05 ? 'massive' : 'medium'
}

function makeCorridor(fromRoom, toRoom) {
  const sameRow = fromRoom.row === toRoom.row
  if (sameRow) {
    // Horizontal corridor
    const left = fromRoom.col < toRoom.col ? fromRoom : toRoom
    const right = left === fromRoom ? toRoom : fromRoom
    const leftEdge = left.x + left.width
    const rightEdge = right.x
    const midY = (left.y + left.height / 2 + right.y + right.height / 2) / 2
    return {
      id: `corridor_${fromRoom.id}_${toRoom.id}`,
      fromRoomId: fromRoom.id,
      toRoomId: toRoom.id,
      x: leftEdge,
      y: midY - CORRIDOR_THICKNESS / 2,
      width: Math.max(1, rightEdge - leftEdge),
      height: CORRIDOR_THICKNESS,
    }
  } else {
    // Vertical corridor
    const top = fromRoom.row < toRoom.row ? fromRoom : toRoom
    const bottom = top === fromRoom ? toRoom : fromRoom
    const topEdge = top.y + top.height
    const bottomEdge = bottom.y
    const midX = (top.x + top.width / 2 + bottom.x + bottom.width / 2) / 2
    return {
      id: `corridor_${fromRoom.id}_${toRoom.id}`,
      fromRoomId: fromRoom.id,
      toRoomId: toRoom.id,
      x: midX - CORRIDOR_THICKNESS / 2,
      y: topEdge,
      width: CORRIDOR_THICKNESS,
      height: Math.max(1, bottomEdge - topEdge),
    }
  }
}

export function generateFloor(floorNumber, totalFloors) {
  const grid = {}  // key: `${col}_${row}` → Room

  // 1. Place start room (col 0, random row)
  const startRow = randomRow()
  const startType = 'start'
  const startSize = 'small'
  const startPos = roomWorldPos(0, startRow, startSize)
  const start = {
    id: roomId(0, startRow),
    type: startType,
    col: 0, row: startRow,
    ...startPos,
    ...ROOM_SIZES[startSize],
    neighborIds: [],
    state: 'locked',
    enemyPack: [],
  }
  grid[`0_${startRow}`] = start

  // 2. Place boss/exit room (col 4, random row) on final floor
  const isFinalFloor = floorNumber === totalFloors
  const bossRow = randomRow()
  let bossRoom = null
  if (isFinalFloor) {
    const bossSize = 'large'
    const bossPos = roomWorldPos(4, bossRow, bossSize)
    bossRoom = {
      id: roomId(4, bossRow),
      type: 'boss',
      col: 4, row: bossRow,
      ...bossPos,
      ...ROOM_SIZES[bossSize],
      neighborIds: [],
      state: 'locked',
      enemyPack: [],
    }
    grid[`4_${bossRow}`] = bossRoom
  }

  // 3. Random walk from start to target col (4), creating critical path
  const criticalPath = [start.id]
  let currentCol = 0
  let currentRow = startRow
  const targetCol = 4
  const targetRow = isFinalFloor ? bossRow : randomRow()

  while (currentCol < targetCol) {
    // Move right always
    currentCol++
    // Optionally adjust row toward target
    if (currentRow < targetRow && Math.random() < 0.6) currentRow++
    else if (currentRow > targetRow && Math.random() < 0.6) currentRow--
    // Clamp row
    currentRow = Math.max(0, Math.min(GRID_ROWS - 1, currentRow))

    const key = `${currentCol}_${currentRow}`
    if (!grid[key]) {
      // Determine room type for critical path
      let type = 'standard'
      const roll = Math.random()
      if (roll < 0.20) type = 'elite'
      else if (roll < 0.30) type = 'empty'

      // If this is the final col on final floor, it's already the boss room
      if (currentCol === 4 && isFinalFloor) {
        // connect to boss room, don't create new
        const prev = grid[criticalPath[criticalPath.length - 1]]
        const next = bossRoom
        if (!prev.neighborIds.includes(next.id)) prev.neighborIds.push(next.id)
        if (!next.neighborIds.includes(prev.id)) next.neighborIds.push(prev.id)
        criticalPath.push(next.id)
        break
      }

      const size = pickRoomSize(type)
      const pos = roomWorldPos(currentCol, currentRow, size)
      const room = {
        id: roomId(currentCol, currentRow),
        type,
        col: currentCol, row: currentRow,
        ...pos,
        ...ROOM_SIZES[size],
        neighborIds: [],
        state: 'locked',
        enemyPack: [],
      }
      grid[key] = room
    }

    // Connect to previous room in critical path
    const prevId = criticalPath[criticalPath.length - 1]
    const prev = grid[prevId]
    const curr = grid[`${currentCol}_${currentRow}`]
    if (curr && !prev.neighborIds.includes(curr.id)) {
      prev.neighborIds.push(curr.id)
      curr.neighborIds.push(prev.id)
    }
    if (curr) criticalPath.push(curr.id)
  }

  // 4. Add 3–4 branch rooms off critical path
  const branchCount = 3 + Math.floor(Math.random() * 2)
  for (let i = 0; i < branchCount; i++) {
    // Pick a random critical path room and try to add an adjacent slot
    const parentId = criticalPath[Math.floor(Math.random() * criticalPath.length)]
    const parent = grid[parentId]
    const directions = [[-1,0],[1,0],[0,-1],[0,1]]
    const dir = directions[Math.floor(Math.random() * directions.length)]
    const nc = parent.col + dir[0]
    const nr = parent.row + dir[1]
    if (nc < 0 || nc >= GRID_COLS || nr < 0 || nr >= GRID_ROWS) continue
    const key = `${nc}_${nr}`
    if (grid[key]) continue  // already occupied

    const type = Math.random() < 0.4 ? 'chest' : Math.random() < 0.5 ? 'elite' : 'empty'
    const size = pickRoomSize(type)
    const pos = roomWorldPos(nc, nr, size)
    const room = {
      id: roomId(nc, nr),
      type,
      col: nc, row: nr,
      ...pos,
      ...ROOM_SIZES[size],
      neighborIds: [],
      state: 'locked',
      enemyPack: [],
    }
    grid[key] = room
    parent.neighborIds.push(room.id)
    room.neighborIds.push(parent.id)
  }

  const rooms = Object.values(grid)

  // 5. Build corridors from neighbor relationships (deduplicated)
  const corridorSet = new Set()
  const corridors = []
  for (const room of rooms) {
    for (const nid of room.neighborIds) {
      const key = [room.id, nid].sort().join('|')
      if (!corridorSet.has(key)) {
        corridorSet.add(key)
        const neighbor = grid[Object.keys(grid).find(k => grid[k].id === nid)]
        if (neighbor) corridors.push(makeCorridor(room, neighbor))
      }
    }
  }

  return {
    rooms,
    corridors,
    startRoomId: start.id,
    bossRoomId: bossRoom?.id ?? null,
    criticalPath,
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/DungeonGenerator.test.js
```

Expected: 6 tests PASS.

- [ ] **Step 5: Run full suite**

```bash
npx vitest run
```

Expected: 35 tests pass (29 + 6 new).

- [ ] **Step 6: Commit**

```bash
git add src/combat/DungeonGenerator.js tests/DungeonGenerator.test.js
git commit -m "feat: DungeonGenerator with TDD (6 passing tests)"
```

---

## Task 3: RoomSpawner (TDD)

**Files:**
- Create: `src/combat/RoomSpawner.js`
- Create: `tests/RoomSpawner.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/RoomSpawner.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { populateRoom } from '../src/combat/RoomSpawner'
import { ZONES } from '../src/data/zones'
import { ENEMIES } from '../src/data/enemies'

const zone = ZONES[1]

function makeRoom(type) {
  return {
    id: `room_test_${type}`,
    type,
    col: 1, row: 1,
    x: 100, y: 100,
    width: 350, height: 350,
    neighborIds: [],
    state: 'locked',
    enemyPack: [],
  }
}

describe('populateRoom', () => {
  it('start, chest, and empty rooms get no enemies', () => {
    for (const type of ['start', 'chest', 'empty']) {
      const room = populateRoom(makeRoom(type), zone)
      expect(room.enemyPack).toHaveLength(0)
    }
  })

  it('standard room gets 3–8 enemies', () => {
    const room = populateRoom(makeRoom('standard'), zone)
    expect(room.enemyPack.length).toBeGreaterThanOrEqual(3)
    expect(room.enemyPack.length).toBeLessThanOrEqual(8)
  })

  it('boss room gets exactly one enemy with archetype boss', () => {
    const room = populateRoom(makeRoom('boss'), zone)
    expect(room.enemyPack).toHaveLength(1)
    expect(room.enemyPack[0].archetype).toBe('boss')
  })

  it('all enemy IDs in packs exist in ENEMIES', () => {
    for (const type of ['standard', 'elite', 'boss']) {
      const room = populateRoom(makeRoom(type), zone)
      for (const enemy of room.enemyPack) {
        expect(ENEMIES).toHaveProperty(enemy.id)
      }
    }
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/RoomSpawner.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/combat/RoomSpawner.js`**

```js
// src/combat/RoomSpawner.js
import { ENEMIES } from '../data/enemies'

const ELITE_AFFIXES = ['molten', 'fast', 'vortex', 'arcane', 'shielded', 'waller']

function buildInstance(enemyId, roomId, index) {
  const def = ENEMIES[enemyId]
  return {
    ...def,
    instanceId: `${enemyId}_${roomId}_${index}`,
    currentHp: def.baseStats.maxHp,
    stats: { ...def.baseStats },
    attackTimer: 0,
    x: 0,
    y: 0,
  }
}

export function populateRoom(room, zoneData) {
  if (['start', 'chest', 'empty'].includes(room.type)) {
    return { ...room, enemyPack: [] }
  }

  if (room.type === 'boss') {
    const boss = buildInstance(zoneData.enemyPool.boss, room.id, 0)
    boss.isBoss = true
    return { ...room, enemyPack: [boss] }
  }

  if (room.type === 'elite') {
    const eliteId = zoneData.enemyPool.elite[Math.floor(Math.random() * zoneData.enemyPool.elite.length)]
    const elite = buildInstance(eliteId, room.id, 0)
    elite.isElite = true
    elite.affix = ELITE_AFFIXES[Math.floor(Math.random() * ELITE_AFFIXES.length)]

    const fillCount = 2 + Math.floor(Math.random() * 3)
    const pool = [...zoneData.enemyPool.standard, ...zoneData.enemyPool.ranged]
    const fill = Array.from({ length: fillCount }, (_, i) => {
      const id = pool[Math.floor(Math.random() * pool.length)]
      return buildInstance(id, room.id, i + 1)
    })

    return { ...room, enemyPack: [elite, ...fill] }
  }

  // standard room: 3–8 enemies from the full pool
  const pool = [...zoneData.enemyPool.standard, ...zoneData.enemyPool.ranged]
  const count = 3 + Math.floor(Math.random() * 6)
  const pack = Array.from({ length: count }, (_, i) => {
    const id = pool[Math.floor(Math.random() * pool.length)]
    return buildInstance(id, room.id, i)
  })

  return { ...room, enemyPack: pack }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/RoomSpawner.test.js
```

Expected: 4 tests PASS.

- [ ] **Step 5: Run full suite**

```bash
npx vitest run
```

Expected: 39 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/combat/RoomSpawner.js tests/RoomSpawner.test.js
git commit -m "feat: RoomSpawner with TDD (4 passing tests)"
```

---

## Task 4: Camera

**Files:**
- Create: `src/combat/Camera.js`

- [ ] **Step 1: Create `src/combat/Camera.js`**

```js
// src/combat/Camera.js
export class Camera {
  constructor(viewportW, viewportH) {
    this.viewportW = viewportW
    this.viewportH = viewportH
    this.x = 0  // world-space x of viewport top-left
    this.y = 0
  }

  follow(targetX, targetY, dungeonBounds) {
    this.x = targetX - this.viewportW / 2
    this.y = targetY - this.viewportH / 2
    // Clamp so camera never shows outside the dungeon
    this.x = Math.max(0, Math.min(this.x, Math.max(0, dungeonBounds.width - this.viewportW)))
    this.y = Math.max(0, Math.min(this.y, Math.max(0, dungeonBounds.height - this.viewportH)))
  }

  worldToScreen(wx, wy) {
    return { x: wx - this.x, y: wy - this.y }
  }

  screenToWorld(sx, sy) {
    return { x: sx + this.x, y: sy + this.y }
  }

  isVisible(wx, wy, margin = 150) {
    return (
      wx >= this.x - margin &&
      wx <= this.x + this.viewportW + margin &&
      wy >= this.y - margin &&
      wy <= this.y + this.viewportH + margin
    )
  }
}
```

- [ ] **Step 2: Run full suite to confirm no regressions**

```bash
npx vitest run
```

Expected: 39 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/combat/Camera.js
git commit -m "feat: Camera viewport tracking for dungeon rendering"
```

---

## Task 5: CombatEngine Rewrite

**Files:**
- Rewrite: `src/combat/CombatEngine.js`

The existing `CombatEngine.js` is replaced entirely. The public interface stays the same (`on`, `startRun`, `tick`, `fireSkill`, `getSnapshot`) but internals are rewritten for the dungeon model.

Key changes from old CombatEngine:
- Hero has `heroX`, `heroY` (was fixed at 400, 250)
- Hero moves toward nearest enemy in the current room
- Room state machine: `locked → active → cleared`
- Between-room: hero walks from cleared room to next room center
- Floor transitions: after all rooms on a floor are cleared, hero moves to next floor
- `startRun(heroStats, zoneId)` takes `zoneId` not hardcoded `1`

Retained from old engine: `_heroTakeHit`, `_killEnemy`, `fireSkill` effect types, lootTimers, skillCooldowns, shield, retribution, HP regen, `on`/`_emit`, all event names (`hero_died`, `run_complete`, `wave_cleared`→`room_cleared`, `loot_drop`, `enemy_killed`, `floating_number`, `hero_damaged`).

- [ ] **Step 1: Replace `src/combat/CombatEngine.js` entirely**

```js
// src/combat/CombatEngine.js
import { calculateDamage } from './DamageCalculator'
import { moveEnemyTowardHero, tickEnemyAttack } from './EnemyAI'
import { generateFloor } from './DungeonGenerator'
import { populateRoom } from './RoomSpawner'
import { generateLoot } from '../systems/LootGenerator'
import { distance } from '../utils'
import { ZONES } from '../data/zones'

const VIEWPORT_W = 800
const VIEWPORT_H = 500

export class CombatEngine {
  constructor() {
    this.reset()
  }

  reset() {
    this.floorLayouts = []
    this.currentFloorIndex = 0
    this.currentRoomId = null
    this.pendingRoomId = null      // room hero is walking toward
    this.zoneId = 1

    this.heroX = 0
    this.heroY = 0
    this.heroMoveTargetX = null
    this.heroMoveTargetY = null

    this.heroHp = 0
    this.heroMaxHp = 0
    this.heroStats = {}
    this.heroAttackTimer = 0

    this.enemies = []
    this.shield = null
    this.skillCooldowns = {}
    this.lootTimers = []
    this.lootOnFloor = []          // { x, y, rarity } for renderer

    this.phase = 'idle'            // 'exploring' | 'fighting' | 'ended'
    this.callbacks = {}
  }

  on(event, fn) {
    this.callbacks[event] = fn
  }

  _emit(event, data) {
    if (this.callbacks[event]) this.callbacks[event](data)
  }

  // ─── PUBLIC API ───────────────────────────────────────────────────────────

  startRun(heroStats, zoneId = 1) {
    this.reset()
    this.zoneId = zoneId
    this.heroStats = { ...heroStats }
    this.heroHp = heroStats.maxHp
    this.heroMaxHp = heroStats.maxHp

    const zone = ZONES[zoneId]

    // Generate and populate all floors
    for (let i = 0; i < zone.floors; i++) {
      const layout = generateFloor(i + 1, zone.floors)
      layout.rooms = layout.rooms.map(r => populateRoom(r, zone))
      this.floorLayouts.push(layout)
    }

    this._enterFloor(0)
  }

  tick(dt) {
    if (this.phase === 'idle' || this.phase === 'ended') return

    // Cooldowns
    for (const skillId of Object.keys(this.skillCooldowns)) {
      this.skillCooldowns[skillId] = Math.max(0, this.skillCooldowns[skillId] - dt)
    }

    // Shield duration
    if (this.shield) {
      this.shield.duration -= dt
      if (this.shield.duration <= 0) this.shield = null
    }

    // Loot pickup timers
    this.lootTimers = this.lootTimers.filter(lt => {
      lt.timer -= dt
      if (lt.timer <= 0) {
        this.lootOnFloor = this.lootOnFloor.filter(l => l !== lt.floorRef)
        this._emit('loot_drop', lt.item)
        return false
      }
      return true
    })

    // HP regen
    const regen = this.heroStats.hpRegenFlat || 0
    if (regen > 0) this.heroHp = Math.min(this.heroMaxHp, this.heroHp + regen * dt)

    if (this.phase === 'exploring') {
      this._tickExploring(dt)
    } else if (this.phase === 'fighting') {
      this._tickFighting(dt)
    }
  }

  fireSkill(skillId, skillDef) {
    if ((this.skillCooldowns[skillId] || 0) > 0) return
    const cdr = this.heroStats.cooldownReduction || 0
    this.skillCooldowns[skillId] = skillDef.cooldown * (1 - cdr)

    const effect = skillDef.effect

    if (effect.type === 'damage_nearest') {
      const target = this._findNearestEnemy()
      if (!target) return
      const { damage, isCrit } = calculateDamage(this.heroStats, target.stats, true)
      const finalDmg = Math.round(damage * effect.multiplier)
      target.currentHp -= finalDmg
      this._emit('floating_number', { x: target.x, y: target.y, value: finalDmg, isCrit })
      if (target.currentHp <= 0) this._killEnemy(target)
    }

    if (effect.type === 'heal_self') {
      const heal = Math.round(this.heroMaxHp * effect.hpPercent)
      this.heroHp = Math.min(this.heroMaxHp, this.heroHp + heal)
      this._emit('floating_number', { x: this.heroX, y: this.heroY - 30, value: heal, isCrit: false })
    }

    if (effect.type === 'damage_aoe') {
      for (const enemy of [...this.enemies]) {
        const dist = distance({ x: this.heroX, y: this.heroY }, { x: enemy.x, y: enemy.y })
        if (dist <= effect.radius) {
          const { damage, isCrit } = calculateDamage(this.heroStats, enemy.stats, true)
          const finalDmg = Math.round(damage * effect.multiplier)
          enemy.currentHp -= finalDmg
          this._emit('floating_number', { x: enemy.x, y: enemy.y, value: finalDmg, isCrit })
          if (enemy.currentHp <= 0) this._killEnemy(enemy)
        }
      }
    }

    if (effect.type === 'shield') {
      const shieldHp = Math.round(this.heroMaxHp * effect.hpPercent)
      this.shield = { remaining: shieldHp, duration: effect.duration }
    }
  }

  getSnapshot() {
    const layout = this.floorLayouts[this.currentFloorIndex]
    const totalRooms = layout?.rooms.length ?? 0
    const clearedRooms = layout?.rooms.filter(r => r.state === 'cleared').length ?? 0

    // Compute dungeon bounds for camera use
    let maxX = VIEWPORT_W, maxY = VIEWPORT_H
    if (layout) {
      for (const r of layout.rooms) {
        maxX = Math.max(maxX, r.x + r.width + 100)
        maxY = Math.max(maxY, r.y + r.height + 100)
      }
    }

    return {
      enemies: this.enemies,
      heroX: this.heroX,
      heroY: this.heroY,
      heroHpPct: this.heroMaxHp > 0 ? this.heroHp / this.heroMaxHp : 1,
      heroHp: Math.ceil(this.heroHp),
      heroMaxHp: this.heroMaxHp,
      isPaused: false,
      shield: this.shield,
      phase: this.phase,
      floor: this.currentFloorIndex + 1,
      totalFloors: this.floorLayouts.length,
      totalRooms,
      clearedRooms,
      currentRoomId: this.currentRoomId,
      floorLayout: layout ?? null,
      lootOnFloor: [...this.lootOnFloor],
      skillCooldowns: { ...this.skillCooldowns },
      dungeonBounds: { width: maxX, height: maxY },
      zoneName: ZONES[this.zoneId]?.name ?? `Zone ${this.zoneId}`,
    }
  }

  // ─── DUNGEON TRAVERSAL ────────────────────────────────────────────────────

  _enterFloor(floorIndex) {
    this.currentFloorIndex = floorIndex
    this.enemies = []
    const layout = this.floorLayouts[floorIndex]
    const startRoom = layout.rooms.find(r => r.id === layout.startRoomId)
    startRoom.state = 'active'
    this.currentRoomId = startRoom.id
    // Place hero at center of start room
    this.heroX = startRoom.x + startRoom.width / 2
    this.heroY = startRoom.y + startRoom.height / 2
    // Start room is empty — begin exploring
    this.phase = 'exploring'
    this._walkToNextRoom()
  }

  _getCurrentRoom() {
    const layout = this.floorLayouts[this.currentFloorIndex]
    return layout.rooms.find(r => r.id === this.currentRoomId)
  }

  _walkToNextRoom() {
    const layout = this.floorLayouts[this.currentFloorIndex]
    const currentRoom = this._getCurrentRoom()

    // Find uncleared adjacent rooms
    const unclearedNeighbors = currentRoom.neighborIds
      .map(id => layout.rooms.find(r => r.id === id))
      .filter(r => r && r.state === 'locked')

    if (unclearedNeighbors.length === 0) {
      // All adjacent rooms cleared — need to backtrack or advance floor
      // Find any uncleared room on this floor (BFS)
      const uncleared = layout.rooms.find(r => r.state === 'locked')
      if (!uncleared) {
        // All rooms on this floor cleared
        const nextFloorIndex = this.currentFloorIndex + 1
        if (nextFloorIndex < this.floorLayouts.length) {
          this._enterFloor(nextFloorIndex)
        } else {
          this.phase = 'ended'
          this._emit('run_complete', {})
        }
        return
      }
      // Walk to that uncleared room directly (simplified: teleport to nearest uncleared neighbor chain)
      this.pendingRoomId = uncleared.id
      this.heroMoveTargetX = uncleared.x + uncleared.width / 2
      this.heroMoveTargetY = uncleared.y + uncleared.height / 2
      return
    }

    // Prefer chest rooms, then elite, then standard
    const priority = ['chest', 'elite', 'standard', 'empty', 'boss']
    unclearedNeighbors.sort((a, b) => priority.indexOf(a.type) - priority.indexOf(b.type))
    const next = unclearedNeighbors[0]

    this.pendingRoomId = next.id
    this.heroMoveTargetX = next.x + next.width / 2
    this.heroMoveTargetY = next.y + next.height / 2
  }

  _tickExploring(dt) {
    if (this.heroMoveTargetX === null) return

    const dx = this.heroMoveTargetX - this.heroX
    const dy = this.heroMoveTargetY - this.heroY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const speed = this.heroStats.moveSpeed || 120

    if (dist < 8) {
      // Arrived at room center
      this.heroX = this.heroMoveTargetX
      this.heroY = this.heroMoveTargetY
      this.heroMoveTargetX = null
      this.heroMoveTargetY = null

      if (this.pendingRoomId) {
        this._activateRoom(this.pendingRoomId)
        this.pendingRoomId = null
      }
    } else {
      const step = speed * dt
      this.heroX += (dx / dist) * step
      this.heroY += (dy / dist) * step
    }
  }

  _activateRoom(roomId) {
    const layout = this.floorLayouts[this.currentFloorIndex]
    const room = layout.rooms.find(r => r.id === roomId)
    room.state = 'active'
    this.currentRoomId = roomId

    if (room.enemyPack.length === 0) {
      // Chest or empty room
      if (room.type === 'chest') {
        const item = generateLoot(this.zoneId, 'normal', 'uncommon')
        const floorRef = { x: room.x + room.width / 2, y: room.y + room.height / 2, rarity: item.rarity }
        this.lootOnFloor.push(floorRef)
        this.lootTimers.push({ item, timer: 2.0, floorRef })
      }
      room.state = 'cleared'
      this._emit('room_cleared', { roomId })
      this._walkToNextRoom()
      return
    }

    // Spawn enemies at random positions within room bounds
    for (const enemy of room.enemyPack) {
      enemy.x = room.x + 30 + Math.random() * (room.width - 60)
      enemy.y = room.y + 30 + Math.random() * (room.height - 60)
      this.enemies.push(enemy)
    }

    this.phase = 'fighting'
  }

  // ─── COMBAT ───────────────────────────────────────────────────────────────

  _tickFighting(dt) {
    // Move hero toward nearest enemy
    const target = this._findNearestEnemy()
    if (target) {
      const dist = distance({ x: this.heroX, y: this.heroY }, { x: target.x, y: target.y })
      const attackRange = this.heroStats.attackRange || 65
      if (dist > attackRange) {
        const dx = target.x - this.heroX
        const dy = target.y - this.heroY
        const speed = this.heroStats.moveSpeed || 120
        const step = Math.min(speed * dt, dist - attackRange)
        this.heroX += (dx / dist) * step
        this.heroY += (dy / dist) * step
      }
    }

    // Enemy movement and attacks
    const activeEnemies = [...this.enemies]
    for (const enemy of activeEnemies) {
      if (enemy.currentHp <= 0) continue
      moveEnemyTowardHero(enemy, this.heroX, this.heroY, dt)
      tickEnemyAttack(enemy, this.heroX, this.heroY, dt, (dmg) => {
        this._heroTakeHit(dmg, enemy)
      })
    }

    // Hero auto-attack
    this.heroAttackTimer += dt
    const attackInterval = 1 / (this.heroStats.attackSpeed || 1)
    if (this.heroAttackTimer >= attackInterval) {
      this.heroAttackTimer -= attackInterval
      this._heroAutoAttack()
    }

    // Room cleared check
    if (this.enemies.length === 0 && this.phase === 'fighting') {
      const room = this._getCurrentRoom()
      room.state = 'cleared'
      this._emit('room_cleared', { roomId: room.id })

      if (room.type === 'boss') {
        this.phase = 'ended'
        this._emit('run_complete', {})
        return
      }

      this.phase = 'exploring'
      this._walkToNextRoom()
    }
  }

  _heroAutoAttack() {
    const target = this._findNearestEnemy()
    if (!target) return
    const dist = distance({ x: this.heroX, y: this.heroY }, { x: target.x, y: target.y })
    if (dist > (this.heroStats.attackRange || 65)) return

    const { damage, isCrit } = calculateDamage(this.heroStats, target.stats)
    target.currentHp -= damage
    this._emit('floating_number', { x: target.x, y: target.y, value: damage, isCrit })
    if (target.currentHp <= 0) this._killEnemy(target)
  }

  _heroTakeHit(rawDmg, enemy) {
    if (this.phase === 'ended') return

    let dmg = rawDmg
    const reduction = this.heroStats.damageReduction || 0
    dmg = Math.max(1, Math.round(dmg * (1 - reduction)))

    if (this.shield && this.shield.remaining > 0) {
      const absorbed = Math.min(this.shield.remaining, dmg)
      this.shield.remaining -= absorbed
      dmg -= absorbed
      if (this.shield.remaining <= 0) this.shield = null
    }

    this.heroHp -= dmg
    this._emit('hero_damaged', { damage: dmg })

    if (this.heroStats.retribution && Math.random() < this.heroStats.retribution.chance) {
      const reflected = Math.round(rawDmg * this.heroStats.retribution.multiplier)
      enemy.currentHp -= reflected
      this._emit('floating_number', { x: enemy.x, y: enemy.y, value: reflected, isCrit: false })
      if (enemy.currentHp <= 0) this._killEnemy(enemy)
    }

    if (this.heroHp <= 0) {
      this.heroHp = 0
      this.phase = 'ended'
      this._emit('hero_died', {})
    }
  }

  _killEnemy(enemy) {
    this.enemies = this.enemies.filter(e => e.instanceId !== enemy.instanceId)
    this._emit('enemy_killed', { enemy })

    const onKillHeal = this.heroStats.onKillHeal
    if (onKillHeal && onKillHeal > 0) {
      this.heroHp = Math.min(this.heroMaxHp, this.heroHp + onKillHeal)
      this._emit('floating_number', { x: this.heroX, y: this.heroY - 30, value: onKillHeal, isCrit: false })
    }

    const thorns = this.heroStats.thorns
    // thorns handled in _heroTakeHit — skip here

    if (Math.random() < enemy.lootChance) {
      const item = generateLoot(this.zoneId, enemy.archetype)
      const floorRef = { x: enemy.x, y: enemy.y, rarity: item.rarity }
      this.lootOnFloor.push(floorRef)
      this.lootTimers.push({ item, timer: 2.0, floorRef })
    }
  }

  _findNearestEnemy() {
    if (this.enemies.length === 0) return null
    let nearest = null
    let minDist = Infinity
    for (const e of this.enemies) {
      const d = distance({ x: this.heroX, y: this.heroY }, { x: e.x, y: e.y })
      if (d < minDist) { minDist = d; nearest = e }
    }
    return nearest
  }
}
```

- [ ] **Step 2: Run full suite**

```bash
npx vitest run
```

Expected: 39 tests pass. The engine has no unit tests of its own (integration-tested via smoke test in Task 8).

- [ ] **Step 3: Commit**

```bash
git add src/combat/CombatEngine.js
git commit -m "feat: CombatEngine rewrite — dungeon traversal, room state machine, mobile hero"
```

---

## Task 6: ArenaRenderer Rewrite

**Files:**
- Rewrite: `src/combat/ArenaRenderer.js`

The renderer now takes a `camera` parameter in `render(snapshot, camera)`. It draws rooms, corridors, enemies at world positions (offset by camera), and a minimap overlay in screen space.

- [ ] **Step 1: Replace `src/combat/ArenaRenderer.js` entirely**

```js
// src/combat/ArenaRenderer.js
const HERO_RADIUS = 14
const VIEWPORT_W = 800
const VIEWPORT_H = 500

const ROOM_FILL = '#0f0f1e'
const ROOM_STROKE = '#2a2a4a'
const CORRIDOR_FILL = '#111122'
const FLOOR_LINE = '#161628'

const RARITY_COLORS = {
  common: '#888',
  uncommon: '#2ecc71',
  rare: '#3498db',
  legendary: '#f39c12',
}

export class ArenaRenderer {
  constructor(ctx) {
    this.ctx = ctx
    this.floatingNumbers = []
  }

  addFloatingNumber(x, y, value, isCrit) {
    this.floatingNumbers.push({ x, y, value, isCrit, age: 0, maxAge: 1.2 })
  }

  render(snapshot, camera) {
    const { ctx } = this
    const { enemies, heroX, heroY, heroHpPct, isPaused, shield,
            floorLayout, lootOnFloor } = snapshot

    // Background
    ctx.fillStyle = '#0a0a14'
    ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)

    if (!floorLayout) return

    // Draw corridors first (below rooms)
    for (const corridor of floorLayout.corridors) {
      this._drawCorridor(ctx, corridor, camera)
    }

    // Draw rooms
    for (const room of floorLayout.rooms) {
      this._drawRoom(ctx, room, camera)
    }

    // Draw loot on floor
    for (const loot of lootOnFloor) {
      const s = camera.worldToScreen(loot.x, loot.y)
      if (!camera.isVisible(loot.x, loot.y)) continue
      ctx.fillStyle = RARITY_COLORS[loot.rarity] || '#888'
      ctx.fillRect(s.x - 5, s.y - 5, 10, 10)
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.strokeRect(s.x - 5, s.y - 5, 10, 10)
    }

    // Draw enemies
    for (const enemy of enemies) {
      if (!camera.isVisible(enemy.x, enemy.y)) continue
      const s = camera.worldToScreen(enemy.x, enemy.y)
      this._drawEnemy(ctx, enemy, s.x, s.y)
    }

    // Draw hero
    const heroS = camera.worldToScreen(heroX, heroY)
    this._drawHero(ctx, heroS.x, heroS.y, heroHpPct, shield)

    // Floating numbers (stored in world space, convert to screen)
    this.floatingNumbers = this.floatingNumbers.filter(n => n.age < n.maxAge)
    for (const n of this.floatingNumbers) {
      n.age += 0.016
      n.y -= 0.5  // move up in world space
      const ns = camera.worldToScreen(n.x, n.y)
      const alpha = 1 - n.age / n.maxAge
      ctx.globalAlpha = alpha
      ctx.font = n.isCrit ? 'bold 18px Georgia' : '14px Georgia'
      ctx.fillStyle = n.isCrit ? '#ffd700' : '#ffffff'
      ctx.textAlign = 'center'
      ctx.fillText(Math.round(n.value), ns.x, ns.y)
    }
    ctx.globalAlpha = 1

    // Pause overlay
    if (isPaused) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)
      ctx.fillStyle = '#f0c040'
      ctx.font = 'bold 32px Georgia'
      ctx.textAlign = 'center'
      ctx.fillText('PAUSED', VIEWPORT_W / 2, VIEWPORT_H / 2)
    }

    // Minimap (drawn last, in screen space — not camera-offset)
    this._drawMinimap(ctx, floorLayout, heroX, heroY)
  }

  _drawCorridor(ctx, corridor, camera) {
    if (!camera.isVisible(corridor.x + corridor.width / 2, corridor.y + corridor.height / 2, 200)) return
    const s = camera.worldToScreen(corridor.x, corridor.y)
    ctx.fillStyle = CORRIDOR_FILL
    ctx.fillRect(s.x, s.y, corridor.width, corridor.height)
    // subtle border
    ctx.strokeStyle = '#1a1a30'
    ctx.lineWidth = 1
    ctx.strokeRect(s.x, s.y, corridor.width, corridor.height)
  }

  _drawRoom(ctx, room, camera) {
    if (!camera.isVisible(room.x + room.width / 2, room.y + room.height / 2, 300)) return
    const s = camera.worldToScreen(room.x, room.y)

    // Room floor
    ctx.fillStyle = room.state === 'cleared' ? '#0d1016' : ROOM_FILL
    ctx.fillRect(s.x, s.y, room.width, room.height)

    // Floor grid lines
    ctx.strokeStyle = FLOOR_LINE
    ctx.lineWidth = 1
    for (let gx = room.x; gx < room.x + room.width; gx += 40) {
      const gs = camera.worldToScreen(gx, room.y)
      ctx.beginPath(); ctx.moveTo(gs.x, s.y); ctx.lineTo(gs.x, s.y + room.height); ctx.stroke()
    }
    for (let gy = room.y; gy < room.y + room.height; gy += 40) {
      const gs = camera.worldToScreen(room.x, gy)
      ctx.beginPath(); ctx.moveTo(s.x, gs.y); ctx.lineTo(s.x + room.width, gs.y); ctx.stroke()
    }

    // Room border
    const borderColor = room.type === 'boss' ? '#8e44ad'
      : room.type === 'elite' ? '#f39c12'
      : room.type === 'chest' ? '#2ecc71'
      : room.state === 'cleared' ? '#1a2a1a'
      : ROOM_STROKE
    ctx.strokeStyle = borderColor
    ctx.lineWidth = room.state === 'active' ? 2.5 : 1.5
    ctx.strokeRect(s.x, s.y, room.width, room.height)

    // Room type label (small, in corner, for debugging/feel)
    if (room.type === 'boss') {
      ctx.fillStyle = '#8e44ad'
      ctx.font = '10px Georgia'
      ctx.textAlign = 'left'
      ctx.fillText('☠ BOSS', s.x + 6, s.y + 14)
    } else if (room.type === 'elite') {
      ctx.fillStyle = '#f39c12'
      ctx.font = '9px Georgia'
      ctx.textAlign = 'left'
      ctx.fillText('⚡ ELITE', s.x + 6, s.y + 14)
    } else if (room.type === 'chest') {
      ctx.fillStyle = '#2ecc71'
      ctx.font = '9px Georgia'
      ctx.textAlign = 'left'
      ctx.fillText('💰', s.x + 6, s.y + 14)
    }
  }

  _drawHero(ctx, x, y, hpPct, shieldActive) {
    // Shield aura
    if (shieldActive) {
      ctx.beginPath()
      ctx.arc(x, y, HERO_RADIUS + 8, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(100,180,255,0.6)'
      ctx.lineWidth = 3
      ctx.stroke()
    }
    // Hero circle
    ctx.beginPath()
    ctx.arc(x, y, HERO_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = '#4a90d9'
    ctx.fill()
    ctx.strokeStyle = '#82c4ff'
    ctx.lineWidth = 2
    ctx.stroke()
    // HP ring
    if (hpPct < 1) {
      const startAngle = -Math.PI / 2
      const endAngle = startAngle + Math.PI * 2 * hpPct
      ctx.beginPath()
      ctx.arc(x, y, HERO_RADIUS + 5, startAngle, endAngle)
      ctx.strokeStyle = hpPct > 0.4 ? '#2ecc71' : '#e74c3c'
      ctx.lineWidth = 3
      ctx.stroke()
    }
  }

  _drawEnemy(ctx, enemy, x, y) {
    const { radius, color, currentHp, stats, isElite, isBoss } = enemy
    const hpPct = currentHp / stats.maxHp

    if (isElite || isBoss) {
      ctx.beginPath()
      ctx.arc(x, y, radius + 5, 0, Math.PI * 2)
      ctx.fillStyle = isBoss ? 'rgba(142,68,173,0.3)' : 'rgba(243,156,18,0.3)'
      ctx.fill()
    }

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    ctx.stroke()

    // HP bar
    const barW = radius * 2.5
    const barH = 4
    const barX = x - barW / 2
    const barY = y - radius - 10
    ctx.fillStyle = '#333'
    ctx.fillRect(barX, barY, barW, barH)
    ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c'
    ctx.fillRect(barX, barY, barW * hpPct, barH)
  }

  _drawMinimap(ctx, floorLayout, heroWorldX, heroWorldY) {
    const MAP_X = VIEWPORT_W - 128
    const MAP_Y = VIEWPORT_H - 92
    const MAP_W = 120
    const MAP_H = 84
    const PADDING = 4

    // Background
    ctx.fillStyle = 'rgba(5,5,15,0.88)'
    ctx.fillRect(MAP_X, MAP_Y, MAP_W, MAP_H)
    ctx.strokeStyle = '#2a2a4a'
    ctx.lineWidth = 1
    ctx.strokeRect(MAP_X, MAP_Y, MAP_W, MAP_H)

    // Label
    ctx.fillStyle = '#444'
    ctx.font = '7px Georgia'
    ctx.textAlign = 'center'
    ctx.fillText('MAP', MAP_X + MAP_W / 2, MAP_Y + 9)

    // Compute minimap scale: fit 5 cols × 4 rows into MAP area
    const innerW = MAP_W - PADDING * 2
    const innerH = MAP_H - PADDING * 2 - 12
    const roomNodeW = Math.floor(innerW / 5) - 2
    const roomNodeH = Math.floor(innerH / 4) - 2

    for (const corridor of floorLayout.corridors) {
      const fromRoom = floorLayout.rooms.find(r => r.id === corridor.fromRoomId)
      const toRoom = floorLayout.rooms.find(r => r.id === corridor.toRoomId)
      if (!fromRoom || !toRoom) continue
      const fx = MAP_X + PADDING + fromRoom.col * (roomNodeW + 2) + roomNodeW / 2
      const fy = MAP_Y + PADDING + 10 + fromRoom.row * (roomNodeH + 2) + roomNodeH / 2
      const tx = MAP_X + PADDING + toRoom.col * (roomNodeW + 2) + roomNodeW / 2
      const ty = MAP_Y + PADDING + 10 + toRoom.row * (roomNodeH + 2) + roomNodeH / 2
      ctx.strokeStyle = '#2a2a3a'
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke()
    }

    for (const room of floorLayout.rooms) {
      const rx = MAP_X + PADDING + room.col * (roomNodeW + 2)
      const ry = MAP_Y + PADDING + 10 + room.row * (roomNodeH + 2)

      let fill = '#111'
      let stroke = '#333'
      if (room.state === 'cleared') { fill = '#1a2a1a'; stroke = '#2ecc71' }
      else if (room.state === 'active') { fill = '#1a2a4a'; stroke = '#4a90d9' }
      else if (room.type === 'boss') stroke = '#8e44ad'
      else if (room.type === 'chest') stroke = '#2ecc71'
      else if (room.type === 'elite') stroke = '#f39c12'

      ctx.fillStyle = fill
      ctx.fillRect(rx, ry, roomNodeW, roomNodeH)
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1
      ctx.strokeRect(rx, ry, roomNodeW, roomNodeH)

      if (room.type === 'boss') {
        ctx.fillStyle = '#8e44ad'
        ctx.font = '6px Georgia'
        ctx.textAlign = 'center'
        ctx.fillText('☠', rx + roomNodeW / 2, ry + roomNodeH / 2 + 2)
      }
    }

    // Hero dot on minimap
    // Find which room the hero is in to get its grid position for hero dot
    const heroRoom = floorLayout.rooms.find(r => r.id ===
      floorLayout.rooms.reduce((closest, room) => {
        const cx = room.x + room.width / 2
        const cy = room.y + room.height / 2
        const d = Math.sqrt((heroWorldX - cx) ** 2 + (heroWorldY - cy) ** 2)
        const cd = closest
          ? Math.sqrt((heroWorldX - (closest.x + closest.width/2)) ** 2 + (heroWorldY - (closest.y + closest.height/2)) ** 2)
          : Infinity
        return d < cd ? room : closest
      }, null)?.id
    )

    if (heroRoom) {
      const hx = MAP_X + PADDING + heroRoom.col * (roomNodeW + 2) + roomNodeW / 2
      const hy = MAP_Y + PADDING + 10 + heroRoom.row * (roomNodeH + 2) + roomNodeH / 2
      ctx.beginPath()
      ctx.arc(hx, hy, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = '#4a90d9'
      ctx.fill()
    }
  }
}
```

- [ ] **Step 2: Run full suite**

```bash
npx vitest run
```

Expected: 39 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/combat/ArenaRenderer.js
git commit -m "feat: ArenaRenderer rewrite — dungeon rooms, camera rendering, minimap"
```

---

## Task 7: runStore, HUD, and GameCanvas Updates

**Files:**
- Modify: `src/store/runStore.js`
- Modify: `src/components/HUD.jsx`
- Modify: `src/components/GameCanvas.jsx`

- [ ] **Step 1: Update `src/store/runStore.js`**

Replace the `wave` and `betweenWaveTimer` fields with dungeon-appropriate fields. Find the initial state object and change:

```js
// OLD fields to remove:
wave: 1,
phase: 'idle',
betweenWaveTimer: 10,

// NEW fields to add:
floor: 1,
totalFloors: 1,
clearedRooms: 0,
totalRooms: 0,
```

Update `startRun(maxHp)`:
```js
startRun(maxHp) {
  set({
    isActive: true,
    floor: 1,
    totalFloors: 1,
    clearedRooms: 0,
    totalRooms: 0,
    currentHp: maxHp,
    enemies: [],
    pendingLoot: [],
    echoesEarned: 0,
    goldEarned: 0,
    isPaused: false,
  })
},
```

Remove `advanceWave`, `setPhase`, `betweenWaveTimer` actions. Add:
```js
setFloor(floor, totalFloors) {
  set({ floor, totalFloors })
},

setRoomProgress(clearedRooms, totalRooms) {
  set({ clearedRooms, totalRooms })
},
```

- [ ] **Step 2: Update `src/components/HUD.jsx`**

Replace the wave counter section. Find the `Zone {zone} / Wave {wave}/10` display and replace with:

```jsx
<div className="text-center min-w-[120px]">
  <div className="text-gold-400 font-bold text-sm">{snapshot.zoneName || `Zone ${snapshot.zone || 1}`}</div>
  <div className="text-xs text-gray-400">
    Floor {snapshot.floor || 1}/{snapshot.totalFloors || 1}
  </div>
  <div className="text-xs text-gray-500">
    {snapshot.clearedRooms || 0}/{snapshot.totalRooms || 0} rooms
  </div>
</div>
```

Also remove the `phase === 'between'` branch showing the between-wave timer — that concept no longer exists.

- [ ] **Step 3: Update `src/components/GameCanvas.jsx`**

**A) Add Camera import:**
```js
import { Camera } from '../combat/Camera'
```

**B) Create camera instance in useEffect:**
```js
const camera = new Camera(800, 500)
```

**C) Update the GameLoop render callback to pass camera:**
```js
() => {
  const snap = engine.getSnapshot()
  camera.follow(snap.heroX, snap.heroY, snap.dungeonBounds || { width: 800, height: 500 })
  renderer.render({ ...snap, isPaused: isPausedRef.current }, camera)
}
```

**D) Update `engine.startRun` call:**
Change `engine.startRun(heroStats, 1)` — the `1` is the zoneId. This is already correct. No change needed.

**E) Update `room_cleared` handler — remove the old `wave_cleared` handler entirely and add:**
```js
engine.on('room_cleared', ({ roomId }) => {
  // runStore doesn't need to track individual rooms — engine snapshot has this
})
```

**F) Remove the `wave_cleared` handler** (old code). The engine now emits `room_cleared` not `wave_cleared`.

- [ ] **Step 4: Run full suite**

```bash
npx vitest run
```

Expected: 39 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/store/runStore.js src/components/HUD.jsx src/components/GameCanvas.jsx
git commit -m "feat: update runStore, HUD, GameCanvas for dungeon room system"
```

---

## Task 8: Integration Verification

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: 39 tests pass across 6 files (DamageCalculator×5, LootGenerator×9, DungeonGenerator×6, RoomSpawner×4, OfflineSimulator×4, SaveManager×3, metaStore×8).

- [ ] **Step 2: Build for production**

```bash
npm run build
```

Expected: Build completes without errors.

- [ ] **Step 3: Start dev server and verify**

```bash
npm run dev
```

Open `http://localhost:5173` and verify:

1. MetaHub loads — CharacterPanel, InventoryPanel, VaultPanel, BlacksmithPanel all render
2. Click "Enter the Crypt" — combat canvas appears
3. Hero (blue circle) is visible in a dungeon room with visible walls and floor grid
4. Enemies spawn in the room and move toward the hero
5. Hero moves toward the nearest enemy
6. Combat plays out — damage numbers, enemies die
7. When room is cleared, hero walks through corridor to next room
8. Minimap in bottom-right shows rooms, current position (blue dot), cleared rooms (green)
9. HUD shows "Floor 1/2" and room progress
10. Boss room eventually reached — large enemy appears, killing it ends the run
11. RunEndScreen shows with echoes and gold
12. Return to hub — gear changes persist

- [ ] **Step 4: Fix any issues found**

Common issues:
- "Cannot read properties of undefined" on `floorLayouts` — check `CombatEngine.reset()` initializes `floorLayouts = []`
- Minimap not showing — check `getSnapshot()` returns `floorLayout` (not `floorLayouts[index]` where index is undefined)
- Hero not moving — check `heroMoveTargetX` is being set in `_walkToNextRoom()`
- Camera off center — check `camera.follow()` is called before `renderer.render()` in the GameLoop render callback

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: Phase 3A complete — dungeon room engine and story zones"
```
