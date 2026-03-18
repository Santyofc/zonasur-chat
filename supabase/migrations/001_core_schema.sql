-- ═══════════════════════════════════════════════════════════════
-- 001_core_schema.sql
-- ZonaSur Chat — Core Database Schema
-- Apply in Supabase Studio: SQL Editor → paste and run
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── public.users ────────────────────────────────────────────
-- Mirrors auth.users and holds public profile info
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  bio             TEXT,
  phone           TEXT,
  status          TEXT NOT NULL DEFAULT 'offline'
                    CHECK (status IN ('online', 'offline', 'away', 'busy')),
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_auth_id      ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_username     ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_status       ON public.users(status);

-- ─── public.auth_accounts ─────────────────────────────────────
-- Tracks which OAuth providers a user has connected
CREATE TABLE IF NOT EXISTS public.auth_accounts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider    TEXT NOT NULL,  -- 'email', 'google', 'github', 'discord'
  provider_id TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_auth_accounts_user_id ON public.auth_accounts(user_id);

-- ─── public.devices ───────────────────────────────────────────
-- For push notifications in v2
CREATE TABLE IF NOT EXISTS public.devices (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL UNIQUE,
  platform     TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);

-- ─── public.contacts ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contacts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contact_user_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, contact_user_id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id         ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_user_id ON public.contacts(contact_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status          ON public.contacts(status);

-- ─── public.blocks ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blocks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON public.blocks(blocked_id);

-- ─── public.conversations ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        TEXT NOT NULL DEFAULT 'direct'
                CHECK (type IN ('direct', 'group')),
  name        TEXT,
  description TEXT,
  avatar_url  TEXT,
  created_by  UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_conversations_type       ON public.conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);

-- ─── public.conversation_members ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'member'
                    CHECK (role IN ('owner', 'admin', 'member')),
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at    TIMESTAMPTZ,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_members_conversation_id ON public.conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_members_user_id         ON public.conversation_members(user_id);

-- ─── public.messages ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  type            TEXT NOT NULL DEFAULT 'text'
                    CHECK (type IN ('text', 'image', 'video', 'audio', 'file', 'system')),
  content         TEXT NOT NULL CHECK (char_length(content) <= 4000),
  reply_to_id     UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  edited_at       TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id       ON public.messages(sender_id);

-- ─── public.attachments ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attachments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id  UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_url    TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  file_type   TEXT NOT NULL,
  file_size   BIGINT NOT NULL, -- bytes
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON public.attachments(message_id);

-- ─── public.message_receipts ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.message_receipts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id  UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'delivered'
                CHECK (status IN ('sent', 'delivered', 'read')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_receipts_message_id ON public.message_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id    ON public.message_receipts(user_id);
