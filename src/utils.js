// src/utils.js
let _idCounter = 0

export function generateId() {
  return `item_${Date.now()}_${_idCounter++}`
}

export function distance(a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

export function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
