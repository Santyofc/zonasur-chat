'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'
import { signOut } from '../../lib/auth'
import type { Conversation } from '@zs/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Props {
  activeId?: string
}

export function ConversationList({ activeId }: Props) {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      try {
        const res = await fetch(`${API}/api/conversations`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        if (mounted) setConversations(data)
      } catch {
        // silently fail — empty state handles it
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => { mounted = false }
  }, [])

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <aside className="w-80 flex-shrink-0 flex flex-col border-r border-zs-border bg-zs-bg-secondary">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-zs-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zs-success" />
          <span className="font-semibold text-zs-text-primary text-sm">ZonaSur Chat</span>
        </div>
        <button
          id="btn-signout"
          onClick={handleSignOut}
          className="zs-btn-ghost p-1.5"
          title="Cerrar sesión"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {/* Search bar — placeholder for v2 */}
      <div className="px-4 py-3 border-b border-zs-border">
        <div className="flex items-center gap-2 bg-zs-bg-primary border border-zs-border rounded-lg px-3 py-2">
          <svg className="w-4 h-4 text-zs-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="search-conversations"
            type="text"
            placeholder="Buscar..."
            className="bg-transparent text-sm text-zs-text-primary placeholder:text-zs-text-muted focus:outline-none flex-1"
            disabled
          />
        </div>
      </div>

      {/* Conversation items */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-zs-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center opacity-60">
            <p className="text-sm text-zs-text-secondary">No hay conversaciones todavía</p>
          </div>
        )}

        {conversations.map(conv => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            isActive={conv.id === activeId}
          />
        ))}
      </div>
    </aside>
  )
}

function ConversationItem({
  conversation: conv,
  isActive,
}: {
  conversation: Conversation
  isActive: boolean
}) {
  const displayName =
    conv.type === 'direct'
      ? conv.members?.find(m => m.user)?.user?.display_name ?? 'Usuario'
      : conv.name ?? 'Grupo'

  const lastMsg = conv.last_message
  const avatar = displayName.charAt(0).toUpperCase()

  return (
    <Link
      id={`conv-${conv.id}`}
      href={`/chat/${conv.id}`}
      className={`flex items-center gap-3 px-4 py-3 transition-colors duration-100 cursor-pointer
        ${isActive
          ? 'bg-zs-accent-muted border-l-2 border-zs-accent'
          : 'hover:bg-zs-bg-hover border-l-2 border-transparent'
        }`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-zs-accent-muted flex items-center justify-center text-zs-accent font-semibold text-sm flex-shrink-0">
        {avatar}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zs-text-primary truncate">{displayName}</span>
          {lastMsg && (
            <span className="text-xs text-zs-text-muted flex-shrink-0 ml-1">
              {formatDistanceToNow(new Date(lastMsg.created_at), {
                locale: es,
                addSuffix: false,
              })}
            </span>
          )}
        </div>
        {lastMsg && (
          <p className="text-xs text-zs-text-secondary truncate mt-0.5">
            {lastMsg.content}
          </p>
        )}
      </div>

      {/* Unread badge */}
      {conv.unread_count && conv.unread_count > 0 && (
        <div className="w-5 h-5 rounded-full bg-zs-accent flex items-center justify-center flex-shrink-0">
          <span className="text-xs text-zs-bg-primary font-semibold">
            {conv.unread_count > 9 ? '9+' : conv.unread_count}
          </span>
        </div>
      )}
    </Link>
  )
}
