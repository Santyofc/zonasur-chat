'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signInWithPassword, signInWithOAuth } from '../../lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await signInWithPassword(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/chat')
  }

  async function handleOAuth(provider: 'google' | 'github' | 'discord') {
    await signInWithOAuth(provider)
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zs-bg-primary px-4">
      <div className="zs-card w-full max-w-sm p-8 space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zs-accent-muted mb-2">
            <svg className="w-6 h-6 text-zs-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-zs-text-primary">Bienvenido</h1>
          <p className="text-sm text-zs-text-secondary">Ingresa a ZonaSur Chat</p>
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zs-text-secondary uppercase tracking-wide">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="zs-input"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zs-text-secondary uppercase tracking-wide">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="zs-input"
            />
          </div>

          {error && (
            <p className="text-sm text-zs-danger bg-zs-danger/10 border border-zs-danger/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            id="btn-login-email"
            type="submit"
            disabled={loading}
            className="zs-btn-primary w-full"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zs-border" />
          <span className="text-xs text-zs-text-muted">o continúa con</span>
          <div className="flex-1 h-px bg-zs-border" />
        </div>

        {/* OAuth */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'btn-login-google', provider: 'google' as const, label: 'Google', icon: 'G' },
            { id: 'btn-login-github', provider: 'github' as const, label: 'GitHub', icon: '⌥' },
            { id: 'btn-login-discord', provider: 'discord' as const, label: 'Discord', icon: '⌘' },
          ].map(({ id, provider, label, icon }) => (
            <button
              key={provider}
              id={id}
              onClick={() => handleOAuth(provider)}
              className="zs-btn-ghost border border-zs-border flex flex-col items-center py-2.5 gap-1 text-xs"
            >
              <span className="font-bold">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-zs-text-secondary">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-zs-accent hover:text-zs-accent-hover transition-colors">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
