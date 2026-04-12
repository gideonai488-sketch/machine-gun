import { Router } from 'express'
import * as projectStore from '../store/projects.js'
import * as sandboxManager from '../sandbox/manager.js'
import { handleChat } from '../agent/claude.js'

export const projectRouter = Router()

projectRouter.post('/', async (req, res) => {
  try {
    const { prompt, framework } = req.body

    if (!prompt || !framework) {
      return res.status(400).json({ message: 'prompt and framework are required' })
    }

    const project = projectStore.createProject({ prompt, framework })

    (async () => {
      try {
        const sandbox = await sandboxManager.createSandbox(project.id, framework)
        const previewUrl = await sandboxManager.startDevServer(project.id, framework)
        projectStore.updateProject(project.id, {
          status: 'ready',
          sandboxId: sandbox.sandboxId,
          previewUrl,
        })

        const io = req.app.get('io')
        if (io) {
          io.to(`project:${project.id}`).emit('project:updated', {
            status: 'ready',
            previewUrl,
          })

          await handleChat(
            project.id,
            prompt,
            io,
            `project:${project.id}`
          )
        }
      } catch (err) {
        console.error('Sandbox initialization failed:', err)
        projectStore.updateProject(project.id, { status: 'error' })
      }
    })()

    res.status(201).json(project)
  } catch (err) {
    console.error('Create project error:', err)
    res.status(500).json({ message: 'Failed to create project' })
  }
})

projectRouter.get('/', (_req, res) => {
  const projects = projectStore.listProjects()
  res.json(projects)
})

projectRouter.get('/:id', (req, res) => {
  const project = projectStore.getProject(req.params.id)
  if (!project) {
    return res.status(404).json({ message: 'Project not found' })
  }
  res.json(project)
})

projectRouter.post('/:id/chat', async (req, res) => {
  try {
    const project = projectStore.getProject(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const { message } = req.body
    if (!message) {
      return res.status(400).json({ message: 'message is required' })
    }

    const io = req.app.get('io')
    handleChat(project.id, message, io, `project:${project.id}`).catch(console.error)

    res.json({ status: 'processing' })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ message: 'Failed to process chat' })
  }
})

projectRouter.get('/:id/files', async (req, res) => {
  try {
    const project = projectStore.getProject(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const path = req.query.path || '/home/user/project'
    const fullPath = path.startsWith('/') ? path : `/home/user/project/${path}`
    const files = await sandboxManager.listFiles(project.id, fullPath)
    res.json({ files })
  } catch (err) {
    console.error('List files error:', err)
    res.json({ files: [] })
  }
})

projectRouter.get('/:id/files/content', async (req, res) => {
  try {
    const project = projectStore.getProject(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const { path } = req.query
    if (!path) {
      return res.status(400).json({ message: 'path query parameter is required' })
    }

    const content = await sandboxManager.readFile(project.id, path)
    res.json({ content })
  } catch (err) {
    console.error('Read file error:', err)
    res.status(500).json({ message: 'Failed to read file' })
  }
})

projectRouter.put('/:id/files/content', async (req, res) => {
  try {
    const project = projectStore.getProject(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const { path, content } = req.body
    if (!path || content === undefined) {
      return res.status(400).json({ message: 'path and content are required' })
    }

    await sandboxManager.writeFile(project.id, path, content)

    const io = req.app.get('io')
    if (io) {
      io.to(`project:${project.id}`).emit('file:changed', { path, content })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Write file error:', err)
    res.status(500).json({ message: 'Failed to write file' })
  }
})

projectRouter.post('/:id/build', async (req, res) => {
  try {
    const project = projectStore.getProject(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const { platform } = req.body
    if (!platform) {
      return res.status(400).json({ message: 'platform is required' })
    }

    const io = req.app.get('io')
    if (io) {
      io.to(`project:${project.id}`).emit('build:status', { status: 'building' })
    }

    projectStore.updateProject(project.id, { status: 'building' })

    res.json({ status: 'building', platform })
  } catch (err) {
    console.error('Build error:', err)
    res.status(500).json({ message: 'Failed to trigger build' })
  }
})

projectRouter.post('/:id/publish', async (req, res) => {
  try {
    const project = projectStore.getProject(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const { platform, track } = req.body
    if (!platform || !track) {
      return res.status(400).json({ message: 'platform and track are required' })
    }

    res.json({ status: 'publishing', platform, track })
  } catch (err) {
    console.error('Publish error:', err)
    res.status(500).json({ message: 'Failed to publish' })
  }
})
