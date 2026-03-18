-- migration: enable rls on core chat and identity tables
-- purpose: establish a production-safe baseline where direct client access is limited to scoped reads.
-- notes:
-- - anon is explicitly denied for all operations.
-- - authenticated is scoped to select-only behavior; writes are explicitly denied.

alter table public.users enable row level security;
alter table public.auth_accounts enable row level security;
alter table public.devices enable row level security;
alter table public.contacts enable row level security;
alter table public.blocks enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;
alter table public.message_receipts enable row level security;

-- users

drop policy if exists "users anon select deny" on public.users;
drop policy if exists "users anon insert deny" on public.users;
drop policy if exists "users anon update deny" on public.users;
drop policy if exists "users anon delete deny" on public.users;
drop policy if exists "users auth select self" on public.users;
drop policy if exists "users auth insert deny" on public.users;
drop policy if exists "users auth update deny" on public.users;
drop policy if exists "users auth delete deny" on public.users;

create policy "users anon select deny" on public.users
for select to anon
using (false);

create policy "users anon insert deny" on public.users
for insert to anon
with check (false);

create policy "users anon update deny" on public.users
for update to anon
using (false)
with check (false);

create policy "users anon delete deny" on public.users
for delete to anon
using (false);

create policy "users auth select self" on public.users
for select to authenticated
using (public.users.auth_id = (select auth.uid()));

create policy "users auth insert deny" on public.users
for insert to authenticated
with check (false);

create policy "users auth update deny" on public.users
for update to authenticated
using (false)
with check (false);

create policy "users auth delete deny" on public.users
for delete to authenticated
using (false);

-- auth_accounts

drop policy if exists "auth accounts anon select deny" on public.auth_accounts;
drop policy if exists "auth accounts anon insert deny" on public.auth_accounts;
drop policy if exists "auth accounts anon update deny" on public.auth_accounts;
drop policy if exists "auth accounts anon delete deny" on public.auth_accounts;
drop policy if exists "auth accounts auth select self" on public.auth_accounts;
drop policy if exists "auth accounts auth insert deny" on public.auth_accounts;
drop policy if exists "auth accounts auth update deny" on public.auth_accounts;
drop policy if exists "auth accounts auth delete deny" on public.auth_accounts;

create policy "auth accounts anon select deny" on public.auth_accounts
for select to anon
using (false);

create policy "auth accounts anon insert deny" on public.auth_accounts
for insert to anon
with check (false);

create policy "auth accounts anon update deny" on public.auth_accounts
for update to anon
using (false)
with check (false);

create policy "auth accounts anon delete deny" on public.auth_accounts
for delete to anon
using (false);

create policy "auth accounts auth select self" on public.auth_accounts
for select to authenticated
using (
  exists (
    select 1
    from public.users
    where public.users.id = public.auth_accounts.user_id
      and public.users.auth_id = (select auth.uid())
  )
);

create policy "auth accounts auth insert deny" on public.auth_accounts
for insert to authenticated
with check (false);

create policy "auth accounts auth update deny" on public.auth_accounts
for update to authenticated
using (false)
with check (false);

create policy "auth accounts auth delete deny" on public.auth_accounts
for delete to authenticated
using (false);

-- devices

drop policy if exists "devices anon select deny" on public.devices;
drop policy if exists "devices anon insert deny" on public.devices;
drop policy if exists "devices anon update deny" on public.devices;
drop policy if exists "devices anon delete deny" on public.devices;
drop policy if exists "devices auth select self" on public.devices;
drop policy if exists "devices auth insert deny" on public.devices;
drop policy if exists "devices auth update deny" on public.devices;
drop policy if exists "devices auth delete deny" on public.devices;

create policy "devices anon select deny" on public.devices
for select to anon
using (false);

create policy "devices anon insert deny" on public.devices
for insert to anon
with check (false);

create policy "devices anon update deny" on public.devices
for update to anon
using (false)
with check (false);

create policy "devices anon delete deny" on public.devices
for delete to anon
using (false);

create policy "devices auth select self" on public.devices
for select to authenticated
using (
  exists (
    select 1
    from public.users
    where public.users.id = public.devices.user_id
      and public.users.auth_id = (select auth.uid())
  )
);

create policy "devices auth insert deny" on public.devices
for insert to authenticated
with check (false);

create policy "devices auth update deny" on public.devices
for update to authenticated
using (false)
with check (false);

create policy "devices auth delete deny" on public.devices
for delete to authenticated
using (false);

-- contacts

drop policy if exists "contacts anon select deny" on public.contacts;
drop policy if exists "contacts anon insert deny" on public.contacts;
drop policy if exists "contacts anon update deny" on public.contacts;
drop policy if exists "contacts anon delete deny" on public.contacts;
drop policy if exists "contacts auth select scoped" on public.contacts;
drop policy if exists "contacts auth insert deny" on public.contacts;
drop policy if exists "contacts auth update deny" on public.contacts;
drop policy if exists "contacts auth delete deny" on public.contacts;

