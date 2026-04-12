import { handleChat } from '../agent/claude.js'
import { getProject } from '../store/projects.js'

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    const projectId = socket.handshake.auth?.projectId
    console.log(`Client connected: ${socket.id} for project: ${projectId || 'none'}`)

    if (projectId) {
      socket.join(`project:${projectId}`)
    }

    socket.on('join:project', (data) => {
      const { projectId: pid } = data
      socket.join(`project:${pid}`)
      console.log(`Socket ${socket.id} joined project:${pid}`)
    })

    socket.on('chat:send', async (data) => {
      const { projectId: pid, message } = data

      if (!pid || !message) {
        socket.emit('error', { message: 'projectId and message are required' })
        return
      }

      const project = getProject(pid)
      if (!project) {
        socket.emit('error', { message: 'Project not found' })
        return
      }

      try {
        await handleChat(pid, message, io, `project:${pid}`)
      } catch (err) {
        console.error('Chat handler error:', err)
        io.to(`project:${pid}`).emit('chat:stream', {
          type: 'delta',
          content: `\n\nI encountered an error: ${err.message}. Let me try again.`,
        })
        io.to(`project:${pid}`).emit('chat:stream', { type: 'done' })
      }
    })

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)
    })
  })
}
