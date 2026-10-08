import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { Countdown } from '@/components/unit-exam/Countdown'
import { Dua } from '@/components/unit-exam/Dua'
import { UnitExamEntry } from '@/components/unit-exam/UnitExamEntry'
import { toArabicDigits } from '@/lib/arabic'
import {
  UNIT_EXAM,
  UNIT_EXAM_AI_WARNING,
  UNIT_EXAM_RULES,
  unitExamPhase,
} from '@/content/unit-exam'

/**
 * The unit-1 comprehensive exam — lobby.
 *
 * Rendered on every request because the phase (before / open / closed) is
 * decided by the server clock, never the student's. Before the exam opens the
 * page is a countdown, the rules and the opening dua; once it opens, the entry
 * form (UnitExamEntry) takes the student into the exam room.
 *
 * ⚠️ Like the weekly exams, this page renders NO questions.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: UNIT_EXAM.title,
  description: `${UNIT_EXAM.unit}. ساعتين، ${UNIT_EXAM.questions} سؤال، ${UNIT_EXAM.marks} درجة.`,
  alternates: { canonical: `/exam/${UNIT_EXAM.slug}` },
}

const ar = (n: number | string) => toArabicDigits(n)

const OPENS_LABEL = new Intl.DateTimeFormat('ar-EG', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Africa/Cairo',
}).format(new Date(UNIT_EXAM.opensAt))

export default function UnitExamPage() {
  const now = Date.now()
  const phase = unitExamPhase(now)

  return (
    <div className="bg-navy-deep py-10 sm:py-14">
      <Container width="content">
        <div className="mx-auto max-w-2xl">
          <div className="card p-6 sm:p-8">
            <span aria-hidden="true" className="trace-rule mb-5" />
            <p className="text-sm font-bold text-gold">{UNIT_EXAM.grade}</p>
            <h1 className="mt-2 text-title font-extrabold text-ink">{UNIT_EXAM.title}</h1>
            <p className="mt-2 text-body text-ink-muted">{UNIT_EXAM.unit}</p>

            <dl className="mt-6 grid grid-cols-3 gap-3 border-y border-navy-line py-4 text-center">
              <Fact label="الزمن" value="ساعتين" />
              <Fact label="الأسئلة" value={ar(UNIT_EXAM.questions)} />
              <Fact label="الدرجة" value={ar(UNIT_EXAM.marks)} />
            </dl>

            {/* ── The countdown, or what replaces it ─────────────────────── */}
            <section className="mt-7" aria-labelledby="exam-when">
              {phase === 'before' && (
                <>
                  <h2 id="exam-when" className="mb-4 text-center font-extrabold text-ink">
                    الامتحان بيفتح <span className="text-gold">{OPENS_LABEL}</span> بتوقيت القاهرة
                  </h2>
                  <Countdown target={Date.parse(UNIT_EXAM.opensAt)} serverNow={now} />
                  <p className="mt-4 text-center text-sm text-ink-muted">
                    خلّي الصفحة دي مفتوحة أو احفظها عندك، وارجع لها في الميعاد.
                  </p>
                  <Dua className="mt-6" />
                </>
              )}
              {(phase === 'open' || phase === 'late') && (
                <>
                  <h2 id="exam-when" className="mb-5 text-center text-lg font-extrabold text-gold">
                    {phase === 'open' ? 'الامتحان مفتوح دلوقتي' : 'وقت البداية خلص · اللي بدأ يكمّل'}
                  </h2>
                  <UnitExamEntry late={phase === 'late'} discount={UNIT_EXAM.outsiderDiscount} />
                </>
              )}
              {phase === 'closed' && (
                <h2 id="exam-when" className="text-center text-lg font-extrabold text-ink">
                  الامتحان انتهى. النتايج هتوصلكم على الواتساب.
                </h2>
              )}
            </section>

            {/* ── Rules, stated before anything is asked ─────────────────── */}
            <section className="mt-8" aria-labelledby="exam-rules">
              <h2 id="exam-rules" className="mb-3 font-extrabold text-ink">
                قبل ما تبدأ
              </h2>
              <ul className="space-y-2.5">
                {UNIT_EXAM_RULES.map((rule) => (
                  <li key={rule} className="flex items-start gap-2.5 text-body leading-relaxed text-ink-muted">
                    <span className="mt-1 shrink-0 text-gold">
                      <Icon name="check" className="h-4 w-4" />
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-6 rounded border border-gold/40 bg-gold/[0.07] p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-gold">
                  <Icon name="shield" className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-extrabold text-ink">تنبيه بخصوص الذكاء الاصطناعي</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{UNIT_EXAM_AI_WARNING}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded border border-navy-line p-5">
              <p className="font-extrabold text-ink">مش مشترك على المنصة؟</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                امتحن ببلاش، وخد وعد بخصم {ar(UNIT_EXAM.outsiderDiscount)}٪ على باقة الشهر وباقة الترم لو قفلت الامتحان.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold text-ink-muted">{label}</dt>
      <dd className="mt-1 text-lg font-extrabold text-ink">{value}</dd>
    </div>
  )
}
