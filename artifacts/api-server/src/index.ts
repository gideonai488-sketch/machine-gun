import { createServer } from 'http'
import { Server } from 'socket.io'
import app from './app.js'
import { setupSocketHandlers } from './socket/handlers.js'
import { logger } from './lib/logger.js'

const rawPort = process.env['PORT']

if (!rawPort) {
  throw new Error('PORT environment variable is required but was not provided.')
}

const port = Number(rawPort)

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`)
}

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (origin.endsWith('.replit.dev') || origin.endsWith('.replit.app')) return callback(null, true)
      if (origin.includes('localhost')) return callback(null, true)
      callback(null, false)
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
})

app.set('io', io)
setupSocketHandlers(io)

httpServer.listen(port, '0.0.0.0', () => {
  logger.info({ port }, 'Machine Gun API Server listening')
})
