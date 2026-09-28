#!/usr/bin/env node
/**
 * Checks the finance model's arithmetic against numbers worked out by hand.
 *
 *   node --experimental-strip-types scripts/verify-finance.mjs
 *
 * Every expected value below was calculated on paper from the owner's figures
 * (2026-09-28) before this file was run, so a pass means the model agrees with
 * the paper, not with itself.
 */

import {
  DEFAULT_SETTINGS,
  computeFinance,
  defaultPlan,
  seasonMonths,
} from '../src/lib/finance.ts'

let failures = 0
let checks = 0

function near(label, actual, expected) {
  checks++
  if (Math.abs(actual - expected) < 0.01) {
    console.log(`  \x1b[32m✓\x1b[0m ${label}`)
  } else {
    failures++
    console.log(`  \x1b[31m✗\x1b[0m ${label} — expected ${expected}, got ${actual}`)
  }
}

const keys = seasonMonths(DEFAULT_SETTINGS.seasonStart)
const records = (overrides = {}) =>
  Object.fromEntries(
    keys.map((key, i) => [
      key,
      {
        plan: { ...defaultPlan(i), ...(overrides[key] ?? {}) },
        actual: { platform: null, center: null, filming: null, editing: null, salaries: null, other: null },
        note: null,
      },
    ]),
  )

console.log('\nDefaults — October, 50 monthly students, all planned hours')
{
  const { months, plannedHours } = computeFinance(DEFAULT_SETTINGS, records())
  const oct = months[0]
  near('planned hours per month = 41.5', plannedHours.month, 41.5)
  near('monthly package: 50 × 180 × 0.75 = 6,750', oct.revenue.monthly, 6750)
  near('centre: 20 × 4 × (60 − 15 − 5) = 3,200', oct.revenue.center, 3200)
  near('studio: 41.5 h × 100 = 4,150', oct.costs.studio, 4150)
  near('editing: 35.5 h × 200 (reels edited in-house) = 7,100', oct.costs.editing, 7100)
  near('fixed: Gamal 5,000 + other 1,000 = 6,000 (Claude off)', oct.costs.fixedTotal, 6000)
  near('profit: 9,950 − 17,250 = −7,300', oct.profit, -7300)
  near('break-even: ceil(14,050 / 135) = 105 students', oct.breakEven, 105)
  near('cash in: centre only, the platform pays next month', oct.cash.in, 3200)
  near('November cash in: 3,200 + 6,750 from October', months[1].cash.in, 9950)

  const jan = months[3]
  near('January is half a month: 200 × 180 × 0.5 × 0.75 = 13,500', jan.revenue.monthly, 13500)
  near('January centre: 1,600', jan.revenue.center, 1600)
  near('January costs: 2,075 + 3,550 + 6,000 (salaries not halved)', jan.costs.total, 11625)
}

console.log('\nUp-front packages are earned month by month')
{
  const { months } = computeFinance(
    DEFAULT_SETTINGS,
    records({
      '2026-10': { termSubs: 10, yearSubs: 10 },
      '2027-01': { termSubs: 10 },
    }),
  )
  near('term bought in Oct: 3,300 net / 3 = 1,100 in Oct', months[0].revenue.term, 1100)
  near('… and 1,100 in Dec', months[2].revenue.term, 1100)
  near('term bought in Jan: half-weight January earns 660', months[3].revenue.term, 660)
  near('… and March earns 1,320', months[5].revenue.term, 1320)
  near('year: 5,625 net over 5.5 month-weights → Oct 1,022.73', months[0].revenue.year, 1022.7272727)
  near('… January 511.36', months[3].revenue.year, 511.3636364)
  near('nothing earned in the revision months', months[6].revenue.term + months[6].revenue.year, 0)
  near('Nov cash includes the full packages bought in Oct', months[1].cash.in, 3200 + 6750 + 3300 + 5625)
}

console.log('\nOverrides and switches')
{
  const settings = {
    ...DEFAULT_SETTINGS,
    fixed: DEFAULT_SETTINGS.fixed.map((f) => (f.name === 'Claude' ? { ...f, from: '2026-11' } : f)),
  }
  const { months } = computeFinance(settings, records({ '2026-10': { hours: 36 } }))
  near('36 h override: studio 3,600', months[0].costs.studio, 3600)
  near('36 h override: editing in proportion, 36 × 35.5/41.5 × 200', months[0].costs.editing, (36 * 35.5 / 41.5) * 200)
  near('Claude switched on from November: not in October', months[0].costs.fixedTotal, 6000)
  near('… but in November', months[1].costs.fixedTotal, 12000)
  near('revision month with no price: break-even is unknown', months[6].breakEven === null ? 1 : 0, 1)
}

console.log('\nActuals')
{
  const r = records()
  r['2026-10'].actual = { platform: 5000, center: 3000, filming: 3600, editing: 7000, salaries: 5000, other: 900 }
  const { months, totals } = computeFinance(DEFAULT_SETTINGS, r)
  near('actual profit: 8,000 − 16,500 = −8,500', months[0].actual.profit, -8500)
  near('months with no actuals stay empty', months[1].actual === null ? 1 : 0, 1)
  near('totals count one month of actuals', totals.actualMonths, 1)
}

console.log(`\n${checks - failures}/${checks} passed`)
process.exit(failures ? 1 : 0)
