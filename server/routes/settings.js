import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { managerOnly } from '../middleware/roleGuard.js'

const router = Router()
const prisma = new PrismaClient()

// GET /api/settings — manager only
router.get('/', managerOnly, async (req, res) => {
  try {
    const settings = await prisma.appSetting.findMany()
    const obj = {}
    for (const s of settings) obj[s.key] = s.value
    res.json(obj)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/settings — manager only, batch upsert
router.put('/', managerOnly, async (req, res) => {
  const { settings } = req.body
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'settings object required' })
  }
  try {
    const results = []
    for (const [key, value] of Object.entries(settings)) {
      const s = await prisma.appSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
      results.push(s)
    }
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
