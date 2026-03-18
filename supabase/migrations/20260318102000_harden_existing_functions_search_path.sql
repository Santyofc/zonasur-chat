-- migration: harden existing helper and trigger functions with explicit search_path
-- purpose: prevent object resolution through implicit schemas and preserve behavior.
-- notes:
-- - this migration replaces functions from 002_triggers_and_functions.sql only.
-- - function signatures and security model are preserved unless required for safety.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _username text;
  _display_name text;
begin
  _username := lower(
    regexp_replace(
      coalesce(
        new.raw_user_meta_data->>'preferred_username',
        new.raw_user_meta_data->>'user_name',
        split_part(new.email, '@', 1),
        'user_' || left(new.id::text, 8)
      ),
      '[^a-z0-9_]', '_', 'g'
    )
  );

  _display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    _username
  );

  insert into public.users (auth_id, username, display_name, avatar_url, status)
  values (
    new.id,
    _username,
    _display_name,
    new.raw_user_meta_data->>'avatar_url',
    'offline'
  )
  on conflict (auth_id) do update
    set
      display_name = excluded.display_name,
      avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
      updated_at = now();

  return new;
end;
$$;

create or replace function public.get_or_create_direct_conversation(
  p_user_a uuid,
  p_user_b uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  _conv_id uuid;
begin
  select public.conversations.id into _conv_id
  from public.conversations
  inner join public.conversation_members as m1
    on m1.conversation_id = public.conversations.id
    and m1.user_id = p_user_a
  inner join public.conversation_members as m2
    on m2.conversation_id = public.conversations.id
    and m2.user_id = p_user_b
  where public.conversations.type = 'direct'
    and public.conversations.deleted_at is null
  limit 1;

  if _conv_id is not null then
    return _conv_id;
  end if;

  insert into public.conversations (type, created_by)
  values ('direct', p_user_a)
  returning id into _conv_id;

  insert into public.conversation_members (conversation_id, user_id, role)
  values
    (_conv_id, p_user_a, 'member'),
    (_conv_id, p_user_b, 'member');

  return _conv_id;
end;
$$;

create or replace function public.get_user_conversations(p_user_id uuid)
returns table (
  id uuid,
  type text,
  name text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz,
  last_message_id uuid,
  last_message_content text,
  last_message_at timestamptz,
  unread_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return query
  select
    public.conversations.id,
    public.conversations.type,
    public.conversations.name,
    public.conversations.avatar_url,
    public.conversations.created_at,
    public.conversations.updated_at,
    lm.id as last_message_id,
    lm.content as last_message_content,
    lm.created_at as last_message_at,
    count(unread.id) as unread_count
  from public.conversations
  inner join public.conversation_members as me
    on me.conversation_id = public.conversations.id
    and me.user_id = p_user_id
  left join lateral (
    select public.messages.id, public.messages.content, public.messages.created_at
    from public.messages
    where public.messages.conversation_id = public.conversations.id
      and public.messages.deleted_at is null
    order by public.messages.created_at desc
    limit 1
  ) as lm on true
  left join public.messages as unread
    on unread.conversation_id = public.conversations.id
    and unread.deleted_at is null
    and unread.sender_id <> p_user_id
    and (
      me.last_read_at is null
      or unread.created_at > me.last_read_at
    )
  where public.conversations.deleted_at is null
  group by
    public.conversations.id,
    public.conversations.type,
    public.conversations.name,
    public.conversations.avatar_url,
    public.conversations.created_at,
    public.conversations.updated_at,
    lm.id,
    lm.content,
    lm.created_at
  order by public.conversations.updated_at desc;
end;
$$;
