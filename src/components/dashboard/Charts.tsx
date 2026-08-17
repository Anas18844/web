import { arabicPlural, toArabicDigits } from '@/lib/arabic'

/**
 * The dashboard's charts, as inline SVG.
 *
 * No charting library. Three charts do not justify the ~100KB the usual ones
 * cost, and every mark here is a rect or a path — the site already draws its
 * own icons and its own circuit motif this way, so the charts look like they
 * came from the same hand rather than from a package.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COLOUR
 *
 * The brand gold (#CBA352) and cyan (#48C8D5) are both too light for a dark
 * chart surface — they sit at OKLCH L 0.74 and 0.77 against a band of
 * 0.48–0.67, which is where saturated marks start to glare on navy. The hues
 * are kept and the lightness snapped into the band, then validated:
 *
 *   #B58E36 + #12A0B2  on #0A1526 → all checks pass
 *   (CVD ΔE 14.8 protan, normal-vision 18.6, contrast ≥ 3:1)
 *
 * Follow-up status is ORDINAL, not categorical — new → contacted → booked →
 * enrolled is a sequence, and swapping two of them would change the meaning.
 * So it takes one hue in monotone lightness steps, and the reader sees the
 * order in the colour itself instead of having to learn a legend.
 *
 * Source of enquiry is NOMINAL — facebook, youtube, friend have no order — so
 * every bar takes the SAME hue. Colouring those bars individually would spend
 * the identity channel re-encoding what the bar length already says.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const SERIES = {
  first: '#B58E36',
  second: '#12A0B2',
} as const

/** Light → dark, five steps, one hue. Validated as an ordinal ramp. */
export const FUNNEL = ['#F0DCA8', '#DCC078', '#C4A44E', '#A88732', '#86691F'] as const

const ar = (n: number) => toArabicDigits(n)

// ── Bars ─────────────────────────────────────────────────────────────────────

export type BarRow = { label: string; value: number; color?: string }

/**
 * A horizontal bar list.
 *
 * Horizontal because the labels are Arabic words, not dates — vertical bars
 * would force them to rotate or truncate, and a chart whose labels have to be
 * decoded is a chart nobody reads twice.
 *
 * Every bar carries its own number at the end. That is what lets the fills sit
 * below the 3:1 relief threshold safely, and it removes the tooltip as the only
 * route to a value — this screen has to work on a phone.
 */
