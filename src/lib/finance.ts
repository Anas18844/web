/**
 * The finance model — every number on /dashboard/finance comes out of here.
 *
 * Pure on purpose: no imports, no database, no Next. The page hands it the
 * assumptions and the month records, and it hands back a table. That is what
 * lets scripts/verify-finance.mjs check the arithmetic in a plain Node process,
 * and a model that decides prices deserves to have its arithmetic checked.
 *
 * The season, as the owner runs it:
 *
 *   month 0–2   first term   (Oct, Nov, Dec)
 *   month 3–5   second term  (Jan, Feb, Mar) — January has a 15-day break
 *   month 6–8   revision     (the revision package, price not decided yet)
 *
 * A year package covers months 0–5. A term package covers the term it was
 * bought in. Both are paid up front but EARNED month by month, so the profit
 * row does not show October as a fortune and March as a disaster. The cash
 * rows show the other side: when the money actually arrives.
 *
 * Two kinds of month weight live in one number. `weights['2027-01'] = 0.5`
 * halves January's monthly-package revenue, its centre sessions and its filming
 * — the break is real for all three. Salaries and subscriptions are NOT
 * weighted: they are owed for the month whether or not anyone is filming.
 */

export const TERM_MONTHS = 3
export const YEAR_MONTHS = 6
export const SEASON_MONTHS = 9

const MONTH_NAMES = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

export type HoursItem = {
  name: string
  /** Hours per month at full weight. */
  hours: number
  /** Paid studio time. False for anything filmed at home. */
  studio: boolean
  /** Edited by the paid editor. False for anything edited in-house. */
  editing: boolean
}

export type FixedCost = {
  name: string
  amount: number
  /** First month it is owed ('YYYY-MM'), or null while it is switched off. */
  from: string | null
}

export type FinanceSettings = {
  seasonStart: string
  prices: { month: number; term: number; year: number; revision: number | null }
  /** The platform's cut of every package, 0–1. */
  platformShare: number
  center: {
    price: number
    rent: number
    booklet: number
    assistant: number
    sessionsPerMonth: number
  }
  rates: { studio: number; editing: number }
  hours: HoursItem[]
  fixed: FixedCost[]
  weights: Record<string, number>
}

export type MonthPlan = {
  /** Students on the monthly package this month. */
  monthlySubs: number
  /** Term packages BOUGHT this month. */
  termSubs: number
  /** Year packages BOUGHT this month. */
  yearSubs: number
  /** Students on the revision package this month. */
  revisionSubs: number
  centerStudents: number
  /** Filming hours this month, replacing the planned total. null = the plan. */
  hours: number | null
}

export type MonthActual = {
  platform: number | null
  center: number | null
  filming: number | null
  editing: number | null
  salaries: number | null
  other: number | null
}

export type MonthRecord = { plan: MonthPlan; actual: MonthActual; note: string | null }

export type Phase = 'term1' | 'term2' | 'revision'

export type MonthResult = {
  key: string
  label: string
  phase: Phase
  weight: number
  revenue: {
    monthly: number
    term: number
    year: number
    revision: number
    center: number
    total: number
  }
  hours: { total: number; studio: number; editing: number }
  costs: {
    studio: number
    editing: number
    fixed: { name: string; amount: number }[]
    fixedTotal: number
    total: number
  }
  profit: number
  cumulative: number
  /** Monthly-package students needed to break even, or null if there is no package to sell. */
  breakEven: number | null
  cash: { in: number; out: number; balance: number }
  actual: { revenue: number; costs: number; profit: number } | null
  /** Revision students were planned but the revision price is not set yet. */
  revisionPriceMissing: boolean
}

export type FinanceResult = {
  months: MonthResult[]
  totals: {
    revenue: number
    costs: number
    profit: number
    actualRevenue: number
    actualCosts: number
    actualProfit: number
    actualMonths: number
  }
  /** Planned filming hours per month at full weight, and per week. */
  plannedHours: { month: number; week: number }
}

// ── Months ───────────────────────────────────────────────────────────────────

