import { GRADES, type Grade } from '@/content/site'
import { HOMEWORK, totalMarks as homeworkMarks } from '@/content/homework'
import { SUMMARIES } from '@/content/summaries'
import { toArabicDigits } from '@/lib/arabic'

/**
 * الدروس — the lesson, as the student experiences it.
 *
 * Before this, the site was organised by ARTEFACT: every summary on one page,
 * every homework on another, every exam on a third. That is how the content was
 * built, not how it is used. A student does not want "all the summaries" — they
 * want Tuesday's lesson: watch it, revise it, do the homework, sit the test. To
 * follow one lesson through they had to visit three different tabs and know
 * which item on each belonged together.
 *
 * So the lesson is now the unit, and this file is what ties the four pieces
 * together. The old pages still work — links have been shared on WhatsApp and
 * must not rot — but nothing sends a student to them any more.
 *
 * NOTE this is deliberately NOT `server-only`: it holds a video id and three
 * slugs, nothing secret. The answer keys stay behind `homework.ts` and
 * `exams.ts`, both of which are server-only and stay that way.
 */

export type Lesson = {
  /** URL segment, unique within its grade: /lessons/second-bacc/lecture-1 */
  slug: string
  grade: Grade
  /** Position in the course, shown as the step number. */
  n: number
  /** «المحاضرة الأولى» — what the teacher calls it. */
  eyebrow: string
  /** What the lesson is actually about, in the student's words. */
  title: string
  /** One line on why it matters, for the card. */
  blurb: string
  youtubeId: string

  /**
   * The three slugs, each optional ON PURPOSE.
   *
   * A lesson goes up the moment its video exists; the summary, homework and
   * exam land over the following days. Modelling them as optional is what lets
   * the page say "الفيديو جاهز، الواجب لسه" honestly instead of either hiding
   * the lesson or linking to a 404.
   */
  summarySlug?: string
  homeworkSlug?: string
  examSlug?: string

  /**
   * The lecture's printed booklet (الملزمة) as a PDF.
   *
   * Optional for the same reason as the three slugs above: a booklet is
   * scanned and uploaded after the lesson, so the step can say "لسه" instead
   * of linking to nothing.
   */
  bookletUrl?: string
}

/** The slug used in URLs for a grade — `first_sec` is not a nice URL. */
export const GRADE_SLUG: Record<Grade, string> = {
  first_sec: 'first-sec',
  second_bacc: 'second-bacc',
}

const GRADE_BY_SLUG: Record<string, Grade> = Object.fromEntries(
  Object.entries(GRADE_SLUG).map(([g, s]) => [s, g as Grade]),
) as Record<string, Grade>

export function gradeFromSlug(slug: string): Grade | undefined {
  return GRADE_BY_SLUG[slug]
}

export function gradeLabel(grade: Grade): string {
  return GRADES.find((g) => g.value === grade)?.label ?? grade
}

/**
 * Titles come from the videos themselves rather than being retyped, trimmed to
 * the part a student needs. The full YouTube titles carry the year, the channel
 * conventions and the word "شرح + حل" — right for search, noise on a page whose
 * heading already says which lesson it is.
 */
