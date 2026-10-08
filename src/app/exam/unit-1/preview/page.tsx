import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ExamRoom } from '@/components/unit-exam/ExamRoom'
import type { PublicUnitExam } from '@/components/unit-exam/types'
import { UNIT_EXAM } from '@/content/unit-exam'

/**
 * A local preview of the exam room — the owner's machine only.
 *
 * ⚠️ Returns 404 in production. The questions file lives in `.private/`, which
 * git ignores: this repository is public, and the paper must not be readable
 * before the exam opens. In production the paper comes from /api/unit-exam/start
 * once a student has entered (next step of the plan).
 *
 * The two hours start the first time the preview is opened on a device and are
 * kept in that device's storage, exactly like a real attempt would be.
 */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'معاينة الامتحان الشامل', robots: { index: false, follow: false } }

export default async function UnitExamPreview({
  searchParams,
}: {
  searchParams: Promise<{ fresh?: string; left?: string; from?: string }>
}) {
  if (process.env.NODE_ENV === 'production') notFound()

  let exam: PublicUnitExam
  try {
    const file = path.join(process.cwd(), '.private', 'unit-1-exam.public.json')
    exam = JSON.parse(await readFile(file, 'utf-8')) as PublicUnitExam
  } catch {
    return (
      <p className="p-10 text-center text-ink">
        ملف الأسئلة مش موجود. شغّل <code>python make-exam-web.py</code> في mr-anas-hq الأول.
      </p>
    )
  }

  const q = await searchParams
  const now = Date.now()
  // ?left=6 → a preview that ends in 6 minutes, to see the warnings and the lock quickly.
  const minutes = Number(q.left) > 0 ? Number(q.left) : UNIT_EXAM.minutes
  // ?from=31 → start the page at question 31, to review the later sections quickly.
  if (Number(q.from) > 1) exam = { ...exam, items: exam.items.filter((i) => i.n >= Number(q.from)) }

  return (
    <div className="min-h-screen bg-navy-deep">
      <PreviewClock minutes={minutes} now={now} fresh={q.fresh === '1'} exam={exam} />
    </div>
  )
}

function PreviewClock({ minutes, now, fresh, exam }: { minutes: number; now: number; fresh: boolean; exam: PublicUnitExam }) {
  // The real start time will come from the server attempt; here it is "now".
  const key = `unit-exam:preview:${minutes}${fresh ? `:${now}` : ''}`
  return (
    <ExamRoom
      exam={exam}
      student={{ name: 'طالب تجريبي', phone: '01000000000' }}
      endsAt={now + minutes * 60_000}
      serverNow={now}
      storageKey={key}
      preview
    />
  )
}
