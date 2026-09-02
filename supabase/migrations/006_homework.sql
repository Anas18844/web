-- =============================================================================
-- Migration 006 — homework submissions.
--
-- One row per attempt, not per student. A student who sits the same paper twice
-- produces two rows, and the dashboard shows both: knowing that someone scored
-- 18 and then 44 is the useful fact, and an UPDATE would destroy it.
--
-- Run ONCE in the Supabase SQL Editor, after 005.
-- =============================================================================

create table if not exists public.homework_submissions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- Which paper.
  homework_slug text not null,
  grade         text not null check (grade in ('first_sec', 'second_bacc')),

  -- Who.
  --
  -- `phone` is how a submission is attached to a student, and it is NULLABLE on
  -- purpose: a YouTube viewer who has not booked may sit the paper without
  -- leaving one. Their attempt still counts as evidence the material is being
  -- used, which is worth having.
  student_name  text,
  phone         text,
  -- Filled when the phone matches a row in `leads`. NULL means "sat the paper
  -- but we have no booking for this number" — a real and interesting state,
  -- not an error.
  lead_id       uuid references public.leads (id) on delete set null,

  -- The result.
  mcq_score     integer not null,
  mcq_total     integer not null,
  essay_score   integer not null,
  essay_total   integer not null,
  total_score   integer not null,
  total_marks   integer not null,
  passed        boolean not null,

  -- Per-question detail, so a teacher can see WHICH question a class failed
  -- rather than only that the average was low. Shaped as
  -- [{ id, type, correct, match? }] — no student text is stored here.
  detail        jsonb,

  -- 'gemini' when the AI marked the essays, 'local' when it fell back to word
  -- matching. A run of 'local' means the marker is down, and the essay scores
  -- from that window should be read with suspicion.
  grader_source text not null default 'local',

  -- Guards against a double-tap on submit writing the same attempt twice.
  attempt_key   text unique
);

create index if not exists hw_sub_created_idx  on public.homework_submissions (created_at desc);
create index if not exists hw_sub_slug_idx     on public.homework_submissions (homework_slug);
create index if not exists hw_sub_phone_idx    on public.homework_submissions (phone);
create index if not exists hw_sub_lead_idx     on public.homework_submissions (lead_id);

-- Locked down like every other table: the browser never reads this, the server
-- writes it with the service role.
alter table public.homework_submissions enable row level security;

comment on table public.homework_submissions is
  'Homework attempts and scores. One row per attempt. Server-side writes only.';

-- ── Sanity check ─────────────────────────────────────────────────────────────
-- select homework_slug, count(*), round(avg(total_score), 1) as avg_score
-- from public.homework_submissions group by homework_slug;
