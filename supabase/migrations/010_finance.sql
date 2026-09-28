-- =============================================================================
-- Migration 010 — the finance planner (الحسابات).
--
-- Two tables behind /dashboard/finance, admin only:
--   1. `finance_settings` — ONE row of assumptions: prices, the platform's cut,
--      the centre's deductions, filming and editing rates, the filming plan and
--      the fixed monthly costs.
--   2. `finance_months`  — one row per month: the plan for that month (how many
--      students on which package, filming hours) and what actually happened.
--
-- Both hold their numbers as jsonb. The shape is validated in the app
-- (lib/finance-repo.ts) and the arithmetic lives in lib/finance.ts, so a new
-- cost line or package does not need a migration.
--
-- No policies: like every other dashboard table, it is read and written only
-- through the service key on the server, after requireAdmin().
--
-- Run ONCE in the Supabase SQL Editor, after 009.
-- =============================================================================

create table if not exists public.finance_settings (
  -- A single row. The check makes a second one impossible rather than unlikely.
  id          smallint primary key default 1 check (id = 1),
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.dashboard_users (id) on delete set null
);

alter table public.finance_settings enable row level security;

comment on table public.finance_settings is
  'Finance planner assumptions. Exactly one row (id = 1). Shape: FinanceSettings in lib/finance.ts.';

create table if not exists public.finance_months (
  -- 'YYYY-MM'. Text, not a date, because a month has no day and pretending it
  -- does invites someone to store the 15th.
  month       text primary key check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  plan        jsonb not null default '{}'::jsonb,
  actual      jsonb not null default '{}'::jsonb,
  note        text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.dashboard_users (id) on delete set null
);

alter table public.finance_months enable row level security;

comment on table public.finance_months is
  'Finance planner, one row per month: plan (MonthPlan) and actual (MonthActual) from lib/finance.ts.';

-- ── Sanity check ─────────────────────────────────────────────────────────────
-- select * from public.finance_settings;
-- select month, plan, actual from public.finance_months order by month;
