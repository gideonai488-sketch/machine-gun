import express, { type Express } from 'express'
import cors from 'cors'
import pinoHttp from 'pino-http'
import router from './routes/index.js'
import { logger } from './lib/logger.js'

const app: Express = express()

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split('?')[0] }
      },
      res(res) {
        return { statusCode: res.statusCode }
      },
    },
  }),
)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (origin.endsWith('.replit.dev') || origin.endsWith('.replit.app')) return callback(null, true)
      if (origin.includes('localhost')) return callback(null, true)
      callback(null, false)
    },
    credentials: true,
  }),
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api', router)

app.get('/', (_req, res) => {
  res.json({ name: 'Machine Gun API', status: 'running' })
})

export default app
