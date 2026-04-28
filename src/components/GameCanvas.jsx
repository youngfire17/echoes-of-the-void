// src/components/GameCanvas.jsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { GameLoop } from '../combat/GameLoop'
import { CombatEngine } from '../combat/CombatEngine'
import { ArenaRenderer } from '../combat/ArenaRenderer'
import { HUD } from './HUD'
import { usePlayerStore } from '../store/playerStore'
import { useRunStore } from '../store/runStore'
import { useInventoryStore } from '../store/inventoryStore'
import { useMetaStore } from '../store/metaStore'
import { SKILLS } from '../data/skills'

const ARENA_W = 800
const ARENA_H = 500

export function GameCanvas({ onRunEnd }) {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const [snapshot, setSnapshot] = useState(null)
  const [isPaused, setIsPaused] = useState(false)
  const isPausedRef = useRef(false)

  const playerStore = usePlayerStore()
  const runStore = useRunStore()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const engine = new CombatEngine()
    const renderer = new ArenaRenderer(ctx)

    engineRef.current = engine

    const heroStats = playerStore.getStats()
    engine.startRun(heroStats, 1)
    runStore.startRun(heroStats.maxHp)

    // Wire engine events
    engine.on('hero_died', () => {
      const snap = engine.getSnapshot()
      runStore.endRun()
      onRunEnd({
        reason: 'death',
        echoesEarned: runStore.echoesEarned,
        goldEarned: runStore.goldEarned,
        wave: snap.wave,
      })
    })

    engine.on('run_complete', () => {
      runStore.endRun()
      onRunEnd({
        reason: 'victory',
        echoesEarned: runStore.echoesEarned,
        goldEarned: runStore.goldEarned,
        wave: 10,
      })
    })

    engine.on('wave_cleared', ({ wave }) => {
      runStore.setPhase('between')
    })

    engine.on('loot_drop', (item) => {
      const { automationSettings } = useMetaStore.getState()
      const { equippedGear, equipItem } = usePlayerStore.getState()
      const { addItem } = useInventoryStore.getState()

      if (automationSettings.autoEquip && !equippedGear[item.slot]) {
        equipItem(item)
      } else {
        addItem(item)
      }
    })

    engine.on('enemy_killed', ({ enemy }) => {
      runStore.addEchoes(enemy.echoesReward)
      const gold = Math.round(
        Math.random() * (enemy.goldReward.max - enemy.goldReward.min) + enemy.goldReward.min
      )
      runStore.addGold(gold)
    })

    engine.on('floating_number', ({ x, y, value, isCrit }) => {
      renderer.addFloatingNumber(x, y, value, isCrit)
    })

    const loop = new GameLoop(
      (dt) => {
        if (!isPausedRef.current) engine.tick(dt)
        setSnapshot({ ...engine.getSnapshot() })
      },
      () => {
        const snap = engine.getSnapshot()
        renderer.render({ ...snap, isPaused: isPausedRef.current })
      }
    )

    loop.start()
    return () => loop.stop()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePause = useCallback(() => {
    const next = !isPausedRef.current
    isPausedRef.current = next
    setIsPaused(next)
  }, [])

  const handleFireSkill = useCallback((skillId) => {
    const engine = engineRef.current
    if (!engine) return
    engine.fireSkill(skillId, SKILLS[skillId])
  }, [])

  // Spacebar to pause
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space') { e.preventDefault(); handlePause() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handlePause])

  const snap = snapshot || {
    heroHp: 0, heroMaxHp: 1, wave: 1, zone: 1,
    phase: 'wave', skillCooldowns: {}, betweenWaveTimer: 10
  }

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={ARENA_W}
        height={ARENA_H}
        className="rounded-t border border-gray-700"
      />
      <div className="w-full max-w-[800px]">
        <HUD
          snapshot={snap}
          activeSkillIds={playerStore.activeSkillIds}
          onFire={handleFireSkill}
          onPause={handlePause}
          isPaused={isPaused}
          echoesEarned={runStore.echoesEarned}
          goldEarned={runStore.goldEarned}
        />
      </div>
    </div>
  )
}
