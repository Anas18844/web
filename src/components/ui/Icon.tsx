import { cn } from '@/lib/utils'

/**
 * The site's icon set — drawn here, not imported.
 *
 * Eleven stroke icons on a 24px grid, 1.75 stroke, square caps to match the
 * angular brand geometry. An icon library would bring hundreds of rounded
 * glyphs drawn for someone else's brand; these are drawn for this one, and
 * they render inline as part of the server HTML at zero JS cost.
 */

export type IconName = keyof typeof PATHS

const PATHS = {
  /** Audience: school student — an open book with a spine. */
  book: (
    <>
      <path d="M12 6c-2-1.6-4.6-2-8-2v14c3.4 0 6 .4 8 2 2-1.6 4.6-2 8-2V4c-3.4 0-6 .4-8 2Z" />
      <path d="M12 6v14" />
    </>
  ),
  /** Audience: track student — a path that branches. */
  branch: (
    <>
      <path d="M5 20V10c0-3 2-5 5-5h9" />
      <path d="m15 1 4 4-4 4" />
      <path d="M5 20h14" />
      <circle cx="5" cy="20" r="1.6" />
    </>
  ),
  /** Audience: university — columns under a pediment. */
  university: (
    <>
      <path d="m12 3 9 5H3l9-5Z" />
      <path d="M5 8v9M10 8v9M14 8v9M19 8v9" />
      <path d="M3 20h18" />
    </>
  ),
  /** Audience: self-learner — a compass needle. */
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2.2 5-4.8 2 2.2-5 4.8-2Z" />
    </>
  ),
  /** System: the lesson — a blackboard with a chalk line. */
  board: (
    <>
      <rect x="3" y="4" width="18" height="13" />
      <path d="M7 9h7M7 12h4" />
      <path d="m9 21 3-4 3 4" />
    </>
  ),
  /** System: the platform — a terminal running code. */
  terminal: (
    <>
      <rect x="3" y="4" width="18" height="16" />
      <path d="m8 9 3 3-3 3" />
      <path d="M13 15h4" />
    </>
  ),
  /** System: follow-up — a rising chart. */
  chart: (
    <>
      <path d="M4 4v16h16" />
      <path d="m7 14 4-4 3 3 5-6" />
      <circle cx="19" cy="7" r="1.4" />
    </>
  ),
  /** Free items — a solid check in a cut square. */
  check: (
    <>
      <path d="M4 4h16v16H4z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  /** Knowledge — a spark / new idea. */
  spark: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="m6.5 6.5 2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5" />
    </>
  ),
  /** Play — for anything that leads to video content. */
  play: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5v7l6-3.5-6-3.5Z" />
    </>
  ),
  /** WhatsApp-adjacent contact — a speech square with a pulse. */
  message: (
    <>
      <path d="M4 4h16v13H9l-5 4V4Z" />
      <path d="M8 10h8" />
    </>
  ),
} as const

export function Icon({
  name,
  className,
  size = 24,
}: {
  name: IconName
  className?: string
  size?: number
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      {PATHS[name]}
    </svg>
  )
}

/**
 * The standard framing for an icon on a card: a cut-corner plate that echoes
 * the angular logo geometry, with the trace-gold glyph on it.
 */
export function IconPlate({ name, className }: { name: IconName; className?: string }) {
  return (
    <span
      className={cn(
        'relative grid h-12 w-12 shrink-0 place-items-center border border-gold/30 bg-gold/[0.07] text-gold',
        'transition-[border-color,background-color] duration-200',
        className,
      )}
    >
      {/* The clipped corner — one gold triangle, top-start. */}
      <span
        aria-hidden="true"
        className="absolute -start-px -top-px border-b-[10px] border-s-[10px] border-b-transparent border-s-gold/60"
      />
      <Icon name={name} size={22} />
    </span>
  )
}
