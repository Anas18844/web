-- =============================================================================
-- Migration 009 — one sitting per student per exam.
--
-- An exam is sat ONCE. A student who has a recorded result does not get the
-- paper again: they have already seen the right answer to every question they
-- got wrong on the result card, so a second attempt measures nothing — and the
-- register would carry two marks for one sitting with no way to tell which was
-- the real one.
--
-- The application refuses a second sitting in two places (/api/exam/start will
-- not issue a pass, /api/exam/submit will not mark a replayed one). This index
-- is what makes it TRUE rather than merely usual: an app-level check reads and
-- then writes, and two requests arriving together can both pass the read.
--
-- ⚠️ SCOPE: this covers online and manual marks alike, deliberately. A paper
-- mark typed into the register for a student who already sat the paper online
-- now UPDATES that row instead of adding a second one — `recordExamMark`
-- conflicts on (exam_slug, phone) for exactly this reason, and the teacher's
-- mark wins.
--
-- Run ONCE in the Supabase SQL Editor, after 008.
-- =============================================================================

-- ── Before running: are there already duplicates? ────────────────────────────
--
-- The index CANNOT be created while any student has two rows for one exam, and
-- the failure is the whole point — it is a real disagreement about a mark, and
-- a person has to say which one counts. Run this first; if it returns nothing,
-- the index below creates cleanly.
--
--   select exam_slug, phone, count(*),
--          array_agg(attempt_key order by created_at) as keys,
--          array_agg(total_score order by created_at) as scores
--   from public.exam_submissions
--   group by exam_slug, phone
--   having count(*) > 1;

create unique index if not exists exam_submissions_one_per_student_idx
  on public.exam_submissions (exam_slug, phone);

comment on index public.exam_submissions_one_per_student_idx is
  'One result per student per exam. An exam is sat once; a re-entered mark corrects the row rather than adding one.';

-- ── Sanity check ─────────────────────────────────────────────────────────────
-- select exam_slug, count(*) as sittings, count(distinct phone) as students
-- from public.exam_submissions group by exam_slug order by exam_slug;
--   -- sittings and students must be equal for every row.
