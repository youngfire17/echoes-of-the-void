// src/combat/CombatEngine.js
import { calculateDamage } from './DamageCalculator'
import { moveEnemyTowardHero, tickEnemyAttack } from './EnemyAI'
import { generateFloor } from './DungeonGenerator'
import { populateRoom } from './RoomSpawner'
import { generateLoot } from '../systems/LootGenerator'
import { distance } from '../utils'
import { ZONES } from '../data/zones'

const VIEWPORT_W = 800
const VIEWPORT_H = 500

export class CombatEngine {
  constructor() {
    this.reset()
  }

  reset() {
    this.floorLayouts = []
    this.currentFloorIndex = 0
    this.currentRoomId = null
    this.pendingRoomId = null
    this.zoneId = 1

    this.heroX = 0
    this.heroY = 0
    this.heroMoveTargetX = null
    this.heroMoveTargetY = null

    this.heroHp = 0
    this.heroMaxHp = 0
    this.heroStats = {}
    this.heroAttackTimer = 0

    this.enemies = []
    this.shield = null
    this.skillCooldowns = {}
    this.lootTimers = []
    this.lootOnFloor = []

    this.phase = 'idle'
    this.callbacks = {}
  }

  on(event, fn) {
    this.callbacks[event] = fn
  }

  _emit(event, data) {
    if (this.callbacks[event]) this.callbacks[event](data)
  }

  startRun(heroStats, zoneId = 1) {
    this.reset()
    this.zoneId = zoneId
    this.heroStats = { ...heroStats }
    this.heroHp = heroStats.maxHp
    this.heroMaxHp = heroStats.maxHp

    const zone = ZONES[zoneId]

    for (let i = 0; i < zone.floors; i++) {
      const layout = generateFloor(i + 1, zone.floors)
      layout.rooms = layout.rooms.map(r => populateRoom(r, zone))
      this.floorLayouts.push(layout)
    }

    this._enterFloor(0)
  }

