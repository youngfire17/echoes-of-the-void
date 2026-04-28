// src/components/MetaHub.jsx
import { CharacterPanel } from './CharacterPanel'
import { InventoryPanel } from './InventoryPanel'
import { VaultPanel } from './VaultPanel'

export function MetaHub({ onStartRun }) {
  return (
    <div className="min-h-screen bg-void-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-bold text-gold-300 tracking-wider">Echoes of the Void</h1>
          <p className="text-gray-500 text-sm">Grimdark Idle RPG</p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => onStartRun(1)}
            className="px-12 py-4 bg-ember-500 hover:bg-ember-400 text-white text-lg font-bold rounded-lg border border-ember-400 transition-colors shadow-lg"
          >
            ⚔️ Enter the Crypt
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CharacterPanel />
          <InventoryPanel />
          <VaultPanel />
        </div>

        <p className="text-center text-gray-600 text-xs">
          Spacebar to pause combat · Click abilities to cast · Gear persists between runs
        </p>
      </div>
    </div>
  )
}
