import type { Metadata } from 'next'
import Link from 'next/link'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { GRADES } from '@/content/site'
import { examsFor, totalMarks, type Exam } from '@/content/exams'
import { toArabicDigits } from '@/lib/arabic'

export const metadata: Metadata = {
  title: 'الامتحانات',
  description:
    'امتحانات أسبوعية بتصحيح فوري لطلاب أولى ثانوي وتانية بكالوريا — بعد ما تخلّص الواجب.',
  alternates: { canonical: '/exam' },
}

const ar = (n: number) => toArabicDigits(n)

export default function ExamIndexPage() {
  return (
    <>
      <PageHero
        eyebrow="الامتحانات"
        title="امتحن نفسك زي يوم الامتحان"
        lead="نفس شكل الورقة، بتصحيح فوري ودرجة بتتسجّل باسمك. الامتحان بيفتح بعد ما تحل الواجب وتسجّل درجتك."
      />

      <Section>
        <div data-reveal-stagger className="grid gap-5 md:grid-cols-2">
          {GRADES.map((grade) => (
            <GradeCard key={grade.value} label={grade.label} items={examsFor(grade.value)} />
          ))}
        </div>
      </Section>
    </>
  )
}

function GradeCard({ label, items }: { label: string; items: readonly Exam[] }) {
  return (
    <section className="card p-6 sm:p-7">
      <header className="mb-5">
        <span aria-hidden="true" className="trace-rule mb-4" />
        <h2 className="text-xl font-extrabold text-ink">{label}</h2>
      </header>

      {items.length === 0 ? (
        <p className="text-body text-ink-muted">
          لسه مانزلش امتحان للصف ده. أول ما ينزل هتلاقيه هنا.
        </p>
      ) : (
        <ul className="grid gap-3">
          {items.map((e) => (
            <li key={e.slug}>
              <Link
                href={`/exam/${e.slug}`}
                className="group block rounded border border-navy-line p-4 transition-colors duration-200 hover:border-gold/50 hover:bg-navy-soft/30"
              >
                <p className="text-xs font-bold text-gold">{e.week}</p>
                <p className="mt-1.5 font-extrabold text-ink transition-colors duration-200 group-hover:text-gold">
                  {e.lesson}
                </p>
                <p className="mt-2 text-xs text-ink-faint">
                  {ar(totalMarks(e))} درجة · {ar(e.minutes)} دقيقة · بعد الواجب
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
