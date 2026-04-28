// src/store/metaStore.js
import { create } from 'zustand'

// Vault passive node definitions
export const VAULT_NODES = [
  { id: 'hp_1',      label: '+25 Max HP',       cost: 10,  stat: 'maxHp',               value: 25 },
  { id: 'hp_2',      label: '+50 Max HP',        cost: 25,  stat: 'maxHp',               value: 50,  requires: 'hp_1' },
  { id: 'dmg_1',     label: '+5 Flat Damage',    cost: 10,  stat: 'damageFlat',          value: 5 },
  { id: 'dmg_2',     label: '+10 Flat Damage',   cost: 25,  stat: 'damageFlat',          value: 10,  requires: 'dmg_1' },
  { id: 'crit_1',    label: '+3% Crit Chance',   cost: 15,  stat: 'critChanceFlat',      value: 3 },
  { id: 'cdr_1',     label: '-8% Cooldowns',     cost: 20,  stat: 'cooldownReductionPct', value: 8 },
  { id: 'regen_1',   label: '+2 HP Regen/sec',   cost: 15,  stat: 'hpRegenFlat',         value: 2 },
  { id: 'armor_1',   label: '+10 Armor',         cost: 15,  stat: 'armorFlat',           value: 10 },
]

export const useMetaStore = create((set, get) => ({
  purchasedNodeIds: [],
  unlockedZones: [1],
  automationSettings: {
    autoEquip: true,
    autoSell: false,
    autoAbilities: false,
  },
  lastOfflineTimestamp: null,

  purchaseNode(nodeId, currentEchoes, spendEchoesFn) {
    const node = VAULT_NODES.find(n => n.id === nodeId)
    if (!node || get().purchasedNodeIds.includes(nodeId)) return false
    if (node.requires && !get().purchasedNodeIds.includes(node.requires)) return false
    if (currentEchoes < node.cost) return false
    spendEchoesFn(node.cost)
    set(state => ({ purchasedNodeIds: [...state.purchasedNodeIds, nodeId] }))
    return true
  },

  getVaultBonuses() {
    const { purchasedNodeIds } = get()
    const bonuses = {}
    for (const nodeId of purchasedNodeIds) {
      const node = VAULT_NODES.find(n => n.id === nodeId)
      if (node) bonuses[node.stat] = (bonuses[node.stat] || 0) + node.value
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
