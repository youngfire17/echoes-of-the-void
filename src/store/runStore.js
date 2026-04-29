// src/store/runStore.js
import { create } from 'zustand'

export const useRunStore = create((set, get) => ({
  isActive: false,
  zone: 1,
  floor: 1,
  totalFloors: 1,
  clearedRooms: 0,
  totalRooms: 0,
  currentHp: 0,
  enemies: [],
  pendingLoot: [],
  echoesEarned: 0,
  goldEarned: 0,
  isPaused: false,

  startRun(maxHp) {
    set({
      isActive: true,
      floor: 1,
      totalFloors: 1,
      clearedRooms: 0,
      totalRooms: 0,
      currentHp: maxHp,
      enemies: [],
      pendingLoot: [],
      echoesEarned: 0,
      goldEarned: 0,
      isPaused: false,
    })
  },

  endRun() {
    set({ isActive: false })
  },

  setFloor(floor, totalFloors) {
    set({ floor, totalFloors })
  },

  setRoomProgress(clearedRooms, totalRooms) {
    set({ clearedRooms, totalRooms })
  },

  setCurrentHp(hp) {
    set({ currentHp: Math.max(0, hp) })
  },

  addPendingLoot(item) {
    set(state => ({ pendingLoot: [...state.pendingLoot, item] }))
  },

  clearPendingLoot() {
    set({ pendingLoot: [] })
  },

  addEchoes(amount) {
    set(state => ({ echoesEarned: state.echoesEarned + amount }))
  },

  addGold(amount) {
    set(state => ({ goldEarned: state.goldEarned + amount }))
  },

  togglePause() {
    set(state => ({ isPaused: !state.isPaused }))
  },
}))
