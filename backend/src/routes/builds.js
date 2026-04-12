import { Router } from 'express'
import * as codemagic from '../services/codemagic.js'
import * as deploy from '../services/deploy.js'
import * as projectStore from '../store/projects.js'

export const buildRouter = Router()

buildRouter.post('/:projectId/deploy/web', async (req, res) => {
  const project = projectStore.getProject(req.params.projectId)
  if (!project) return res.status(404).json({ message: 'Project not found' })

  const io = req.app.get('io')
  const room = `project:${project.id}`

  res.json({ status: 'deploying' })

  deploy.deployWeb(project.id, {
    emitActivity(a) { io?.to(room).emit('activity', a) },
    emitStatus(s) { io?.to(room).emit('deploy:status', s) },
  }).then((result) => {
    io?.to(room).emit('deploy:done', result)
  }).catch((err) => {
    console.error('Web deploy error:', err)
    io?.to(room).emit('deploy:error', { message: err.message })
  })
})

buildRouter.post('/:projectId/deploy/mobile', async (req, res) => {
  const project = projectStore.getProject(req.params.projectId)
  if (!project) return res.status(404).json({ message: 'Project not found' })

  const { platform, track } = req.body
  if (!platform || !['android', 'ios'].includes(platform)) {
    return res.status(400).json({ message: 'platform must be android or ios' })
  }

  const io = req.app.get('io')
  const room = `project:${project.id}`

  res.json({ status: 'building', platform })

  deploy.buildAndPublishMobile(project.id, {
    platform,
    track: track || null,
    emitActivity(a) { io?.to(room).emit('activity', a) },
    emitStatus(s) { io?.to(room).emit('deploy:status', s) },
  }).then((result) => {
    io?.to(room).emit('deploy:done', result)
  }).catch((err) => {
    console.error('Mobile build error:', err)
    io?.to(room).emit('deploy:error', { message: err.message })
  })
})

buildRouter.get('/:projectId/build/:buildId', async (req, res) => {
  try {
    const data = await codemagic.getBuildStatus(req.params.buildId)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

buildRouter.post('/:projectId/build/:buildId/cancel', async (req, res) => {
  try {
    const result = await codemagic.cancelBuild(req.params.buildId)
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})
