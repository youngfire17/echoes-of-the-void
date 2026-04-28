const TICK_INTERVAL_MS = 100 // 10 logic ticks per second

export class GameLoop {
  constructor(onLogicTick, onRender) {
    this.onLogicTick = onLogicTick
    this.onRender = onRender
    this.running = false
    this.rafId = null
    this.lastTimestamp = 0
    this.tickAccumulator = 0
  }

  start() {
    if (this.running) return
    this.running = true
    this.lastTimestamp = performance.now()
    this.rafId = requestAnimationFrame(this._loop.bind(this))
  }

  stop() {
    this.running = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  _loop(timestamp) {
    if (!this.running) return

    const delta = Math.min(timestamp - this.lastTimestamp, 200) // cap at 200ms to prevent spiral
    this.lastTimestamp = timestamp
    this.tickAccumulator += delta

    while (this.tickAccumulator >= TICK_INTERVAL_MS) {
      this.onLogicTick(TICK_INTERVAL_MS / 1000) // dt in seconds (always 0.1)
      this.tickAccumulator -= TICK_INTERVAL_MS
    }

    this.onRender()
    this.rafId = requestAnimationFrame(this._loop.bind(this))
  }
}
