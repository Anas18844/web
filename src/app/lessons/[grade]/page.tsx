import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import {
  GRADE_SLUG,
  gradeFromSlug,
  gradeLabel,
  gradesWithLessons,
  lessonsFor,
  stepsFor,
  type Lesson,
} from '@/content/lessons'
import { toArabicDigits } from '@/lib/arabic'

const ar = (n: number) => toArabicDigits(n)

type Params = { grade: string }

export function generateStaticParams() {
  return gradesWithLessons().map((g) => ({ grade: GRADE_SLUG[g] }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { grade: gradeSlug } = await params
  const grade = gradeFromSlug(gradeSlug)
  if (!grade) return {}
  const label = gradeLabel(grade)

  return {
    title: `دروس ${label}`,
    description: `كل دروس البرمجة والذكاء الاصطناعي لـ${label} — شرح بالفيديو، ملخص مكتوب، واجب بتصحيح فوري، وامتحان الحصة.`,
    alternates: { canonical: `/lessons/${gradeSlug}` },
  }
}

/**
 * Every lesson of one grade, newest work first in the student's mind but in
 * course order on the page — a student looking for «الدرس التاني» looks for the
 * number two, not for whatever went up last.
 */
export default async function GradeLessonsPage({ params }: { params: Promise<Params> }) {
  const { grade: gradeSlug } = await params
  const grade = gradeFromSlug(gradeSlug)
  if (!grade) notFound()

  const lessons = lessonsFor(grade)
  if (lessons.length === 0) notFound()

  const label = gradeLabel(grade)

  return (
    <>
      <PageHero
        eyebrow={label}
        title={`دروس ${label}`}
        lead="كل درس في مكان واحد: الشرح بالفيديو، الملخص، الواجب، وامتحان الحصة."
      />

      <Section>
        <ul data-reveal-stagger className="grid gap-5 lg:grid-cols-2">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.slug} lesson={lesson} gradeSlug={gradeSlug} />
          ))}
        </ul>

        {/* The other grade, for the student who landed on the wrong one. */}
        <OtherGrade current={gradeSlug} />
      </Section>
    </>
  )
}

function LessonCard({ lesson, gradeSlug }: { lesson: Lesson; gradeSlug: string }) {
  const steps = stepsFor(lesson)
  /**
   * "Ready" means the piece EXISTS, so a gated exam counts.
   *
   * Counting only `ready` made lecture 1 — which has all four pieces, its exam
   * merely gated behind the homework — read as «٣ من ٤ جاهزة», identical to a
   * lesson whose exam has not been written yet. Two very different lessons, one
   * number, and the more complete one looked worse.
   */
  const ready = steps.filter((s) => s.state !== 'soon').length

  return (
    <li>
      <Link
        href={`/lessons/${gradeSlug}/${lesson.slug}`}
        className="group block overflow-hidden rounded border border-navy-line bg-navy-soft/30 transition-colors duration-200 hover:border-gold/50"
      >
        {/*
          The thumbnail, because a lesson is a video first and a row of text
          cards gives a student nothing to recognise. `hqdefault` is 480x360 and
          already in next.config's remote patterns — no new host, no new config.
        */}
        <div className="relative aspect-video w-full overflow-hidden bg-navy-deep">
          <Image
            src={`https://i.ytimg.com/vi/${lesson.youtubeId}/hqdefault.jpg`}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover opacity-70 transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.03] group-hover:opacity-100"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/20 to-transparent" />
          <span className="absolute bottom-3 end-4 grid h-11 w-11 place-items-center rounded-full bg-gold text-navy transition-transform duration-300 ease-out group-hover:scale-105">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-xs font-bold text-gold">{lesson.eyebrow}</p>
          <h2 className="mt-1.5 text-lg font-extrabold leading-snug text-ink transition-colors duration-200 group-hover:text-gold">
            {lesson.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{lesson.blurb}</p>

          {/*
            Four dots, one per step. It says at a glance how much of this lesson
            is actually up — which is the honest thing to show while first-year
            lessons have a video and nothing else yet.
          */}
          <div className="mt-4 flex items-center gap-2.5">
            <span className="flex gap-1.5" aria-hidden="true">
              {steps.map((s) => (
                <span
                  key={s.key}
                  className={`h-1.5 w-6 rounded-full ${
                    s.state !== 'soon' ? 'bg-gold' : 'bg-navy-line'
                  }`}
                />
              ))}
            </span>
            <span className="text-xs text-ink-faint">
              {ar(ready)} من {ar(steps.length)} جاهزة
            </span>
          </div>
        </div>
      </Link>
    </li>
  )
}

function OtherGrade({ current }: { current: string }) {
  const others = gradesWithLessons().filter((g) => GRADE_SLUG[g] !== current)
  if (others.length === 0) return null

  return (
    <p className="mt-8 text-center text-sm text-ink-muted">
      بتدوّر على صف تاني؟{' '}
      {others.map((g) => (
        <Link
          key={g}
          href={`/lessons/${GRADE_SLUG[g]}`}
          className="font-bold text-gold underline-offset-4 hover:underline"
        >
          دروس {gradeLabel(g)}
        </Link>
      ))}
    </p>
  )
}
