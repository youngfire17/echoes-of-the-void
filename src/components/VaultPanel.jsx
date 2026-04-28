import { useMetaStore, VAULT_NODES } from '../store/metaStore'
import { usePlayerStore } from '../store/playerStore'

export function VaultPanel() {
  const { purchasedNodeIds, purchaseNode } = useMetaStore()
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
          const purchased = purchasedNodeIds.includes(node.id)
          const requiresMet = !node.requires || purchasedNodeIds.includes(node.requires)
          const canAfford = echoes >= node.cost
          const available = requiresMet && !purchased

          return (
            <button
              key={node.id}
              onClick={() => available && canAfford && handlePurchase(node.id)}
              disabled={purchased || !requiresMet || !canAfford}
              className={`p-3 rounded border text-left text-sm transition-colors
                ${purchased
                  ? 'border-gold-500 bg-gold-500 bg-opacity-10 text-gold-300 cursor-default'
                  : available && canAfford
                    ? 'border-gray-500 bg-void-800 hover:border-echo-400 cursor-pointer'
                    : 'border-gray-700 bg-void-900 opacity-40 cursor-not-allowed'
                }`}
            >
              <div className="font-semibold">{node.label}</div>
              <div className="text-xs mt-1 text-gray-400">
                {purchased
                  ? '✓ Purchased'
                  : !requiresMet
                    ? '🔒 Locked'
                    : `⚡ ${node.cost} Echoes`}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
