import { describe, it, expect } from 'vitest'
import { calculateOfflineProgress } from '../src/systems/OfflineSimulator'

const strongStats = { maxHp: 200, damageFlat: 30, attackSpeed: 1.5, critChance: 0.1, armor: 20 }
const weakStats = { maxHp: 50, damageFlat: 5, attackSpeed: 0.8, critChance: 0, armor: 0 }

describe('calculateOfflineProgress', () => {
  it('returns zero progress for zero elapsed time', () => {
    const result = calculateOfflineProgress(strongStats, 1, 1, 0)
    expect(result.wavesCleared).toBe(0)
    expect(result.gold).toBe(0)
    expect(result.echoes).toBe(0)
  })

  it('caps progress at 8 hours', () => {
    const tenHoursMs = 10 * 60 * 60 * 1000
    const eightHoursMs = 8 * 60 * 60 * 1000
    const tenH = calculateOfflineProgress(strongStats, 1, 1, tenHoursMs)
    const eightH = calculateOfflineProgress(strongStats, 1, 1, eightHoursMs)
    expect(tenH.wavesCleared).toBe(eightH.wavesCleared)
  })

  it('stronger stats produce more waves cleared in same time', () => {
    const oneHourMs = 60 * 60 * 1000
    const strongResult = calculateOfflineProgress(strongStats, 1, 1, oneHourMs)
    const weakResult = calculateOfflineProgress(weakStats, 1, 1, oneHourMs)
    expect(strongResult.wavesCleared).toBeGreaterThan(weakResult.wavesCleared)
  })

  it('gold and echoes scale with waves cleared', () => {
    const oneHourMs = 60 * 60 * 1000
    const result = calculateOfflineProgress(strongStats, 1, 1, oneHourMs)
    if (result.wavesCleared > 0) {
      expect(result.gold).toBeGreaterThan(0)
      expect(result.echoes).toBeGreaterThan(0)
    }
  })
})
