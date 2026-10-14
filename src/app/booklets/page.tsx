import type { Metadata } from 'next'
import Link from 'next/link'
import { Section, SectionHeading } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { LibraryList } from '@/components/library/LibraryList'
import { BOOKLETS, itemsFor, lectureBooklets } from '@/content/library'

export const metadata: Metadata = {
  title: 'الملازم',
  description:
    'ملازم البرمجة والذكاء الاصطناعي مجانًا PDF — ملزمة الوحدة الأولى كاملة، وملزمة شرح الوحدة الثانية، وكتاب التدريبات، وملازم المحاضرات. اطبعها وذاكر من غير نت.',
  alternates: { canonical: '/booklets' },
}

/**
 * الملازم — every free booklet, by grade.
 *
 * Unit booklets first: they are what a student revising for an exam wants.
 * The per-lecture booklets follow, for the student catching up on one lesson.
 */
export default function BookletsPage() {
  const units = itemsFor(BOOKLETS, 'second_bacc')
  const lectures = lectureBooklets('second_bacc')
  const firstSec = itemsFor(BOOKLETS, 'first_sec')

  return (
    <>
      <PageHero
        eyebrow="مجانًا · PDF"
        title="الملازم"
        lead="ملازم مفتوحة لأي طالب: نزّلها، اطبعها، وذاكر منها على الورق ومن غير نت. مش محتاج تكون مشترك."
      />

      <Section>
        <SectionHeading
          eyebrow="تانية بكالوريا"
          title="ملازم الوحدات"
          intro="الوحدة كاملة في ملف واحد، والتدريبات في كتاب لوحده."
        />
        <LibraryList items={units} />

        {lectures.length > 0 && (
          <>
            <SectionHeading
              title="ملازم المحاضرات"
              intro="ملزمة لكل محاضرة اتشرحت على الموقع، بنفس ترتيب الشرح."
              className="mt-14 sm:mt-16"
            />
            <LibraryList items={lectures} />
          </>
        )}
      </Section>

      <Section tone="raised" space="sm" className="border-t border-navy-line">
        <SectionHeading eyebrow="أولى ثانوي" title="ملازم أولى ثانوي" />
        {firstSec.length > 0 ? (
          <LibraryList items={firstSec} />
        ) : (
          <p className="text-body text-ink-muted">
            ملازم أولى ثانوي بتنزل قريب. لحد ما تنزل، الشرح كامل على{' '}
            <Link href="/lessons/first-sec" className="font-bold text-gold underline-offset-4 hover:underline">
              صفحة دروس أولى ثانوي
            </Link>
            ، وحل التقييمات الأسبوعية على{' '}
            <Link href="/answers" className="font-bold text-gold underline-offset-4 hover:underline">
              صفحة حل التقييمات
            </Link>
            .
          </p>
        )}
      </Section>
    </>
  )
}
