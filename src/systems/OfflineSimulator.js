const MAX_OFFLINE_MS = 8 * 60 * 60 * 1000 // 8 hours
const SECONDS_PER_WAVE = 90 // approx seconds to clear one wave at base power

export function calculateOfflineProgress(heroStats, zone, startWave, elapsedMs) {
  if (elapsedMs <= 0) return { wavesCleared: 0, gold: 0, echoes: 0 }

  const cappedMs = Math.min(elapsedMs, MAX_OFFLINE_MS)
  const elapsedSeconds = cappedMs / 1000

  // Power score: rough DPS estimate vs zone enemies
  const dps = (heroStats.damageFlat || 5) * (heroStats.attackSpeed || 1) * (1 + (heroStats.critChance || 0) * 0.5)
  const survivalFactor = Math.min(1, (heroStats.maxHp || 100) / 80) * (1 + (heroStats.armor || 0) / 100)
  const powerScore = dps * survivalFactor

  // Zone 1 base DPS requirement to survive ≈ 15 DPS
  const zoneDifficulty = zone * 15
  const efficiency = Math.min(1, powerScore / zoneDifficulty)

  const effectiveSecondsPerWave = SECONDS_PER_WAVE / Math.max(0.1, efficiency)
  const wavesCleared = Math.floor(elapsedSeconds / effectiveSecondsPerWave)

  const gold = wavesCleared * 12
  const echoes = wavesCleared * 3

  return { wavesCleared, gold, echoes }
}
