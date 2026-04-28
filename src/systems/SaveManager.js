const SAVE_KEY = 'echoes_of_the_void_save'

export const SAVE_VERSION = 1

export function save(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Save failed:', e)
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (typeof data !== 'object' || data === null || data.version !== SAVE_VERSION) {
      console.warn('Save version mismatch or invalid, clearing save')
      clearSave()
      return null
    }
    return data
  } catch (e) {
    console.error('Load failed, clearing corrupted save:', e)
    clearSave()
    return null
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY)
}

export function buildSaveState(playerStore, inventoryStore, metaStore) {
  return {
    version: SAVE_VERSION,
    classId: playerStore.classId,
    echoes: playerStore.echoes,
    equippedGear: playerStore.equippedGear,
    activeSkillIds: playerStore.activeSkillIds,
    passiveSkillIds: playerStore.passiveSkillIds,
    inventory: inventoryStore.items,
    stash: inventoryStore.stash,
    purchasedNodeIds: metaStore.purchasedNodeIds,
    unlockedZones: metaStore.unlockedZones,
    automationSettings: metaStore.automationSettings,
    lastOfflineTimestamp: Date.now(),
  }
}
