// src/combat/CombatEngine.js
import { calculateDamage } from './DamageCalculator'
import { moveEnemyTowardHero, tickEnemyAttack } from './EnemyAI'
import { buildSpawnQueue } from './WaveSpawner'
import { ZONES } from '../data/zones'
import { generateLoot } from '../systems/LootGenerator'
import { distance } from '../utils'

const ARENA_W = 800
const ARENA_H = 500
const HERO_X = ARENA_W / 2
const HERO_Y = ARENA_H / 2

export class CombatEngine {
  constructor() {
    this.reset()
  }

  reset() {
    this.enemies = []
    this.spawnQueue = []
    this.spawnTimer = 0
    this.heroHp = 0
    this.heroMaxHp = 0
    this.heroStats = {}
    this.heroAttackTimer = 0
    this.wave = 1
    this.zone = 1
    this.phase = 'idle'    // 'idle' | 'wave' | 'between' | 'ended'
    this.betweenWaveTimer = 0
    this.shield = null      // { remaining: number, duration: number }
    this.skillCooldowns = {} // skillId → seconds remaining
    this.lootTimers = []    // { item, timer }
    this.callbacks = {}
  }

  on(event, fn) {
    this.callbacks[event] = fn
  }

  _emit(event, data) {
    if (this.callbacks[event]) this.callbacks[event](data)
  }

  startRun(heroStats, zone = 1) {
    this.reset()
    this.heroStats = { ...heroStats }
    this.heroHp = heroStats.maxHp
    this.heroMaxHp = heroStats.maxHp
    this.zone = zone
    this.wave = 1
    this.phase = 'wave'
    this._loadWave()
  }

  _loadWave() {
    this.spawnQueue = buildSpawnQueue(this.zone, this.wave)
      .sort((a, b) => a.spawnDelay - b.spawnDelay)
    this.spawnTimer = 0
    this.enemies = []
    this.phase = 'wave'
  }

