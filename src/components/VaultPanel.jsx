// src/components/VaultPanel.jsx
import { useMetaStore, VAULT_NODES } from '../store/metaStore'
import { usePlayerStore } from '../store/playerStore'

export function VaultPanel() {
  const { nodeLevels, purchaseNode, getNodeLevel, getNodeCost } = useMetaStore()
  const { echoes, spendEchoes } = usePlayerStore()

  const handlePurchase = (nodeId) => {
    purchaseNode(nodeId, echoes, spendEchoes)
  }

  return (
    <div className="bg-void-900 border border-gray-700 rounded p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-gold-400 font-bold text-sm uppercase tracking-wide">The Vault</h3>
        <span className="text-yellow-300 text-sm font-bold">⚡ {echoes} Echoes</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {VAULT_NODES.map(node => {
          const level = getNodeLevel(node.id)
          const cost = getNodeCost(node.id)
          const requiresMet = !node.requires || getNodeLevel(node.requires) >= 1
          const canAfford = echoes >= cost
          const isLocked = !requiresMet

          return (
            <button
              key={node.id}
              onClick={() => !isLocked && canAfford && handlePurchase(node.id)}
              disabled={isLocked || !canAfford}
              className={`p-3 rounded border text-left text-sm transition-colors relative
                ${isLocked
                  ? 'border-gray-700 bg-void-900 opacity-40 cursor-not-allowed'
                  : canAfford
                    ? 'border-gray-500 bg-void-800 hover:border-echo-400 cursor-pointer'
                    : 'border-gray-700 bg-void-900 opacity-50 cursor-not-allowed'
                }`}
            >
              {level > 0 && (
                <span className="absolute top-1 right-1 text-xs text-gold-400 font-bold">Lv.{level}</span>
              )}
              <div className="font-semibold pr-6">{node.label}</div>
              <div className="text-xs mt-1 text-gray-400">
                {isLocked ? '🔒 Locked' : `⚡ ${cost} Echoes`}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
