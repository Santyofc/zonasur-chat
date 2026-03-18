<div align="center">

# Supabase Layer - ZonaSur Chat

SQL schema, RLS, functions, and migration workflow.

</div>

---

<div align="center">

## SQL Stack

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-0F172A?style=for-the-badge&logo=postgresql&logoColor=336791)
![Supabase](https://img.shields.io/badge/Supabase-111827?style=for-the-badge&logo=supabase&logoColor=3ECF8E)
![SQL](https://img.shields.io/badge/SQL-1F2937?style=for-the-badge&logo=sqlite&logoColor=86B7FE)

## Security

![RLS Enabled](https://img.shields.io/badge/RLS-Enabled-16A34A?style=for-the-badge)
![Auth UID](https://img.shields.io/badge/auth.uid()-Scoped-2563EB?style=for-the-badge)
![Service Role](https://img.shields.io/badge/Service_Role-Backend_Only-E11D48?style=for-the-badge)

## Functions

![search_path](https://img.shields.io/badge/search_path-''-7C3AED?style=for-the-badge)
![Security Definer](https://img.shields.io/badge/security_definer-Hardened-F97316?style=for-the-badge)
![RPC Execute](https://img.shields.io/badge/RPC_execute-service__role_only-14B8A6?style=for-the-badge)

</div>

---

## Migration order

Apply migrations in lexical order from `supabase/migrations/`.

Current sequence:

1. `001_core_schema.sql`
2. `002_triggers_and_functions.sql`
3. `20260318101500_enable_rls_core_chat_identity.sql`
4. `20260318102000_harden_existing_functions_search_path.sql`
5. `20260318103000_restrict_security_definer_rpc_execute.sql`
6. `20260318105000_restrict_security_definer_execute_permissions.sql`

## Apply migrations

### Option A - Supabase CLI (recommended)

```bash
pnpm supabase:push
```

### Option B - Supabase Studio SQL Editor

Run each migration file in the exact order listed above.

## Security model (important)

- NestJS backend uses `service_role` and enforces business authorization.
- Core chat tables are RLS-protected.
- Direct `authenticated` client writes to core chat tables are intentionally denied.
- Privileged RPC function execution is restricted to `service_role`.

## After push quick checks

1. RLS is enabled on core tables.
2. Authenticated users can read only their scoped data.
3. Authenticated users cannot insert/update/delete directly in core chat tables.
4. Backend flows (conversation create/list, message send/read) still work through API.

## Helpful commands

```bash
# Link project (first time)
supabase link --project-ref your-project-ref

# Push migrations
pnpm supabase:push

# Show migration status
supabase migration list
```
