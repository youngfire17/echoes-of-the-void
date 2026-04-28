// tests/WaveSpawner.test.js
import { describe, it, expect } from 'vitest'
import { getWaveConfig, buildSpawnQueue } from '../src/combat/WaveSpawner'
import { ENEMIES } from '../src/data/enemies'

describe('getWaveConfig', () => {
  it('wave 10 of zone 1 is a boss wave', () => {
    const config = getWaveConfig(1, 10)
    expect(config.isBoss).toBe(true)
  })

  it('wave 1 of zone 1 is not a boss wave', () => {
    const config = getWaveConfig(1, 1)
    expect(config.isBoss).toBe(false)
  })

  it('wave 5+ of zone 1 can have an elite', () => {
    const config = getWaveConfig(1, 5)
    expect(config.hasElite).toBe(true)
  })

  it('wave 1 enemies list has at least one entry', () => {
    const config = getWaveConfig(1, 1)
    expect(config.enemies.length).toBeGreaterThan(0)
  })
})

describe('buildSpawnQueue', () => {
  it('boss wave produces exactly one enemy with archetype boss', () => {
    const queue = buildSpawnQueue(1, 10)
    expect(queue.length).toBe(1)
    expect(queue[0].archetype).toBe('boss')
  })

  it('all enemy IDs in spawn queue exist in ENEMIES', () => {
    for (let wave = 1; wave <= 9; wave++) {
      const queue = buildSpawnQueue(1, wave)
      for (const enemy of queue) {
        expect(ENEMIES).toHaveProperty(enemy.id)
      }
    }
  })

  it('spawn queue enemies have instanceId, currentHp, stats, and spawnDelay', () => {
    const queue = buildSpawnQueue(1, 1)
    for (const enemy of queue) {
      expect(enemy).toHaveProperty('instanceId')
      expect(enemy).toHaveProperty('currentHp')
      expect(enemy).toHaveProperty('stats')
      expect(enemy).toHaveProperty('spawnDelay')
    }
  })

  it('boss wave bossId exists in ENEMIES data', () => {
    const config = getWaveConfig(1, 10)
    expect(config.isBoss).toBe(true)
    expect(ENEMIES).toHaveProperty(config.bossId)
  })
})