  tick(dt) {
    if (this.phase === 'idle' || this.phase === 'ended') return

    for (const skillId of Object.keys(this.skillCooldowns)) {
      this.skillCooldowns[skillId] = Math.max(0, this.skillCooldowns[skillId] - dt)
    }

    if (this.shield) {
      this.shield.duration -= dt
      if (this.shield.duration <= 0) this.shield = null
    }

    this.lootTimers = this.lootTimers.filter(lt => {
      lt.timer -= dt
      if (lt.timer <= 0) {
        this.lootOnFloor = this.lootOnFloor.filter(l => l !== lt.floorRef)
        this._emit('loot_drop', lt.item)
        return false
      }
      return true
    })

    const regen = this.heroStats.hpRegenFlat || 0
    if (regen > 0) this.heroHp = Math.min(this.heroMaxHp, this.heroHp + regen * dt)

    if (this.phase === 'exploring') {
      this._tickExploring(dt)
    } else if (this.phase === 'fighting') {
      this._tickFighting(dt)
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
      this._emit('floating_number', { x: this.heroX, y: this.heroY - 30, value: heal, isCrit: false })
    }

    if (effect.type === 'damage_aoe') {
      for (const enemy of [...this.enemies]) {
        const dist = distance({ x: this.heroX, y: this.heroY }, { x: enemy.x, y: enemy.y })
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

  getSnapshot() {
    const layout = this.floorLayouts[this.currentFloorIndex]
    const totalRooms = layout?.rooms.length ?? 0
    const clearedRooms = layout?.rooms.filter(r => r.state === 'cleared').length ?? 0

    let maxX = VIEWPORT_W, maxY = VIEWPORT_H
    if (layout) {
      for (const r of layout.rooms) {
        maxX = Math.max(maxX, r.x + r.width + 100)
        maxY = Math.max(maxY, r.y + r.height + 100)
      }
    }

    return {
      enemies: this.enemies,
      heroX: this.heroX,
      heroY: this.heroY,
      heroHpPct: this.heroMaxHp > 0 ? this.heroHp / this.heroMaxHp : 1,
      heroHp: Math.ceil(this.heroHp),
      heroMaxHp: this.heroMaxHp,
      isPaused: false,
      shield: this.shield,
      phase: this.phase,
      floor: this.currentFloorIndex + 1,
      totalFloors: this.floorLayouts.length,
      totalRooms,
      clearedRooms,
      currentRoomId: this.currentRoomId,
      floorLayout: layout ?? null,
      lootOnFloor: [...this.lootOnFloor],
      skillCooldowns: { ...this.skillCooldowns },
      dungeonBounds: { width: maxX, height: maxY },
      zoneName: ZONES[this.zoneId]?.name ?? `Zone ${this.zoneId}`,
    }
  }

  _enterFloor(floorIndex) {
    this.currentFloorIndex = floorIndex
    this.enemies = []
    const layout = this.floorLayouts[floorIndex]
    const startRoom = layout.rooms.find(r => r.id === layout.startRoomId)
    startRoom.state = 'cleared'  // start room has no enemies — immediately cleared
    this.currentRoomId = startRoom.id
    this.heroX = startRoom.x + startRoom.width / 2
    this.heroY = startRoom.y + startRoom.height / 2
    this.phase = 'exploring'
    this._walkToNextRoom()
  }

  _getCurrentRoom() {
    const layout = this.floorLayouts[this.currentFloorIndex]
    return layout.rooms.find(r => r.id === this.currentRoomId)
  }

  _walkToNextRoom() {
    const layout = this.floorLayouts[this.currentFloorIndex]
    const currentRoom = this._getCurrentRoom()

    const unclearedNeighbors = currentRoom.neighborIds
      .map(id => layout.rooms.find(r => r.id === id))
      .filter(r => r && r.state === 'locked')

    if (unclearedNeighbors.length === 0) {
      // BFS to find next step toward nearest uncleared room
      const nextStepId = this._findNextStepToUncleared()
      if (!nextStepId) {
        // All rooms on this floor are cleared
        const nextFloorIndex = this.currentFloorIndex + 1
        if (nextFloorIndex < this.floorLayouts.length) {
          this._enterFloor(nextFloorIndex)
        } else {
          this.phase = 'ended'
          this._emit('run_complete', {})
        }
        return
      }
      const nextRoom = layout.rooms.find(r => r.id === nextStepId)
      this.pendingRoomId = nextStepId
      this.heroMoveTargetX = nextRoom.x + nextRoom.width / 2
      this.heroMoveTargetY = nextRoom.y + nextRoom.height / 2
      return
    }

    const priority = ['chest', 'elite', 'standard', 'empty', 'boss']
    unclearedNeighbors.sort((a, b) => priority.indexOf(a.type) - priority.indexOf(b.type))
    const next = unclearedNeighbors[0]

    this.pendingRoomId = next.id
    this.heroMoveTargetX = next.x + next.width / 2
    this.heroMoveTargetY = next.y + next.height / 2
  }

  _tickExploring(dt) {
    if (this.heroMoveTargetX === null) return

    const dx = this.heroMoveTargetX - this.heroX
    const dy = this.heroMoveTargetY - this.heroY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const speed = this.heroStats.moveSpeed || 120

    if (dist < 8) {
      this.heroX = this.heroMoveTargetX
      this.heroY = this.heroMoveTargetY
      this.heroMoveTargetX = null
      this.heroMoveTargetY = null

      if (this.pendingRoomId) {
        const roomToActivate = this.pendingRoomId
        this.pendingRoomId = null  // clear FIRST, before _activateRoom sets a new one
        this._activateRoom(roomToActivate)
      }
    } else {
      const step = speed * dt
      this.heroX += (dx / dist) * step
      this.heroY += (dy / dist) * step
    }
  }

  _findNextStepToUncleared() {
    const layout = this.floorLayouts[this.currentFloorIndex]
    const roomMap = Object.fromEntries(layout.rooms.map(r => [r.id, r]))

    // BFS from current room to find nearest locked room
    const queue = [[this.currentRoomId, []]]
    const visited = new Set([this.currentRoomId])

    while (queue.length > 0) {
      const [roomId, path] = queue.shift()
      const room = roomMap[roomId]

      if (room.state === 'locked') {
        // Return the first step in the path (the adjacent room to walk to next)
        return path[0] ?? roomId
      }

      for (const neighborId of room.neighborIds) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId)
          queue.push([neighborId, path.length === 0 ? [neighborId] : [...path, neighborId]])
        }
      }
    }
    return null  // no uncleared rooms
  }

