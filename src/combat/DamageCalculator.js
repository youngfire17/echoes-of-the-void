// src/combat/DamageCalculator.js
export function calculateDamage(attackerStats, defenderStats, isAbility = false) {
  const base = (attackerStats.damageFlat || 0) + (attackerStats.strength || 0) * 0.1
  const abilityBonus = isAbility ? (1 + (attackerStats.abilityDamagePct || 0) / 100) : 1
  const isCrit = Math.random() < (attackerStats.critChance || 0)
  const critMult = isCrit ? (1 + (attackerStats.critDamage || 0.5)) : 1
  const raw = base * abilityBonus * critMult
  const armor = defenderStats.armor || 0
  const reduction = armor / (armor + 100)
  const final = raw * (1 - reduction)
  return { damage: Math.max(1, Math.round(final)), isCrit }
}