  tick(dt) {
    if (this.phase === 'idle' || this.phase === 'ended') return

    if (this.phase === 'between') {
      this.betweenWaveTimer -= dt
      if (this.betweenWaveTimer <= 0) {
        this.wave++
        const zoneWaveCount = ZONES[this.zone]?.waves.length ?? 10
        if (this.wave > zoneWaveCount) {
          this.phase = 'ended'
          this._emit('run_complete', {})
          return
        }
        this._loadWave()
      }
      return
    }

    // Tick skill cooldowns
    for (const skillId of Object.keys(this.skillCooldowns)) {
      this.skillCooldowns[skillId] = Math.max(0, this.skillCooldowns[skillId] - dt)
    }

    // Tick shield duration
    if (this.shield) {
      this.shield.duration -= dt
      if (this.shield.duration <= 0) this.shield = null
    }

    // Spawn queued enemies
    this.spawnTimer += dt
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].spawnDelay <= this.spawnTimer) {
      const enemy = this.spawnQueue.shift()
      enemy.x = this._randomEdgeX()
      enemy.y = this._randomEdgeY()
      this.enemies.push(enemy)
    }

    // Tick loot pickup timers
    this.lootTimers = this.lootTimers.filter(lt => {
      lt.timer -= dt
      if (lt.timer <= 0) {
        this._emit('loot_drop', lt.item)
        return false
      }
      return true
    })

    // Enemy movement and attacks
    const activeEnemies = [...this.enemies]
    for (const enemy of activeEnemies) {
      if (enemy.currentHp <= 0) continue
      moveEnemyTowardHero(enemy, HERO_X, HERO_Y, dt)
      tickEnemyAttack(enemy, HERO_X, HERO_Y, dt, (dmg) => {
        this._heroTakeHit(dmg, enemy)
      })
    }

    // Hero auto-attack
    this.heroAttackTimer += dt
    const attackInterval = 1 / (this.heroStats.attackSpeed || 1)
    if (this.heroAttackTimer >= attackInterval) {
      this.heroAttackTimer -= attackInterval
      this._heroAutoAttack()
    }

    // HP regen
    const regen = this.heroStats.hpRegenFlat || 0
    if (regen > 0) {
      this.heroHp = Math.min(this.heroMaxHp, this.heroHp + regen * dt)
    }

    // Wave cleared check
    if (this.phase === 'wave' && this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.phase = 'between'
      this.betweenWaveTimer = 10
      this._emit('wave_cleared', { wave: this.wave, zone: this.zone })
    }
  }

  fireSkill(skillId, skillDef) {
    if ((this.skillCooldowns[skillId] || 0) > 0) return
    const cdr = this.heroStats.cooldownReduction || 0
    this.skillCooldowns[skillId] = skillDef.cooldown * (1 - cdr)

    const effect = skillDef.effect

    if (effect.type === 'damage_nearest') {
      const target = this._findNearestEnemy()
      if (!target) return
      const { damage, isCrit } = calculateDamage(this.heroStats, target.stats, true)
      const finalDmg = Math.round(damage * effect.multiplier)
      target.currentHp -= finalDmg
      this._emit('floating_number', { x: target.x, y: target.y, value: finalDmg, isCrit })
      if (target.currentHp <= 0) this._killEnemy(target)
    }

    if (effect.type === 'heal_self') {
      const heal = Math.round(this.heroMaxHp * effect.hpPercent)
      this.heroHp = Math.min(this.heroMaxHp, this.heroHp + heal)
      this._emit('floating_number', { x: HERO_X, y: HERO_Y - 30, value: heal, isCrit: false })
    }

    if (effect.type === 'damage_aoe') {
      for (const enemy of [...this.enemies]) {
        const dist = distance({ x: HERO_X, y: HERO_Y }, { x: enemy.x, y: enemy.y })
        if (dist <= effect.radius) {
          const { damage, isCrit } = calculateDamage(this.heroStats, enemy.stats, true)
          const finalDmg = Math.round(damage * effect.multiplier)
          enemy.currentHp -= finalDmg
          this._emit('floating_number', { x: enemy.x, y: enemy.y, value: finalDmg, isCrit })
          if (enemy.currentHp <= 0) this._killEnemy(enemy)
        }
      }
    }

    if (effect.type === 'shield') {
      const shieldHp = Math.round(this.heroMaxHp * effect.hpPercent)
      this.shield = { remaining: shieldHp, duration: effect.duration }
    }
  }

  _heroAutoAttack() {
    const target = this._findNearestEnemy()
    if (!target) return
    const dist = distance({ x: HERO_X, y: HERO_Y }, { x: target.x, y: target.y })
    if (dist > (this.heroStats.attackRange || 65)) return

    const { damage, isCrit } = calculateDamage(this.heroStats, target.stats)
    target.currentHp -= damage
    this._emit('floating_number', { x: target.x, y: target.y, value: damage, isCrit })
    if (target.currentHp <= 0) this._killEnemy(target)
  }

  _heroTakeHit(rawDmg, enemy) {
    if (this.phase === 'ended') return  // hero already dead, ignore subsequent hits this tick
    let dmg = rawDmg
    const reduction = this.heroStats.damageReduction || 0
    dmg = Math.max(1, Math.round(dmg * (1 - reduction)))

    if (this.shield && this.shield.remaining > 0) {
      const absorbed = Math.min(this.shield.remaining, dmg)
      this.shield.remaining -= absorbed
      dmg -= absorbed
      if (this.shield.remaining <= 0) this.shield = null
    }

    this.heroHp -= dmg
    this._emit('hero_damaged', { damage: dmg })

    // Retribution passive
    if (this.heroStats.retribution && Math.random() < this.heroStats.retribution.chance) {
      const reflected = Math.round(rawDmg * this.heroStats.retribution.multiplier)
      enemy.currentHp -= reflected
      this._emit('floating_number', { x: enemy.x, y: enemy.y, value: reflected, isCrit: false })
      if (enemy.currentHp <= 0) this._killEnemy(enemy)
    }

    // thorns affix effect
    const thorns = this.heroStats.thorns
    if (thorns && thorns > 0 && enemy.currentHp > 0) {
      enemy.currentHp -= thorns
      this._emit('floating_number', { x: enemy.x, y: enemy.y, value: thorns, isCrit: false })
      if (enemy.currentHp <= 0) this._killEnemy(enemy)
    }

    if (this.heroHp <= 0) {
      this.heroHp = 0
      this.phase = 'ended'
      this._emit('hero_died', {})
    }
  }

  _killEnemy(enemy) {
    this.enemies = this.enemies.filter(e => e.instanceId !== enemy.instanceId)
    this._emit('enemy_killed', { enemy })

    if (Math.random() < enemy.lootChance) {
      const item = generateLoot(this.zone, enemy.archetype)
      this.lootTimers.push({ item, timer: 2.0 })
    }

    // on_kill_heal affix effect
    const healOnKill = this.heroStats.onKillHeal
    if (healOnKill && healOnKill > 0) {
      this.heroHp = Math.min(this.heroMaxHp, this.heroHp + healOnKill)
      this._emit('floating_number', { x: HERO_X, y: HERO_Y - 30, value: healOnKill, isCrit: false })
    }
  }

  _findNearestEnemy() {
    if (this.enemies.length === 0) return null
    let nearest = null
    let minDist = Infinity
    for (const e of this.enemies) {
      const d = distance({ x: HERO_X, y: HERO_Y }, { x: e.x, y: e.y })
      if (d < minDist) { minDist = d; nearest = e }
    }
    return nearest
  }

  _randomEdgeX() {
    const edge = Math.floor(Math.random() * 4)
    if (edge === 0 || edge === 1) return Math.random() * ARENA_W
    if (edge === 2) return 0
    return ARENA_W
  }

  _randomEdgeY() {
    const edge = Math.floor(Math.random() * 4)
    if (edge === 0) return 0
    if (edge === 1) return ARENA_H
    return Math.random() * ARENA_H
  }

  getSnapshot() {
    return {
      enemies: this.enemies,
      heroX: HERO_X,
      heroY: HERO_Y,
      heroHpPct: this.heroMaxHp > 0 ? this.heroHp / this.heroMaxHp : 1,
      heroHp: Math.ceil(this.heroHp),
      heroMaxHp: this.heroMaxHp,
      isPaused: false,
      shield: this.shield,
      phase: this.phase,
      wave: this.wave,
      zone: this.zone,
      skillCooldowns: { ...this.skillCooldowns },
      betweenWaveTimer: this.betweenWaveTimer,
    }
  }
}
