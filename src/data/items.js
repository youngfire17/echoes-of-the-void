// src/data/items.js
export const BASE_ITEMS = {
  weapon:  { id: 'weapon',  name: 'Weapon',  slot: 'weapon',  baseDamage: 5, baseArmor: 0 },
  offhand: { id: 'offhand', name: 'Offhand', slot: 'offhand', baseDamage: 0, baseArmor: 6 },
  helm:    { id: 'helm',    name: 'Helm',    slot: 'helm',    baseDamage: 0, baseArmor: 4 },
  chest:   { id: 'chest',   name: 'Chest',   slot: 'chest',   baseDamage: 0, baseArmor: 9 },
  ring:    { id: 'ring',    name: 'Ring',    slot: 'ring',    baseDamage: 0, baseArmor: 0 },
  amulet:  { id: 'amulet',  name: 'Amulet',  slot: 'amulet',  baseDamage: 0, baseArmor: 0 },
}

export const SLOTS = Object.keys(BASE_ITEMS)
