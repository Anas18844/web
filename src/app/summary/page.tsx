import type { Metadata } from 'next'
import Link from 'next/link'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { GRADES } from '@/content/site'
import { summariesFor, type Summary } from '@/content/summaries'

export const metadata: Metadata = {
  title: 'الملخصات',
  description:
    'ملخصات دروس البرمجة والذكاء الاصطناعي لطلاب أولى ثانوي وتانية بكالوريا — كل درس في صفحة واحدة، وبعدها الواجب.',
  alternates: { canonical: '/summary' },
}

export default function SummaryIndexPage() {
  return (
    <>
      <PageHero
        eyebrow="الملخصات"
        title="الدرس كله في صفحة واحدة"
        lead="مراجعة سريعة قبل الامتحان — الأفكار والصور والمصطلحات مرتّبة. وفي الآخر تروح تحل الواجب على طول."
      />

      <Section>
        <div data-reveal-stagger className="grid gap-5 md:grid-cols-2">
          {GRADES.map((grade) => (
            <GradeCard key={grade.value} label={grade.label} items={summariesFor(grade.value)} />
          ))}
        </div>
      </Section>
    </>
  )
}

function GradeCard({ label, items }: { label: string; items: readonly Summary[] }) {
  return (
    <section className="card p-6 sm:p-7">
      <header className="mb-5">
        <span aria-hidden="true" className="trace-rule mb-4" />
        <h2 className="text-xl font-extrabold text-ink">{label}</h2>
      </header>

      {items.length === 0 ? (
        <p className="text-body text-ink-muted">
          لسه مانزلش ملخص للصف ده. أول ما ينزل هتلاقيه هنا.
        </p>
      ) : (
        <ul className="grid gap-3">
          {items.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/summary/${s.slug}`}
                className="group block rounded border border-navy-line p-4 transition-colors duration-200 hover:border-gold/50 hover:bg-navy-soft/30"
              >
                <p className="text-xs font-bold text-gold">{s.lecture}</p>
                <p className="mt-1.5 font-extrabold text-ink transition-colors duration-200 group-hover:text-gold">
                  {s.lesson}
                </p>
                <p className="mt-2 text-xs text-ink-faint">
                  {s.axes.length} محاور · ملخص كامل
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
