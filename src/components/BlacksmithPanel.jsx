// src/components/BlacksmithPanel.jsx
import { useState } from 'react'
import { useShopStore, MANUAL_REFRESH_COST } from '../store/shopStore'
import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore } from '../store/inventoryStore'
import { rerollItemAffixes } from '../systems/LootGenerator'

const BUY_PRICES = { common: 30, uncommon: 80, rare: 200, legendary: 600 }
const REROLL_PRICES = { common: 20, uncommon: 50, rare: 150, legendary: 500 }

const RARITY_COLORS = {
  common:    'border-gray-500 text-gray-400',
  uncommon:  'border-green-600 text-green-400',
  rare:      'border-blue-500 text-blue-300',
  legendary: 'border-yellow-500 text-yellow-300',
}

function ShopTab() {
  const { stock, manualRefresh, removeFromStock } = useShopStore()
  const { gold, spendGold } = usePlayerStore()
  const { items, addItem } = useInventoryStore()

  const handleBuy = (item) => {
    const price = BUY_PRICES[item.rarity]
    if (gold < price || items.length >= 20) return
    spendGold(price)
    addItem(item)
    removeFromStock(item.id)
  }

  const handleManualRefresh = () => {
    if (gold < MANUAL_REFRESH_COST) return
    manualRefresh(usePlayerStore.getState().spendGold)
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Refreshes after each run</span>
        <button
          onClick={handleManualRefresh}
          disabled={gold < MANUAL_REFRESH_COST}
          className="text-xs px-2 py-1 border border-gray-600 rounded hover:border-gold-400 disabled:opacity-40"
        >
          🔄 {MANUAL_REFRESH_COST}g
        </button>
      </div>

      {stock.length === 0 ? (
        <div className="text-center text-gray-600 text-sm py-6">
          Complete a run to stock the shop
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {stock.map(item => {
            const price = BUY_PRICES[item.rarity]
            const canAfford = gold >= price
            const inventoryFull = items.length >= 20
            const color = RARITY_COLORS[item.rarity]
            const tooltip = [item.name, ...item.affixes.map(a => a.label.replace('{v}', a.value))].join('\n')
            return (
              <div key={item.id} className={`border-2 rounded p-2 ${color} bg-void-800`} title={tooltip}>
                <div className="text-xs font-bold truncate">{item.name}</div>
                <div className="text-xs text-gray-500 mb-2 capitalize">{item.slot}</div>
                <button
                  onClick={() => handleBuy(item)}
                  disabled={!canAfford || inventoryFull}
                  className="w-full text-xs py-1 bg-void-700 border border-gray-600 rounded hover:border-gold-400 disabled:opacity-40"
                >
                  {inventoryFull ? 'Inv. Full' : `💰 ${price}g`}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function RerollTab() {
  const [selectedId, setSelectedId] = useState(null)
  const { gold, spendGold } = usePlayerStore()
  const { items } = useInventoryStore()

  const selected = items.find(i => i.id === selectedId)
  const price = selected ? REROLL_PRICES[selected.rarity] : 0
  const canAfford = gold >= price

  const handleReroll = () => {
    if (!selected || !canAfford) return
    spendGold(price)
    const rerolled = rerollItemAffixes(selected)
    useInventoryStore.getState().removeItem(selected.id)
    useInventoryStore.getState().addItem(rerolled)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Select an item to reroll its affixes</p>

      {items.length === 0 ? (
        <div className="text-center text-gray-600 text-sm py-4">No items in inventory</div>
      ) : (
        <div className="grid grid-cols-5 gap-1 max-h-28 overflow-y-auto">
          {items.map(item => {
            const color = RARITY_COLORS[item.rarity]
            const isSelected = selectedId === item.id
            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                title={item.name}
                className={`h-12 w-12 border-2 rounded cursor-pointer flex flex-col items-center justify-center text-xs ${color}
                  ${isSelected ? 'bg-void-700 ring-2 ring-gold-400' : 'bg-void-800 hover:bg-void-700'}`}
              >
                <span>{item.slot.slice(0, 3)}</span>
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <div className="bg-void-800 rounded p-3 space-y-1">
          <div className={`text-sm font-bold ${RARITY_COLORS[selected.rarity].split(' ')[1]}`}>
            {selected.name}
          </div>
          {selected.affixes.map((a, i) => (
            <div key={i} className="text-xs text-gray-400">
              {a.label.replace('{v}', a.value)}
            </div>
          ))}
          <button
            onClick={handleReroll}
            disabled={!canAfford}
            className="w-full mt-2 py-2 text-sm bg-ember-500 hover:bg-ember-400 disabled:opacity-40 rounded font-bold text-white transition-colors"
          >
            Reroll — {price}g
          </button>
        </div>
      )}
    </div>
  )
}

export function BlacksmithPanel() {
  const [tab, setTab] = useState('shop')
  const { gold } = usePlayerStore()

  return (
    <div className="bg-void-900 border border-gray-700 rounded p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-gold-400 font-bold text-sm uppercase tracking-wide">⚒️ Blacksmith</h3>
        <span className="text-yellow-200 text-sm font-bold">💰 {gold}g</span>
      </div>

      <div className="flex gap-1">
        {[['shop', 'Shop'], ['reroll', 'Reroll']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-1 text-xs rounded border capitalize transition-colors
              ${tab === key
                ? 'border-gold-400 text-gold-300 bg-void-800'
                : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'shop' ? <ShopTab /> : <RerollTab />}
    </div>
  )
}
