import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { projectRouter } from './routes/projects.js'
import { buildRouter } from './routes/builds.js'
import { setupSocketHandlers } from './socket/handlers.js'

const app = express()
const server = createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
})

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}))
app.use(express.json({ limit: '10mb' }))

app.use('/api/projects', projectRouter)
app.use('/api/projects', buildRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

setupSocketHandlers(io)

app.set('io', io)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`DevFlow backend running on port ${PORT}`)
})

export { app, io }
