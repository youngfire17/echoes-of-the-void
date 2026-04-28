const SAVE_KEY = 'echoes_of_the_void_save'

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
    return JSON.parse(raw)
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
