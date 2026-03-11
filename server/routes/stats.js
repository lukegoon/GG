import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { getDerivedMetrics, computeCompositeScore } from '../services/compositeScore.js'

const router = Router()
const prisma = new PrismaClient()

function addDerived(stat, allStats) {
  const m = getDerivedMetrics(stat)
  const score = stat.compositeScore ?? computeCompositeScore(stat, allStats)
  return {
    ...stat,
    contactRate:  m.contactRate,
    schedPct:     m.schedPct,
    schedHour:    m.schedHour,
    talkEff:      m.talkEff,
    eodYesRate:   m.eodYesRate,
    hangUpRate:   stat.contacts > 0 ? stat.hu / stat.contacts : 0,
    ngfRate:      stat.contacts > 0 ? stat.ngf / stat.contacts : 0,
    noAnsRate:    stat.calls > 0 ? stat.noAns / stat.calls : 0,
    pausePct:     (stat.talkMin + stat.waitMin + stat.pauseMin + stat.wrapMin) > 0
      ? stat.pauseMin / (stat.talkMin + stat.waitMin + stat.pauseMin + stat.wrapMin) : 0,
    compositeScore: score,
  }
}

// GET /api/stats/weeks — distinct weekStart dates desc
router.get('/weeks', async (req, res) => {
  try {
    const rows = await prisma.weeklyStat.findMany({
      select: { weekStart: true },
      distinct: ['weekStart'],
      orderBy: { weekStart: 'desc' },
    })
    res.json(rows.map(r => r.weekStart.toISOString().split('T')[0]))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/stats?week=YYYY-MM-DD — all reps' stats for a week
router.get('/', async (req, res) => {
  try {
    const weekParam = req.query.week
    let weekStart

    if (weekParam) {
      weekStart = new Date(weekParam + 'T00:00:00.000Z')
    } else {
      const latest = await prisma.weeklyStat.findFirst({ orderBy: { weekStart: 'desc' } })
      if (!latest) return res.json([])
      weekStart = latest.weekStart
    }

    // Always fetch ALL reps (needed for composite score percentile calc)
    const allStats = await prisma.weeklyStat.findMany({
      where: { weekStart },
      include: { rep: { select: { id: true, name: true, email: true, convosoId: true, active: true } } },
    })

    const enriched = allStats.map(s => addDerived(s, allStats))

    // REP role: return only own row
    if (req.user.role === 'REP') {
      const own = enriched.find(s => s.repId === req.user.repId)
      const teamAvg = computeTeamAverages(enriched)
      return res.json({ own: own ?? null, teamAvg, rank: own ? getRank(own, enriched) : null })
    }

    res.json(enriched)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/stats/:repId?week=YYYY-MM-DD
router.get('/:repId', async (req, res) => {
  const repId = parseInt(req.params.repId)

  if (req.user.role === 'REP' && req.user.repId !== repId) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    const weekParam = req.query.week
    let weekStart
    if (weekParam) {
      weekStart = new Date(weekParam + 'T00:00:00.000Z')
    } else {
      const latest = await prisma.weeklyStat.findFirst({ orderBy: { weekStart: 'desc' } })
      if (!latest) return res.json(null)
      weekStart = latest.weekStart
    }

    const allStats = await prisma.weeklyStat.findMany({ where: { weekStart } })
    const repStat = allStats.find(s => s.repId === repId)
    if (!repStat) return res.status(404).json({ error: 'Stats not found' })

    const enriched = addDerived(repStat, allStats)
    const teamAvg = computeTeamAverages(allStats.map(s => addDerived(s, allStats)))
    res.json({ stat: enriched, teamAvg, rank: getRank(enriched, allStats.map(s => addDerived(s, allStats))) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/stats/:repId/trends?weeks=8
router.get('/:repId/trends', async (req, res) => {
  const repId = parseInt(req.params.repId)
  if (req.user.role === 'REP' && req.user.repId !== repId) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  const numWeeks = parseInt(req.query.weeks ?? 8)

  try {
    const stats = await prisma.weeklyStat.findMany({
      where: { repId },
      orderBy: { weekStart: 'desc' },
      take: numWeeks,
    })
    res.json(stats.map(s => addDerived(s, [s])).reverse())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function computeTeamAverages(stats) {
  if (!stats.length) return {}
  const keys = ['contactRate', 'schedPct', 'schedHour', 'talkEff', 'eodYesRate',
    'hangUpRate', 'ngfRate', 'noAnsRate', 'pausePct', 'compositeScore',
    'calls', 'contacts', 'sched', 'hires', 'talkMin', 'pauseMin', 'wrapMin']
  const result = {}
  for (const k of keys) {
    const vals = stats.map(s => s[k] ?? 0).filter(v => !isNaN(v))
    result[k] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  }
  return result
}

function getRank(repStat, allStats) {
  const sorted = [...allStats].sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0))
  return sorted.findIndex(s => s.repId === repStat.repId) + 1
}

export default router
