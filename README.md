# zonasur chat

private whatsapp-style messaging for closed communities. built with nestjs, next.js, supabase auth, and socket.io.

## monorepo layout

- `apps/api`: nestjs api + socket.io gateway
- `apps/web`: next.js app router frontend
- `packages/types`: shared types
- `supabase`: schema and migration sql

## environment matrix

### shared

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### api (`apps/api`)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `PORT` (default `3001`)
- `NODE_ENV`
- `ALLOWED_ORIGINS` (comma-separated; required outside development)

### web (`apps/web`)

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`

copy `.env.example` to `.env` (and optionally `.env.local`) before running locally.

## database migration workflow

1. ensure migrations are applied in file order:
   - `001_core_schema.sql`
   - `002_triggers_and_functions.sql`
   - newer additive migrations
2. preferred cli command:

```bash
pnpm supabase:push
```

3. do not edit applied baseline migrations in place; add new timestamped migrations.

## local development

```bash
pnpm install
pnpm dev
```

or run each app separately:

```bash
pnpm dev:api
pnpm dev:web
```

## production build and start

```bash
pnpm install --frozen-lockfile
pnpm -r typecheck
pnpm -r lint
pnpm build
```

start processes:

```bash
pnpm --filter @zs/api start
pnpm --filter @zs/web start
```

api health check is exposed at:

- `/api/health`

## reverse proxy requirements (ec2/vm)

configure your reverse proxy (nginx/caddy/traefik) to:

1. proxy web http traffic to next.js process.
2. proxy api traffic to nestjs process (`/api/*`).
3. forward websocket upgrades to the same nestjs upstream.
4. preserve `host`, `x-forwarded-for`, and `x-forwarded-proto` headers.

example nginx websocket directives for api upstream:

```nginx
proxy_http_version 1.1;
proxy_set_header upgrade $http_upgrade;
proxy_set_header connection "upgrade";
proxy_set_header host $host;
proxy_set_header x-forwarded-for $proxy_add_x_forwarded_for;
proxy_set_header x-forwarded-proto $scheme;
```

## operational notes

- service-role access is kept for backend infrastructure logic.
- direct client writes to core chat tables are denied by rls baseline.
- websocket path remains socket.io only.

## known limitations / next hardening steps

- presence is in-memory (single instance); use shared store for horizontal scaling.
- add e2e tests for auth + websocket event authorization and read receipts.
- add structured logging sink and alerting for gateway/auth failures.
