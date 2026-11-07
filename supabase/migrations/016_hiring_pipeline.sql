-- =============================================================================
-- Migration 016 — hiring pipeline for the team application form.
--
-- The applications themselves are rows in form_responses (migration 013), one
-- per send, for the private form `join-mr-anas-team-k7q3x9`. This table adds
-- what the owner decides about each applicant: a status and a short note,
-- keyed by the applicant's WhatsApp number so a second send by the same person
-- keeps its status.
--
-- Same rule as every table on this site: RLS on, no public policies. Only the
-- server (service role) reads or writes, from /dashboard/hiring, admins only.
--
-- Run ONCE in the Supabase SQL Editor, after 015.
-- =============================================================================

create table if not exists public.hiring_status (
  form        text not null references public.private_pages(slug) on delete cascade,
  phone       text not null check (phone ~ '^01[0125][0-9]{8}$'),
  status      text not null default 'new'
              check (status in ('new', 'contacted', 'interview', 'accepted', 'rejected')),
  note        text not null default '' check (char_length(note) <= 1000),
  updated_by  text not null,
  updated_at  timestamptz not null default now(),
  primary key (form, phone)
);
alter table public.hiring_status enable row level security;
comment on table public.hiring_status is
  'Owner decisions on team applicants (status + note), keyed by WhatsApp number. Server-side only. Delete with the form when hiring closes.';
