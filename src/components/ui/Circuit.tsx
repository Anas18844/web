import { cn } from '@/lib/utils'

/**
 * The brand's circuit motif as a living ornament.
 *
 * The hero artwork carries these traces as a static image; this component
 * draws them as real SVG so they can animate. Inside any `data-reveal` block
 * the lines draw themselves as the section arrives (`.circuit-path` +
 * `pathLength=1`, driven from globals.css) and the node dots pop in when the
 * current reaches them. Runs once, then holds.
 *
 * Server component — the animation is pure CSS.
 */
export function Circuit({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      aria-hidden="true"
      className={cn('pointer-events-none', flip && '-scale-x-100', className)}
    >
      <g stroke="#CBA352" strokeWidth="1.5">
        <path className="circuit-path" pathLength={1} d="M8 210 8 120 60 68 60 24" />
        <path className="circuit-path" pathLength={1} d="M48 210 48 140 108 80 108 56" />
        <path className="circuit-path" pathLength={1} d="M88 210 88 160 150 98 150 12" />
        <path className="circuit-path" pathLength={1} d="M128 210v-34l70-70V64" />
        <path className="circuit-path" pathLength={1} d="M168 210v-22l84-84" />
      </g>
      <g stroke="#48C8D5" strokeWidth="2">
        <path className="circuit-path" pathLength={1} d="M208 210v-46l96-96" />
      </g>

      {/*
        Current, once the board is drawn. Two traces carry a pulse, not six —
        the motif should look powered, not like a fairground. They are separate
        paths laid exactly over the ones above, so the trace keeps its own
        steady colour and only the bright head moves.

        The delays are longer than they look because `.circuit-pulse` starts
        counting from the reveal, and the draw-in takes 1.6s before there is
        anything to run current through.
      */}
      <g fill="none" strokeLinecap="round">
        <path
          className="circuit-pulse"
          pathLength={1}
          stroke="#48C8D5"
          strokeWidth="3"
          style={{ '--pulse-delay': '1.7s' } as React.CSSProperties}
          d="M208 210v-46l96-96"
        />
        <path
          className="circuit-pulse"
          pathLength={1}
          stroke="#F0DCA8"
          strokeWidth="2.5"
          style={{ '--pulse-delay': '2.9s' } as React.CSSProperties}
          d="M88 210 88 160 150 98 150 12"
        />
      </g>
      <g fill="#CBA352">
        <circle className="circuit-node" cx="60" cy="24" r="4" />
        <circle className="circuit-node" cx="108" cy="56" r="4" />
        <circle className="circuit-node" cx="150" cy="12" r="4" />
        <circle className="circuit-node" cx="198" cy="64" r="4" />
        <circle className="circuit-node" cx="252" cy="106" r="4" />
      </g>
      <circle className="circuit-node" cx="304" cy="68" r="5" fill="#48C8D5" />
    </svg>
  )
}
