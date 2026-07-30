-- =============================================================================
-- Leads table — the only table in V1.
--
-- ⚠️ This file is the CURRENT desired shape, for fresh installs.
--    An existing database must be updated with the files in ./migrations
--    instead, so no data is lost.
--
-- Security model (roadmap §6):
--   * RLS is ON with NO policies, so the anon/publishable key can neither read
--     nor write. Every write goes through the server route using the service
--     role key, which bypasses RLS.
--   * Minors' data: minimum fields only, never shared (Principle 31).
-- =============================================================================

create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- Who they are.
  name          text not null,                -- student's full (triple) Arabic name
  phone         text not null,                -- normalised 01XXXXXXXXX
  whatsapp      text not null,                -- normalised 01XXXXXXXXX

  -- What they want.
  grade         text not null check (grade in ('first_sec', 'second_bacc')),
  attendance    text not null check (attendance in ('online', 'center')),
  branch        text check (branch in ('helwan', 'hadayek_helwan', 'may15', 'other')),

  -- Where they came from — the only reliable read on word of mouth.
  heard_from    text not null check (heard_from in
                  ('facebook', 'youtube', 'google', 'tiktok', 'friend', 'other')),

  -- Context, so automation can route without asking again.
  intent        text not null check (intent in
                  ('curriculum', 'intro_session', 'updates', 'parent')),
  note          text,                          -- optional question from the visitor
  page_context  text,
  source        text,
  utm           jsonb,
  referred_by   text,                          -- legacy, no longer collected

  -- Operational state, owned by the follow-up team.
  status        text not null default 'new' check (status in
                  ('new', 'contacted', 'booked', 'enrolled', 'closed')),

  -- A branch only makes sense for centre students.
  constraint leads_branch_requires_center check (branch is null or attendance = 'center')
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_whatsapp_idx   on public.leads (whatsapp);
create index if not exists leads_status_idx     on public.leads (status);
create index if not exists leads_heard_from_idx on public.leads (heard_from);
create index if not exists leads_branch_idx     on public.leads (branch);

-- Lock the table down. Do NOT add public policies.
alter table public.leads enable row level security;

comment on table public.leads is
  'Website leads. Minors data — minimum collection, never shared. Server-side writes only.';