export function addMonths(key: string, n: number): string {
  const [y, m] = key.split('-').map(Number)
  const index = y * 12 + (m - 1) + n
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

export function seasonMonths(start: string): string[] {
  return Array.from({ length: SEASON_MONTHS }, (_, i) => addMonths(start, i))
}

export function phaseOf(index: number): Phase {
  if (index < TERM_MONTHS) return 'term1'
  if (index < YEAR_MONTHS) return 'term2'
  return 'revision'
}

export const PHASE_LABELS: Record<Phase, string> = {
  term1: 'الترم الأول',
  term2: 'الترم التاني',
  revision: 'المراجعات',
}

// ── Defaults: the numbers the owner gave on 2026-09-28 ───────────────────────

export const DEFAULT_SETTINGS: FinanceSettings = {
  seasonStart: '2026-10',
  prices: { month: 180, term: 440, year: 750, revision: null },
  platformShare: 0.25,
  center: { price: 60, rent: 15, booklet: 5, assistant: 0, sessionsPerMonth: 4 },
  rates: { studio: 100, editing: 200 },
  hours: [
    { name: 'محاضرات الشرح (٤ × ٢ ساعة)', hours: 8, studio: true, editing: true },
    { name: 'حل الواجب (٤ × ١.٥ ساعة)', hours: 6, studio: true, editing: true },
    { name: 'ورشة الحل', hours: 3, studio: true, editing: true },
    { name: 'المراجعة الشهرية', hours: 5, studio: true, editing: true },
    { name: 'كيريو والتقييمات', hours: 6, studio: true, editing: true },
    { name: 'أولى ثانوي', hours: 6, studio: true, editing: true },
    { name: 'حل الامتحان الشامل', hours: 1.5, studio: true, editing: true },
    { name: 'الريلز (جمال بيمنتجها)', hours: 6, studio: true, editing: false },
  ],
  fixed: [
    { name: 'جمال', amount: 5000, from: '2026-10' },
    { name: 'مصاريف ثابتة تانية', amount: 1000, from: '2026-10' },
    { name: 'Claude', amount: 6000, from: null },
    { name: 'مصمم', amount: 0, from: null },
    { name: 'مساعد', amount: 0, from: null },
  ],
  weights: { '2027-01': 0.5 },
}

export const EMPTY_ACTUAL: MonthActual = {
  platform: null,
  center: null,
  filming: null,
  editing: null,
  salaries: null,
  other: null,
}

/** The pessimistic start the owner gave, climbing to the three-month target. */
const DEFAULT_MONTHLY_SUBS = [50, 100, 200, 200, 200, 200, 0, 0, 0]

export function defaultPlan(index: number): MonthPlan {
  return {
    monthlySubs: DEFAULT_MONTHLY_SUBS[index] ?? 0,
    termSubs: 0,
    yearSubs: 0,
    revisionSubs: 0,
    centerStudents: index < YEAR_MONTHS ? 20 : 0,
    hours: null,
  }
}

// ── The model ────────────────────────────────────────────────────────────────

export function computeFinance(
  settings: FinanceSettings,
  records: Record<string, MonthRecord | undefined>,
): FinanceResult {
  const keys = seasonMonths(settings.seasonStart)
  const net = 1 - settings.platformShare
  const weight = (key: string) => settings.weights[key] ?? 1
  const weights = keys.map(weight)
  const plans = keys.map((key, i) => records[key]?.plan ?? defaultPlan(i))

  // Up-front packages, spread over the months they pay for, in proportion to
  // each month's weight — a half January earns half a month of a term.
  const termEarned = new Array<number>(SEASON_MONTHS).fill(0)
  const yearEarned = new Array<number>(SEASON_MONTHS).fill(0)
  const spread = (target: number[], from: number, to: number, amount: number) => {
    const total = weights.slice(from, to).reduce((a, b) => a + b, 0)
    if (total <= 0) return
    for (let i = from; i < to; i++) target[i] += (amount * weights[i]) / total
  }
  plans.forEach((plan, i) => {
    if (i < YEAR_MONTHS && plan.termSubs > 0) {
      const termEnd = i < TERM_MONTHS ? TERM_MONTHS : YEAR_MONTHS
      spread(termEarned, i, termEnd, plan.termSubs * settings.prices.term * net)
    }
    if (i < YEAR_MONTHS && plan.yearSubs > 0) {
      spread(yearEarned, i, YEAR_MONTHS, plan.yearSubs * settings.prices.year * net)
    }
  })

  const planTotal = settings.hours.reduce((a, h) => a + h.hours, 0)
  const planStudio = settings.hours.reduce((a, h) => a + (h.studio ? h.hours : 0), 0)
  const planEditing = settings.hours.reduce((a, h) => a + (h.editing ? h.hours : 0), 0)

  const centerNet =
    settings.center.price - settings.center.rent - settings.center.booklet - settings.center.assistant

  let cumulative = 0
  let balance = 0
  let previousCollections = 0

  const months = keys.map((key, i): MonthResult => {
    const plan = plans[i]
    const w = weights[i]
    const phase = phaseOf(i)
    const revisionPrice = settings.prices.revision

    const monthly = plan.monthlySubs * settings.prices.month * w * net
    const revision = plan.revisionSubs * (revisionPrice ?? 0) * w * net
    const center = plan.centerStudents * settings.center.sessionsPerMonth * w * centerNet
    const total = monthly + termEarned[i] + yearEarned[i] + revision + center

    const hoursTotal = plan.hours ?? planTotal * w
    const share = (part: number) => (planTotal > 0 ? (hoursTotal * part) / planTotal : 0)
    const studioHours = share(planStudio)
    const editingHours = share(planEditing)

    const fixed = settings.fixed
      .filter((f) => f.from !== null && f.from <= key && f.amount > 0)
      .map((f) => ({ name: f.name, amount: f.amount }))
    const fixedTotal = fixed.reduce((a, f) => a + f.amount, 0)
    const studio = studioHours * settings.rates.studio
    const editing = editingHours * settings.rates.editing
    const costs = studio + editing + fixedTotal

    const profit = total - costs
    cumulative += profit

    // What one more student on the month's own package is worth.
    const perStudent =
      phase === 'revision'
        ? (revisionPrice ?? 0) * w * net
        : settings.prices.month * w * net
    const otherRevenue = total - (phase === 'revision' ? revision : monthly)
    const breakEven =
      perStudent > 0 ? Math.max(0, Math.ceil((costs - otherRevenue) / perStudent)) : null

    // The platform pays out on the 5th of the following month; the centre
    // pays on the day.
    const collections =
      plan.monthlySubs * settings.prices.month * w +
      (i < YEAR_MONTHS ? plan.termSubs * settings.prices.term : 0) +
      (i < YEAR_MONTHS ? plan.yearSubs * settings.prices.year : 0) +
      plan.revisionSubs * (revisionPrice ?? 0) * w
    const cashIn = center + previousCollections * net
    previousCollections = collections
    balance += cashIn - costs

    const a = records[key]?.actual ?? EMPTY_ACTUAL
    const values = Object.values(a)
    const actual = values.some((v) => v !== null)
      ? (() => {
          const revenue = (a.platform ?? 0) + (a.center ?? 0)
          const spent = (a.filming ?? 0) + (a.editing ?? 0) + (a.salaries ?? 0) + (a.other ?? 0)
          return { revenue, costs: spent, profit: revenue - spent }
        })()
      : null

    return {
      key,
      label: monthLabel(key),
      phase,
      weight: w,
      revenue: {
        monthly,
        term: termEarned[i],
        year: yearEarned[i],
        revision,
        center,
        total,
      },
      hours: { total: hoursTotal, studio: studioHours, editing: editingHours },
      costs: { studio, editing, fixed, fixedTotal, total: costs },
      profit,
      cumulative,
      breakEven,
      cash: { in: cashIn, out: costs, balance },
      actual,
      revisionPriceMissing: plan.revisionSubs > 0 && revisionPrice === null,
    }
  })

  const sum = (pick: (m: MonthResult) => number) => months.reduce((a, m) => a + pick(m), 0)
  const withActual = months.filter((m) => m.actual)

  return {
    months,
    totals: {
      revenue: sum((m) => m.revenue.total),
      costs: sum((m) => m.costs.total),
      profit: sum((m) => m.profit),
      actualRevenue: withActual.reduce((a, m) => a + m.actual!.revenue, 0),
      actualCosts: withActual.reduce((a, m) => a + m.actual!.costs, 0),
      actualProfit: withActual.reduce((a, m) => a + m.actual!.profit, 0),
      actualMonths: withActual.length,
    },
    plannedHours: { month: planTotal, week: planTotal / 4 },
  }
}
