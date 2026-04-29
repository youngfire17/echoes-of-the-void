// src/systems/LootGenerator.js
import { AFFIXES, RARITY_AFFIX_COUNT } from '../data/affixes'
import { BASE_ITEMS, SLOTS } from '../data/items'
import { generateId, randomBetween } from '../utils'

export function rollRarity(enemyArchetype, forcedRarity = null) {
  if (forcedRarity) return forcedRarity
  const roll = Math.random()
  if (enemyArchetype === 'boss') {
    if (roll < 0.05) return 'legendary'
    if (roll < 0.35) return 'rare'
    return 'uncommon'
  }
  if (enemyArchetype === 'elite') {
    if (roll < 0.02) return 'legendary'
    if (roll < 0.18) return 'rare'
    if (roll < 0.55) return 'uncommon'
    return 'common'
  }
  if (roll < 0.005) return 'legendary'
  if (roll < 0.05) return 'rare'
  if (roll < 0.22) return 'uncommon'
  return 'common'
}

function rollAffixes(slot, rarity, count) {
  const rarityIndex = ['common', 'uncommon', 'rare', 'legendary'].indexOf(rarity)
  const eligible = AFFIXES.filter(a =>
    a.slots.includes(slot) && a.minRarity <= rarityIndex
  )
  const selected = []
  const pool = [...eligible]
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    const affix = pool.splice(idx, 1)[0]
    const value = randomBetween(affix.valueRange[0], affix.valueRange[1])
    selected.push({ ...affix, value })
  }
  return selected
}

export function generateLoot(zone, enemyArchetype, forcedRarity = null) {
  const rarity = rollRarity(enemyArchetype, forcedRarity)
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)]
  const base = BASE_ITEMS[slot]
  const affixCount = RARITY_AFFIX_COUNT[rarity]
  const affixes = rollAffixes(slot, rarity, affixCount)
  return {
    id: generateId(),
    slot,
    rarity,
    base,
    affixes,
    zone,
    name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${base.name}`,
  }
}

export function rerollItemAffixes(item) {
  const affixCount = RARITY_AFFIX_COUNT[item.rarity]
  const affixes = rollAffixes(item.slot, item.rarity, affixCount)
  return { ...item, affixes }
}
