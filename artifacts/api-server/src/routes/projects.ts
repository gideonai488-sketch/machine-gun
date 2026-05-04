import { Router } from 'express'
import type { Server } from 'socket.io'
import * as projectStore from '../store/projects.js'
import * as sandboxManager from '../sandbox/manager.js'
import { handleChat } from '../agent/claude.js'

export const projectRouter = Router()

projectRouter.post('/', async (req, res) => {
  try {
    const { prompt, framework } = req.body as { prompt: string; framework: string }
    if (!prompt || !framework) {
      return res.status(400).json({ message: 'prompt and framework are required' })
    }

    const project = await projectStore.createProject({ prompt, framework })
    const io = req.app.get('io') as Server

    ;(async () => {
      try {
        await sandboxManager.createSandbox(project.id, framework)
        const previewUrl = await sandboxManager.startDevServer(project.id, framework)
        await projectStore.updateProject(project.id, { status: 'ready', previewUrl })

        io.to(`project:${project.id}`).emit('project:updated', { status: 'ready', previewUrl })
        await handleChat(project.id, prompt, io, `project:${project.id}`)
      } catch (err: any) {
        console.error('Sandbox initialization failed:', err)
        await projectStore.updateProject(project.id, { status: 'error' })
        io.to(`project:${project.id}`).emit('project:updated', { status: 'error' })
      }
    })()

    res.status(201).json(project)
  } catch (err) {
    console.error('Create project error:', err)
    res.status(500).json({ message: 'Failed to create project' })
  }
})

projectRouter.get('/', async (_req, res) => {
  const projects = await projectStore.listProjects()
  res.json(projects)
})

projectRouter.get('/:id', async (req, res) => {
  const project = await projectStore.getProject(req.params['id']!)
  if (!project) return res.status(404).json({ message: 'Project not found' })
  res.json(project)
})

projectRouter.post('/:id/chat', async (req, res) => {
  try {
    const project = await projectStore.getProject(req.params['id']!)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const { message } = req.body as { message: string }
    if (!message) return res.status(400).json({ message: 'message is required' })

    const io = req.app.get('io') as Server
    handleChat(project.id, message, io, `project:${project.id}`).catch(console.error)
    res.json({ status: 'processing' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to process chat' })
  }
})

projectRouter.get('/:id/files', async (req, res) => {
  try {
    const project = await projectStore.getProject(req.params['id']!)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const path = (req.query['path'] as string) || '/home/user/project'
    const fullPath = path.startsWith('/') ? path : `/home/user/project/${path}`
    const files = await sandboxManager.listFiles(project.id, fullPath)
    res.json({ files })
  } catch {
    res.json({ files: [] })
  }
})

projectRouter.get('/:id/files/content', async (req, res) => {
  try {
    const project = await projectStore.getProject(req.params['id']!)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const path = req.query['path'] as string
    if (!path) return res.status(400).json({ message: 'path query parameter is required' })

    const content = await sandboxManager.readFile(project.id, path)
    res.json({ content })
  } catch {
    res.status(500).json({ message: 'Failed to read file' })
  }
})

projectRouter.put('/:id/files/content', async (req, res) => {
  try {
    const project = await projectStore.getProject(req.params['id']!)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const { path, content } = req.body as { path: string; content: string }
    if (!path || content === undefined) return res.status(400).json({ message: 'path and content are required' })

    await sandboxManager.writeFile(project.id, path, content)

    const io = req.app.get('io') as Server
    io.to(`project:${project.id}`).emit('file:changed', { path, content })
    res.json({ success: true })
  } catch {
    res.status(500).json({ message: 'Failed to write file' })
  }
})

projectRouter.post('/:id/deploy/web', async (req, res) => {
  try {
    const project = await projectStore.getProject(req.params['id']!)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const io = req.app.get('io') as Server
    io.to(`project:${project.id}`).emit('build:status', { status: 'building' })
    await projectStore.updateProject(project.id, { status: 'building' })

    res.json({ status: 'building' })
  } catch {
    res.status(500).json({ message: 'Failed to trigger deploy' })
  }
})

projectRouter.post('/:id/deploy/mobile', async (req, res) => {
  try {
    const project = await projectStore.getProject(req.params['id']!)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const { platform, track } = req.body as { platform: string; track: string }
    if (!platform || !track) return res.status(400).json({ message: 'platform and track are required' })

    const io = req.app.get('io') as Server
    io.to(`project:${project.id}`).emit('build:status', { status: 'building', platform })
    res.json({ status: 'building', platform, track })
  } catch {
    res.status(500).json({ message: 'Failed to trigger mobile deploy' })
  }
})
