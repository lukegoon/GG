import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { runSync } from '../jobs/syncJob.js'
import { managerOnly } from '../middleware/roleGuard.js'

const router = Router()
const prisma = new PrismaClient()

// POST /api/sync — manager only, trigger manual sync
router.post('/', managerOnly, async (req, res) => {
  const { weekStart } = req.body
  const app = req.app

  // Fire async — don't await
  const weekDate = weekStart ? new Date(weekStart + 'T00:00:00.000Z') : null
  runSync(app, weekDate).catch(err => console.error('[Sync route] Error:', err.message))

  res.json({ ok: true, message: 'Sync started' })
})

// GET /api/sync/logs?limit=20
router.get('/logs', managerOnly, async (req, res) => {
  const limit = parseInt(req.query.limit ?? 20)
  try {
    const logs = await prisma.syncLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    })
    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/sync/logs/:id
router.get('/logs/:id', managerOnly, async (req, res) => {
  try {
    const log = await prisma.syncLog.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!log) return res.status(404).json({ error: 'Not found' })
    res.json(log)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
