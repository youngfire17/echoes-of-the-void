// src/components/AbilityBar.jsx
import { SKILLS } from '../data/skills'

export function AbilityBar({ activeSkillIds, cooldowns, onFire }) {
  return (
    <div className="flex gap-2 justify-center">
      {activeSkillIds.map(skillId => {
        const skill = SKILLS[skillId]
        const remaining = cooldowns[skillId] || 0
        const pct = remaining > 0 ? remaining / skill.cooldown : 0
        return (
          <button
            key={skillId}
            onClick={() => onFire(skillId)}
            disabled={remaining > 0}
            className="relative w-14 h-14 rounded border border-gray-600 bg-void-800 hover:border-gold-400 disabled:opacity-50 flex flex-col items-center justify-center text-lg"
            title={`${skill.name}: ${skill.description}`}
          >
            <span>{skill.icon}</span>
            <span className="text-xs text-gray-400">{skill.name.split(' ')[0]}</span>
            {pct > 0 && (
              <div
                className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-b"
                style={{ width: `${(1 - pct) * 100}%` }}
              />
            )}
            {remaining > 0 && (
              <span className="absolute top-0 right-1 text-xs text-yellow-300">
                {remaining.toFixed(1)}s
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
