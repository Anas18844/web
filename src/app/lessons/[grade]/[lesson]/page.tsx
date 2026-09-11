import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Section } from '@/components/ui/Section'
import { VideoFacade } from '@/components/VideoFacade'
import { LessonPath } from '@/components/lessons/LessonPath'
import {
  GRADE_SLUG,
  LESSONS,
  findLesson,
  gradeFromSlug,
  gradeLabel,
  lessonsFor,
  stepsFor,
} from '@/content/lessons'
import { toArabicDigits } from '@/lib/arabic'

const ar = (n: number) => toArabicDigits(n)

type Params = { grade: string; lesson: string }

/** Every lesson is known at build time, so every page is static. */
export function generateStaticParams() {
  return LESSONS.map((l) => ({ grade: GRADE_SLUG[l.grade], lesson: l.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { grade: gradeSlug, lesson: lessonSlug } = await params
  const grade = gradeFromSlug(gradeSlug)
  const lesson = grade ? findLesson(grade, lessonSlug) : undefined
  if (!lesson || !grade) return {}

  return {
    title: `${lesson.eyebrow} — ${lesson.title}`,
    description: `${lesson.blurb} شرح بالفيديو، ملخص مكتوب، وواجب بتصحيح فوري — ${gradeLabel(grade)}.`,
    alternates: { canonical: `/lessons/${gradeSlug}/${lessonSlug}` },
  }
}

/**
 * One lesson, start to finish.
 *
 * The video first because that is what the student came for, then the path
 * below it. Nothing else competes for the top of this page — no related
 * lessons, no calls to action, no cross-sell. A student who opens this has
 * already chosen; the job is to get them watching and then tell them what is
 * next, in that order.
 */
export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { grade: gradeSlug, lesson: lessonSlug } = await params
  const grade = gradeFromSlug(gradeSlug)
  if (!grade) notFound()

  const lesson = findLesson(grade, lessonSlug)
  if (!lesson) notFound()

  const steps = stepsFor(lesson)
  const siblings = lessonsFor(grade)
  const index = siblings.findIndex((l) => l.slug === lesson.slug)
  const prev = siblings[index - 1]
  const next = siblings[index + 1]

  return (
    <Section tone="deep" space="lg" className="wash-top">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
        <Link href={`/lessons/${gradeSlug}`} className="font-bold text-gold hover:text-ink">
          {gradeLabel(grade)}
        </Link>
        <span aria-hidden="true">/</span>
        <span>{lesson.eyebrow}</span>
      </nav>

      <header className="mb-8">
        <span aria-hidden="true" className="trace-rule mb-5" />
        <p className="text-xs font-bold text-gold">
          {lesson.eyebrow} · {gradeLabel(grade)}
        </p>
        <h1 className="mt-2 text-title font-extrabold leading-tight text-ink">{lesson.title}</h1>
        <p className="mt-3 max-w-prose text-body leading-relaxed text-ink-muted">{lesson.blurb}</p>
      </header>

      <div className="mx-auto max-w-4xl">
        <VideoFacade
          video={{ youtubeId: lesson.youtubeId, title: `${lesson.eyebrow} — ${lesson.title}` }}
          proofName={`lesson:${gradeSlug}:${lesson.slug}`}
        />
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        <h2 className="mb-4 text-sm font-extrabold text-ink">خطوتك الجاية</h2>
        <LessonPath steps={steps} />
      </div>

      {/* Where to go when the lesson is finished. */}
      <nav className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-between gap-3 border-t border-navy-line pt-5 text-sm">
        {prev ? (
          <Link
            href={`/lessons/${gradeSlug}/${prev.slug}`}
            className="font-bold text-ink-muted transition-colors duration-200 hover:text-gold"
          >
            ← {prev.eyebrow}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/lessons/${gradeSlug}/${next.slug}`}
            className="font-bold text-gold transition-colors duration-200 hover:text-ink"
          >
            {next.eyebrow} →
          </Link>
        ) : (
          <Link
            href={`/lessons/${gradeSlug}`}
            className="font-bold text-ink-muted transition-colors duration-200 hover:text-gold"
          >
            كل دروس {gradeLabel(grade)} ({ar(siblings.length)})
          </Link>
        )}
      </nav>
    </Section>
  )
}
