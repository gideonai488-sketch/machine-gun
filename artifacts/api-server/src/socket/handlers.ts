import type { Server } from 'socket.io'
import { handleChat } from '../agent/claude.js'
import { getProject } from '../store/projects.js'

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket) => {
    const projectId = (socket.handshake.auth as any)?.projectId as string | undefined
    console.log(`Client connected: ${socket.id} for project: ${projectId ?? 'none'}`)

    if (projectId) socket.join(`project:${projectId}`)

    socket.on('join:project', (data: { projectId: string }) => {
      socket.join(`project:${data.projectId}`)
    })

    socket.on('chat:send', async (data: { projectId: string; message: string }) => {
      const { projectId: pid, message } = data

      if (!pid || !message) {
        socket.emit('error', { message: 'projectId and message are required' })
        return
      }

      const project = await getProject(pid)
      if (!project) {
        socket.emit('error', { message: 'Project not found' })
        return
      }

      handleChat(pid, message, io, `project:${pid}`).catch((err) => {
        console.error('Chat handler error:', err)
        io.to(`project:${pid}`).emit('chat:stream', { type: 'delta', content: `\n\nI encountered an error: ${err.message}` })
        io.to(`project:${pid}`).emit('chat:stream', { type: 'done' })
      })
    })

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)
    })
  })
}
