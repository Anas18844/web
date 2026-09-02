import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HOMEWORK, findHomework, toPublic } from '@/content/homework'
import { HomeworkPaper } from '@/components/homework/HomeworkPaper'
import { summaryForHomework } from '@/content/summaries'

export function generateStaticParams() {
  return HOMEWORK.map((hw) => ({ slug: hw.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const hw = findHomework((await params).slug)
  if (!hw) return {}

  return {
    title: `${hw.title} — ${hw.lesson}`,
    description: `${hw.lesson}. ${hw.mcq.length} سؤال اختيار و${hw.essay.length} مقالي، بتصحيح فوري.`,
    alternates: { canonical: `/homework/${hw.slug}` },
  }
}

/**
 * The exam page.
 *
 * A SERVER component, and that is the security boundary rather than a
 * performance choice: it reads the bank — answers and all — and hands the
 * client component only `toPublic(hw)`. The correct answers exist in this
 * process and are never serialised into the page.
 *
 * Everything interactive lives in HomeworkPaper below it.
 */
export default async function HomeworkPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const hw = findHomework((await params).slug)
  if (!hw) notFound()

  const summary = summaryForHomework(hw.slug)

  return <HomeworkPaper homework={toPublic(hw)} summarySlug={summary?.slug} />
}
