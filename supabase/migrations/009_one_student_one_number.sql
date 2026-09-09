-- ═══════════════════════════════════════════════════════════════════════════
-- 009 — one student, one number.
--
-- The application already refuses a phone it has seen before, and that check is
-- worth having because it produces a sentence a student can act on. But it is
-- not a guarantee: two requests can both run the SELECT, both find nothing, and
-- both INSERT. On a launch night, with a student double-tapping a slow button,
-- that is not a hypothetical.
--
-- This is the guarantee. The index does not care how many requests are in
-- flight, which code path they came from, or whether someone writes a new one
-- next month and forgets the check.
--
-- Verified before applying: 22 rows, 22 distinct phones, every one canonical.
-- Nothing needed cleaning, so this index applies without touching data.
-- ═══════════════════════════════════════════════════════════════════════════

create unique index if not exists leads_phone_key on public.leads (phone);

-- ── And the format the index depends on ────────────────────────────────────
-- A unique index on a free-text column is only as good as the text going in:
-- 01000755376, +201000755376 and 0100 075 5376 are one student and three
-- distinct strings. Every write path normalises through normalizePhone() today
-- — the public form, the no-JS post, the recovery path and the dashboard — so
-- this constraint costs nothing now. It exists for the path someone adds later
-- without knowing that rule, which would otherwise silently reopen the door
-- this migration closes.
alter table public.leads drop constraint if exists leads_phone_canonical;
alter table public.leads add constraint leads_phone_canonical
  check (phone ~ '^01[0125][0-9]{8}$');

comment on index public.leads_phone_key is
  'One student, one number. The app returns a friendly message first; this is what makes it true under concurrency.';
