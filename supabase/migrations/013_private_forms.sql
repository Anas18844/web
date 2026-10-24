-- =============================================================================
-- Migration 013 — private one-off forms.
--
-- Some forms are not part of the public site: a questionnaire sent by link to a
-- handful of people, used once, then closed. Their HTML must not live in this
-- repository (it is public), so the page itself is stored here and served by
-- /f/[slug]; the answers come back through /api/form.
--
-- No student data goes in these tables. A form is closed by setting expires_at;
-- once its answers are exported, delete its rows.
--
-- Same rule as every table on this site: RLS on, no public policies. Only the
-- server (service role) reads or writes.
--
-- Run ONCE in the Supabase SQL Editor, after 012.
-- =============================================================================

create table if not exists public.private_pages (
  slug        text primary key check (slug ~ '^[a-z0-9-]{8,64}$'),
  title       text not null,
  html        text not null,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);
alter table public.private_pages enable row level security;
comment on table public.private_pages is
  'One-off private forms served at /f/[slug]. Not student data. Server-side reads only. Delete when the form closes.';

create table if not exists public.form_responses (
  id          uuid primary key default gen_random_uuid(),
  form        text not null references public.private_pages(slug) on delete cascade,
  respondent  text not null check (char_length(respondent) between 1 and 200),
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists form_responses_form_created_idx
  on public.form_responses (form, created_at desc);
alter table public.form_responses enable row level security;
comment on table public.form_responses is
  'Answers to the private forms, one row per send (the latest per respondent wins). Not student data. Server-side writes only.';
