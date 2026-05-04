import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || ''

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  auth: {},
})

export function connectSocket(projectId: string) {
  if (!socket.connected) {
    socket.auth = { projectId }
    socket.connect()
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect()
  }
}
