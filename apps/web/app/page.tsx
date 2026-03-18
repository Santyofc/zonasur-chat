import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../lib/supabase-server'

/** Root / redirects based on auth */
export default async function HomePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/chat')
  } else {
    redirect('/login')
  }
}
