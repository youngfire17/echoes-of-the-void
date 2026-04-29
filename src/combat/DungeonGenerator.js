// DungeonGenerator.js
// Generates a floor layout on a 5x4 grid with guaranteed connectivity.
// Grid is keyed by roomId (e.g. "room_2_3") so all lookups are consistent.

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
  return Math.random() < 0.05 ? 'massive' : 'medium'
}

function makeCorridor(fromRoom, toRoom) {
  const sameRow = fromRoom.row === toRoom.row
  if (sameRow) {
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
  // grid is keyed by roomId string so grid[room.id] always works
  const grid = {}

  // 1. Start room at col 0, random row
  const startRow = randomRow()
  const startSize = 'small'
  const startPos = roomWorldPos(0, startRow, startSize)
  const start = {
    id: roomId(0, startRow),
    type: 'start',
    col: 0, row: startRow,
    ...startPos,
    ...ROOM_SIZES[startSize],
    neighborIds: [],
    state: 'locked',
    enemyPack: [],
  }
  grid[start.id] = start

  // 2. Boss room at col 4 on final floor
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
    grid[bossRoom.id] = bossRoom
  }

  // 3. Random walk critical path — move rightward col-by-col, drifting toward target row
  const criticalPath = [start.id]
  let currentCol = 0
  let currentRow = startRow
  const targetRow = isFinalFloor ? bossRow : randomRow()

  while (currentCol < 4) {
    currentCol++

    // Drift toward target row with 60% probability
    if (currentRow < targetRow && Math.random() < 0.6) currentRow++
    else if (currentRow > targetRow && Math.random() < 0.6) currentRow--
    currentRow = Math.max(0, Math.min(GRID_ROWS - 1, currentRow))

    if (currentCol === 4 && isFinalFloor) {
      // Connect current path tail to existing boss room (may be at a different row)
      const prev = grid[criticalPath[criticalPath.length - 1]]
      if (prev && !prev.neighborIds.includes(bossRoom.id)) {
        prev.neighborIds.push(bossRoom.id)
        bossRoom.neighborIds.push(prev.id)
      }
      criticalPath.push(bossRoom.id)
      break
    }

    const id = roomId(currentCol, currentRow)

    if (!grid[id]) {
      const roll = Math.random()
      let type = 'standard'
      if (roll < 0.20) type = 'elite'
      else if (roll < 0.30) type = 'empty'

      const size = pickRoomSize(type)
      const pos = roomWorldPos(currentCol, currentRow, size)
      grid[id] = {
        id,
        type,
        col: currentCol, row: currentRow,
        ...pos,
        ...ROOM_SIZES[size],
        neighborIds: [],
        state: 'locked',
        enemyPack: [],
      }
    }

    const prev = grid[criticalPath[criticalPath.length - 1]]
    const curr = grid[id]
    if (curr && prev && !prev.neighborIds.includes(curr.id)) {
      prev.neighborIds.push(curr.id)
      curr.neighborIds.push(prev.id)
    }
    if (curr) criticalPath.push(curr.id)
  }

  // 4. Branch rooms — add 3-4 off critical path to reach 8-10 total rooms.
  // Critical path has 5 rooms (cols 0-4), so 3-4 branches → 8-9 total.
  const branchCount = 3 + Math.floor(Math.random() * 2) // 3 or 4
  let branchesAdded = 0
  let attempts = 0

  while (branchesAdded < branchCount && attempts < 50) {
    attempts++
    const parentId = criticalPath[Math.floor(Math.random() * criticalPath.length)]
    const parent = grid[parentId]
    if (!parent) continue

    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
    const dir = directions[Math.floor(Math.random() * directions.length)]
    const nc = parent.col + dir[0]
    const nr = parent.row + dir[1]

    if (nc < 0 || nc >= GRID_COLS || nr < 0 || nr >= GRID_ROWS) continue
    const bid = roomId(nc, nr)
    if (grid[bid]) continue

    const type = Math.random() < 0.4 ? 'chest' : Math.random() < 0.5 ? 'elite' : 'empty'
    const size = pickRoomSize(type)
    const pos = roomWorldPos(nc, nr, size)
    const room = {
      id: bid,
      type,
      col: nc, row: nr,
      ...pos,
      ...ROOM_SIZES[size],
      neighborIds: [],
      state: 'locked',
      enemyPack: [],
    }
    grid[bid] = room
    parent.neighborIds.push(room.id)
    room.neighborIds.push(parent.id)
    branchesAdded++
  }

  const rooms = Object.values(grid)

  // 5. Build corridors (deduplicated by sorted room ID pair)
  const corridorSet = new Set()
  const corridors = []
  for (const room of rooms) {
    for (const nid of room.neighborIds) {
      const ckey = [room.id, nid].sort().join('|')
      if (!corridorSet.has(ckey)) {
        corridorSet.add(ckey)
        const neighbor = grid[nid]
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
