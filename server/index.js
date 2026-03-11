import 'dotenv/config'
import express from 'express'
import http from 'http'
import { WebSocketServer } from 'ws'
import cors from 'cors'
import { setupRoutes } from './routes/index.js'
import { startSyncJob } from './jobs/syncJob.js'

const required = ['DATABASE_URL', 'JWT_SECRET']
const missing = required.filter(k => !process.env[k])
if (missing.length) {
  console.error('Missing required env vars:', missing.join(', '))
  process.exit(1)
}

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

app.set('wss', wss)

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

setupRoutes(app)

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ event: 'connected' }))
  ws.on('error', console.error)
})

startSyncJob(app)

const PORT = process.env.PORT || 4000
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
