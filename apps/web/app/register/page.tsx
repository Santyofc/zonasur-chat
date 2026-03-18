'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUpWithEmail } from '../../lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await signUpWithEmail(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If email confirmation is enabled, show success state
    if (data.user && !data.session) {
      setSuccess(true)
      setLoading(false)
      return
    }

    // If auto-confirmed, redirect to chat
    router.push('/chat')
  }

  if (success) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zs-bg-primary px-4">
        <div className="zs-card w-full max-w-sm p-8 text-center space-y-4 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-zs-success/10 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-zs-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zs-text-primary">Revisa tu email</h2>
          <p className="text-sm text-zs-text-secondary">
            Te enviamos un link de confirmación a <strong>{email}</strong>.
          </p>
          <Link href="/login" className="zs-btn-primary block">
            Ir al login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zs-bg-primary px-4">
      <div className="zs-card w-full max-w-sm p-8 space-y-6 animate-fade-in">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-zs-text-primary">Crear cuenta</h1>
          <p className="text-sm text-zs-text-secondary">Únete a ZonaSur Chat</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zs-text-secondary uppercase tracking-wide">
              Email
            </label>
            <input
              id="reg-email"
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
              id="reg-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="zs-input"
            />
          </div>

          {error && (
            <p className="text-sm text-zs-danger bg-zs-danger/10 border border-zs-danger/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            id="btn-register"
            type="submit"
            disabled={loading}
            className="zs-btn-primary w-full"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-zs-text-secondary">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-zs-accent hover:text-zs-accent-hover transition-colors">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
