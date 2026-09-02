import type { Metadata } from 'next'
import Link from 'next/link'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { GRADES } from '@/content/site'
import { homeworkFor, totalMarks, type Homework } from '@/content/homework'

export const metadata: Metadata = {
  title: 'الواجبات',
  description:
    'واجبات البرمجة والذكاء الاصطناعي لطلاب أولى ثانوي وتانية بكالوريا — تصحيح فوري ودرجة تتسجّل باسمك.',
  alternates: { canonical: '/homework' },
}

/**
 * The two grades, side by side.
 *
 * A grade with no assignment yet keeps its card and says so in a sentence. The
 * alternative — hiding it — reads to a first-year student as "this site is not
 * for me", which is the opposite of true and the more expensive mistake.
 */
export default function HomeworkIndexPage() {
  return (
    <>
      <PageHero
        eyebrow="الواجبات"
        title="حِل واجبك واعرف درجتك على طول"
        lead="التصحيح فوري — اختيار من متعدد ومقالي. ولو إنت حاجز معانا، درجتك بتتسجّل باسمك."
      />

      <Section>
        <div data-reveal-stagger className="grid gap-5 md:grid-cols-2">
          {GRADES.map((grade) => (
            <GradeCard
              key={grade.value}
              label={grade.label}
              items={homeworkFor(grade.value)}
            />
          ))}
        </div>
      </Section>
    </>
  )
}

function GradeCard({ label, items }: { label: string; items: readonly Homework[] }) {
  return (
    <section className="card p-6 sm:p-7">
      <header className="mb-5">
        <span aria-hidden="true" className="trace-rule mb-4" />
        <h2 className="text-xl font-extrabold text-ink">{label}</h2>
      </header>

      {items.length === 0 ? (
        <p className="text-body text-ink-muted">
          لسه مانزلش واجب للصف ده. أول ما ينزل هتلاقيه هنا.
        </p>
      ) : (
        <ul className="grid gap-3">
          {items.map((hw) => (
            <li key={hw.slug}>
              <Link
                href={`/homework/${hw.slug}`}
                className="group block rounded border border-navy-line p-4 transition-colors duration-200 hover:border-gold/50 hover:bg-navy-soft/30"
              >
                <p className="text-xs font-bold text-gold">{hw.lecture}</p>
                <p className="mt-1.5 font-extrabold text-ink transition-colors duration-200 group-hover:text-gold">
                  {hw.lesson}
                </p>
                <p className="mt-2 text-xs text-ink-faint">
                  {hw.mcq.length} اختيار · {hw.essay.length} مقالي · من {totalMarks(hw)} درجة
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
