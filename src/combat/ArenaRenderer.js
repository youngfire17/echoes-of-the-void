// src/combat/ArenaRenderer.js
const HERO_RADIUS = 14
const VIEWPORT_W = 800
const VIEWPORT_H = 500

const ROOM_FILL = '#0f0f1e'
const ROOM_STROKE = '#2a2a4a'
const CORRIDOR_FILL = '#111122'
const FLOOR_LINE = '#161628'

const RARITY_COLORS = {
  common: '#888',
  uncommon: '#2ecc71',
  rare: '#3498db',
  legendary: '#f39c12',
}

export class ArenaRenderer {
  constructor(ctx) {
    this.ctx = ctx
    this.floatingNumbers = []
  }

  addFloatingNumber(x, y, value, isCrit) {
    this.floatingNumbers.push({ x, y, value, isCrit, age: 0, maxAge: 1.2 })
  }

  render(snapshot, camera) {
    const { ctx } = this
    const { enemies, heroX, heroY, heroHpPct, isPaused, shield,
            floorLayout, lootOnFloor } = snapshot

    // Background
    ctx.fillStyle = '#0a0a14'
    ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)

    if (!floorLayout) return

    // Draw corridors first (below rooms)
    for (const corridor of floorLayout.corridors) {
      this._drawCorridor(ctx, corridor, camera)
    }

    // Draw rooms
    for (const room of floorLayout.rooms) {
      this._drawRoom(ctx, room, camera)
    }

    // Draw loot on floor
    for (const loot of lootOnFloor) {
      if (!camera.isVisible(loot.x, loot.y)) continue
      const s = camera.worldToScreen(loot.x, loot.y)
      ctx.fillStyle = RARITY_COLORS[loot.rarity] || '#888'
      ctx.fillRect(s.x - 5, s.y - 5, 10, 10)
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.strokeRect(s.x - 5, s.y - 5, 10, 10)
    }

    // Draw enemies
    for (const enemy of enemies) {
      if (!camera.isVisible(enemy.x, enemy.y)) continue
      const s = camera.worldToScreen(enemy.x, enemy.y)
      this._drawEnemy(ctx, enemy, s.x, s.y)
    }

    // Draw hero
    const heroS = camera.worldToScreen(heroX, heroY)
    this._drawHero(ctx, heroS.x, heroS.y, heroHpPct, shield)

    // Floating numbers (stored in world space, convert to screen)
    this.floatingNumbers = this.floatingNumbers.filter(n => n.age < n.maxAge)
    for (const n of this.floatingNumbers) {
      n.age += 0.016
      n.y -= 0.5
      const ns = camera.worldToScreen(n.x, n.y)
      const alpha = 1 - n.age / n.maxAge
      ctx.globalAlpha = alpha
      ctx.font = n.isCrit ? 'bold 18px Georgia' : '14px Georgia'
      ctx.fillStyle = n.isCrit ? '#ffd700' : '#ffffff'
      ctx.textAlign = 'center'
      ctx.fillText(Math.round(n.value), ns.x, ns.y)
    }
    ctx.globalAlpha = 1

