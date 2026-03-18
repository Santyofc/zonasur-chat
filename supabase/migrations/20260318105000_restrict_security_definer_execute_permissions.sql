-- migration: restrict execute permissions for privileged security definer rpc functions
-- purpose: ensure only service_role can execute privileged rpc helpers.
-- affected functions:
-- - public.get_or_create_direct_conversation(uuid, uuid)
-- - public.get_user_conversations(uuid)

-- apply changes only if function exists

do $$
begin
  if to_regprocedure('public.get_or_create_direct_conversation(uuid, uuid)') is not null then
    execute 'revoke execute on function public.get_or_create_direct_conversation(uuid, uuid) from public';
    execute 'revoke execute on function public.get_or_create_direct_conversation(uuid, uuid) from anon';
    execute 'revoke execute on function public.get_or_create_direct_conversation(uuid, uuid) from authenticated';
    execute 'grant execute on function public.get_or_create_direct_conversation(uuid, uuid) to service_role';
  end if;
end;
$$;

do $$
begin
  if to_regprocedure('public.get_user_conversations(uuid)') is not null then
    execute 'revoke execute on function public.get_user_conversations(uuid) from public';
    execute 'revoke execute on function public.get_user_conversations(uuid) from anon';
    execute 'revoke execute on function public.get_user_conversations(uuid) from authenticated';
    execute 'grant execute on function public.get_user_conversations(uuid) to service_role';
  end if;
end;
$$;
