// src/App.jsx
import { useState, useEffect } from 'react'
import { MetaHub } from './components/MetaHub'
import { GameCanvas } from './components/GameCanvas'
import { RunEndScreen } from './components/RunEndScreen'
import { usePlayerStore } from './store/playerStore'
import { useInventoryStore } from './store/inventoryStore'
import { useMetaStore } from './store/metaStore'
import { load, save, buildSaveState } from './systems/SaveManager'
import { calculateOfflineProgress } from './systems/OfflineSimulator'

export default function App() {
  const [view, setView] = useState('hub')   // 'hub' | 'combat' | 'runend'
  const [runResult, setRunResult] = useState(null)
  const [offlineReward, setOfflineReward] = useState(null)

  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const metaStore = useMetaStore()

  // Load save + calculate offline progress on mount
  useEffect(() => {
    const saved = load()
    if (!saved) return

    // Restore player store
    if (typeof saved.echoes === 'number') usePlayerStore.setState({ echoes: saved.echoes })
    if (saved.equippedGear) {
      Object.entries(saved.equippedGear).forEach(([slot, item]) => {
        if (item) usePlayerStore.getState().equipItem(item)
      })
    }
    if (saved.activeSkillIds) {
      // Skills are set at class selection; for MVP the default warden loadout is fine
    }

    // Restore inventory
    if (saved.inventory) {
      saved.inventory.forEach(item => useInventoryStore.getState().addItem(item))
    }
    if (saved.stash) {
      useInventoryStore.setState({ stash: saved.stash })
    }

    // Restore meta store state by reconstructing the arrays
    if (saved.purchasedNodeIds) {
      saved.purchasedNodeIds.forEach(nodeId => {
        // Directly purchase without echoes check since we're restoring a save
        useMetaStore.setState(state => ({
          purchasedNodeIds: state.purchasedNodeIds.includes(nodeId)
            ? state.purchasedNodeIds
            : [...state.purchasedNodeIds, nodeId]
        }))
      })
    }
    if (saved.unlockedZones) {
      useMetaStore.setState({ unlockedZones: saved.unlockedZones })
    }
    if (saved.automationSettings) {
      useMetaStore.setState({ automationSettings: saved.automationSettings })
    }

    // Calculate offline progress
    if (saved.lastOfflineTimestamp) {
      const elapsed = Date.now() - saved.lastOfflineTimestamp
      if (elapsed > 60 * 1000) {
        const stats = usePlayerStore.getState().getStats()
        const progress = calculateOfflineProgress(stats, 1, 1, elapsed)
        if (progress.wavesCleared > 0) {
          usePlayerStore.getState().addEchoes(progress.echoes)
          setOfflineReward(progress)
        }
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const state = buildSaveState(
        usePlayerStore.getState(),
        useInventoryStore.getState(),
        useMetaStore.getState()
      )
      save(state)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Save on tab visibility change (backgrounded/closed)
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden') {
        const state = buildSaveState(
          usePlayerStore.getState(),
          useInventoryStore.getState(),
          useMetaStore.getState()
        )
        save(state)
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  const handleStartRun = () => {
    setView('combat')
  }

  const handleRunEnd = (result) => {
    setRunResult(result)
    setView('runend')
    // Save immediately after run ends
    const state = buildSaveState(
      usePlayerStore.getState(),
      useInventoryStore.getState(),
      useMetaStore.getState()
    )
    save(state)
  }

  const handleReturnToHub = () => {
    setRunResult(null)
    setView('hub')
  }

  return (
    <>
      {/* Offline reward toast */}
      {offlineReward && (
        <div className="fixed top-4 right-4 z-50 bg-void-800 border border-echo-400 rounded p-4 text-sm shadow-xl max-w-xs">
          <div className="font-bold text-echo-300 mb-1">Welcome back!</div>
          <div className="text-gray-300 mb-1">
            Cleared {offlineReward.wavesCleared} waves while away
          </div>
          <div className="text-yellow-300">
            +{offlineReward.echoes} Echoes
          </div>
          <button
            onClick={() => setOfflineReward(null)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {view === 'hub' && <MetaHub onStartRun={handleStartRun} />}
      {view === 'combat' && <GameCanvas onRunEnd={handleRunEnd} />}
      {view === 'runend' && runResult && (
        <RunEndScreen result={runResult} onReturn={handleReturnToHub} />
      )}
    </>
  )
}
