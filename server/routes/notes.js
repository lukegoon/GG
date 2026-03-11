import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { managerOnly } from '../middleware/roleGuard.js'

const router = Router()
const prisma = new PrismaClient()

// GET /api/notes/:repId?week=YYYY-MM-DD
router.get('/:repId', async (req, res) => {
  const repId = parseInt(req.params.repId)
  if (req.user.role === 'REP' && req.user.repId !== repId) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  try {
    const where = { repId }
    if (req.query.week) where.weekStart = new Date(req.query.week + 'T00:00:00.000Z')
    const notes = await prisma.managerNote.findMany({ where, orderBy: { createdAt: 'asc' } })
    res.json(notes)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/notes/:repId — manager only
router.post('/:repId', managerOnly, async (req, res) => {
  const { weekStart, content } = req.body
  if (!weekStart || !content) return res.status(400).json({ error: 'weekStart and content required' })
  try {
    const note = await prisma.managerNote.create({
      data: {
        repId: parseInt(req.params.repId),
        weekStart: new Date(weekStart + 'T00:00:00.000Z'),
        content,
        authorId: req.user.userId,
      }
    })
    res.status(201).json(note)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/notes/:id — manager only
router.patch('/:id', managerOnly, async (req, res) => {
  const { content } = req.body
  try {
    const note = await prisma.managerNote.update({
      where: { id: parseInt(req.params.id) },
      data: { content },
    })
    res.json(note)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/notes/:id — manager only
router.delete('/:id', managerOnly, async (req, res) => {
  try {
    await prisma.managerNote.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
