import { Router } from 'express'
import * as codemagic from '../services/codemagic.js'
import * as projectStore from '../store/projects.js'

export const buildRouter = Router()

buildRouter.post('/:projectId/build', async (req, res) => {
  try {
    const project = projectStore.getProject(req.params.projectId)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const { platform } = req.body
    if (!platform) {
      return res.status(400).json({ message: 'platform is required (android | ios | web)' })
    }

    if (!process.env.CODEMAGIC_API_TOKEN || !process.env.CODEMAGIC_APP_ID) {
      return res.status(400).json({
        message: 'Codemagic is not configured. Add CODEMAGIC_API_TOKEN and CODEMAGIC_APP_ID to your environment.',
      })
    }

    const workflowMap = {
      android: 'android-release',
      ios: 'ios-release',
      web: 'web-release',
    }

    const workflowId = workflowMap[platform]
    if (!workflowId) {
      return res.status(400).json({ message: `Unknown platform: ${platform}` })
    }

    const io = req.app.get('io')
    if (io) {
      io.to(`project:${project.id}`).emit('build:status', { status: 'building', platform })
    }

    const result = await codemagic.startBuild({
      appId: process.env.CODEMAGIC_APP_ID,
      workflowId,
      branch: 'main',
    })

    projectStore.updateProject(project.id, {
      status: 'building',
      currentBuildId: result.buildId,
    })

    pollAndNotify(project.id, result.buildId, io)

    res.json({
      status: 'building',
      buildId: result.buildId,
      platform,
    })
  } catch (err) {
    console.error('Build error:', err)
    res.status(500).json({ message: err.message })
  }
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

buildRouter.get('/:projectId/codemagic/apps', async (_req, res) => {
  try {
    const apps = await codemagic.listApps()
    res.json({ apps })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

buildRouter.post('/:projectId/codemagic/yaml', async (req, res) => {
  try {
    const project = projectStore.getProject(req.params.projectId)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const { androidPublish, iosPublish, playStoreTrack } = req.body
    const appName = project.name?.replace(/[^a-zA-Z0-9]/g, '') || 'DevFlowApp'

    let yaml
    if (project.framework === 'flutter') {
      yaml = codemagic.generateFlutterYaml({
        appName,
        androidPublish,
        iosPublish,
        playStoreTrack,
      })
    } else {
      yaml = codemagic.generateReactNativeYaml({
        appName,
        androidPublish,
        iosPublish,
        playStoreTrack,
      })
    }

    res.json({ yaml })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

async function pollAndNotify(projectId, buildId, io) {
  try {
    const result = await codemagic.pollBuildUntilDone(buildId, {
      intervalMs: 15000,
      timeoutMs: 1200000,
      onStatus({ status }) {
        if (io) {
          io.to(`project:${projectId}`).emit('build:status', { status, buildId })
          io.to(`project:${projectId}`).emit('activity', {
            id: `build-poll-${buildId}`,
            type: 'build',
            message: status === 'building' ? 'Building your app...' : `Build ${status}`,
            status: status === 'building' ? 'running' : status === 'finished' ? 'success' : 'error',
            update: true,
          })
        }
      },
    })

    const finalStatus = result.status === 'finished' ? 'success' : 'error'
    projectStore.updateProject(projectId, { status: finalStatus })

    if (io) {
      io.to(`project:${projectId}`).emit('build:status', {
        status: finalStatus,
        buildId,
        artefacts: result.artefacts,
      })
    }
  } catch (err) {
    console.error('Build polling error:', err)
    projectStore.updateProject(projectId, { status: 'error' })
    if (io) {
      io.to(`project:${projectId}`).emit('build:status', { status: 'error', buildId })
    }
  }
}
