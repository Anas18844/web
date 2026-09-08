-- =============================================================================
-- Migration 007 — exams.
--
-- An exam is not homework. Homework is open to anyone; an exam is GATED on
-- having done the homework first, and the gate is checked against
-- `homework_submissions` at the moment a student asks to start.
--
-- Run ONCE in the Supabase SQL Editor, after 006.
-- =============================================================================

create table if not exists public.exam_submissions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  exam_slug     text not null,
  grade         text not null check (grade in ('first_sec', 'second_bacc')),

  -- Who sat it. The phone is REQUIRED here, unlike homework: an exam that
  -- cannot be attached to a student is an exam with no reason to exist.
  student_name  text,
  phone         text not null,
  lead_id       uuid references public.leads (id) on delete set null,
  -- The homework submission that unlocked this attempt. Keeping the link means
  -- "did they really do the homework first?" is answerable later, not just at
  -- the moment the gate ran.
  homework_id   uuid references public.homework_submissions (id) on delete set null,

  -- Marks, per section, so a teacher can see WHERE a class lost them.
  mcq_score        int not null,
  mcq_total        int not null,
  truefalse_score  int not null,
  truefalse_total  int not null,
  blanks_score     int not null,
  blanks_total     int not null,
  essay_score      int not null,
  essay_total      int not null,

  total_score   int not null,
  total_marks   int not null,
  passed        boolean not null,

  -- Per-question correctness. No student text: a written answer can contain
  -- anything, and none of it is needed to see which question a class failed.
  detail        jsonb,

  grader_source text check (grader_source in ('gemini', 'local')),

  -- Client-generated, so a double-tap on submit cannot write two attempts.
  attempt_key   text not null unique
);

create index if not exists exam_submissions_exam_idx    on public.exam_submissions (exam_slug);
create index if not exists exam_submissions_phone_idx   on public.exam_submissions (phone);
create index if not exists exam_submissions_created_idx on public.exam_submissions (created_at desc);
create index if not exists exam_submissions_lead_idx    on public.exam_submissions (lead_id);

alter table public.exam_submissions enable row level security;

comment on table public.exam_submissions is
  'Exam results. Server-side writes only. Gated on a matching homework_submissions row.';

-- ── Sanity check ─────────────────────────────────────────────────────────────
-- select exam_slug, count(*), round(avg(total_score), 1) as avg_score
-- from public.exam_submissions group by exam_slug;
