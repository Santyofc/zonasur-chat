import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../lib/supabase-server'

/** Chat shell layout — sidebar + main panel */
export default async function ChatLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex h-dvh overflow-hidden bg-zs-bg-primary">
      {children}
    </div>
  )
}
