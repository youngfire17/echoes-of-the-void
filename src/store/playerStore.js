// src/store/playerStore.js
import { create } from 'zustand'
import { CLASSES } from '../data/classes'
import { SKILLS } from '../data/skills'
import { useMetaStore } from './metaStore'

const DEFAULT_CLASS = 'warden'

function buildDerivedStats(baseStats, equippedGear, passiveSkills, vaultBonuses = {}) {
  const stats = { ...baseStats }

  // Apply gear base values and affixes
  for (const item of Object.values(equippedGear)) {
    if (!item) continue
    stats.damageFlat = (stats.damageFlat || 0) + (item.base?.baseDamage || 0)
    stats.armor = (stats.armor || 0) + (item.base?.baseArmor || 0)
    for (const affix of item.affixes || []) {
      if (affix.stat) {
        stats[affix.stat] = (stats[affix.stat] || 0) + affix.value
      }
    }
  }

  // Apply passive skills
  for (const skillId of passiveSkills) {
    const skill = SKILLS[skillId]
    if (!skill) continue
    if (skill.effect.type === 'on_hit_retaliate') {
      stats.retribution = { chance: skill.effect.chance, multiplier: skill.effect.multiplier }
      continue
    }
    if (skill.effect.type !== 'stat_bonus') continue
    const { stat, percent, flat } = skill.effect
    if (percent !== undefined) stats[stat] = (stats[stat] || 0) * (1 + percent)
    if (flat !== undefined) stats[stat] = (stats[stat] || 0) + flat
  }

  // Apply vault bonuses
  for (const [stat, value] of Object.entries(vaultBonuses)) {
    stats[stat] = (stats[stat] || 0) + value
  }

  // Fold accumulated modifiers into final derived values
  if (stats.attackSpeedPct) stats.attackSpeed = (stats.attackSpeed || 1) * (1 + stats.attackSpeedPct / 100)
  if (stats.maxHpFlat) stats.maxHp = (stats.maxHp || 0) + stats.maxHpFlat
  if (stats.armorFlat) stats.armor = (stats.armor || 0) + stats.armorFlat
  if (stats.strengthFlat) stats.strength = (stats.strength || 0) + stats.strengthFlat
  if (stats.vitalityFlat) stats.vitality = (stats.vitality || 0) + stats.vitalityFlat
  if (stats.critChanceFlat) stats.critChance = (stats.critChance || 0) + stats.critChanceFlat / 100
  if (stats.critDamagePct) stats.critDamage = (stats.critDamage || 0) + stats.critDamagePct / 100
  if (stats.cooldownReductionPct) stats.cooldownReduction = (stats.cooldownReductionPct || 0) / 100
  if (stats.damageReductionPct) stats.damageReduction = (stats.damageReduction || 0) + stats.damageReductionPct / 100

  return stats
}

export const usePlayerStore = create((set, get) => ({
  classId: DEFAULT_CLASS,
  echoes: 0,
  equippedGear: { weapon: null, offhand: null, helm: null, chest: null, ring: null, amulet: null },
  activeSkillIds: [...CLASSES[DEFAULT_CLASS].activeSkillIds],
  passiveSkillIds: [...CLASSES[DEFAULT_CLASS].passiveSkillIds],

  getStats() {
    const { classId, equippedGear, passiveSkillIds } = get()
    const base = CLASSES[classId].baseStats
    const vaultBonuses = useMetaStore.getState().getVaultBonuses()
    return buildDerivedStats(base, equippedGear, passiveSkillIds, vaultBonuses)
  },

  equipItem(item) {
    set(state => ({
      equippedGear: { ...state.equippedGear, [item.slot]: item }
    }))
  },

  unequipItem(slot) {
    set(state => ({
      equippedGear: { ...state.equippedGear, [slot]: null }
    }))
  },

  addEchoes(amount) {
    set(state => ({ echoes: state.echoes + amount }))
  },

  spendEchoes(amount) {
    set(state => ({ echoes: Math.max(0, state.echoes - amount) }))
  },
}))
