// src/store/inventoryStore.js
import { create } from 'zustand'

const MAX_INVENTORY_SLOTS = 20

export const useInventoryStore = create((set, get) => ({
  items: [],
  stash: [[], [], [], []],

  addItem(item) {
    set(state => {
      if (state.items.length >= MAX_INVENTORY_SLOTS) {
        const oldestCommonIdx = state.items.findIndex(i => i.rarity === 'common')
        if (oldestCommonIdx !== -1) {
          const remaining = [...state.items]
          remaining.splice(oldestCommonIdx, 1)
          return { items: [...remaining, item] }
        }
        return state
      }
      return { items: [...state.items, item] }
    })
  },

  removeItem(itemId) {
    set(state => ({ items: state.items.filter(i => i.id !== itemId) }))
  },

  sellItem(itemId) {
    set(state => ({ items: state.items.filter(i => i.id !== itemId) }))
  },

  moveToStash(itemId, tabIndex) {
    const { items, stash } = get()
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const newStash = stash.map((tab, i) => i === tabIndex ? [...tab, item] : tab)
    set({ items: items.filter(i => i.id !== itemId), stash: newStash })
  },

  moveFromStash(itemId, tabIndex) {
    const { items, stash } = get()
    if (items.length >= MAX_INVENTORY_SLOTS) return
    const tab = stash[tabIndex]
    const item = tab.find(i => i.id === itemId)
    if (!item) return
    const newStash = stash.map((t, i) => i === tabIndex ? t.filter(it => it.id !== itemId) : t)
    set({ items: [...items, item], stash: newStash })
  },
}))
