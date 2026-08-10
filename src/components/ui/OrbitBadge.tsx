import { cn } from '@/lib/utils'

/**
 * The rotating seal — the one playful object on the site.
 *
 * A gauge-like ring of ticks revolves slowly around a still centre that
 * carries the promise. The Arabic stays horizontal and set as type: cursive
 * script bent around a circle (SVG textPath) does not shape correctly in
 * browsers, and a promise you cannot read is decoration, not a promise.
 *
 * Placed on the free-content section and nowhere else — repeated anywhere,
 * a seal stops being a stamp and starts being wallpaper.
 */
export function OrbitBadge({ label, title, sub, className }: {
  /** What assistive tech reads. Omit when a nearby heading already says it. */
  label?: string
  /** The big line in the centre, e.g. «١٠٠٪». */
  title: string
  /** The word under it, e.g. «مجاني». */
  sub: string
  className?: string
}) {
  return (
    <div
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const })}
      className={cn('relative h-28 w-28 select-none', className)}
    >
      {/* The revolving instrument ring: a dashed orbit, four diamond
          bearings, and one cyan node — the logo's palette in rotation. */}
      <svg viewBox="0 0 112 112" className="orbit absolute inset-0 h-full w-full" aria-hidden="true">
        <circle
          cx="56"
          cy="56"
          r="46"
          fill="none"
          stroke="#CBA352"
          strokeOpacity="0.55"
          strokeWidth="1.25"
          strokeDasharray="3 7"
        />
        <g fill="#CBA352">
          <rect x="53" y="6" width="6" height="6" transform="rotate(45 56 9)" />
          <rect x="53" y="100" width="6" height="6" transform="rotate(45 56 103)" />
          <rect x="6" y="53" width="6" height="6" transform="rotate(45 9 56)" />
        </g>
        <circle cx="103" cy="56" r="3.5" fill="#48C8D5" />
      </svg>

      {/* The still centre: the promise, readable. */}
      <span className="absolute inset-3 grid place-items-center rounded-full border border-gold/30 bg-navy-deep/90">
        <span className="text-center leading-none">
          <span className="block text-xl font-black text-gold">{title}</span>
          <span className="mt-1 block text-[11px] font-bold tracking-wide text-ink-muted">
            {sub}
          </span>
        </span>
      </span>
    </div>
  )
}
