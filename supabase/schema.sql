-- =============================================================================
-- Leads table — the only table in V1.
--
-- Security model (roadmap §6):
--   * RLS is ON with NO policies, so the anon/public key can neither read nor
--     write. Every write goes through the server route using the service role
--     key, which bypasses RLS.
--   * Minors' data: minimum fields only, never shared (Principle 31).
--
-- Run this once in the Supabase SQL Editor.
-- =============================================================================

create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- Captured fields (Doc 05 §3 — three required + one optional).
  name          text        not null,
  whatsapp      text        not null,
  grade         text        not null check (grade in ('first', 'second', 'other')),
  referred_by   text,

  -- Context, so automation can route without asking again.
  intent        text        not null check (intent in ('curriculum', 'intro_session', 'updates', 'parent')),
  note          text,
  page_context  text,
  source        text,
  utm           jsonb,

  -- Operational state, owned by the follow-up team.
  status        text        not null default 'new' check (status in ('new', 'contacted', 'booked', 'enrolled', 'closed'))
);

-- Dedupe lookups and the daily "who came in today" query.
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_whatsapp_idx   on public.leads (whatsapp);
create index if not exists leads_status_idx     on public.leads (status);

-- Lock the table down. Do NOT add public policies.
alter table public.leads enable row level security;

comment on table public.leads is
  'Website leads. Minors data — minimum collection, never shared. Server-side writes only.';
