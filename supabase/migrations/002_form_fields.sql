-- =============================================================================
-- Migration 002 — new form structure.
--
-- Adds: phone, attendance (online/centre), branch (centre only), heard_from.
-- Changes: grade vocabulary → first_sec | second_bacc.
--
-- Run ONCE in the Supabase SQL Editor. Safe to run whether or not migration
-- 001 was applied, and safe on a table that already has rows.
-- =============================================================================

-- ── 1. New columns ───────────────────────────────────────────────────────────
alter table public.leads add column if not exists phone      text;
alter table public.leads add column if not exists attendance text;
alter table public.leads add column if not exists branch     text;
alter table public.leads add column if not exists heard_from text;

-- ── 2. Grade vocabulary ──────────────────────────────────────────────────────
alter table public.leads drop constraint if exists leads_grade_check;

update public.leads set grade = 'first_sec'   where grade in ('first', 'first_sec');
update public.leads set grade = 'second_bacc' where grade in ('second', 'second_sec');
-- Any leftover value belongs to the earlier audience model (test data only).
update public.leads set grade = 'first_sec'
  where grade not in ('first_sec', 'second_bacc');

alter table public.leads
  add constraint leads_grade_check
  check (grade in ('first_sec', 'second_bacc'));

-- ── 3. Value constraints for the new columns ─────────────────────────────────
-- NULL is allowed so pre-existing rows stay valid; the app requires them.
alter table public.leads drop constraint if exists leads_attendance_check;
alter table public.leads
  add constraint leads_attendance_check
  check (attendance is null or attendance in ('online', 'center'));

alter table public.leads drop constraint if exists leads_branch_check;
alter table public.leads
  add constraint leads_branch_check
  check (branch is null or branch in ('helwan', 'hadayek_helwan', 'may15', 'other'));

-- A branch only makes sense for centre students.
alter table public.leads drop constraint if exists leads_branch_requires_center;
alter table public.leads
  add constraint leads_branch_requires_center
  check (branch is null or attendance = 'center');

alter table public.leads drop constraint if exists leads_heard_from_check;
alter table public.leads
  add constraint leads_heard_from_check
  check (heard_from is null or heard_from in
        ('facebook', 'youtube', 'google', 'tiktok', 'friend', 'other'));

-- ── 4. Indexes for the reports the team will actually run ────────────────────
create index if not exists leads_heard_from_idx on public.leads (heard_from);
create index if not exists leads_branch_idx     on public.leads (branch);

-- ── 5. Documentation ─────────────────────────────────────────────────────────
comment on column public.leads.name        is 'Student full (triple) name, Arabic';
comment on column public.leads.phone       is 'Primary phone, normalised 01XXXXXXXXX';
comment on column public.leads.whatsapp    is 'WhatsApp number, normalised 01XXXXXXXXX';
comment on column public.leads.grade       is 'first_sec | second_bacc';
comment on column public.leads.attendance  is 'online | center';
comment on column public.leads.branch      is 'helwan | hadayek_helwan | may15 | other (centre only)';
comment on column public.leads.heard_from  is 'facebook | youtube | google | tiktok | friend | other';
comment on column public.leads.note        is 'Optional question from the visitor';
comment on column public.leads.referred_by is 'Legacy — no longer collected; friend referrals now come through heard_from';
