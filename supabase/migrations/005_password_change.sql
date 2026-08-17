-- =============================================================================
-- Migration 005 — forced password change on first login.
--
-- An account is created with a temporary password that somebody else chose and
-- typed somewhere: a terminal, a message, a handover note. That password has
-- to stop working the moment its owner arrives.
--
-- With this flag set, every dashboard screen redirects to /dashboard/password
-- until the person picks their own. There is no way to reach the student list
-- while a password somebody else knows is still valid.
--
-- Run ONCE in the Supabase SQL Editor, after 004.
-- =============================================================================

alter table public.dashboard_users
  add column if not exists must_change_password boolean not null default false;

comment on column public.dashboard_users.must_change_password is
  'true = the current password was issued by someone else. Blocks every screen except /dashboard/password.';

-- When the password was last set. A password that has never been changed from
-- the one it was issued with is a thing worth being able to find.
alter table public.dashboard_users
  add column if not exists password_changed_at timestamptz;

-- ── Sanity check ─────────────────────────────────────────────────────────────
-- select email, role, active, must_change_password, last_login_at
-- from public.dashboard_users order by created_at;
