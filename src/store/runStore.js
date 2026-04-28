// src/store/runStore.js
import { create } from 'zustand'

export const useRunStore = create((set, get) => ({
  isActive: false,
  zone: 1,
  wave: 1,
  phase: 'idle',
  currentHp: 0,
  enemies: [],
  pendingLoot: [],
  echoesEarned: 0,
  goldEarned: 0,
  isPaused: false,
  betweenWaveTimer: 10,

  startRun(maxHp) {
    set({
      isActive: true,
      zone: 1,
      wave: 1,
      phase: 'wave',
      currentHp: maxHp,
      enemies: [],
      pendingLoot: [],
      echoesEarned: 0,
      goldEarned: 0,
      isPaused: false,
    })
  },

  endRun() {
    set({ isActive: false, phase: 'ended' })
  },

  setPhase(phase) {
    set({ phase })
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

  advanceWave() {
    set(state => ({ wave: state.wave + 1, phase: 'wave' }))
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