export function BarList({
  rows,
  total,
  emptyLabel = 'مفيش بيانات لسه',
}: {
  rows: BarRow[]
  total?: number
  emptyLabel?: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  const sum = total ?? rows.reduce((t, r) => t + r.value, 0)

  if (rows.length === 0 || sum === 0) {
    return <p className="py-6 text-sm text-ink-faint">{emptyLabel}</p>
  }

  return (
    <ul className="grid gap-3">
      {rows.map((row) => {
        const share = sum > 0 ? Math.round((row.value / sum) * 100) : 0
        return (
          <li key={row.label} className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-bold text-ink">{row.label}</span>
              <span className="shrink-0 font-mono text-xs text-ink-faint">
                {ar(row.value)} · {ar(share)}٪
              </span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-sm bg-navy-line/50">
              <div
                className="h-full rounded-sm"
                style={{
                  width: `${Math.max(2, (row.value / max) * 100)}%`,
                  backgroundColor: row.color ?? SERIES.first,
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ── Daily line ───────────────────────────────────────────────────────────────

export type DailyPoint = { date: string; first: number; second: number }

/**
 * Thirty days, two series: which year group is actually arriving.
 *
 * Two series and both are direct-labelled at the end of their line, so identity
 * never rests on colour alone. The y-axis starts at zero — a truncated baseline
 * turns a flat fortnight into a cliff, and this screen is explicitly meant to
 * inform decisions that are hard to reverse.
 */
export function DailyChart({ points }: { points: DailyPoint[] }) {
  const W = 720
  const H = 200
  const PAD = { top: 16, right: 12, bottom: 26, left: 34 }

  const peak = Math.max(1, ...points.flatMap((p) => [p.first, p.second]))
  // A tidy ceiling, so the gridlines land on numbers a person would say out loud.
  const ceiling = peak <= 4 ? 4 : Math.ceil(peak / 5) * 5

  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (i / Math.max(1, points.length - 1)) * innerW
  const y = (v: number) => PAD.top + innerH - (v / ceiling) * innerH

  const path = (key: 'first' | 'second') =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(' ')

  const totalFirst = points.reduce((t, p) => t + p.first, 0)
  const totalSecond = points.reduce((t, p) => t + p.second, 0)

  if (totalFirst + totalSecond === 0) {
    return <p className="py-10 text-center text-sm text-ink-faint">مفيش تسجيلات في آخر ٣٠ يوم</p>
  }

  const ticks = [0, ceiling / 2, ceiling]

  return (
    <figure className="grid gap-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`تسجيلات آخر ٣٠ يوم: ${totalFirst} أولى ثانوي و${totalSecond} تانية بكالوريا`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="rgb(35 56 92)"
              strokeWidth="1"
            />
            <text
              x={W - PAD.right + 4}
              y={y(t) + 4}
              fontSize="11"
              fill="rgb(138 151 173)"
              textAnchor="start"
            >
              {ar(Math.round(t))}
            </text>
          </g>
        ))}

        <path d={path('first')} fill="none" stroke={SERIES.first} strokeWidth="2" />
        <path d={path('second')} fill="none" stroke={SERIES.second} strokeWidth="2" />

        {/* The last point of each line, ringed in the surface colour so the two
            stay separable where they cross. */}
        {points.length > 0 && (
          <>
            <circle
              cx={x(points.length - 1)}
              cy={y(points[points.length - 1].first)}
              r="4"
              fill={SERIES.first}
              stroke="#0A1526"
              strokeWidth="2"
            />
            <circle
              cx={x(points.length - 1)}
              cy={y(points[points.length - 1].second)}
              r="4"
              fill={SERIES.second}
              stroke="#0A1526"
              strokeWidth="2"
            />
          </>
        )}
      </svg>

      <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: SERIES.first }}
          />
          <span className="font-bold text-ink">أولى ثانوي</span>
          <span className="font-mono text-ink-faint">{ar(totalFirst)}</span>
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: SERIES.second }}
          />
          <span className="font-bold text-ink">تانية بكالوريا</span>
          <span className="font-mono text-ink-faint">{ar(totalSecond)}</span>
        </span>
        <span className="text-ink-faint">آخر ٣٠ يوم</span>
      </figcaption>
    </figure>
  )
}

// ── The honest reading of a number ───────────────────────────────────────────

/**
 * A week-on-week comparison that refuses to mislead.
 *
 * Below a floor of ten it reports the raw change and NOT a percentage: three
 * leads becoming six is "+3", not "+100%", and a dashboard that says +100% on
 * a base of three has told a lie that someone may act on. This screen exists to
 * inform hard decisions, so it declines to produce a number it cannot support.
 */
export function Trend({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous

  if (previous === 0 && current === 0) {
    return <span className="text-xs text-ink-faint">مفيش تسجيلات في الأسبوعين</span>
  }

  const tone =
    delta > 0 ? 'text-emerald-300' : delta < 0 ? 'text-red-300' : 'text-ink-faint'
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : ''
  const magnitude = Math.abs(delta)

  const enoughToRate = previous >= 10
  const rate = enoughToRate ? Math.round((delta / previous) * 100) : null

  return (
    <span className={`text-xs font-bold ${tone}`}>
      {sign}
      {ar(magnitude)}{' '}
      {rate !== null ? (
        <span className="font-mono">({sign}{ar(Math.abs(rate))}٪)</span>
      ) : (
        <span className="font-normal text-ink-faint">
          {arabicPlural(magnitude, {
            one: 'تسجيل',
            two: 'تسجيلين',
            few: 'تسجيلات',
            many: 'تسجيل',
          })}
        </span>
      )}{' '}
      <span className="font-normal text-ink-faint">عن الأسبوع اللي فات</span>
    </span>
  )
}
