import { auth } from '../middleware/auth.js'
import authRoutes from './auth.js'
import repsRoutes from './reps.js'
import statsRoutes from './stats.js'
import listsRoutes from './lists.js'
import insightsRoutes from './insights.js'
import goalsRoutes from './goals.js'
import notesRoutes from './notes.js'
import syncRoutes from './sync.js'
import settingsRoutes from './settings.js'
import usersRoutes from './users.js'

export function setupRoutes(app) {
  app.use('/api/auth', authRoutes)
  app.use('/api/reps', auth, repsRoutes)
  app.use('/api/stats', auth, statsRoutes)
  app.use('/api/lists', auth, listsRoutes)
  app.use('/api/insights', auth, insightsRoutes)
  app.use('/api/goals', auth, goalsRoutes)
  app.use('/api/notes', auth, notesRoutes)
  app.use('/api/sync', auth, syncRoutes)
  app.use('/api/settings', auth, settingsRoutes)
  app.use('/api/users', auth, usersRoutes)

  app.get('/api/health', (req, res) => res.json({ ok: true }))
}
