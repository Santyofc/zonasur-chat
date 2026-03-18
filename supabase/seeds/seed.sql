-- ═══════════════════════════════════════════════════════════════
-- seed.sql — Development seed data for ZonaSur Chat
-- Safe to re-run (uses ON CONFLICT DO NOTHING)
-- ═══════════════════════════════════════════════════════════════

-- Note: auth.users rows must be created via Supabase Auth API or Studio.
-- This seed only adds public.users rows as fallback
-- (normally created automatically by the auth trigger).

-- Example: manually seed a test user if auth trigger hasn't run
-- INSERT INTO public.users (auth_id, username, display_name, status)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'testuser', 'Test User', 'offline')
-- ON CONFLICT (auth_id) DO NOTHING;
