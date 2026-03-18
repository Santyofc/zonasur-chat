# ZonaSur Chat

Private WhatsApp-style messaging for closed communities. Built with NestJS, Next.js 14, Supabase, and Socket.IO.

## 🏗️ Architecture

- **Backend (`apps/api`)**: NestJS 10. Handles business logic, contacts, conversation management, and Realtime Gateway (Socket.IO). Accesses Supabase via `@supabase/supabase-js` using the service role.
- **Frontend (`apps/web`)**: Next.js 14 (App Router). Authenticest includes Supabase Auth and communicates with the NestJS API for sensitive operations.
- **Shared (`packages/types`)**: Shared TypeScript interfaces for both frontend and backend.
- **Database (`supabase/`)**: SQL migrations for table schema, triggers, and helper functions.

## 🚀 Getting Started

### 1. Prerequisites
- [PNPM](https://pnpm.io/) installed.
- A [Supabase](https://supabase.com/) project created.

### 2. Database Setup
1. Go to your Supabase Project → SQL Editor.
2. Paste and run the contents of:
   - `supabase/migrations/001_core_schema.sql`
   - `supabase/migrations/002_triggers_and_functions.sql`

### 3. Environment Variables
Copy `.env.example` to `.env.local` (or `.env` in the root) and fill in your Supabase credentials.

```bash
cp .env.example .env
```

You will need:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Server-side only)
- `SUPABASE_JWT_SECRET` (For NestJS to verify client tokens)
- `DATABASE_URL` (For migrations)

### 4. Installation
```bash
pnpm install
```

### 5. Running the Project
```bash
# Start backend and frontend in parallel
pnpm dev

# Or start them separately
pnpm dev:api   # NestJS on :3001
pnpm dev:web   # Next.js on :3000
```

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Backend**: NestJS + Socket.IO
- **Database/Auth**: Supabase
- **Styling**: Tailwind CSS (ZonaSur `zs-*` theme)
- **Realtime**: WebSockets (Socket.IO)

## 📝 Features Implemented (MVP)
- [x] Email & OAuth Authentication (Google, GitHub, Discord)
- [x] User Profile Sync (Auth -> Public table)
- [x] Contact list management (Requests & Accept)
- [x] Direct Conversations (1-to-1)
- [x] Real-time messaging with Socket.IO
- [x] Optimistic UI updates
- [x] Typing Indicators
- [x] Read Receipts (Sent/Delivered/Read)
- [x] Online/Offline Presence (In-memory v1)
- [x] Custom "Hacker-Tech" UI with Tailwind
