// src/components/CharacterPanel.jsx
import { usePlayerStore } from '../store/playerStore'
import { CLASSES } from '../data/classes'

export function CharacterPanel() {
  const { classId, getStats, echoes } = usePlayerStore()
  const classData = CLASSES[classId]
  const stats = getStats()

  const statRows = [
    ['Max HP',        Math.round(stats.maxHp || 0)],
    ['Damage',        Math.round(stats.damageFlat || 0)],
    ['Atk Speed',     (stats.attackSpeed || 0).toFixed(2)],
    ['Crit Chance',   `${((stats.critChance || 0) * 100).toFixed(1)}%`],
    ['Crit Damage',   `${((stats.critDamage || 0.5) * 100).toFixed(0)}%`],
    ['Armor',         Math.round(stats.armor || 0)],
    ['HP Regen/s',    (stats.hpRegenFlat || 0).toFixed(1)],
    ['Dmg Reduction', `${((stats.damageReduction || 0) * 100).toFixed(0)}%`],
  ]

  return (
    <div className="bg-void-900 border border-gray-700 rounded p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-800 border-2 border-blue-400 flex items-center justify-center text-xl">
          ⚔️
        </div>
        <div>
          <div className="font-bold text-gold-300">{classData.name}</div>
          <div className="text-xs text-gray-400">{classData.description}</div>
        </div>
      </div>
      <div className="text-yellow-400 text-sm font-semibold">⚡ {echoes} Echoes</div>
      <hr className="border-gray-700" />
      <div className="space-y-1">
        {statRows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-400">{label}</span>
            <span className="text-gray-200">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