    // Pause overlay
    if (isPaused) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)
      ctx.fillStyle = '#f0c040'
      ctx.font = 'bold 32px Georgia'
      ctx.textAlign = 'center'
      ctx.fillText('PAUSED', VIEWPORT_W / 2, VIEWPORT_H / 2)
    }

    // Minimap (drawn last, in screen space — not camera-offset)
    this._drawMinimap(ctx, floorLayout, heroX, heroY)
  }

  _drawCorridor(ctx, corridor, camera) {
    if (!camera.isVisible(corridor.x + corridor.width / 2, corridor.y + corridor.height / 2, 200)) return
    const s = camera.worldToScreen(corridor.x, corridor.y)
    ctx.fillStyle = CORRIDOR_FILL
    ctx.fillRect(s.x, s.y, corridor.width, corridor.height)
    ctx.strokeStyle = '#1a1a30'
    ctx.lineWidth = 1
    ctx.strokeRect(s.x, s.y, corridor.width, corridor.height)
  }

  _drawRoom(ctx, room, camera) {
    if (!camera.isVisible(room.x + room.width / 2, room.y + room.height / 2, 300)) return
    const s = camera.worldToScreen(room.x, room.y)

    // Room floor
    ctx.fillStyle = room.state === 'cleared' ? '#0d1016' : ROOM_FILL
    ctx.fillRect(s.x, s.y, room.width, room.height)

    // Floor grid lines
    ctx.strokeStyle = FLOOR_LINE
    ctx.lineWidth = 1
    for (let gx = room.x; gx < room.x + room.width; gx += 40) {
      const gs = camera.worldToScreen(gx, room.y)
      ctx.beginPath(); ctx.moveTo(gs.x, s.y); ctx.lineTo(gs.x, s.y + room.height); ctx.stroke()
    }
    for (let gy = room.y; gy < room.y + room.height; gy += 40) {
      const gs = camera.worldToScreen(room.x, gy)
      ctx.beginPath(); ctx.moveTo(s.x, gs.y); ctx.lineTo(s.x + room.width, gs.y); ctx.stroke()
    }

    // Room border
    const borderColor = room.type === 'boss' ? '#8e44ad'
      : room.type === 'elite' ? '#f39c12'
      : room.type === 'chest' ? '#2ecc71'
      : room.state === 'cleared' ? '#1a2a1a'
      : ROOM_STROKE
    ctx.strokeStyle = borderColor
    ctx.lineWidth = room.state === 'active' ? 2.5 : 1.5
    ctx.strokeRect(s.x, s.y, room.width, room.height)

    // Room type label
    if (room.type === 'boss') {
      ctx.fillStyle = '#8e44ad'
      ctx.font = '10px Georgia'
      ctx.textAlign = 'left'
      ctx.fillText('☠ BOSS', s.x + 6, s.y + 14)
    } else if (room.type === 'elite') {
      ctx.fillStyle = '#f39c12'
      ctx.font = '9px Georgia'
      ctx.textAlign = 'left'
      ctx.fillText('⚡ ELITE', s.x + 6, s.y + 14)
    } else if (room.type === 'chest') {
      ctx.fillStyle = '#2ecc71'
      ctx.font = '9px Georgia'
      ctx.textAlign = 'left'
      ctx.fillText('💰', s.x + 6, s.y + 14)
    }
  }

  _drawHero(ctx, x, y, hpPct, shieldActive) {
    if (shieldActive) {
      ctx.beginPath()
      ctx.arc(x, y, HERO_RADIUS + 8, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(100,180,255,0.6)'
      ctx.lineWidth = 3
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(x, y, HERO_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = '#4a90d9'
    ctx.fill()
    ctx.strokeStyle = '#82c4ff'
    ctx.lineWidth = 2
    ctx.stroke()
    if (hpPct < 1) {
      const startAngle = -Math.PI / 2
      const endAngle = startAngle + Math.PI * 2 * hpPct
      ctx.beginPath()
      ctx.arc(x, y, HERO_RADIUS + 5, startAngle, endAngle)
      ctx.strokeStyle = hpPct > 0.4 ? '#2ecc71' : '#e74c3c'
      ctx.lineWidth = 3
      ctx.stroke()
    }
  }

  _drawEnemy(ctx, enemy, x, y) {
    const { radius, color, currentHp, stats, isElite, isBoss } = enemy
    const hpPct = currentHp / stats.maxHp

    if (isElite || isBoss) {
      ctx.beginPath()
      ctx.arc(x, y, radius + 5, 0, Math.PI * 2)
      ctx.fillStyle = isBoss ? 'rgba(142,68,173,0.3)' : 'rgba(243,156,18,0.3)'
      ctx.fill()
    }

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    ctx.stroke()

    const barW = radius * 2.5
    const barH = 4
    const barX = x - barW / 2
    const barY = y - radius - 10
    ctx.fillStyle = '#333'
    ctx.fillRect(barX, barY, barW, barH)
    ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c'
    ctx.fillRect(barX, barY, barW * hpPct, barH)
  }

  _drawMinimap(ctx, floorLayout, heroWorldX, heroWorldY) {
    const MAP_X = VIEWPORT_W - 128
    const MAP_Y = VIEWPORT_H - 92
    const MAP_W = 120
    const MAP_H = 84
    const PADDING = 4

    ctx.fillStyle = 'rgba(5,5,15,0.88)'
    ctx.fillRect(MAP_X, MAP_Y, MAP_W, MAP_H)
    ctx.strokeStyle = '#2a2a4a'
    ctx.lineWidth = 1
    ctx.strokeRect(MAP_X, MAP_Y, MAP_W, MAP_H)

    ctx.fillStyle = '#444'
    ctx.font = '7px Georgia'
    ctx.textAlign = 'center'
    ctx.fillText('MAP', MAP_X + MAP_W / 2, MAP_Y + 9)

    const innerW = MAP_W - PADDING * 2
    const innerH = MAP_H - PADDING * 2 - 12
    const roomNodeW = Math.floor(innerW / 5) - 2
    const roomNodeH = Math.floor(innerH / 4) - 2

    for (const corridor of floorLayout.corridors) {
      const fromRoom = floorLayout.rooms.find(r => r.id === corridor.fromRoomId)
      const toRoom = floorLayout.rooms.find(r => r.id === corridor.toRoomId)
      if (!fromRoom || !toRoom) continue
      const fx = MAP_X + PADDING + fromRoom.col * (roomNodeW + 2) + roomNodeW / 2
      const fy = MAP_Y + PADDING + 10 + fromRoom.row * (roomNodeH + 2) + roomNodeH / 2
      const tx = MAP_X + PADDING + toRoom.col * (roomNodeW + 2) + roomNodeW / 2
      const ty = MAP_Y + PADDING + 10 + toRoom.row * (roomNodeH + 2) + roomNodeH / 2
      ctx.strokeStyle = '#2a2a3a'
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke()
    }

    for (const room of floorLayout.rooms) {
      const rx = MAP_X + PADDING + room.col * (roomNodeW + 2)
      const ry = MAP_Y + PADDING + 10 + room.row * (roomNodeH + 2)

      let fill = '#111'
      let stroke = '#333'
      if (room.state === 'cleared') { fill = '#1a2a1a'; stroke = '#2ecc71' }
      else if (room.state === 'active') { fill = '#1a2a4a'; stroke = '#4a90d9' }
      else if (room.type === 'boss') stroke = '#8e44ad'
      else if (room.type === 'chest') stroke = '#2ecc71'
      else if (room.type === 'elite') stroke = '#f39c12'

      ctx.fillStyle = fill
      ctx.fillRect(rx, ry, roomNodeW, roomNodeH)
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1
      ctx.strokeRect(rx, ry, roomNodeW, roomNodeH)

      if (room.type === 'boss') {
        ctx.fillStyle = '#8e44ad'
        ctx.font = '6px Georgia'
        ctx.textAlign = 'center'
        ctx.fillText('☠', rx + roomNodeW / 2, ry + roomNodeH / 2 + 2)
      }
    }

    // Hero dot — find nearest room to hero position
    const heroRoom = floorLayout.rooms.reduce((closest, room) => {
      const cx = room.x + room.width / 2
      const cy = room.y + room.height / 2
      const d = Math.sqrt((heroWorldX - cx) ** 2 + (heroWorldY - cy) ** 2)
      const cd = closest
        ? Math.sqrt((heroWorldX - (closest.x + closest.width / 2)) ** 2 + (heroWorldY - (closest.y + closest.height / 2)) ** 2)
        : Infinity
      return d < cd ? room : closest
    }, null)

    if (heroRoom) {
      const hx = MAP_X + PADDING + heroRoom.col * (roomNodeW + 2) + roomNodeW / 2
      const hy = MAP_Y + PADDING + 10 + heroRoom.row * (roomNodeH + 2) + roomNodeH / 2
      ctx.beginPath()
      ctx.arc(hx, hy, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = '#4a90d9'
      ctx.fill()
    }
  }
}
