// Composite score: weighted percentile rank across 5 components (0–100 scale)
const WEIGHTS = {
  schedPct:     30,
  schedHour:    25,
  contactRate:  20,
  talkEff:      15,
  eodYesRate:   10,
}

export function getDerivedMetrics(stat) {
  const totalMin = stat.talkMin + stat.waitMin + stat.pauseMin + stat.wrapMin
  return {
    schedPct:    stat.contacts > 0 ? stat.sched / stat.contacts : 0,
    schedHour:   stat.loginMin > 0 ? stat.sched / (stat.loginMin / 60) : 0,
    contactRate: stat.calls > 0 ? stat.contacts / stat.calls : 0,
    talkEff:     totalMin > 0 ? stat.talkMin / totalMin : 0,
    eodYesRate:  (stat.eodYes + stat.eodNo) > 0 ? stat.eodYes / (stat.eodYes + stat.eodNo) : 0,
  }
}

function percentileRank(value, allValues) {
  if (allValues.length === 0) return 50
  const sorted = [...allValues].sort((a, b) => a - b)
  const below = sorted.filter(v => v < value).length
  return Math.round((below / sorted.length) * 100)
}

export function computeCompositeScore(stat, allStats) {
  const repMetrics = getDerivedMetrics(stat)

  const score = Object.entries(WEIGHTS).reduce((total, [metric, weight]) => {
    const allValues = allStats.map(s => getDerivedMetrics(s)[metric])
    const pct = percentileRank(repMetrics[metric], allValues)
    return total + (pct * weight / 100)
  }, 0)

  return Math.round(score * 10) / 10
}

export function computeAllScores(allStats) {
  return allStats.map(stat => ({
    ...stat,
    compositeScore: computeCompositeScore(stat, allStats)
  }))
}
