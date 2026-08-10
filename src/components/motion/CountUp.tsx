'use client'

import { useEffect, useRef } from 'react'
import { toArabicDigits } from '@/lib/arabic'

/**
 * A number that counts itself up when it scrolls into view.
 *
 * The founder's numbers are the trust spine of the site; watching «٢٠+» tick
 * up from zero makes the eye stop on exactly the fact we want weighed.
 *
 * Deliberately NOT built on the motion library: a one-way count needs an
 * easing curve, not a physics engine, and importing the full `animate` here
 * would ship motion's core a second time just for this. One rAF loop drives
 * one text node directly — no React re-render per frame — and runs once.
 *
 * The value renders in full in the initial HTML (SEO, no-JS, reduced motion
 * all see the real number); the zeroing happens only on the client right
 * before the count begins.
 */

/** The same curve as --ease-trace, so digits and reveals decelerate together. */
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const DURATION = 1100

export function CountUp({
  value,
  prefix = '',
  suffix = '',
  className,
}: {
  value: number
  /** Rendered before/after the digits, e.g. «+» or « منتج». */
  prefix?: string
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (typeof IntersectionObserver === 'undefined') return

    let frame = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()

        const start = performance.now()
        const tick = (now: number) => {
          const progress = easeOutExpo(Math.min(1, (now - start) / DURATION))
          node.textContent = toArabicDigits(Math.round(progress * value))
          if (progress < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.6 },
    )

    observer.observe(node)
    return () => {
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [value])

  return (
    <span className={className}>
      {prefix}
      <span ref={ref}>{toArabicDigits(value)}</span>
      {suffix}
    </span>
  )
}
