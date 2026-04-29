// src/combat/Camera.js
export class Camera {
  constructor(viewportW, viewportH) {
    this.viewportW = viewportW
    this.viewportH = viewportH
    this.x = 0
    this.y = 0
  }

  follow(targetX, targetY, dungeonBounds) {
    this.x = targetX - this.viewportW / 2
    this.y = targetY - this.viewportH / 2
    this.x = Math.max(0, Math.min(this.x, Math.max(0, dungeonBounds.width - this.viewportW)))
    this.y = Math.max(0, Math.min(this.y, Math.max(0, dungeonBounds.height - this.viewportH)))
  }

  worldToScreen(wx, wy) {
    return { x: wx - this.x, y: wy - this.y }
  }

  screenToWorld(sx, sy) {
    return { x: sx + this.x, y: sy + this.y }
  }

  isVisible(wx, wy, margin = 150) {
    return (
      wx >= this.x - margin &&
      wx <= this.x + this.viewportW + margin &&
      wy >= this.y - margin &&
      wy <= this.y + this.viewportH + margin
    )
  }
}
