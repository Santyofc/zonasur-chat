import { io, Socket } from 'socket.io-client'
import type {
  SendMessagePayload,
  ReadMessagePayload,
  TypingPayload,
  NewMessageEvent,
  MessageDeliveredEvent,
  MessageReadEvent,
  TypingUpdateEvent,
  PresenceUpdateEvent,
} from '@zs/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

let socketInstance: Socket | null = null

/**
 * Returns a singleton Socket.IO client authenticated with the Supabase JWT.
 * Connects lazily on first call and reuses the same connection.
 */
export function getSocket(token: string): Socket {
  if (socketInstance?.connected) return socketInstance

  // Disconnect stale socket if token changed
  socketInstance?.disconnect()

  socketInstance = io(API_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  return socketInstance
}

/**
 * Disconnect and destroy the socket singleton.
 * Call on sign-out.
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}

// ─── Typed emit helpers ───────────────────────────────────────

export function emitMessage(socket: Socket, payload: SendMessagePayload) {
  socket.emit('message:send', payload)
}

export function emitMessageRead(socket: Socket, payload: ReadMessagePayload) {
  socket.emit('message:read', payload)
}

export function emitTypingStart(socket: Socket, payload: TypingPayload) {
  socket.emit('typing:start', payload)
}

export function emitTypingStop(socket: Socket, payload: TypingPayload) {
  socket.emit('typing:stop', payload)
}

export function joinConversation(socket: Socket, conversationId: string) {
  socket.emit('conversation:join', { conversation_id: conversationId })
}

export function leaveConversation(socket: Socket, conversationId: string) {
  socket.emit('conversation:leave', { conversation_id: conversationId })
}

// ─── Typed listener factory ───────────────────────────────────

export function onNewMessage(socket: Socket, cb: (e: NewMessageEvent) => void) {
  socket.on('message:new', cb)
  return () => socket.off('message:new', cb)
}

export function onMessageDelivered(socket: Socket, cb: (e: MessageDeliveredEvent) => void) {
  socket.on('message:delivered', cb)
  return () => socket.off('message:delivered', cb)
}

export function onMessageRead(socket: Socket, cb: (e: MessageReadEvent) => void) {
  socket.on('message:read', cb)
  return () => socket.off('message:read', cb)
}

export function onTypingUpdate(socket: Socket, cb: (e: TypingUpdateEvent) => void) {
  socket.on('typing:update', cb)
  return () => socket.off('typing:update', cb)
}

export function onPresenceUpdate(socket: Socket, cb: (e: PresenceUpdateEvent) => void) {
  socket.on('presence:update', cb)
  return () => socket.off('presence:update', cb)
}

export function onError(socket: Socket, cb: (e: { message: string }) => void) {
  socket.on('error', cb)
  return () => socket.off('error', cb)
}
