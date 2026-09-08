-- =============================================================================
-- Migration 008 — the register (كشف الحضور).
--
-- One screen the teacher works from while sitting in front of the class: who
-- turned up, who did the homework and what they scored, and a box to type a
-- paper exam mark into.
--
-- Two things are added:
--   1. `attendance` — presence, one row per student per day.
--   2. `exam_submissions.source` — so a mark typed in by hand sits beside the
--      ones the site marked itself, instead of in a second table nobody joins.
--
-- Run ONCE in the Supabase SQL Editor, after 007.
-- =============================================================================

-- ── 1. Attendance ────────────────────────────────────────────────────────────
--
-- Keyed on (student, date) rather than on a sessions table. A student attends
-- one lesson on a given day, so a separate `class_sessions` row per group would
-- add a join and a foreign key to express something the date already says. If
-- two groups per day ever needs distinguishing, `lesson` is where it goes.
create table if not exists public.attendance (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  lead_id       uuid not null references public.leads (id) on delete cascade,
  session_date  date not null,

  -- 'late' and 'excused' exist because a register with only present/absent
  -- forces a teacher to lie about the student who arrived twenty minutes in.
  status        text not null check (status in ('present', 'absent', 'late', 'excused')),

  /** Optional label — "الدرس الأول", "مراجعة". */
  lesson        text,
  note          text,

  recorded_by   uuid references public.dashboard_users (id) on delete set null,

  -- One record per student per day. Marking the same student twice is a
  -- correction, not a second attendance.
  unique (lead_id, session_date)
);

create index if not exists attendance_date_idx on public.attendance (session_date desc);
create index if not exists attendance_lead_idx on public.attendance (lead_id);

alter table public.attendance enable row level security;

comment on table public.attendance is
  'Daily register. One row per student per date; re-marking updates in place.';

-- ── 2. Where an exam mark came from ──────────────────────────────────────────
--
-- The site marks its own exams. A paper exam is marked by the teacher and typed
-- in. Both are exam marks and belong in one table — but a rate calculated over
-- them is meaningless unless they can be told apart.
alter table public.exam_submissions
  add column if not exists source text not null default 'online';

alter table public.exam_submissions drop constraint if exists exam_submissions_source_check;
alter table public.exam_submissions
  add constraint exam_submissions_source_check check (source in ('online', 'manual'));

comment on column public.exam_submissions.source is
  'online = marked by the site. manual = a paper mark typed in from the register.';

-- Who typed it, for a mark that was not earned through the site.
alter table public.exam_submissions
  add column if not exists recorded_by uuid references public.dashboard_users (id) on delete set null;

-- A hand-entered mark has no marking run behind it.
alter table public.exam_submissions alter column grader_source drop not null;

-- ── 3. Sanity check ──────────────────────────────────────────────────────────
-- select session_date, status, count(*) from public.attendance
-- group by session_date, status order by session_date desc;
--
-- select source, count(*) from public.exam_submissions group by source;
