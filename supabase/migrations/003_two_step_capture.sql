-- =============================================================================
-- Migration 003 — two-step capture.
--
-- The form now saves the lead on the FIRST step (name, phone, grade) and
-- enriches it on the second. That is the whole point: a student who abandons
-- half way is still a lead the team can call, instead of nothing at all.
--
-- Consequences for the table:
--   * whatsapp can no longer be NOT NULL — it is collected in step two.
--   * a row needs to say whether it was finished, so the team can tell a
--     half-filled lead from a complete one at a glance.
--   * dedupe now keys on phone (step one has no whatsapp yet), so phone
--     needs an index.
--
-- Run ONCE in the Supabase SQL Editor. Safe on a table that already has rows.
-- =============================================================================

-- ── 1. WhatsApp becomes optional at insert time ──────────────────────────────
alter table public.leads alter column whatsapp drop not null;

comment on column public.leads.whatsapp is
  'WhatsApp number, normalised 01XXXXXXXXX. NULL until step two is submitted.';

-- ── 2. Form-completion stage ─────────────────────────────────────────────────
-- Deliberately separate from `status`: `status` is the follow-up team''s
-- operational state (new → contacted → booked), `stage` is how much of the
-- form the student actually filled. Conflating them would lose one or other.
alter table public.leads add column if not exists stage text;

update public.leads set stage = 'complete' where stage is null;

alter table public.leads alter column stage set default 'partial';
alter table public.leads alter column stage set not null;

alter table public.leads drop constraint if exists leads_stage_check;
alter table public.leads
  add constraint leads_stage_check
  check (stage in ('partial', 'complete'));

comment on column public.leads.stage is
  'partial = step one only (name, phone, grade). complete = step two submitted.';

-- When step two landed. NULL for a lead that never finished.
alter table public.leads add column if not exists completed_at timestamptz;

update public.leads set completed_at = created_at
  where completed_at is null and stage = 'complete';

-- ── 3. Indexes for the two questions the team will actually ask ──────────────
-- "who never finished?" and "have we seen this phone in the last ten minutes?"
create index if not exists leads_stage_idx on public.leads (stage);
create index if not exists leads_phone_idx on public.leads (phone);

-- ── 4. Sanity check — run this after the migration ───────────────────────────
-- select stage, count(*) from public.leads group by stage;
