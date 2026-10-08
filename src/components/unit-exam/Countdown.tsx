'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toArabicDigits } from '@/lib/arabic'

/**
 * Counts down to the exam opening.
 *
 * The student's clock is not trusted: the page is rendered with the SERVER's
 * time, and the difference from the device clock is measured once on load and
 * applied to every tick. A phone set an hour ahead still sees the real
 * countdown. When it reaches zero the page is re-rendered on the server, which
 * is what actually decides whether the exam is open.
 */
export function Countdown({ target, serverNow }: { target: number; serverNow: number }) {
  const router = useRouter()
  const [left, setLeft] = useState(() => Math.max(0, target - serverNow))

  useEffect(() => {
    const offset = serverNow - Date.now()
    let refreshed = false
    const tick = () => {
      const ms = Math.max(0, target - (Date.now() + offset))
      setLeft(ms)
      if (ms === 0 && !refreshed) {
        refreshed = true
        router.refresh()
      }
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [target, serverNow, router])

  const total = Math.floor(left / 1000)
  const parts = [
    { label: 'يوم', value: Math.floor(total / 86400) },
    { label: 'ساعة', value: Math.floor((total % 86400) / 3600) },
    { label: 'دقيقة', value: Math.floor((total % 3600) / 60) },
    { label: 'ثانية', value: total % 60 },
  ]

  if (left === 0) {
    return (
      <p role="status" className="text-center text-lg font-extrabold text-gold">
        الامتحان بيفتح دلوقتي…
      </p>
    )
  }

  return (
    <div role="timer" aria-live="off" className="grid grid-cols-4 gap-2 sm:gap-3" dir="rtl">
      {parts.map((p) => (
        <div
          key={p.label}
          className="rounded border border-navy-line bg-navy-soft px-1 py-3 text-center sm:py-4"
        >
          <div className="text-3xl font-extrabold tabular-nums text-ink sm:text-5xl">
            {toArabicDigits(String(p.value).padStart(2, '0'))}
          </div>
          <div className="mt-1 text-xs font-bold text-ink-muted sm:text-sm">{p.label}</div>
        </div>
      ))}
    </div>
  )
}
