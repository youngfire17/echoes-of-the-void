// src/combat/EnemyAI.js
import { distance } from '../utils'

export function moveEnemyTowardHero(enemy, heroX, heroY, dt) {
  const dx = heroX - enemy.x
  const dy = heroY - enemy.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist <= enemy.stats.attackRange) return
  const speed = enemy.stats.speed * dt
  enemy.x += (dx / dist) * speed
  enemy.y += (dy / dist) * speed
}

export function tickEnemyAttack(enemy, heroX, heroY, dt, onHit) {
  const dist = distance({ x: enemy.x, y: enemy.y }, { x: heroX, y: heroY })
  if (dist > enemy.stats.attackRange) return

  enemy.attackTimer = (enemy.attackTimer || 0) + dt
  const interval = 1 / enemy.stats.attackSpeed
  if (enemy.attackTimer >= interval) {
    enemy.attackTimer -= interval
    onHit(enemy.stats.damage)
  }
}
