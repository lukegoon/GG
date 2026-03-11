import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { generateInsights } from '../services/insightEngine.js'
import { managerOnly } from '../middleware/roleGuard.js'

const router = Router()
const prisma = new PrismaClient()

// GET /api/insights/:repId?week=YYYY-MM-DD
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
      if (!latest) return res.json([])
      weekStart = latest.weekStart
    }

    const allStats = await prisma.weeklyStat.findMany({ where: { weekStart } })
    const repStat = allStats.find(s => s.repId === repId)
    if (!repStat) return res.json([])

    const insights = generateInsights(repStat, allStats)
    res.json(insights)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/insights?week=YYYY-MM-DD — all reps (manager only)
router.get('/', managerOnly, async (req, res) => {
  try {
    const weekParam = req.query.week
    let weekStart
    if (weekParam) {
      weekStart = new Date(weekParam + 'T00:00:00.000Z')
    } else {
      const latest = await prisma.weeklyStat.findFirst({ orderBy: { weekStart: 'desc' } })
      if (!latest) return res.json({})
      weekStart = latest.weekStart
    }

    const allStats = await prisma.weeklyStat.findMany({
      where: { weekStart },
      include: { rep: { select: { id: true, name: true } } },
    })

    const result = {}
    for (const stat of allStats) {
      result[stat.repId] = {
        repName: stat.rep?.name ?? stat.repId,
        insights: generateInsights(stat, allStats),
      }
    }
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
