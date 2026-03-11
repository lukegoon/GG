import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { managerOnly } from '../middleware/roleGuard.js'

const router = Router()
const prisma = new PrismaClient()

// GET /api/goals/:repId?week=YYYY-MM-DD
router.get('/:repId', async (req, res) => {
  const repId = parseInt(req.params.repId)
  if (req.user.role === 'REP' && req.user.repId !== repId) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  try {
    const weekParam = req.query.week
    const where = { repId }
    if (weekParam) where.weekStart = new Date(weekParam + 'T00:00:00.000Z')

    const goals = await prisma.repGoal.findMany({ where, orderBy: { metric: 'asc' } })
    res.json(goals)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/goals/:repId — manager only, batch upsert
router.put('/:repId', managerOnly, async (req, res) => {
  const repId = parseInt(req.params.repId)
  const { weekStart, goals } = req.body
  if (!weekStart || !Array.isArray(goals)) {
    return res.status(400).json({ error: 'weekStart and goals[] required' })
  }
  try {
    const week = new Date(weekStart + 'T00:00:00.000Z')
    const results = []
    for (const { metric, target } of goals) {
      const g = await prisma.repGoal.upsert({
        where: { repId_weekStart_metric: { repId, weekStart: week, metric } },
        update: { target },
        create: { repId, weekStart: week, metric, target },
      })
      results.push(g)
    }
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/goals/:id — manager only
router.delete('/:id', managerOnly, async (req, res) => {
  try {
    await prisma.repGoal.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
