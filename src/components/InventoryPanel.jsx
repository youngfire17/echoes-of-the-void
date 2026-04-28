// src/components/InventoryPanel.jsx
import { usePlayerStore } from '../store/playerStore'
import { useInventoryStore } from '../store/inventoryStore'
import { SLOTS } from '../data/items'

const RARITY_COLORS = {
  common:    'border-gray-500 text-gray-400',
  uncommon:  'border-green-600 text-green-400',
  rare:      'border-blue-500 text-blue-300',
  legendary: 'border-yellow-500 text-yellow-300',
}

function ItemTile({ item, onClick }) {
  if (!item) {
    return <div className="h-14 w-14 border border-gray-700 rounded bg-void-900 opacity-30" />
  }
  const color = RARITY_COLORS[item.rarity] || RARITY_COLORS.common
  const tooltip = [item.name, ...item.affixes.map(a => a.label.replace('{v}', a.value))].join('\n')
  return (
    <div
      className={`h-14 w-14 border-2 rounded bg-void-800 flex flex-col items-center justify-center cursor-pointer hover:bg-void-700 ${color}`}
      title={tooltip}
      onClick={() => onClick && onClick(item)}
    >
      <span className="text-xs text-center leading-tight px-1 truncate w-full text-center">
        {item.base?.name}
      </span>
      <span className="text-xs opacity-60">{item.slot.slice(0, 3)}</span>
    </div>
  )
}

export function InventoryPanel() {
  const { equippedGear, equipItem, unequipItem } = usePlayerStore()
  const { items, removeItem } = useInventoryStore()

  const handleEquipFromInventory = (item) => {
    const currentlyEquipped = equippedGear[item.slot]
    removeItem(item.id)
    if (currentlyEquipped) {
      useInventoryStore.getState().addItem(currentlyEquipped)
    }
    equipItem(item)
  }

  const handleUnequip = (slot) => {
    const item = equippedGear[slot]
    if (!item) return
    useInventoryStore.getState().addItem(item)
    unequipItem(slot)
  }

  const emptySlots = Array(Math.max(0, 20 - items.length)).fill(null)

  return (
    <div className="bg-void-900 border border-gray-700 rounded p-4 space-y-4">
      <h3 className="text-gold-400 font-bold text-sm uppercase tracking-wide">Equipment</h3>

      {/* Gear slots — 3 columns */}
      <div className="grid grid-cols-3 gap-2">
        {SLOTS.map(slot => (
          <div key={slot} className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500 capitalize">{slot}</span>
            <ItemTile item={equippedGear[slot]} onClick={() => handleUnequip(slot)} />
          </div>
        ))}
      </div>

      <hr className="border-gray-700" />
      <h3 className="text-gold-400 font-bold text-sm uppercase tracking-wide">
        Inventory ({items.length}/20)
      </h3>

      {/* 20-slot inventory grid */}
      <div className="grid grid-cols-5 gap-1">
        {items.map(item => (
          <ItemTile key={item.id} item={item} onClick={handleEquipFromInventory} />
        ))}
        {emptySlots.map((_, i) => (
          <ItemTile key={`empty_${i}`} item={null} />
        ))}
      </div>
    </div>
  )
}
