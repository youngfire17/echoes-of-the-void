// src/store/shopStore.js
import { create } from 'zustand'
import { generateLoot } from '../systems/LootGenerator'

function generateShopStock() {
  return [
    generateLoot(1, 'normal'),
    generateLoot(1, 'normal'),
    generateLoot(1, 'normal'),
    generateLoot(1, 'elite'),
  ]
}

export const MANUAL_REFRESH_COST = 50

export const useShopStore = create((set) => ({
  stock: [],

  refreshStock() {
    set({ stock: generateShopStock() })
  },

  manualRefresh(spendGoldFn) {
    spendGoldFn(MANUAL_REFRESH_COST)
    set({ stock: generateShopStock() })
  },

  removeFromStock(itemId) {
    set(state => ({ stock: state.stock.filter(i => i.id !== itemId) }))
  },
}))
