'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import {
  getSocket,
  joinConversation,
  leaveConversation,
  onNewMessage,
  onTypingUpdate,
} from '../../lib/socket'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { TypingIndicator } from './TypingIndicator'
import type { Message, TypingUpdateEvent } from '@zs/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Props {
  conversationId: string
}

interface TypingUser {
  userId: string
  displayName: string
}

export function ChatWindow({ conversationId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  /** Scroll to bottom whenever messages change */
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    let token: string
    let cleanup: (() => void)[] = []

    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      token = session.access_token
      setCurrentUserId(session.user.id)

      // Load messages from REST
      try {
        const res = await fetch(
          `${API}/api/conversations/${conversationId}/messages`,
          { headers: { Authorization: `Bearer ${token}` } },
        )
        if (!res.ok) throw new Error('Failed to load messages')
        const msgs = await res.json()
        setMessages(msgs)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }

      // Connect socket
      const socket = getSocket(token)
      joinConversation(socket, conversationId)

      // New message listener
      const offNew = onNewMessage(socket, (event) => {
        if (event.message.conversation_id !== conversationId) return
        setMessages(prev => {
          // Deduplicate by id (optimistic UI may have added temp)
          if (prev.find(m => m.id === event.message.id)) return prev
          return [...prev, event.message]
        })
      })

      // Typing indicator listener
      const offTyping = onTypingUpdate(socket, (event: TypingUpdateEvent) => {
        if (event.conversation_id !== conversationId) return
        if (event.user_id === session.user.id) return // ignore own typing

        if (event.is_typing) {
          setTypingUsers(prev => {
            if (prev.find(u => u.userId === event.user_id)) return prev
            return [...prev, { userId: event.user_id, displayName: event.display_name ?? 'Alguien' }]
          })
          // Auto-clear after 3s
          const existing = typingTimers.current.get(event.user_id)
          if (existing) clearTimeout(existing)
          typingTimers.current.set(event.user_id,
            setTimeout(() => {
              setTypingUsers(prev => prev.filter(u => u.userId !== event.user_id))
              typingTimers.current.delete(event.user_id)
            }, 3000),
          )
        } else {
          setTypingUsers(prev => prev.filter(u => u.userId !== event.user_id))
          const t = typingTimers.current.get(event.user_id)
          if (t) { clearTimeout(t); typingTimers.current.delete(event.user_id) }
        }
      })

      cleanup = [
        offNew,
        offTyping,
        () => leaveConversation(socket, conversationId),
      ]
    }

    void init()

    return () => {
      cleanup.forEach(fn => fn())
      typingTimers.current.forEach(t => clearTimeout(t))
      typingTimers.current.clear()
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-zs-danger text-sm">{error}</p>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-zs-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-center">
            <p className="text-zs-text-muted text-sm">
              No hay mensajes aún. ¡Decí hola!
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === currentUserId}
              showAvatar={
                i === 0 ||
                messages[i - 1]?.sender_id !== msg.sender_id
              }
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 pb-1">
          <TypingIndicator users={typingUsers.map(u => u.displayName)} />
        </div>
      )}

      {/* Input */}
      <MessageInput
        conversationId={conversationId}
        onOptimisticMessage={msg => setMessages(prev => [...prev, msg])}
      />
    </main>
  )
}
