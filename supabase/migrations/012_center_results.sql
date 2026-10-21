-- =============================================================================
-- Migration 012 — paper exam results of the center students.
--
-- The center students sat the unit exam on paper. The owner marks the papers
-- and sends the scores; they go in here from the owner's machine (the data file
-- never passes through git — this repository is public). /results looks a
-- student up by the phone number written on the paper and shows the score and
-- the rank, computed from this table, of that one student only.
--
-- Same rule as every table on this site: RLS on, no public policies. Only the
-- server (service role) reads or writes.
--
-- Run ONCE in the Supabase SQL Editor, after 011.
-- =============================================================================

create table if not exists public.center_results (
  id          uuid primary key default gen_random_uuid(),
  exam_slug   text not null,
  phone       text not null check (phone ~ '^01[0125][0-9]{8}$'),
  full_name   text not null,
  score       numeric(4,1) not null check (score >= 0),
  max_score   numeric(4,1) not null default 70,
  branch      text,
  created_at  timestamptz not null default now(),
  unique (exam_slug, phone)
);
alter table public.center_results enable row level security;
comment on table public.center_results is
  'Paper exam scores of center students, one row per student per exam. Minors data. Server-side reads only.';
