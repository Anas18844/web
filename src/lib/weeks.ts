import 'server-only'

import type { Grade } from '@/content/site'
import { GRADE_SLUG, lessonsFor } from '@/content/lessons'
import { HOMEWORK, totalMarks as homeworkMarks } from '@/content/homework'
import { findExam, totalMarks as examMarks } from '@/content/exams'
import { toArabicDigits } from '@/lib/arabic'

/**
 * الأسبوع — the unit the register is organised by.
 *
 * «الأسبوع» is the teaching unit by the owner's own decision (OQ-014 in
 * brain/facts/open-questions.md, answered 2026-09-15); «درس» and «وحدة» stay for
 * the ministry book. So a register is "week 3", not a date, and a date is only
 * the label on it.
 *
 * WHAT A WEEK CONTAINS — and why it is not just "this week's things":
 *
 *   الأسبوع N  →  attendance for session N
 *              →  the homework from week N-1, checked at the door
 *              →  the exam on week N-1's material, sat in that session
 *
 * That is how the lesson actually runs: you teach week 3, but you check the
 * homework from week 2 and you examine week 2. A register that showed week 3's
 * homework on week 3 would show nobody as having done it, every single time.
 *
 * This replaced a register that showed "each student's most recent homework,
 * whatever it was for" — which made a student who did week 1 and skipped week 2
 * look, in week 3, exactly like one who did both.
 */

/**
 * The centre's first Tuesday. BIZ-20 in brain/facts/business.md — change it
 * there first if it is ever wrong, then here.
 */
const TERM_START = '2026-09-01'
const DAY_MS = 86_400_000

/**
 * Which grades sit a weekly paper in the centre.
 *
 * Only تانية بكالوريا has centre classes (BIZ-07). أولى ثانوي is taught on
 * YouTube, so a "week 3 exam" for it does not exist, and offering a box to type
 * a mark into would invent one.
 */
const HAS_WEEKLY_PAPER: Record<Grade, boolean> = {
  second_bacc: true,
  first_sec: false,
}

/**
 * What a paper is out of when its online version has not been written yet.
 *
 * The week 1 paper is 20 with a pass mark of 10. Until a week's paper is added
 * to content/exams.ts, a hand-entered mark is taken to be out of the same — and
 * a mark above it is refused rather than stored, so a different total shows up
 * the first time someone types it, not in a report a month later.
 */
const DEFAULT_PAPER = { marks: 20, passMark: 10 }

/** Today, in Cairo. The server runs in UTC, and a week turns over on Tuesday. */
export function cairoToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** The week a date falls in. Week 1 is the week of TERM_START. */
export function weekOf(date: string): number {
  const days = Math.floor(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${TERM_START}T00:00:00Z`)) / DAY_MS,
  )
  return Math.max(1, Math.floor(days / 7) + 1)
}

/**
 * The date a week's register is filed under.
 *
 * One date per week, whatever day the class actually met. The attendance table
 * is keyed on (student, session_date), so this is what makes "week 3" a single
 * register rather than one per day somebody happened to open it. The seven
 * rows already recorded on 2026-09-08 land on week 2 by this rule unchanged.
 */
export function weekDate(week: number): string {
  return new Date(Date.parse(`${TERM_START}T00:00:00Z`) + (week - 1) * 7 * DAY_MS)
    .toISOString()
    .slice(0, 10)
}

/** Spoken ordinals, the way the teacher says them — «الأسبوع التالت». */
const ORDINAL = [
  'الأول',
  'التاني',
  'التالت',
  'الرابع',
  'الخامس',
  'السادس',
  'السابع',
  'التامن',
  'التاسع',
  'العاشر',
]

export function weekName(week: number): string {
  return `الأسبوع ${ORDINAL[week - 1] ?? toArabicDigits(week)}`
}

export function dateLabel(date: string): string {
  return new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`))
}

export type WeekPlan = {
  week: number
  date: string
  name: string
  dateLabel: string
  /** The homework CHECKED this week — last week's. Null in week 1. */
  homework: { slug: string; label: string; marks: number } | null
  /** The paper SAT this week, on last week's material. */
  exam: { slug: string; label: string; marks: number; passMark: number } | null
}

export function planFor(grade: Grade, week: number): WeekPlan {
  const date = weekDate(week)
  const previous = week - 1
  const lesson = previous >= 1 ? lessonsFor(grade).find((l) => l.n === previous) : undefined

  const hw = lesson?.homeworkSlug ? HOMEWORK.find((h) => h.slug === lesson.homeworkSlug) : undefined

  let exam: WeekPlan['exam'] = null
  if (previous >= 1 && HAS_WEEKLY_PAPER[grade]) {
    // The lesson names its paper when there is one online. When there is not
    // yet, the slug follows the convention the first paper set — so a mark
    // typed in today and the online paper added next week share one slug, and
    // a student's result is one row, not two that disagree.
    const slug = lesson?.examSlug ?? `${GRADE_SLUG[grade]}-week-${previous}`
    const paper = findExam(slug)
    exam = {
      slug,
      label: `امتحان ${weekName(previous)}`,
      marks: paper ? examMarks(paper) : DEFAULT_PAPER.marks,
      passMark: paper?.passMark ?? DEFAULT_PAPER.passMark,
    }
  }

  return {
    week,
    date,
    name: weekName(week),
    dateLabel: dateLabel(date),
    homework: hw ? { slug: hw.slug, label: `واجب ${weekName(previous)}`, marks: homeworkMarks(hw) } : null,
    exam,
  }
}

/** Every week so far, newest first — the one being taught is the default. */
export function weeksSoFar(): { week: number; label: string }[] {
  const current = weekOf(cairoToday())
  return Array.from({ length: current }, (_, i) => current - i).map((week) => ({
    week,
    label: `${weekName(week)} · ${dateLabel(weekDate(week))}`,
  }))
}
