// src/data/affixes.js
// valueRange: [min, max] — rolled as integer
export const AFFIXES = [
  { id: 'flat_damage',      tag: 'physical', stat: 'damageFlat',          label: '+{v} Physical Damage',    valueRange: [3, 10],  slots: ['weapon', 'ring', 'amulet'],  minRarity: 0 },
  { id: 'attack_speed',     tag: 'physical', stat: 'attackSpeedPct',      label: '+{v}% Attack Speed',       valueRange: [4, 12],  slots: ['weapon', 'ring'],            minRarity: 0 },
  { id: 'crit_chance',      tag: 'physical', stat: 'critChanceFlat',      label: '+{v}% Crit Chance',        valueRange: [2, 6],   slots: ['helm', 'ring', 'amulet'],    minRarity: 1 },
  { id: 'crit_damage',      tag: 'physical', stat: 'critDamagePct',       label: '+{v}% Crit Damage',        valueRange: [10, 25], slots: ['ring', 'amulet'],            minRarity: 1 },
  { id: 'flat_hp',          tag: 'physical', stat: 'maxHpFlat',           label: '+{v} Maximum HP',          valueRange: [10, 35], slots: ['helm', 'chest', 'ring', 'offhand'], minRarity: 0 },
  { id: 'hp_regen',         tag: 'physical', stat: 'hpRegenFlat',         label: '+{v} HP Regen/sec',        valueRange: [1, 5],   slots: ['chest', 'ring', 'amulet', 'offhand'], minRarity: 0 },
  { id: 'armor',            tag: 'physical', stat: 'armorFlat',           label: '+{v} Armor',               valueRange: [5, 18],  slots: ['helm', 'chest', 'offhand'],  minRarity: 0 },
  { id: 'damage_reduction', tag: 'physical', stat: 'damageReductionPct',  label: '+{v}% Damage Reduction',   valueRange: [2, 7],   slots: ['chest', 'offhand'],          minRarity: 1 },
  { id: 'on_kill_heal',     tag: 'physical', stat: 'onKillHeal',           label: 'Kill: Restore {v} HP',     valueRange: [2, 8],   slots: ['weapon', 'ring'],            minRarity: 1, effectType: 'on_kill_heal' },
  { id: 'cooldown_reduction', tag: 'arcane', stat: 'cooldownReductionPct',label: '-{v}% Cooldowns',          valueRange: [5, 15],  slots: ['helm', 'ring', 'amulet'],    minRarity: 1 },
  { id: 'ability_damage',   tag: 'arcane',   stat: 'abilityDamagePct',    label: '+{v}% Ability Damage',     valueRange: [8, 20],  slots: ['weapon', 'ring', 'amulet'],  minRarity: 1 },
  { id: 'strength_bonus',   tag: 'physical', stat: 'strengthFlat',        label: '+{v} Strength',            valueRange: [2, 6],   slots: ['helm', 'chest', 'amulet'],   minRarity: 0 },
  { id: 'vitality_bonus',   tag: 'physical', stat: 'vitalityFlat',        label: '+{v} Vitality',            valueRange: [2, 6],   slots: ['helm', 'chest', 'ring'],     minRarity: 0 },
  { id: 'thorns',           tag: 'physical', stat: 'thorns',              label: 'Return {v} damage when hit', valueRange: [3, 10], slots: ['chest', 'offhand'],          minRarity: 2, effectType: 'thorns' },
]

export const RARITY_AFFIX_COUNT = {
  common: 1,
  uncommon: 2,
  rare: 3,
  legendary: 3,
}

export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'legendary']
