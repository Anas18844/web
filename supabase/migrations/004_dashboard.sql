-- =============================================================================
-- Migration 004 — the dashboard.
--
-- Adds the people who can log in, a record of what they do, and the columns a
-- manually-entered lead needs.
--
-- Run ONCE in the Supabase SQL Editor. Safe on a table that already has rows.
-- =============================================================================

-- ── 1. Who can log in ────────────────────────────────────────────────────────
-- Two roles and no more, enforced by a CHECK rather than by application code:
--
--   admin — sees phone numbers, edits, deletes, sees the analytics.
--   team  — sees everything EXCEPT phone numbers, may add, may not change or
--           remove anything.
--
-- Passwords are scrypt hashes produced by scripts/dashboard-user.mjs. No plain
-- password is ever sent to this database, and there is no way back from the
-- stored value to the password.
create table if not exists public.dashboard_users (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  email         text not null unique,
  name          text not null,
  password_hash text not null,
  role          text not null check (role in ('admin', 'team')),

  -- Revoking access is a flag, not a delete: the audit trail below references
  -- these rows, and history that loses its author is not history.
  active        boolean not null default true,
  last_login_at timestamptz
);

create index if not exists dashboard_users_email_idx on public.dashboard_users (lower(email));

alter table public.dashboard_users enable row level security;

comment on table public.dashboard_users is
  'Dashboard accounts. Server-side auth only — no client ever queries this table.';

-- ── 2. What they did ─────────────────────────────────────────────────────────
-- This dashboard is meant to inform decisions that are hard to walk back, so
-- every change to a lead is recorded with who made it and what the row looked
-- like before. `before` is the part that matters: without it a deletion is
-- indistinguishable from a row that never existed.
--
-- The actor's email is copied in, not just referenced, so the record still
-- reads correctly after an account is renamed or deactivated.
create table if not exists public.dashboard_audit (
  id          uuid primary key default gen_random_uuid(),
  at          timestamptz not null default now(),

  actor_id    uuid references public.dashboard_users (id) on delete set null,
  actor_email text not null,
  actor_role  text not null,

  action      text not null check (action in ('create', 'update', 'delete', 'login', 'export')),
  lead_id     uuid,

  before      jsonb,
  after       jsonb
);

create index if not exists dashboard_audit_at_idx      on public.dashboard_audit (at desc);
create index if not exists dashboard_audit_lead_idx    on public.dashboard_audit (lead_id);

alter table public.dashboard_audit enable row level security;

comment on table public.dashboard_audit is
  'Append-only record of dashboard actions. Never updated, never deleted.';

-- ── 3. Columns a manually-entered lead needs ─────────────────────────────────
-- `source` already exists on the table but was never constrained or used.
-- A lead that came in over WhatsApp and was typed in by hand must be
-- distinguishable from one the website captured, or every conversion rate
-- computed from this table is wrong.
update public.leads set source = 'website' where source is null;

alter table public.leads alter column source set default 'website';

alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads
  add constraint leads_source_check
  check (source in ('website', 'manual'));

comment on column public.leads.source is
  'website = captured by the form. manual = entered by the team (WhatsApp, phone, in person).';

-- Who typed it in. NULL for everything the website captured.
alter table public.leads add column if not exists created_by uuid
  references public.dashboard_users (id) on delete set null;

create index if not exists leads_source_idx on public.leads (source);

-- ── 4. Sanity check — run after the migration ────────────────────────────────
-- select source, stage, count(*) from public.leads group by source, stage;
