'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  getSocket,
  emitMessage,
  emitTypingStart,
  emitTypingStop,
} from '../../lib/socket'
import type { Message } from '@zs/types'

interface Props {
  conversationId: string
  onOptimisticMessage: (msg: Message) => void
}

const TYPING_DEBOUNCE_MS = 1500

export function MessageInput({ conversationId, onOptimisticMessage }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const typingRef = useRef(false)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null)
  const authIdRef = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || !mounted) return
      authIdRef.current = session.user.id
      socketRef.current = getSocket(session.access_token)
    })
    return () => {
      mounted = false
      if (typingTimer.current) clearTimeout(typingTimer.current)
    }
  }, [])

  const stopTyping = useCallback(() => {
    if (!socketRef.current || !typingRef.current) return
    typingRef.current = false
    emitTypingStop(socketRef.current, { conversation_id: conversationId })
  }, [conversationId])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)

    if (!socketRef.current) return

    // Typing start
    if (!typingRef.current) {
      typingRef.current = true
      emitTypingStart(socketRef.current, { conversation_id: conversationId })
    }

    // Debounce stop
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(stopTyping, TYPING_DEBOUNCE_MS)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  async function sendMessage() {
    const content = text.trim()
    if (!content || sending) return

    setSending(true)
    stopTyping()
    setText('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSending(false); return }

    // Optimistic message
    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: session.user.id,
      content,
      type: 'text',
      reply_to_id: null,
      edited_at: null,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    onOptimisticMessage(optimistic)

    // Emit via socket
    if (socketRef.current) {
      emitMessage(socketRef.current, {
        conversation_id: conversationId,
        content,
        temp_id: tempId,
      })
    }

    setSending(false)
  }

  return (
    <div className="px-4 py-3 border-t border-zs-border bg-zs-bg-secondary">
      <div className="flex items-end gap-3 bg-zs-bg-surface border border-zs-border rounded-xl px-4 py-2.5 transition-shadow focus-within:shadow-zs-glow-blue focus-within:border-zs-accent">
        <textarea
          id="message-input"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribí un mensaje..."
          rows={1}
          className="flex-1 bg-transparent text-sm text-zs-text-primary placeholder:text-zs-text-muted resize-none focus:outline-none max-h-32 overflow-y-auto"
          style={{ minHeight: '24px' }}
        />
        <button
          id="btn-send-message"
          onClick={() => void sendMessage()}
          disabled={!text.trim() || sending}
          className="flex-shrink-0 p-1.5 rounded-lg bg-zs-accent text-zs-bg-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zs-accent-hover active:scale-95 transition-all"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
