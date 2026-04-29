// src/store/metaStore.js
import { create } from 'zustand'

export const VAULT_NODES = [
  { id: 'hp_1',    label: '+25 Max HP',       baseCost: 10,  stat: 'maxHp',               value: 25 },
  { id: 'hp_2',    label: '+50 Max HP',        baseCost: 25,  stat: 'maxHp',               value: 50,  requires: 'hp_1' },
  { id: 'dmg_1',   label: '+5 Flat Damage',    baseCost: 10,  stat: 'damageFlat',          value: 5 },
  { id: 'dmg_2',   label: '+10 Flat Damage',   baseCost: 25,  stat: 'damageFlat',          value: 10,  requires: 'dmg_1' },
  { id: 'crit_1',  label: '+3% Crit Chance',   baseCost: 15,  stat: 'critChanceFlat',      value: 3 },
  { id: 'cdr_1',   label: '-8% Cooldowns',     baseCost: 20,  stat: 'cooldownReductionPct', value: 8 },
  { id: 'regen_1', label: '+2 HP Regen/sec',   baseCost: 15,  stat: 'hpRegenFlat',         value: 2 },
  { id: 'armor_1', label: '+10 Armor',         baseCost: 15,  stat: 'armorFlat',           value: 10 },
]

export const useMetaStore = create((set, get) => ({
  nodeLevels: {},
  unlockedZones: [1],
  automationSettings: {
    autoEquip: true,
    autoSell: false,
    autoAbilities: false,
  },
  lastOfflineTimestamp: null,

  getNodeLevel(nodeId) {
    return get().nodeLevels[nodeId] ?? 0
  },

  getNodeCost(nodeId) {
    const node = VAULT_NODES.find(n => n.id === nodeId)
    if (!node) return Infinity
    const level = get().nodeLevels[nodeId] ?? 0
    return Math.round(node.baseCost * Math.pow(1.4, level))
  },

  purchaseNode(nodeId, currentEchoes, spendEchoesFn) {
    const node = VAULT_NODES.find(n => n.id === nodeId)
    if (!node) return false
    if (node.requires && (get().nodeLevels[node.requires] ?? 0) < 1) return false
    const cost = get().getNodeCost(nodeId)
    if (currentEchoes < cost) return false
    spendEchoesFn(cost)
    set(state => ({
      nodeLevels: { ...state.nodeLevels, [nodeId]: (state.nodeLevels[nodeId] ?? 0) + 1 }
    }))
    return true
  },

  getVaultBonuses() {
    const { nodeLevels } = get()
    const bonuses = {}
    for (const [nodeId, level] of Object.entries(nodeLevels)) {
      const node = VAULT_NODES.find(n => n.id === nodeId)
      if (node && level > 0) {
        bonuses[node.stat] = (bonuses[node.stat] || 0) + node.value * level
      }
    }
    return bonuses
  },

  unlockZone(zoneId) {
    set(state => ({
      unlockedZones: state.unlockedZones.includes(zoneId)
        ? state.unlockedZones
        : [...state.unlockedZones, zoneId]
    }))
  },

  setAutomation(key, value) {
    set(state => ({
      automationSettings: { ...state.automationSettings, [key]: value }
    }))
  },

  setOfflineTimestamp(ts) {
    set({ lastOfflineTimestamp: ts })
  },
}))
