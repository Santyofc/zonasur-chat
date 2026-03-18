-- ═══════════════════════════════════════════════════════════════
-- 002_triggers_and_functions.sql
-- ZonaSur Chat — Triggers, Functions, and Helpers
-- Apply AFTER 001_core_schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ─── updated_at trigger function ─────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'devices', 'contacts', 'conversations',
    'messages', 'message_receipts'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I;
       CREATE TRIGGER trg_set_updated_at
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      t, t
    );
  END LOOP;
END;
$$;

-- ─── Auth sync: auth.users → public.users ────────────────────
-- When a new user signs up via Supabase Auth, create their public profile.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  _username TEXT;
  _display_name TEXT;
BEGIN
  -- Derive username from email or provider metadata
  _username := LOWER(
    REGEXP_REPLACE(
      COALESCE(
        NEW.raw_user_meta_data->>'preferred_username',
        NEW.raw_user_meta_data->>'user_name',
        SPLIT_PART(NEW.email, '@', 1),
        'user_' || LEFT(NEW.id::TEXT, 8)
      ),
      '[^a-z0-9_]', '_', 'g'
    )
  );

  _display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    _username
  );

  INSERT INTO public.users (auth_id, username, display_name, avatar_url, status)
  VALUES (
    NEW.id,
    _username,
    _display_name,
    NEW.raw_user_meta_data->>'avatar_url',
    'offline'
  )
  ON CONFLICT (auth_id) DO UPDATE
    SET
      display_name = EXCLUDED.display_name,
      avatar_url   = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
      updated_at   = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ─── get_or_create_direct_conversation ───────────────────────
-- Returns an existing 1:1 conversation or creates a new one.
-- Guarantees no duplicate direct conversations between two users.
CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(
  p_user_a UUID,
  p_user_b UUID
)
RETURNS UUID AS $$
DECLARE
  _conv_id UUID;
BEGIN
  -- Look for existing conversation where both users are members
  SELECT c.id INTO _conv_id
  FROM public.conversations c
  INNER JOIN public.conversation_members m1
    ON m1.conversation_id = c.id AND m1.user_id = p_user_a
  INNER JOIN public.conversation_members m2
    ON m2.conversation_id = c.id AND m2.user_id = p_user_b
  WHERE c.type = 'direct'
    AND c.deleted_at IS NULL
  LIMIT 1;

  IF _conv_id IS NOT NULL THEN
    RETURN _conv_id;
  END IF;

  -- Create new direct conversation
  INSERT INTO public.conversations (type, created_by)
  VALUES ('direct', p_user_a)
  RETURNING id INTO _conv_id;

  -- Add both members
  INSERT INTO public.conversation_members (conversation_id, user_id, role)
  VALUES
    (_conv_id, p_user_a, 'member'),
    (_conv_id, p_user_b, 'member');

  RETURN _conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── get_user_conversations ──────────────────────────────────
-- Returns all conversations for a user with last message and unread count.
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id UUID)
RETURNS TABLE (
  id               UUID,
  type             TEXT,
  name             TEXT,
  avatar_url       TEXT,
  created_at       TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ,
  last_message_id  UUID,
  last_message_content TEXT,
  last_message_at  TIMESTAMPTZ,
  unread_count     BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.type,
    c.name,
    c.avatar_url,
    c.created_at,
    c.updated_at,
    lm.id            AS last_message_id,
    lm.content       AS last_message_content,
    lm.created_at    AS last_message_at,
    COUNT(unread.id) AS unread_count
  FROM public.conversations c
  INNER JOIN public.conversation_members me
    ON me.conversation_id = c.id AND me.user_id = p_user_id
  LEFT JOIN LATERAL (
    SELECT m.id, m.content, m.created_at
    FROM public.messages m
    WHERE m.conversation_id = c.id
      AND m.deleted_at IS NULL
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON TRUE
  LEFT JOIN public.messages unread
    ON unread.conversation_id = c.id
    AND unread.deleted_at IS NULL
    AND unread.sender_id <> p_user_id
    AND (
      me.last_read_at IS NULL
      OR unread.created_at > me.last_read_at
    )
  WHERE c.deleted_at IS NULL
  GROUP BY c.id, c.type, c.name, c.avatar_url, c.created_at, c.updated_at,
           lm.id, lm.content, lm.created_at
  ORDER BY c.updated_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
