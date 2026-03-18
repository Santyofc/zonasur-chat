interface Props {
  users: string[] // display names of typing users
}

/**
 * Typing indicator à la WhatsApp: "Ana está escribiendo..."
 * Uses CSS-only animated dots — no JS intervals.
 */
export function TypingIndicator({ users }: Props) {
  if (users.length === 0) return null

  const label =
    users.length === 1
      ? `${users[0]} está escribiendo`
      : users.length === 2
        ? `${users[0]} y ${users[1]} están escribiendo`
        : 'Varios están escribiendo'

  return (
    <div className="flex items-center gap-2 py-1 animate-fade-in">
      {/* Animated dots */}
      <div className="flex items-center gap-0.5 bg-zs-bubble-in border border-zs-border px-3 py-2 rounded-2xl rounded-bl-sm">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-zs-text-secondary"
            style={{
              animation: `pulse-dot 1.4s infinite ease-in-out`,
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-zs-text-muted">{label}</span>
    </div>
  )
}
