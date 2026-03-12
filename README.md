# TypeRacer

A real-time multiplayer typing competition app built with Next.js and Supabase.

## Features

- **Single-player** — practice mode with configurable word count, live WPM/accuracy tracking, and personal best persistence
- **Multiplayer** — real-time rooms with ready/countdown flow, live progress bars for all players, and ranked results
- **Auth** — email/password sign-up and sign-in with Supabase Auth
- **Leaderboard** — global scores via Supabase Postgres

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database / Auth / Realtime | Supabase |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS v4 |
| Tables | TanStack Table |
| Testing | Vitest + Testing Library |

## Prerequisites

- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local dev)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these from your [Supabase project dashboard](https://supabase.com/dashboard) under **Project Settings → API**.

### 3. Apply database migrations

If using a remote Supabase project, run migrations via the Supabase dashboard SQL editor or the CLI:

```bash
supabase db push
```

For local development with the Supabase CLI:

```bash
supabase start
```

This spins up a local Postgres + Auth + Realtime stack. The local API URL and anon key are printed on startup — use those in `.env.local`.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm test` | Run unit tests (Vitest, single pass) |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run lint` | ESLint |

## Project structure

```
app/
  api/                  # Route handlers (rooms, game results, sentences)
  components/
    TypingGame/         # Reusable game component (WPM, accuracy, progress)
  login/                # Auth page (sign-in / sign-up)
  play/
    single/             # Single-player wrapper
    multi/              # Multiplayer lobby + room
  leaderboard/          # Global scores
lib/
  metrics.ts            # Pure WPM / accuracy calculation functions
  supabase/             # Supabase client helpers
supabase/
  migrations/           # SQL migration files
```

## Running tests

Tests cover the core `TypingGame` component and the login/register form:

```bash
npm test
```

17 tests across 2 suites — all unit tests, no network calls (Supabase and Next.js router are mocked).
