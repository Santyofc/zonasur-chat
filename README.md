<div align="center">

# ZonaSur Chat

Private WhatsApp-style messaging for closed communities.

</div>

---

<div align="center">

## Languages

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![SQL](https://img.shields.io/badge/SQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)

## Frontend

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)

## Backend

![Node.js](https://img.shields.io/badge/Node.js-1B1F23?style=for-the-badge&logo=node.js&logoColor=5FA04E)
![NestJS](https://img.shields.io/badge/NestJS-1A1A1A?style=for-the-badge&logo=nestjs&logoColor=E0234E)
![Socket.IO](https://img.shields.io/badge/Socket.IO-0B0D12?style=for-the-badge&logo=socketdotio&logoColor=white)

## Database / Auth

![Supabase](https://img.shields.io/badge/Supabase-111827?style=for-the-badge&logo=supabase&logoColor=3ECF8E)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-0F172A?style=for-the-badge&logo=postgresql&logoColor=336791)
![RLS](https://img.shields.io/badge/RLS-13263A?style=for-the-badge&logo=databricks&logoColor=white)

## Cloud / DevOps

![Nginx](https://img.shields.io/badge/Nginx-16211B?style=for-the-badge&logo=nginx&logoColor=009639)
![PM2](https://img.shields.io/badge/PM2-202A44?style=for-the-badge&logo=pm2&logoColor=2B8BF2)
![pnpm](https://img.shields.io/badge/pnpm-1F2937?style=for-the-badge&logo=pnpm&logoColor=F69220)

## Tools

![Git](https://img.shields.io/badge/Git-111827?style=for-the-badge&logo=git&logoColor=F05032)
![GitHub](https://img.shields.io/badge/GitHub-0B0F19?style=for-the-badge&logo=github&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-111827?style=for-the-badge&logo=eslint&logoColor=4B32C3)
![Prettier](https://img.shields.io/badge/Prettier-1F2937?style=for-the-badge&logo=prettier&logoColor=F7B93E)

---

## Core Areas

![SaaS](https://img.shields.io/badge/SaaS-0EA5E9?style=flat-square)
![Realtime](https://img.shields.io/badge/Realtime-8B5CF6?style=flat-square)
![Auth](https://img.shields.io/badge/Auth-E11D48?style=flat-square)
![API](https://img.shields.io/badge/API-2563EB?style=flat-square)
![Cloud](https://img.shields.io/badge/Cloud-06B6D4?style=flat-square)

## Engineering Profile

![Backend Architecture](https://img.shields.io/badge/Backend_Architecture-4338CA?style=flat-square)
![Cloud Systems](https://img.shields.io/badge/Cloud_Systems-0EA5E9?style=flat-square)
![APIs and Integrations](https://img.shields.io/badge/APIs_and_Integrations-14B8A6?style=flat-square)
![Security First](https://img.shields.io/badge/Security_First-DC2626?style=flat-square)

</div>

---

## Monorepo layout

- `apps/api`: NestJS API + Socket.IO gateway
- `apps/web`: Next.js App Router frontend
- `packages/types`: shared TypeScript contracts
- `supabase`: schema and SQL migrations

## Environment matrix

### Shared

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### API (`apps/api`)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `PORT` (default `3001`)
- `NODE_ENV`
- `ALLOWED_ORIGINS` (comma-separated; required outside development)

### Web (`apps/web`)

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`

Copy `.env.example` to `.env` (and optionally `.env.local`) before local runs.

## Database migration workflow

1. Apply migrations in file order.
2. Recommended command:

```bash
pnpm supabase:push
```

3. Keep baseline migrations immutable; add new timestamped migrations only.

## Local development

```bash
pnpm install
pnpm dev
```

or run separately:

```bash
pnpm dev:api
pnpm dev:web
```

## Build and start

```bash
pnpm install --frozen-lockfile
pnpm -r typecheck
pnpm -r lint
pnpm build
```

start services:

```bash
pnpm --filter @zs/api start
pnpm --filter @zs/web start
```

Health probe:

- `GET /api/health`

## Reverse proxy requirements (EC2/VM)

1. Proxy web traffic to Next.js.
2. Proxy `/api/*` to NestJS.
3. Forward WebSocket upgrades to NestJS upstream.
4. Preserve `host`, `x-forwarded-for`, and `x-forwarded-proto` headers.

Minimal Nginx WebSocket directives:

```nginx
proxy_http_version 1.1;
proxy_set_header upgrade $http_upgrade;
proxy_set_header connection "upgrade";
proxy_set_header host $host;
proxy_set_header x-forwarded-for $proxy_add_x_forwarded_for;
proxy_set_header x-forwarded-proto $scheme;
```

## Operational notes

- Backend uses `service_role` for infrastructure access.
- Direct client writes to core chat tables are denied by RLS baseline.
- Realtime path is Socket.IO only.

## Known limitations

- Presence is in-memory (single instance).
- Add e2e coverage for auth + websocket authorization paths.
- Add centralized logging/alerting for gateway and auth failures.
