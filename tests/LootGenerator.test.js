// tests/LootGenerator.test.js
import { describe, it, expect } from 'vitest'
import { generateLoot, rollRarity } from '../src/systems/LootGenerator'
import { RARITY_AFFIX_COUNT } from '../src/data/affixes'
import { SLOTS } from '../src/data/items'

describe('rollRarity', () => {
  it('boss always returns at least uncommon', () => {
    for (let i = 0; i < 100; i++) {
      const r = rollRarity('boss')
      expect(['uncommon', 'rare', 'legendary']).toContain(r)
    }
  })

  it('returns a valid rarity string', () => {
    const valid = ['common', 'uncommon', 'rare', 'legendary']
    expect(valid).toContain(rollRarity('normal'))
  })
})

describe('generateLoot', () => {
  it('returns item with correct affix count for common rarity', () => {
    const item = generateLoot(1, 'normal', 'common')
    expect(item.affixes.length).toBe(RARITY_AFFIX_COUNT.common)
  })

  it('returns item with correct affix count for rare rarity', () => {
    const item = generateLoot(1, 'normal', 'rare')
    expect(item.affixes.length).toBe(RARITY_AFFIX_COUNT.rare)
  })

  it('item slot is a valid slot', () => {
    const item = generateLoot(1, 'normal')
    expect(SLOTS).toContain(item.slot)
  })

  it('all affixes have values within their defined range', () => {
    for (let i = 0; i < 20; i++) {
      const item = generateLoot(1, 'normal', 'rare')
      for (const affix of item.affixes) {
        expect(affix.value).toBeGreaterThanOrEqual(affix.valueRange[0])
        expect(affix.value).toBeLessThanOrEqual(affix.valueRange[1])
      }
    }
  })

  it('item has required fields', () => {
    const item = generateLoot(1, 'normal')
    expect(item).toHaveProperty('id')
    expect(item).toHaveProperty('slot')
    expect(item).toHaveProperty('rarity')
    expect(item).toHaveProperty('affixes')
    expect(item).toHaveProperty('base')
  })
})
