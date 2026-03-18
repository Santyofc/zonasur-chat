-- migration: restrict execute permissions for security definer rpc functions
-- purpose: prevent authenticated and anon clients from directly invoking privileged functions.
-- notes:
-- - backend service-role access is preserved.
-- - this migration does not change function logic.

revoke execute on function public.get_or_create_direct_conversation(uuid, uuid) from public;
revoke execute on function public.get_or_create_direct_conversation(uuid, uuid) from anon;
revoke execute on function public.get_or_create_direct_conversation(uuid, uuid) from authenticated;
grant execute on function public.get_or_create_direct_conversation(uuid, uuid) to service_role;

revoke execute on function public.get_user_conversations(uuid) from public;
revoke execute on function public.get_user_conversations(uuid) from anon;
revoke execute on function public.get_user_conversations(uuid) from authenticated;
grant execute on function public.get_user_conversations(uuid) to service_role;
