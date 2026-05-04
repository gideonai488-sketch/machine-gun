import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || ''

export const socket: Socket = io(SOCKET_URL || 'http://localhost:3001', {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
})

export function connectSocket(projectId: string) {
  if (!SOCKET_URL) return
  if (!socket.connected) {
    (socket as any).auth = { projectId }
    socket.connect()
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect()
  }
}
