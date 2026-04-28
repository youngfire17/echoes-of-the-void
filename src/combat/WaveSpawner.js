// src/combat/WaveSpawner.js
import { ZONES } from '../data/zones'
import { ENEMIES } from '../data/enemies'

export function getWaveConfig(zoneId, waveNumber) {
  const zone = ZONES[zoneId]
  if (!zone) throw new Error(`Zone ${zoneId} not found`)
  const waveIndex = waveNumber - 1
  const waveDef = zone.waves[waveIndex]
  if (!waveDef) throw new Error(`Wave ${waveNumber} not found in zone ${zoneId}`)
  return waveDef
}

export function buildSpawnQueue(zoneId, waveNumber) {
  const config = getWaveConfig(zoneId, waveNumber)
  const queue = []

  // Boss wave: use bossId, not the enemies array
  if (config.isBoss && config.bossId) {
    const bossDef = ENEMIES[config.bossId]
    queue.push({
      ...bossDef,
      instanceId: `${config.bossId}_w${waveNumber}_boss`,
      currentHp: bossDef.baseStats.maxHp,
      stats: { ...bossDef.baseStats },
      attackTimer: 0,
      spawnDelay: 0,
      isBoss: true,
    })
    return queue
  }

  // Regular enemies
  for (const entry of config.enemies) {
    const enemyDef = ENEMIES[entry.id]
    for (let i = 0; i < entry.count; i++) {
      queue.push({
        ...enemyDef,
        instanceId: `${entry.id}_w${waveNumber}_${i}`,
        currentHp: enemyDef.baseStats.maxHp,
        stats: { ...enemyDef.baseStats },
        attackTimer: 0,
        spawnDelay: i * 0.4,
      })
    }
  }

  // Elite enemy (appended after regular enemies)
  if (config.hasElite && config.eliteId) {
    const eliteDef = ENEMIES[config.eliteId]
    queue.push({
      ...eliteDef,
      instanceId: `${config.eliteId}_w${waveNumber}_elite`,
      currentHp: eliteDef.baseStats.maxHp,
      stats: { ...eliteDef.baseStats },
      attackTimer: 0,
      spawnDelay: queue.length * 0.4 + 1.0,
      isElite: true,
    })
  }

  return queue
}
