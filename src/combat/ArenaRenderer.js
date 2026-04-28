// src/combat/ArenaRenderer.js
const HERO_RADIUS = 18
const ARENA_W = 800
const ARENA_H = 500

export class ArenaRenderer {
  constructor(ctx) {
    this.ctx = ctx
    this.floatingNumbers = [] // { x, y, value, isCrit, age, maxAge }
  }

  addFloatingNumber(x, y, value, isCrit) {
    this.floatingNumbers.push({ x, y, value, isCrit, age: 0, maxAge: 1.2 })
  }

  render(snapshot) {
    const { ctx } = this
    const { enemies, heroX, heroY, heroHpPct, isPaused, shield } = snapshot

    // Background
    ctx.fillStyle = '#0d0d1a'
    ctx.fillRect(0, 0, ARENA_W, ARENA_H)

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 1
    for (let x = 0; x < ARENA_W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ARENA_H); ctx.stroke()
    }
    for (let y = 0; y < ARENA_H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ARENA_W, y); ctx.stroke()
    }

    // Draw enemies
    for (const enemy of enemies) {
      this._drawEnemy(ctx, enemy)
    }

    // Draw hero
    this._drawHero(ctx, heroX, heroY, heroHpPct, shield)

    // Floating numbers — advance age each frame (~60fps = ~0.016s per frame)
    this.floatingNumbers = this.floatingNumbers.filter(n => n.age < n.maxAge)
    for (const n of this.floatingNumbers) {
      n.age += 0.016
      n.y -= 0.5
      const alpha = 1 - (n.age / n.maxAge)
      ctx.globalAlpha = alpha
      ctx.font = n.isCrit ? 'bold 18px Georgia' : '14px Georgia'
      ctx.fillStyle = n.isCrit ? '#ffd700' : '#ffffff'
      ctx.textAlign = 'center'
      ctx.fillText(Math.round(n.value), n.x, n.y)
    }
    ctx.globalAlpha = 1 // Always reset alpha after floating numbers

    // Pause overlay
    if (isPaused) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, 0, ARENA_W, ARENA_H)
      ctx.fillStyle = '#f0c040'
      ctx.font = 'bold 32px Georgia'
      ctx.textAlign = 'center'
      ctx.fillText('PAUSED', ARENA_W / 2, ARENA_H / 2)
    }
  }

  _drawHero(ctx, x, y, hpPct, shieldActive) {
    // Shield aura
    if (shieldActive) {
      ctx.beginPath()
      ctx.arc(x, y, HERO_RADIUS + 8, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(100,180,255,0.6)'
      ctx.lineWidth = 3
      ctx.stroke()
    }
    // Hero circle
    ctx.beginPath()
    ctx.arc(x, y, HERO_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = '#4a90d9'
    ctx.fill()
    ctx.strokeStyle = '#82c4ff'
    ctx.lineWidth = 2
    ctx.stroke()
    // HP arc ring around hero
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

  _drawEnemy(ctx, enemy) {
    const { x, y, radius, color, currentHp, stats, isElite, isBoss } = enemy
    const hpPct = currentHp / stats.maxHp

    // Glow for elite/boss
    if (isElite || isBoss) {
      ctx.beginPath()
      ctx.arc(x, y, radius + 5, 0, Math.PI * 2)
      ctx.fillStyle = isBoss ? 'rgba(142,68,173,0.3)' : 'rgba(243,156,18,0.3)'
      ctx.fill()
    }

    // Enemy body circle
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    ctx.stroke()

    // HP bar above enemy
    const barW = radius * 2.5
    const barH = 4
    const barX = x - barW / 2
    const barY = y - radius - 10
    ctx.fillStyle = '#333'
    ctx.fillRect(barX, barY, barW, barH)
    ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c'
    ctx.fillRect(barX, barY, barW * hpPct, barH)
  }
}
