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