create policy "contacts anon select deny" on public.contacts
for select to anon
using (false);

create policy "contacts anon insert deny" on public.contacts
for insert to anon
with check (false);

create policy "contacts anon update deny" on public.contacts
for update to anon
using (false)
with check (false);

create policy "contacts anon delete deny" on public.contacts
for delete to anon
using (false);

create policy "contacts auth select scoped" on public.contacts
for select to authenticated
using (
  exists (
    select 1
    from public.users
    where public.users.id in (public.contacts.user_id, public.contacts.contact_user_id)
      and public.users.auth_id = (select auth.uid())
  )
);

create policy "contacts auth insert deny" on public.contacts
for insert to authenticated
with check (false);

create policy "contacts auth update deny" on public.contacts
for update to authenticated
using (false)
with check (false);

create policy "contacts auth delete deny" on public.contacts
for delete to authenticated
using (false);

-- blocks

drop policy if exists "blocks anon select deny" on public.blocks;
drop policy if exists "blocks anon insert deny" on public.blocks;
drop policy if exists "blocks anon update deny" on public.blocks;
drop policy if exists "blocks anon delete deny" on public.blocks;
drop policy if exists "blocks auth select scoped" on public.blocks;
drop policy if exists "blocks auth insert deny" on public.blocks;
drop policy if exists "blocks auth update deny" on public.blocks;
drop policy if exists "blocks auth delete deny" on public.blocks;

create policy "blocks anon select deny" on public.blocks
for select to anon
using (false);

create policy "blocks anon insert deny" on public.blocks
for insert to anon
with check (false);

create policy "blocks anon update deny" on public.blocks
for update to anon
using (false)
with check (false);

create policy "blocks anon delete deny" on public.blocks
for delete to anon
using (false);

create policy "blocks auth select scoped" on public.blocks
for select to authenticated
using (
  exists (
    select 1
    from public.users
    where public.users.id in (public.blocks.blocker_id, public.blocks.blocked_id)
      and public.users.auth_id = (select auth.uid())
  )
);

create policy "blocks auth insert deny" on public.blocks
for insert to authenticated
with check (false);

create policy "blocks auth update deny" on public.blocks
for update to authenticated
using (false)
with check (false);

create policy "blocks auth delete deny" on public.blocks
for delete to authenticated
using (false);

-- conversations

drop policy if exists "conversations anon select deny" on public.conversations;
drop policy if exists "conversations anon insert deny" on public.conversations;
drop policy if exists "conversations anon update deny" on public.conversations;
drop policy if exists "conversations anon delete deny" on public.conversations;
drop policy if exists "conversations auth select member" on public.conversations;
drop policy if exists "conversations auth insert deny" on public.conversations;
drop policy if exists "conversations auth update deny" on public.conversations;
drop policy if exists "conversations auth delete deny" on public.conversations;

create policy "conversations anon select deny" on public.conversations
for select to anon
using (false);

create policy "conversations anon insert deny" on public.conversations
for insert to anon
with check (false);

create policy "conversations anon update deny" on public.conversations
for update to anon
using (false)
with check (false);

create policy "conversations anon delete deny" on public.conversations
for delete to anon
using (false);

create policy "conversations auth select member" on public.conversations
for select to authenticated
using (
  exists (
    select 1
    from public.conversation_members
    join public.users on public.users.id = public.conversation_members.user_id
    where public.conversation_members.conversation_id = public.conversations.id
      and public.users.auth_id = (select auth.uid())
  )
);

create policy "conversations auth insert deny" on public.conversations
for insert to authenticated
with check (false);

create policy "conversations auth update deny" on public.conversations
for update to authenticated
using (false)
with check (false);

create policy "conversations auth delete deny" on public.conversations
for delete to authenticated
using (false);

-- conversation_members

drop policy if exists "conversation members anon select deny" on public.conversation_members;
drop policy if exists "conversation members anon insert deny" on public.conversation_members;
drop policy if exists "conversation members anon update deny" on public.conversation_members;
drop policy if exists "conversation members anon delete deny" on public.conversation_members;
drop policy if exists "conversation members auth select scoped" on public.conversation_members;
drop policy if exists "conversation members auth insert deny" on public.conversation_members;
drop policy if exists "conversation members auth update deny" on public.conversation_members;
drop policy if exists "conversation members auth delete deny" on public.conversation_members;

create policy "conversation members anon select deny" on public.conversation_members
for select to anon
using (false);

create policy "conversation members anon insert deny" on public.conversation_members
for insert to anon
with check (false);

create policy "conversation members anon update deny" on public.conversation_members
for update to anon
using (false)
with check (false);

create policy "conversation members anon delete deny" on public.conversation_members
for delete to anon
using (false);

create policy "conversation members auth select scoped" on public.conversation_members
for select to authenticated
using (
  exists (
    select 1
    from public.users
    where public.users.id = public.conversation_members.user_id
      and public.users.auth_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.conversation_members as own_membership
    join public.users on public.users.id = own_membership.user_id
    where own_membership.conversation_id = public.conversation_members.conversation_id
      and public.users.auth_id = (select auth.uid())
  )
);

