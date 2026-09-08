import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { EXAMS, findExam, totalMarks } from '@/content/exams'
import { ExamShell } from '@/components/exam/ExamShell'

export function generateStaticParams() {
  return EXAMS.map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const exam = findExam((await params).slug)
  if (!exam) return {}
  return {
    title: `${exam.title} — ${exam.lesson}`,
    description: `${exam.lesson}. ${totalMarks(exam)} درجة، بتصحيح فوري.`,
    alternates: { canonical: `/exam/${exam.slug}` },
  }
}

/**
 * The exam page.
 *
 * ⚠️ It renders NO questions. Only the title, the marks and the gate — the
 * paper itself is returned by /api/exam/start once a phone has been matched to
 * a marked homework submission.
 *
 * That is the whole point of the feature: a student who has not done the
 * homework cannot read the exam, not even by viewing source.
 */
export default async function ExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const exam = findExam((await params).slug)
  if (!exam) notFound()

  return (
    <div className="bg-navy-deep py-10 sm:py-14">
      <Container width="content">
        <ExamShell
          slug={exam.slug}
          title={exam.title}
          lesson={exam.lesson}
          week={exam.week}
          minutes={exam.minutes}
          marks={totalMarks(exam)}
          homeworkSlug={exam.requiresHomework}
        />
      </Container>
    </div>
  )
}
