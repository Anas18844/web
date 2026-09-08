'use client'

import { useState } from 'react'
import type { PublicExam } from '@/content/exams'
import { ExamGate } from './ExamGate'
import { ExamPaper } from './ExamPaper'

/**
 * Holds the exam's two states: locked, then open.
 *
 * The paper does not exist in the browser until the gate returns it. That is
 * why this component takes only a summary of the exam, and receives the real
 * `PublicExam` — questions and all — from the server as the gate's reply.
 */
export function ExamShell({
  slug,
  title,
  lesson,
  week,
  minutes,
  marks,
  homeworkSlug,
}: {
  slug: string
  title: string
  lesson: string
  week: string
  minutes: number
  marks: number
  homeworkSlug: string
}) {
  const [open, setOpen] = useState<{ pass: string; exam: PublicExam; name: string | null } | null>(
    null,
  )

  if (open) {
    return <ExamPaper exam={open.exam} pass={open.pass} studentName={open.name} />
  }

  return (
    <ExamGate
      slug={slug}
      title={title}
      lesson={lesson}
      week={week}
      minutes={minutes}
      marks={marks}
      homeworkSlug={homeworkSlug}
      onOpen={(r) =>
        setOpen({ pass: r.pass, exam: r.exam as PublicExam, name: r.name })
      }
    />
  )
}
