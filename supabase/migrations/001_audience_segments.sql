-- =============================================================================
-- Migration 001 — widen the audience segments.
--
-- The site now serves four segments, not two school grades:
--   1st secondary · 2nd secondary · university (CS/engineering) · self-learner
--
-- Run this ONCE in the Supabase SQL Editor, after the initial schema.sql.
-- Safe to run on a table that already contains rows.
-- =============================================================================

-- 1. Drop the old constraint so existing values can be rewritten.
alter table public.leads drop constraint if exists leads_grade_check;

-- 2. Map any existing rows onto the new vocabulary.
update public.leads set grade = 'first_sec'    where grade = 'first';
update public.leads set grade = 'second_sec'   where grade = 'second';
update public.leads set grade = 'self_learner' where grade = 'other';

-- 3. Re-apply the constraint with the new set.
alter table public.leads
  add constraint leads_grade_check
  check (grade in ('first_sec', 'second_sec', 'university', 'self_learner'));

comment on column public.leads.grade is
  'Audience segment: first_sec | second_sec | university | self_learner';
