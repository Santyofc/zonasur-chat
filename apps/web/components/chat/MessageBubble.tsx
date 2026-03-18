import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Message } from '@zs/types'

interface Props {
  message: Message
  isOwn: boolean
  showAvatar: boolean
}

export function MessageBubble({ message: msg, isOwn, showAvatar }: Props) {
  const time = format(new Date(msg.created_at), 'HH:mm', { locale: es })
  const senderName = msg.sender?.display_name ?? 'Unknown'
  const avatar = senderName.charAt(0).toUpperCase()

  return (
    <div
      id={`msg-${msg.id}`}
      className={`flex items-end gap-2 animate-fade-in ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar — only show when sender changes */}
      <div className="w-7 h-7 flex-shrink-0">
        {!isOwn && showAvatar && (
          <div className="w-7 h-7 rounded-full bg-zs-accent-muted flex items-center justify-center text-zs-accent text-xs font-semibold">
            {avatar}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name — for group chats */}
        {!isOwn && showAvatar && (
          <span className="text-xs text-zs-text-secondary mb-1 ml-1">
            {senderName}
          </span>
        )}

        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
            ${isOwn
              ? 'bg-zs-bubble-out text-zs-text-primary rounded-br-sm'
              : 'bg-zs-bubble-in text-zs-text-primary rounded-bl-sm border border-zs-border'
            }
            ${msg.deleted_at ? 'opacity-40 italic' : ''}
          `}
        >
          {msg.deleted_at ? 'Mensaje eliminado' : msg.content}
        </div>

        {/* Time + status */}
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-zs-text-muted">{time}</span>
          {isOwn && (
            <ReadStatus receipts={msg.receipts} />
          )}
        </div>
      </div>
    </div>
  )
}

function ReadStatus({ receipts }: { receipts?: { status: string }[] }) {
  if (!receipts || receipts.length === 0) {
    // Sent (single checkmark)
    return <CheckIcon count={1} className="text-zs-text-muted" />
  }
  const allRead = receipts.every(r => r.status === 'read')
  const allDelivered = receipts.every(r => r.status === 'delivered' || r.status === 'read')

  if (allRead) return <CheckIcon count={2} className="text-zs-accent" />
  if (allDelivered) return <CheckIcon count={2} className="text-zs-text-muted" />
  return <CheckIcon count={1} className="text-zs-text-muted" />
}

function CheckIcon({ count, className }: { count: 1 | 2; className: string }) {
  return (
    <svg
      className={`w-3.5 h-3.5 ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {count === 2 ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M4.5 12.75l6 6 9-13.5M9 12.75l4.5 4.5" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M4.5 12.75l6 6 9-13.5" />
      )}
    </svg>
  )
}
