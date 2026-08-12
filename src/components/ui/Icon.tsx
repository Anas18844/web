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

  // ── نظام الشرح ─────────────────────────────────────────────────────────────
  /** Per-session quiz — a marked answer sheet. */
  quiz: (
    <>
      <path d="M6 3h12v18H6z" />
      <path d="m9 9 1.6 1.6L14 7" />
      <path d="M9 15h6" />
    </>
  ),
  /** The named supervisor — a person with a tick. */
  mentor: (
    <>
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3.5 20c0-3.6 2.9-6.5 6.5-6.5 1 0 2 .2 2.8.6" />
      <path d="m15 17 2 2 4-4" />
    </>
  ),
  /** Question-by-question correction — a pen on a line of marks. */
  pen: (
    <>
      <path d="M4 20h4L20 8l-4-4L4 16v4Z" />
      <path d="m14 6 4 4" />
    </>
  ),
  /** MCQ + essay formats — two answer shapes side by side. */
  formats: (
    <>
      <path d="M4 5h6v6H4zM14 5h6v6h-6z" />
      <path d="m5.5 8 1.2 1.2L9 7" />
      <path d="M4 16h16M4 20h10" />
    </>
  ),
  /** Levels — stacked plates, the top one lit. */
  layers: (
    <>
      <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" />
      <path d="m3 12 9 4.5 9-4.5" />
      <path d="m3 16.5 9 4.5 9-4.5" />
    </>
  ),
  /** Three support lines — a shield with a pulse through it. */
  shield: (
    <>
      <path d="M12 3 4.5 6v6c0 4.2 3.1 7.6 7.5 9 4.4-1.4 7.5-4.8 7.5-9V6L12 3Z" />
      <path d="M8 12h2l1.5-2.5L13 14l1-2h2" />
    </>
  ),

  // ── التحضير ────────────────────────────────────────────────────────────────
  /** Foreign sources — a globe with a meridian. */
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.6 2.8 2.6 15.2 0 18-2.6-2.8-2.6-15.2 0-18Z" />
    </>
  ),
  /** Arabising it — two scripts meeting. */
  translate: (
    <>
      <path d="M3 6h9M7.5 6v2c0 3-2 5-4.5 6" />
      <path d="M6 11c1.5 2 3.5 3.2 6 3.6" />
      <path d="m13 21 4-10 4 10" />
      <path d="M14.6 17.5h4.8" />
    </>
  ),
  /** Adding our own work — a wrench over the material. */
  wrench: (
    <>
      <path d="M15.5 3.5a5 5 0 0 0-4.6 6.9L3 18.3 5.7 21l7.9-7.9a5 5 0 0 0 6.9-4.6l-3.1 3.1-2.9-.5-.5-2.9 3.1-3.1Z" />
    </>
  ),
  /** Rehearsed before it ships — a play button inside a frame. */
  rehearse: (
    <>
      <rect x="3" y="4" width="18" height="16" />
      <path d="M10 9.5v5l4.5-2.5L10 9.5Z" />
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
