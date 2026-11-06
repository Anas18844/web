-- 014: a third student type on the unit exam — center students who sit it online (owner, 2026-11-06).
-- Center students used to be told apart only by hand; some of tonight's center students want the online exam,
-- and the ranking and results need to know where each student belongs.
-- Run this in the Supabase SQL Editor BEFORE the site version that sends 'center' goes live.

alter table public.unit_exam_attempts drop constraint if exists unit_exam_attempts_student_type_check;
alter table public.unit_exam_attempts
  add constraint unit_exam_attempts_student_type_check
  check (student_type in ('online', 'center', 'exam_only'));

-- Check: the constraint now lists three types.
select pg_get_constraintdef(oid) from pg_constraint where conname = 'unit_exam_attempts_student_type_check';