  _activateRoom(roomId) {
    const layout = this.floorLayouts[this.currentFloorIndex]
    const room = layout.rooms.find(r => r.id === roomId)

    // Passing through a cleared room during backtracking — just update position and keep moving
    if (room.state === 'cleared') {
      this.currentRoomId = roomId
      this._walkToNextRoom()
      return
    }

    room.state = 'active'
    this.currentRoomId = roomId

    if (room.enemyPack.length === 0) {
      if (room.type === 'chest') {
        const item = generateLoot(this.zoneId, 'normal', 'uncommon')
        const floorRef = { x: room.x + room.width / 2, y: room.y + room.height / 2, rarity: item.rarity }
        this.lootOnFloor.push(floorRef)
        this.lootTimers.push({ item, timer: 2.0, floorRef })
      }
      room.state = 'cleared'
      this._emit('room_cleared', { roomId })
      this._walkToNextRoom()
      return
    }

    for (const enemy of room.enemyPack) {
      enemy.x = room.x + 30 + Math.random() * (room.width - 60)
      enemy.y = room.y + 30 + Math.random() * (room.height - 60)
      this.enemies.push(enemy)
    }

    this.phase = 'fighting'
  }

  _tickFighting(dt) {
    const target = this._findNearestEnemy()
    if (target) {
      const dist = distance({ x: this.heroX, y: this.heroY }, { x: target.x, y: target.y })
      const attackRange = this.heroStats.attackRange || 65
      if (dist > attackRange) {
        const dx = target.x - this.heroX
        const dy = target.y - this.heroY
        const speed = this.heroStats.moveSpeed || 120
        const step = Math.min(speed * dt, dist - attackRange)
        this.heroX += (dx / dist) * step
        this.heroY += (dy / dist) * step
      }
    }

    const activeEnemies = [...this.enemies]
    for (const enemy of activeEnemies) {
      if (enemy.currentHp <= 0) continue
      moveEnemyTowardHero(enemy, this.heroX, this.heroY, dt)
      tickEnemyAttack(enemy, this.heroX, this.heroY, dt, (dmg) => {
        this._heroTakeHit(dmg, enemy)
      })
    }

    this.heroAttackTimer += dt
    const attackInterval = 1 / (this.heroStats.attackSpeed || 1)
    if (this.heroAttackTimer >= attackInterval) {
      this.heroAttackTimer -= attackInterval
      this._heroAutoAttack()
    }

    if (this.enemies.length === 0 && this.phase === 'fighting') {
      const room = this._getCurrentRoom()
      room.state = 'cleared'
      this._emit('room_cleared', { roomId: room.id })

      if (room.type === 'boss') {
        this.phase = 'ended'
        this._emit('run_complete', {})
        return
      }

      this.phase = 'exploring'
      this._walkToNextRoom()
    }
  }

  _heroAutoAttack() {
    const target = this._findNearestEnemy()
    if (!target) return
    const dist = distance({ x: this.heroX, y: this.heroY }, { x: target.x, y: target.y })
    if (dist > (this.heroStats.attackRange || 65)) return

    const { damage, isCrit } = calculateDamage(this.heroStats, target.stats)
    target.currentHp -= damage
    this._emit('floating_number', { x: target.x, y: target.y, value: damage, isCrit })
    if (target.currentHp <= 0) this._killEnemy(target)
  }

  _heroTakeHit(rawDmg, enemy) {
    if (this.phase === 'ended') return

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

    if (this.heroStats.retribution && Math.random() < this.heroStats.retribution.chance) {
      const reflected = Math.round(rawDmg * this.heroStats.retribution.multiplier)
      enemy.currentHp -= reflected
      this._emit('floating_number', { x: enemy.x, y: enemy.y, value: reflected, isCrit: false })
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

    const onKillHeal = this.heroStats.onKillHeal
    if (onKillHeal && onKillHeal > 0) {
      this.heroHp = Math.min(this.heroMaxHp, this.heroHp + onKillHeal)
      this._emit('floating_number', { x: this.heroX, y: this.heroY - 30, value: onKillHeal, isCrit: false })
    }

    if (Math.random() < enemy.lootChance) {
      const item = generateLoot(this.zoneId, enemy.archetype)
      const floorRef = { x: enemy.x, y: enemy.y, rarity: item.rarity }
      this.lootOnFloor.push(floorRef)
      this.lootTimers.push({ item, timer: 2.0, floorRef })
    }
  }

  _findNearestEnemy() {
    if (this.enemies.length === 0) return null
    let nearest = null
    let minDist = Infinity
    for (const e of this.enemies) {
      const d = distance({ x: this.heroX, y: this.heroY }, { x: e.x, y: e.y })
      if (d < minDist) { minDist = d; nearest = e }
    }
    return nearest
  }
}
