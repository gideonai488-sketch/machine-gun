import { Router, type IRouter } from 'express'
import { projectRouter } from './projects.js'
import { authRouter } from './auth.js'

const router: IRouter = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

router.use('/auth', authRouter)
router.use('/projects', projectRouter)

export default router
