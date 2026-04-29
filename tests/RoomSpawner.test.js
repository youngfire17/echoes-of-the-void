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
