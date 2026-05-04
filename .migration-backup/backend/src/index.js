import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { projectRouter } from './routes/projects.js'
import { buildRouter } from './routes/builds.js'
import { authRouter } from './routes/auth.js'
import { setupSocketHandlers } from './socket/handlers.js'

const app = express()
const server = createServer(app)

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean)

function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true)
  if (allowedOrigins.includes(origin)) return callback(null, true)
  if (origin.endsWith('.vercel.app')) return callback(null, true)
  if (origin.endsWith('.railway.app')) return callback(null, true)
  callback(null, false)
}

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
})

app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json({ limit: '10mb' }))

app.use('/api/auth', authRouter)
app.use('/api/projects', projectRouter)
app.use('/api/projects', buildRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/', (_req, res) => {
  res.json({ name: 'Machine Gun API', status: 'running' })
})

setupSocketHandlers(io)

app.set('io', io)

const PORT = process.env.PORT || 3001
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Machine Gun backend running on port ${PORT}`)
})

export { app, io }
