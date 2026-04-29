// src/components/HUD.jsx
import { AbilityBar } from './AbilityBar'

export function HUD({ snapshot, activeSkillIds, onFire, onPause, isPaused, echoesEarned, goldEarned }) {
  const { heroHp, heroMaxHp, skillCooldowns } = snapshot
  const hpPct = heroMaxHp > 0 ? heroHp / heroMaxHp : 1
  const hpColor = hpPct > 0.5 ? 'bg-green-500' : hpPct > 0.25 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="flex flex-col gap-2 p-3 bg-void-900 border-t border-gray-700">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>HP</span>
            <span>{Math.ceil(heroHp)} / {heroMaxHp}</span>
          </div>
          <div className="h-4 bg-gray-800 rounded overflow-hidden">
            <div
              className={`h-full ${hpColor} transition-all duration-100`}
              style={{ width: `${hpPct * 100}%` }}
            />
          </div>
        </div>
        <div className="text-center min-w-[120px]">
          <div className="text-gold-400 font-bold text-sm">{snapshot.zoneName || 'Zone 1'}</div>
          <div className="text-xs text-gray-400">
            Floor {snapshot.floor || 1}/{snapshot.totalFloors || 1}
          </div>
          <div className="text-xs text-gray-500">
            {snapshot.clearedRooms || 0}/{snapshot.totalRooms || 0} rooms
          </div>
        </div>
        <button
          onClick={onPause}
          className="px-4 py-2 bg-void-800 border border-gray-600 rounded hover:border-gold-400 text-sm"
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>
      <AbilityBar
        activeSkillIds={activeSkillIds}
        cooldowns={skillCooldowns}
        onFire={onFire}
      />
      <div className="flex gap-4 text-xs text-gray-500 justify-center">
        <span>⚡ {echoesEarned} Echoes</span>
        <span>💰 {goldEarned} Gold</span>
      </div>
    </div>
  )
}
