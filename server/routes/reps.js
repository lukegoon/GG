import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { managerOnly } from '../middleware/roleGuard.js'

const router = Router()
const prisma = new PrismaClient()

// GET /api/reps
router.get('/', async (req, res) => {
  try {
    const where = req.user.role === 'REP'
      ? { id: req.user.repId }
      : { active: true }

    const reps = await prisma.rep.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { user: { select: { id: true, email: true, role: true } } }
    })
    res.json(reps)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reps/:id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  if (req.user.role === 'REP' && req.user.repId !== id) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  try {
    const rep = await prisma.rep.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, role: true } } }
    })
    if (!rep) return res.status(404).json({ error: 'Rep not found' })
    res.json(rep)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/reps/:id — manager only
router.patch('/:id', managerOnly, async (req, res) => {
  const id = parseInt(req.params.id)
  const { name, active, convosoId, email } = req.body
  try {
    const rep = await prisma.rep.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(active !== undefined && { active }),
        ...(convosoId !== undefined && { convosoId }),
        ...(email !== undefined && { email }),
      }
    })
    res.json(rep)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/reps — manager only
router.post('/', managerOnly, async (req, res) => {
  const { name, email, convosoId } = req.body
  if (!name || !email) return res.status(400).json({ error: 'name and email required' })
  try {
    const rep = await prisma.rep.create({ data: { name, email, convosoId } })
    res.status(201).json(rep)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