create policy "conversation members auth insert deny" on public.conversation_members
for insert to authenticated
with check (false);

create policy "conversation members auth update deny" on public.conversation_members
for update to authenticated
using (false)
with check (false);

create policy "conversation members auth delete deny" on public.conversation_members
for delete to authenticated
using (false);

-- messages

drop policy if exists "messages anon select deny" on public.messages;
drop policy if exists "messages anon insert deny" on public.messages;
drop policy if exists "messages anon update deny" on public.messages;
drop policy if exists "messages anon delete deny" on public.messages;
drop policy if exists "messages auth select member" on public.messages;
drop policy if exists "messages auth insert deny" on public.messages;
drop policy if exists "messages auth update deny" on public.messages;
drop policy if exists "messages auth delete deny" on public.messages;

create policy "messages anon select deny" on public.messages
for select to anon
using (false);

create policy "messages anon insert deny" on public.messages
for insert to anon
with check (false);

create policy "messages anon update deny" on public.messages
for update to anon
using (false)
with check (false);

create policy "messages anon delete deny" on public.messages
for delete to anon
using (false);

create policy "messages auth select member" on public.messages
for select to authenticated
using (
  exists (
    select 1
    from public.conversation_members
    join public.users on public.users.id = public.conversation_members.user_id
    where public.conversation_members.conversation_id = public.messages.conversation_id
      and public.users.auth_id = (select auth.uid())
  )
);

create policy "messages auth insert deny" on public.messages
for insert to authenticated
with check (false);

create policy "messages auth update deny" on public.messages
for update to authenticated
using (false)
with check (false);

create policy "messages auth delete deny" on public.messages
for delete to authenticated
using (false);

-- attachments

drop policy if exists "attachments anon select deny" on public.attachments;
drop policy if exists "attachments anon insert deny" on public.attachments;
drop policy if exists "attachments anon update deny" on public.attachments;
drop policy if exists "attachments anon delete deny" on public.attachments;
drop policy if exists "attachments auth select member" on public.attachments;
drop policy if exists "attachments auth insert deny" on public.attachments;
drop policy if exists "attachments auth update deny" on public.attachments;
drop policy if exists "attachments auth delete deny" on public.attachments;

create policy "attachments anon select deny" on public.attachments
for select to anon
using (false);

create policy "attachments anon insert deny" on public.attachments
for insert to anon
with check (false);

create policy "attachments anon update deny" on public.attachments
for update to anon
using (false)
with check (false);

create policy "attachments anon delete deny" on public.attachments
for delete to anon
using (false);

create policy "attachments auth select member" on public.attachments
for select to authenticated
using (
  exists (
    select 1
    from public.messages
    join public.conversation_members
      on public.conversation_members.conversation_id = public.messages.conversation_id
    join public.users
      on public.users.id = public.conversation_members.user_id
    where public.messages.id = public.attachments.message_id
      and public.users.auth_id = (select auth.uid())
  )
);

create policy "attachments auth insert deny" on public.attachments
for insert to authenticated
with check (false);

create policy "attachments auth update deny" on public.attachments
for update to authenticated
using (false)
with check (false);

create policy "attachments auth delete deny" on public.attachments
for delete to authenticated
using (false);

-- message_receipts

drop policy if exists "receipts anon select deny" on public.message_receipts;
drop policy if exists "receipts anon insert deny" on public.message_receipts;
drop policy if exists "receipts anon update deny" on public.message_receipts;
drop policy if exists "receipts anon delete deny" on public.message_receipts;
drop policy if exists "receipts auth select scoped" on public.message_receipts;
drop policy if exists "receipts auth insert deny" on public.message_receipts;
drop policy if exists "receipts auth update deny" on public.message_receipts;
drop policy if exists "receipts auth delete deny" on public.message_receipts;

create policy "receipts anon select deny" on public.message_receipts
for select to anon
using (false);

create policy "receipts anon insert deny" on public.message_receipts
for insert to anon
with check (false);

create policy "receipts anon update deny" on public.message_receipts
for update to anon
using (false)
with check (false);

create policy "receipts anon delete deny" on public.message_receipts
for delete to anon
using (false);

create policy "receipts auth select scoped" on public.message_receipts
for select to authenticated
using (
  exists (
    select 1
    from public.users
    where public.users.id = public.message_receipts.user_id
      and public.users.auth_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.messages
    join public.conversation_members
      on public.conversation_members.conversation_id = public.messages.conversation_id
    join public.users
      on public.users.id = public.conversation_members.user_id
    where public.messages.id = public.message_receipts.message_id
      and public.users.auth_id = (select auth.uid())
  )
);

create policy "receipts auth insert deny" on public.message_receipts
for insert to authenticated
with check (false);

create policy "receipts auth update deny" on public.message_receipts
for update to authenticated
using (false)
with check (false);

create policy "receipts auth delete deny" on public.message_receipts
for delete to authenticated
using (false);
