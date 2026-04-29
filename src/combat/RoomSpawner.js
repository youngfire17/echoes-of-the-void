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

  // standard
  const pool = [...zoneData.enemyPool.standard, ...zoneData.enemyPool.ranged]
  const count = 3 + Math.floor(Math.random() * 6)
  const pack = Array.from({ length: count }, (_, i) => {
    const id = pool[Math.floor(Math.random() * pool.length)]
    return buildInstance(id, room.id, i)
  })

  return { ...room, enemyPack: pack }
}
