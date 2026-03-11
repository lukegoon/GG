import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { managerOnly } from '../middleware/roleGuard.js'

const router = Router()
const prisma = new PrismaClient()

// GET /api/lists?week=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const weekParam = req.query.week
    let weekStart
    if (weekParam) {
      weekStart = new Date(weekParam + 'T00:00:00.000Z')
    } else {
      const latest = await prisma.listStat.findFirst({ orderBy: { weekStart: 'desc' } })
      weekStart = latest?.weekStart ?? null
    }

    const lists = await prisma.clientList.findMany({
      orderBy: { name: 'asc' },
      include: weekStart
        ? { listStats: { where: { weekStart }, take: 1 } }
        : { listStats: { orderBy: { weekStart: 'desc' }, take: 1 } },
    })

    const enriched = lists.map(l => {
      const stat = l.listStats[0] ?? null
      return {
        ...l,
        listStats: undefined,
        weekStat: stat ? {
          ...stat,
          contactRate: stat.calls > 0 ? stat.contacts / stat.calls : 0,
          schedRate: stat.contacts > 0 ? stat.sched / stat.contacts : 0,
        } : null,
      }
    })

    res.json(enriched)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/lists/:id
router.get('/:id', async (req, res) => {
  try {
    const list = await prisma.clientList.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { listStats: { orderBy: { weekStart: 'desc' }, take: 12 } },
    })
    if (!list) return res.status(404).json({ error: 'List not found' })
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/lists — manager only
router.post('/', managerOnly, async (req, res) => {
  const { name, industry, source } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  try {
    const list = await prisma.clientList.create({ data: { name, industry, source } })
    res.status(201).json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/lists/:id — manager only
router.patch('/:id', managerOnly, async (req, res) => {
  const { name, industry } = req.body
  try {
    const list = await prisma.clientList.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(industry !== undefined && { industry }),
      },
    })
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
