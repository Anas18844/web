-- =============================================================================
-- Migration 011 — the comprehensive (unit) exam, sat online with a 2-hour clock.
--
-- Plan: mr-anas-hq/brain/plans/2026-10-online-unit-exam/plan.md
--
-- Different from the weekly exams (007/009): nothing is marked on submit. The
-- answers are STORED, one row per question, saved as the student types, and
-- marked together after the exam. The clock lives here too — `started_at` and
-- `ends_at` are written by the server once — so a student whose phone dies
-- comes back to the same attempt with the same time left.
--
-- Same rule as every table on this site: RLS on, no public policies. Only the
-- server (service role) reads or writes.
--
-- ⚠️ The questions are NOT in this file: this repository is public. The paper
-- goes into `unit_exam_papers` from the owner's machine
-- (scripts/upload-unit-exam-paper.mjs) — it never passes through git.
--
-- Run ONCE in the Supabase SQL Editor, after 010.
-- =============================================================================

-- ── The paper (questions only — never the answers) ───────────────────────────
create table if not exists public.unit_exam_papers (
  slug        text primary key,
  paper       jsonb not null,
  updated_at  timestamptz not null default now()
);
alter table public.unit_exam_papers enable row level security;
comment on table public.unit_exam_papers is
  'Question papers for the online unit exams, without answers. Uploaded from the owner''s machine; never in git.';

-- ── One attempt per student per exam ─────────────────────────────────────────
create table if not exists public.unit_exam_attempts (
  id               uuid primary key default gen_random_uuid(),
  exam_slug        text not null,
  phone            text not null,
  full_name        text not null,
  student_type     text not null check (student_type in ('online', 'exam_only')),
  contact_consent  boolean not null default false,
  started_at       timestamptz not null default now(),
  ends_at          timestamptz not null,
  extended_minutes integer not null default 0,
  submitted_at     timestamptz,
  end_reason       text check (end_reason in ('submitted', 'timeout')),
  order_seed       integer not null,
  net_hash         text,
  device_summary   text,
  receipt_code     text,
  final_hash       text,
  last_seen_at     timestamptz not null default now(),
  created_at       timestamptz not null default now()
);
create unique index if not exists unit_exam_attempts_one_per_student_idx
  on public.unit_exam_attempts (exam_slug, phone);
create index if not exists unit_exam_attempts_net_idx
  on public.unit_exam_attempts (exam_slug, net_hash);
alter table public.unit_exam_attempts enable row level security;
comment on index public.unit_exam_attempts_one_per_student_idx is
  'One attempt per phone: coming back with the same number resumes the attempt instead of starting a new clock.';

-- ── The answers: one row per question, overwritten as the student edits ──────
create table if not exists public.unit_exam_answers (
  attempt_id  uuid not null references public.unit_exam_attempts (id) on delete cascade,
  question_id text not null,
  value       jsonb,
  rev         integer not null default 0,
  flagged     boolean not null default false,
  updated_at  timestamptz not null default now(),
  primary key (attempt_id, question_id)
);
alter table public.unit_exam_answers enable row level security;
comment on column public.unit_exam_answers.rev is
  'Increases with every edit on the device. A save with a lower rev than the stored one is ignored, so a late retry never overwrites a newer answer.';

-- ── What happened during the attempt — for review, never for automatic marks ─
create table if not exists public.unit_exam_events (
  id          bigint generated always as identity primary key,
  attempt_id  uuid not null references public.unit_exam_attempts (id) on delete cascade,
  type        text not null,
  at          timestamptz not null default now(),
  net_hash    text,
  detail      jsonb
);
create index if not exists unit_exam_events_attempt_idx on public.unit_exam_events (attempt_id, at);
alter table public.unit_exam_events enable row level security;

-- ── Extra time given from the dashboard, and by whom ─────────────────────────
create table if not exists public.unit_exam_extensions (
  id          bigint generated always as identity primary key,
  attempt_id  uuid not null references public.unit_exam_attempts (id) on delete cascade,
  minutes     integer not null check (minutes > 0 and minutes <= 120),
  reason      text not null,
  by_user     text not null,
  at          timestamptz not null default now()
);
alter table public.unit_exam_extensions enable row level security;

-- ── Sanity check after running ───────────────────────────────────────────────
-- select tablename, rowsecurity from pg_tables
-- where schemaname = 'public' and tablename like 'unit_exam_%';
--   -- five rows, rowsecurity = true on all of them.
