import type { Metadata } from 'next'
import { Section, SectionHeading } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { LibraryList } from '@/components/library/LibraryList'
import { ANSWER_KEYS, itemsFor } from '@/content/library'

export const metadata: Metadata = {
  title: 'حل التقييمات',
  description:
    'حل تقييمات الوزارة في البرمجة والذكاء الاصطناعي PDF مجانًا — حل كتاب التقييمات لتانية بكالوريا، وحل التقييمات الأسبوعية لأولى ثانوي، مع سبب كل إجابة.',
  alternates: { canonical: '/answers' },
}

/**
 * حل التقييمات — worked answers to the ministry's assessments, by grade.
 *
 * Second bacc first, because its assessment book counts towards the grade the
 * student is preparing for; first-sec's weekly sheets follow in week order.
 */
export default function AnswersPage() {
  return (
    <>
      <PageHero
        eyebrow="مجانًا · PDF"
        title="حل التقييمات"
        lead="حل أسئلة تقييمات الوزارة: صفحة الوزارة جنب حلها، ومع كل إجابة السبب أو التركة. حل إنت الأول، وبعدين صحّح من هنا."
      />

      <Section>
        <SectionHeading eyebrow="تانية بكالوريا" title="حل كتاب التقييمات" />
        <LibraryList items={itemsFor(ANSWER_KEYS, 'second_bacc')} icon="check" cta="نزّل الحل" />
      </Section>

      <Section tone="raised" className="border-t border-navy-line">
        <SectionHeading
          eyebrow="أولى ثانوي"
          title="حل التقييمات الأسبوعية"
          intro="الترم الأول: الاختبارات، والتقييم الصفي، والواجب المنزلي لكل أسبوع."
        />
        <LibraryList items={itemsFor(ANSWER_KEYS, 'first_sec')} icon="check" cta="نزّل الحل" />
      </Section>
    </>
  )
}
