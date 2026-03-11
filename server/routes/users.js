import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { managerOnly } from '../middleware/roleGuard.js'

const router = Router()
const prisma = new PrismaClient()

// GET /api/users — manager only
router.get('/', managerOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true, rep: { select: { id: true, name: true } } },
      orderBy: { email: 'asc' },
    })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/users — manager only
router.post('/', managerOnly, async (req, res) => {
  const { email, password, role, repId } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  try {
    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, passwordHash: hash, role: role ?? 'REP' },
    })
    if (repId) {
      await prisma.rep.update({ where: { id: repId }, data: { userId: user.id } })
    }
    res.status(201).json({ id: user.id, email: user.email, role: user.role })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/users/:id/password — manager only
router.patch('/:id/password', managerOnly, async (req, res) => {
  const { newPassword } = req.body
  if (!newPassword) return res.status(400).json({ error: 'newPassword required' })
  try {
    const hash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: parseInt(req.params.id) }, data: { passwordHash: hash } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/users/:id — manager only, soft-delete via rep.active
router.delete('/:id', managerOnly, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { rep: true },
    })
    if (user?.rep) {
      await prisma.rep.update({ where: { id: user.rep.id }, data: { active: false } })
    }
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
