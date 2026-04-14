# Deployment Guide

## Stack

| Layer | Service |
|-------|---------|
| Frontend | React SPA (Vite) hosted on Vercel |
| Serverless API | Vercel Functions (`api/*.ts`, Node.js runtime) |
| Database | Neon Postgres (serverless, pooled connection) |
| Payments | Monobank webhook |

## Prerequisites

- [Vercel CLI](https://vercel.com/docs/cli) installed: `npm i -g vercel`
- Project linked to Vercel: `vercel link`
- Neon project created and tables applied (see schema below)

## Environment Variables

Set in Vercel project dashboard → Settings → Environment Variables.

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | Neon pooled connection string | Yes |
| `MONO_TOKEN` | Monobank personal token | Yes |
| `MONO_ACCOUNT_ID` | Monobank account ID (default: `0` = first) | No |

For local development, values live in `.env` (not committed to git). Use `vercel env pull .env` to sync from Vercel.

## Local Development

```bash
# Install dependencies
npm install

# Pull environment variables from Vercel
vercel env pull .env

# Start Vercel dev server (serves both API and Vite SPA)
vercel dev
```

The Vercel dev server starts at `http://localhost:3000` and proxies `/api/*` to the serverless functions.

> **Note:** `npm run dev` (plain Vite) does NOT serve `/api/*` routes. Use `vercel dev` when testing the full stack locally.

## Deploying

```bash
# Preview deploy (staging)
vercel

# Production deploy
vercel --prod
```

Vercel automatically:
1. Runs `npm run build` → outputs `dist/`
2. Deploys `dist/` as a static site
3. Deploys `api/*.ts` as serverless Node.js functions
4. Applies `vercel.json` rewrites (SPA fallback + API routing)

## Updating Environment Variables

```bash
# Add or update a variable in Vercel (all environments)
vercel env add MONO_TOKEN

# Pull updated vars to local .env
vercel env pull .env
```

After updating env vars, redeploy: `vercel --prod`.

## Viewing Vercel Function Logs

```bash
# Stream real-time logs for all functions
vercel logs --follow

# Logs for a specific function (last 100 lines)
vercel logs api/monobank-webhook.ts
```

Or in Vercel dashboard: Project → Functions tab → click on a function → Logs.

Key log lines to monitor:
- `[monobank-webhook] received payload:` — every incoming webhook
- `[server error]` — unexpected errors in any handler
- `[mono-sync] error processing item` — matching errors during manual sync

## Database: Running Migrations

Tables are managed manually in Neon console (https://console.neon.tech).

Current schema (already applied):

```sql
create table if not exists events (
  id serial primary key,
  name text not null,
  date timestamptz not null,
  fee_amount numeric(10,2) not null,
  registration_deadline timestamptz not null
);

create table if not exists registrations (
  id serial primary key,
  event_id int not null references events(id),
  child_name text not null,
  parent_name text not null,
  phone text not null,
  email text not null,
  payment_code text not null unique,
  expected_amount numeric(10,2) not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  mono_transaction_id text,
  raw_statement jsonb
);

create table if not exists mono_events (
  id serial primary key,
  received_at timestamptz not null default now(),
  event_type text not null,
  account text,
  statement_item_id text,
  payload jsonb not null,
  processed boolean not null default false,
  processed_at timestamptz,
  error text
);

create index if not exists mono_events_statement_item_id_idx
  on mono_events (statement_item_id);

create index if not exists mono_events_processed_idx
  on mono_events (processed, received_at);
```

For future schema changes: run SQL directly in Neon SQL editor, then document here.

## Rollback

If a deploy breaks production:

```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote <deployment-url>
```
