import { describe, it, expect, beforeEach } from 'vitest'
import { save, load, clearSave, SAVE_VERSION } from '../src/systems/SaveManager'

// Mock localStorage for tests
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('SaveManager', () => {
  beforeEach(() => localStorage.clear())

  it('saved state can be loaded back as equal object', () => {
    const state = { version: SAVE_VERSION, echoes: 42, items: [{ id: 'item_1', slot: 'weapon' }] }
    save(state)
    const loaded = load()
    expect(loaded).toEqual(state)
  })

  it('load returns null when no save exists', () => {
    expect(load()).toBeNull()
  })

  it('clearSave causes subsequent load to return null', () => {
    save({ echoes: 10 })
    clearSave()
    expect(load()).toBeNull()
  })
})
