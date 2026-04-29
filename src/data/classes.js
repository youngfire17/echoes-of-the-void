// src/data/classes.js
export const CLASSES = {
  warden: {
    id: 'warden',
    name: 'Warden',
    description: 'Heavily armored guardian. High survivability, punishing counterattacks.',
    primaryStat: 'strength',
    color: '#4a90d9',
    baseStats: {
      maxHp: 150,
      strength: 18,
      agility: 8,
      intellect: 5,
      vitality: 14,
      attackSpeed: 1.2,
      attackRange: 65,
      moveSpeed: 120,
      damageFlat: 8,
      critChance: 0.05,
      critDamage: 0.5,
      armor: 15,
    },
    activeSkillIds: ['shield_slam', 'holy_light', 'consecration', 'divine_barrier'],
    passiveSkillIds: ['iron_will', 'blessed_armor', 'battle_hardened', 'retribution'],
  },
}