export const LESSONS: readonly Lesson[] = [
  // ── تانية بكالوريا ────────────────────────────────────────────────────────
  {
    slug: 'lecture-1',
    grade: 'second_bacc',
    n: 1,
    eyebrow: 'المحاضرة الأولى',
    title: 'تطوّر تكنولوجيا المعلومات والتحوّل الاجتماعي',
    blurb: 'من الصمامات المفرغة للحوسبة الكمومية، وإزاي كل نقلة غيّرت شكل حياتنا.',
    youtubeId: 'NHQFnpP84PE',
    summarySlug: 'second-bacc-lecture-1',
    homeworkSlug: 'second-bacc-lecture-1',
    examSlug: 'second-bacc-week-1',
    bookletUrl:
      'https://drive.google.com/file/d/1qI7Gm5zzdfXDiREFToNJxvDe7gb5KEgR/view?usp=drive_link',
  },
  {
    slug: 'lecture-2',
    grade: 'second_bacc',
    n: 2,
    eyebrow: 'المحاضرة الثانية',
    title: 'كيف يعمل الذكاء الاصطناعي',
    blurb: 'AI و ML و DL و التوليدي — مين جوّه مين، وليه الفرق ده بيتسأل في الامتحان.',
    youtubeId: 'jKc5wAX9Mv8',
    summarySlug: 'second-bacc-lecture-2',
    homeworkSlug: 'second-bacc-lecture-2',
    examSlug: 'second-bacc-week-2',
    bookletUrl:
      'https://drive.google.com/file/d/1HDdEdUxbTsmsmEc9k0P2vKWAQ_DF_Dgm/view?usp=drive_link',
  },
  {
    slug: 'lecture-3',
    grade: 'second_bacc',
    n: 3,
    eyebrow: 'المحاضرة الثالثة',
    title: 'الذكاء الاصطناعي في الحياة اليومية والصناعة',
    blurb:
      'AI شغّال فين فعلًا — التوصيات والترجمة والمصانع والمستشفيات — وبيبرع في إيه، وإيه اللي يتطلب حذر.',
    youtubeId: 'Lweb2IodrqQ',
    summarySlug: 'second-bacc-lecture-3',
    homeworkSlug: 'second-bacc-lecture-3',
    examSlug: 'second-bacc-week-3',
    bookletUrl:
      'https://drive.google.com/file/d/1YbRHa0DWyW1RSTmcDlOoj7buoeaNhIWm/view?usp=drive_link',
  },
  {
    slug: 'lecture-4',
    grade: 'second_bacc',
    n: 4,
    eyebrow: 'المحاضرة الرابعة',
    title: 'القضايا الأخلاقية المتعلقة بالذكاء الاصطناعي',
    blurb:
      'لو بيانات التدريب متحيزة النظام بيكرر تحيزها — التحيز والخصوصية ومين المسؤول، والمبادئ اللي تحكم استخدامه.',
    youtubeId: 'HMLv05wfJj4',
    summarySlug: 'second-bacc-lecture-4',
    homeworkSlug: 'second-bacc-lecture-4',
    bookletUrl:
      'https://drive.google.com/file/d/1M2cpmseXqaBWJnYex0Pmo46V77bM7yJx/view?usp=drive_link',
    // Exam paper lands with the Tuesday lesson.
  },

  // ── أولى ثانوي ────────────────────────────────────────────────────────────
  {
    slug: 'unit-1',
    grade: 'first_sec',
    n: 1,
    eyebrow: 'الوحدة الأولى',
    title: 'ما هي المعلومات؟',
    blurb: 'الوحدة كاملة، شرح وحل كتاب المدرسة.',
    youtubeId: 'pe182xHNFxg',
  },
  {
    slug: 'unit-2',
    grade: 'first_sec',
    n: 2,
    eyebrow: 'الوحدة الثانية',
    title: 'القوانين والحقوق في مجتمع المعلومات',
    blurb: 'الوحدة كاملة، شرح وحل كتاب المدرسة.',
    youtubeId: 'ROqnYtA1Mrk',
  },
]

export function lessonsFor(grade: Grade): readonly Lesson[] {
  return LESSONS.filter((l) => l.grade === grade).sort((a, b) => a.n - b.n)
}

export function findLesson(grade: Grade, slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.grade === grade && l.slug === slug)
}

/** Which grades have at least one lesson — used to build the two tabs. */
export function gradesWithLessons(): readonly Grade[] {
  return GRADES.map((g) => g.value).filter((g) => lessonsFor(g).length > 0)
}

// ── What a step looks like to the page ───────────────────────────────────────

