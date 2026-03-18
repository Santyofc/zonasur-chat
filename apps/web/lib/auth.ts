import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

/**
 * Get the current session from the browser Supabase client.
 * Returns null if not authenticated.
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Get the current user from the browser Supabase client.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  await supabase.auth.signOut()
}

/**
 * Sign in with email and password.
 */
export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

/**
 * Register with email and password.
 */
export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

/**
 * Sign in with OAuth provider.
 * Redirects to the provider's auth page.
 */
export async function signInWithOAuth(
  provider: 'google' | 'github' | 'discord',
) {
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}

/**
 * Get the access token for use with the NestJS API / Socket.IO.
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession()
  return session?.access_token ?? null
}
