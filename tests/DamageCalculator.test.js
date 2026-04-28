// tests/DamageCalculator.test.js
import { describe, it, expect, vi } from 'vitest'
import { calculateDamage } from '../src/combat/DamageCalculator'

const baseAttacker = {
  damageFlat: 10,
  strength: 20,
  critChance: 0,
  critDamage: 0.5,
  abilityDamagePct: 0,
}
const baseDefender = { armor: 0 }

describe('calculateDamage', () => {
  it('returns damage > 0 for basic attacker vs zero-armor defender', () => {
    const result = calculateDamage(baseAttacker, baseDefender)
    expect(result.damage).toBeGreaterThan(0)
  })

  it('applies crit multiplier when forced crit', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // 0 < any critChance → always crit
    const attacker = { ...baseAttacker, critChance: 1 }
    const normal = calculateDamage({ ...baseAttacker, critChance: 0 }, baseDefender)
    const crit = calculateDamage(attacker, baseDefender)
    expect(crit.damage).toBeGreaterThan(normal.damage)
    expect(crit.isCrit).toBe(true)
    vi.restoreAllMocks()
  })

  it('armor reduces damage', () => {
    const armoredDefender = { armor: 50 }
    const result = calculateDamage(baseAttacker, armoredDefender)
    const unarmored = calculateDamage(baseAttacker, baseDefender)
    expect(result.damage).toBeLessThan(unarmored.damage)
  })

  it('damage is never less than 1', () => {
    const weakAttacker = { damageFlat: 1, strength: 1, critChance: 0, critDamage: 0.5, abilityDamagePct: 0 }
    const heavyArmor = { armor: 9999 }
    const result = calculateDamage(weakAttacker, heavyArmor)
    expect(result.damage).toBeGreaterThanOrEqual(1)
  })

  it('returns integer damage', () => {
    const result = calculateDamage(baseAttacker, baseDefender)
    expect(Number.isInteger(result.damage)).toBe(true)
  })
})