export type StepKey = 'video' | 'summary' | 'homework' | 'exam' | 'booklet'

export type LessonStep = {
  key: StepKey
  n: number
  title: string
  /** What the student gets out of it. */
  body: string
  href?: string
  /** Shown under the title when the step exists — «٥٠ درجة», «٧ محاور». */
  meta?: string
  /**
   * `ready` links; `soon` is published but not yet made; `locked` exists and is
   * deliberately gated. They are three different messages and a student who
   * cannot tell them apart assumes the site is broken.
   */
  state: 'ready' | 'soon' | 'locked'
  /** Why it is not available — only for `soon` and `locked`. */
  note?: string
}

/**
 * Builds the four steps for a lesson, reading the real content so a count on
 * the page can never drift from the paper behind it.
 */
export function stepsFor(lesson: Lesson): LessonStep[] {
  const summary = lesson.summarySlug
    ? SUMMARIES.find((s) => s.slug === lesson.summarySlug)
    : undefined
  const homework = lesson.homeworkSlug
    ? HOMEWORK.find((h) => h.slug === lesson.homeworkSlug)
    : undefined

  return [
    {
      key: 'video',
      n: 1,
      title: 'اتفرّج على الدرس',
      body: 'الشرح كامل بالفيديو، وحل أسئلة الكتاب معاه.',
      state: 'ready',
      meta: 'فوق في الصفحة',
    },
    {
      key: 'summary',
      n: 2,
      title: 'ذاكر الملخص',
      body: 'نفس الدرس مكتوب ومرتّب — للمراجعة السريعة قبل الامتحان.',
      href: summary ? `/summary/${summary.slug}` : undefined,
      meta: summary ? `${toArabicDigits(summary.axes.length)} محاور` : undefined,
      state: summary ? 'ready' : 'soon',
      note: summary ? undefined : 'الملخص بينزل بعد المحاضرة بيوم.',
    },
    {
      key: 'homework',
      n: 3,
      title: 'حل الواجب',
      body: 'تصحيح فوري بالدرجة والإجابة النموذجية، والمقالي بيتصحّح بالمعنى.',
      href: homework ? `/homework/${homework.slug}` : undefined,
      meta: homework
        ? `${toArabicDigits(homework.mcq.length + homework.essay.length)} سؤال · ${toArabicDigits(homeworkMarks(homework))} درجة`
        : undefined,
      state: homework ? 'ready' : 'soon',
      note: homework ? undefined : 'الواجب بينزل مع الملخص.',
    },
    {
      key: 'exam',
      n: 4,
      title: 'امتحن نفسك',
      body: 'امتحان الحصة بنفس شكل الورقة — وبيتسجّل باسمك.',
      href: lesson.examSlug ? `/exam/${lesson.examSlug}` : undefined,
      meta: lesson.examSlug ? 'من ٢٠ درجة' : undefined,
      state: lesson.examSlug ? (homework ? 'locked' : 'soon') : 'soon',
      note: lesson.examSlug
        ? 'مفتوح للي خلّص الواجب — بتدخله برقم تليفونك.'
        : 'امتحان الحصة بينزل يوم المحاضرة الجاية.',
    },
    /**
     * The booklet sits LAST, after the exam, because it is not a step in the
     * sequence — it is the lesson on paper, for the student who wants to
     * revise away from a screen. Putting it earlier would interrupt a path
     * whose whole point is "watch, revise, practise, test".
     */
    {
      key: 'booklet',
      n: 5,
      title: 'نزّل الملزمة',
      body: 'المحاضرة مطبوعة PDF — للمذاكرة على الورق ومن غير نت.',
      href: lesson.bookletUrl,
      meta: lesson.bookletUrl ? 'PDF' : undefined,
      state: lesson.bookletUrl ? 'ready' : 'soon',
      note: lesson.bookletUrl ? undefined : 'الملزمة بتترفع بعد المحاضرة.',
    },
  ]
}
