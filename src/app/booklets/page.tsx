import type { Metadata } from 'next'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { LibraryList } from '@/components/library/LibraryList'
import { BOOKLETS, ANSWER_KEYS, lectureBooklets, unitItems, type LibraryItem } from '@/content/library'
import { UNITS, unitLabel } from '@/content/lessons'
import type { Grade } from '@/content/site'

export const metadata: Metadata = {
  title: 'الملازم وحل التقييمات',
  description:
    'ملازم البرمجة والذكاء الاصطناعي PDF مجانًا، وحل تقييمات الوزارة — مرتبة بالصف والوحدة: ملزمة الشرح، وكتاب التدريبات، وحل كتاب التقييمات، وملازم المحاضرات، والعملي.',
  alternates: { canonical: '/booklets' },
}

/**
 * الملازم — every free PDF, by grade and then by unit (owner, 2026-10-15).
 *
 * The answer keys used to be a page of their own (/answers, now a redirect
 * here). A student revising a unit wants its booklet, its practice book and
 * its answer key together, so each unit is one block holding all three, and
 * the per-lecture booklets sit at the bottom of their unit.
 */
export default function BookletsPage() {
  return (
    <>
      <PageHero
        eyebrow="مجانًا · PDF"
        title="الملازم وحل التقييمات"
        lead="كل وحدة في مكان واحد: ملزمة الشرح، وكتاب التدريبات، وحل كتاب التقييمات. نزّل، اطبع، وذاكر من غير نت — مش محتاج تكون مشترك."
      />

      <Section>
        <nav aria-label="الصفوف" className="mb-10 flex flex-wrap gap-2">
          <Jump href="#second-bacc">تانية بكالوريا</Jump>
          <Jump href="#first-sec">أولى ثانوي</Jump>
        </nav>

        <GradeBlock
          id="second-bacc"
          title="تانية بكالوريا"
          grade="second_bacc"
          after={
            <UnitBlock
              id="second-bacc-practical"
              eyebrow="العملي"
              title="منصة كيريو · Qureo"
              items={BOOKLETS.filter((i) => i.grade === 'second_bacc' && i.kind === 'practical')}
            />
          }
        />

        <GradeBlock
          id="first-sec"
          title="أولى ثانوي"
          grade="first_sec"
          after={
            <UnitBlock
              id="first-sec-weekly"
              eyebrow="الترم الأول"
              title="حل التقييمات الأسبوعية"
              note="الاختبارات، والتقييم الصفي، والواجب المنزلي لكل أسبوع: صفحة الوزارة جنب حلها."
              items={ANSWER_KEYS.filter((i) => i.grade === 'first_sec' && i.kind === 'weekly')}
            />
          }
        />
      </Section>
    </>
  )
}

/** One grade: its units in book order, then `after`. */
function GradeBlock({
  id,
  title,
  grade,
  after,
}: {
  id: string
  title: string
  grade: Grade
  after?: React.ReactNode
}) {
  const units = UNITS[grade]
    .map((u) => ({ ...u, items: [...unitItems(grade, u.n), ...lecturesOf(grade, u.n)] }))
    .filter((u) => u.items.length > 0)

  return (
    <section id={id} className="mb-16 scroll-mt-24">
      <h2 className="mb-6 border-b border-navy-line pb-3 text-title font-extrabold text-ink">{title}</h2>
      {units.map((u) => (
        <UnitBlock
          key={u.n}
          id={`${id}-unit-${u.n}`}
          eyebrow={unitLabel(u.n)}
          title={u.title}
          items={u.items}
        />
      ))}
      {after}
    </section>
  )
}

/** Lecture booklets of one unit — second bacc only; a first-sec unit is one booklet. */
function lecturesOf(grade: Grade, unit: number): LibraryItem[] {
  return grade === 'second_bacc' ? lectureBooklets(grade).filter((i) => i.unit === unit) : []
}

function UnitBlock({
  id,
  eyebrow,
  title,
  note,
  items,
}: {
  id: string
  eyebrow: string
  title: string
  note?: string
  items: readonly LibraryItem[]
}) {
  if (items.length === 0) return null
  return (
    <div id={id} className="mb-10 scroll-mt-24 rounded border border-navy-line bg-navy-soft/20 p-4 sm:p-6">
      <p className="text-sm font-bold text-gold">{eyebrow}</p>
      <h3 className="mt-1 text-lg font-extrabold text-ink sm:text-xl">{title}</h3>
      {note && <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{note}</p>}
      <div className="mt-5">
        <LibraryList items={items} />
      </div>
    </div>
  )
}

function Jump({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded border border-navy-line bg-navy-soft/30 px-4 py-2 text-sm font-bold text-ink-muted transition-colors duration-200 hover:border-gold/50 hover:text-gold"
    >
      {children}
    </a>
  )
}
