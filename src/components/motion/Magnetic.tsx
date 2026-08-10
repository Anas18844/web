'use client'

import { useRef } from 'react'
import { LazyMotion, domAnimation, m, useSpring, useReducedMotion } from 'motion/react'

/**
 * Magnetic hover — the one interaction on the site that genuinely needs a
 * physics engine, and therefore the one place the motion library runs.
 *
 * The wrapped element leans toward the cursor on a critically-damped spring
 * and snaps home when the pointer leaves. CSS cannot express "follow the
 * cursor with mass and settle" — this is spring physics driven per-frame,
 * which is exactly what motion is for.
 *
 * SSR-safe by construction: the resting state is zero translation, so the
 * server renders the plain element and hydration changes nothing visible.
 * On touch there is no pointer to follow and the handlers simply never fire;
 * under reduced motion they are not attached at all.
 */
const spring = { stiffness: 320, damping: 24, mass: 0.6 }

export function Magnetic({
  children,
  strength = 0.22,
  className,
}: {
  children: React.ReactNode
  /** How far the element leans, as a fraction of the cursor's offset. */
  strength?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const still = useReducedMotion()

  const x = useSpring(0, spring)
  const y = useSpring(0, spring)

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse') return
    const rect = el.getBoundingClientRect()
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength)
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength)
  }

  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        ref={ref}
        className={className}
        style={{ x, y, display: 'inline-block' }}
        onPointerMove={still ? undefined : onMove}
        onPointerLeave={still ? undefined : onLeave}
      >
        {children}
      </m.div>
    </LazyMotion>
  )
}
