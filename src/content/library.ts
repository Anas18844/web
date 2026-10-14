import type { Grade } from '@/content/site'
import { LESSONS } from '@/content/lessons'

/**
 * الملازم وحل التقييمات — the free PDFs, in one place (October 2026).
 *
 * Until now a booklet was only reachable from inside its lesson page, as the
 * last step. That works for a student following one lecture, and fails the
 * student who wants "the unit 2 booklet" and does not know which lesson it hangs
 * off. The owner asked for a section of its own: open-source booklets anyone can
 * download and print, and the worked answers to the ministry's assessments.
 *
 * Lecture booklets are NOT retyped here: they are read from `LESSONS`, so a
 * booklet added to a lesson shows up on /booklets with nothing else to edit.
 *
 * `url` absent = announced but not uploaded yet. The page says «بتنزل قريب»
 * instead of linking to nothing, same as a lesson step.
 */

export type LibraryItem = {
  id: string
  grade: Grade
  title: string
  /** What is inside, in one line. */
  blurb: string
  /** Google Drive view link, or a path under /files on this site. */
  url?: string
  /** «٦٤ صفحة», «الوحدة كاملة» — a fact, not an adjective. */
  meta?: string
}

// ── الملازم ──────────────────────────────────────────────────────────────────

/** Whole-unit booklets and books, newest unit first. */
export const BOOKLETS: readonly LibraryItem[] = [
  {
    id: 'second-bacc-unit-2-practice',
    grade: 'second_bacc',
    title: 'كتاب تدريبات الوحدة الثانية — الأمن السيبراني',
    blurb: 'تدريبات كل درس: اختيار من متعدد ومقالي ورسومات، ومقارنات وصح وخطأ، وأسئلة مستويات عليا، ومراجعة مستمرة على الوحدة الأولى.',
    url: 'https://drive.google.com/file/d/1Aerg1ljeeIVio61t3nd-QCk3D5jL4cKr/view?usp=sharing',
    meta: 'تدريبات',
  },
  {
    id: 'second-bacc-unit-2',
    grade: 'second_bacc',
    title: 'ملزمة شرح الوحدة الثانية — الأمن السيبراني',
    blurb: 'الوحدة الثانية كاملة بترتيب الشرح: التشفير والمصادقة، وتصميم أمن الشبكات، والاستجابة للحوادث وإدارة المخاطر.',
    // Waiting on the owner's Drive link (the one sent on 2026-10-15 was the
    // unit 1 booklet's link pasted twice).
    url: undefined,
    meta: 'شرح',
  },
  {
    id: 'second-bacc-unit-1',
    grade: 'second_bacc',
    title: 'ملزمة الوحدة الأولى كاملة — تكنولوجيا المعلومات والمجتمع',
    blurb: 'الدروس الأربعة في ملزمة واحدة — للمذاكرة على الورق ومن غير نت.',
    url: 'https://drive.google.com/file/d/1UpyIKfNviAIPPf2RByik09BvSSd-ZITv/view?usp=drive_link',
    meta: 'الوحدة كاملة',
  },
  {
    id: 'second-bacc-practical-1',
    grade: 'second_bacc',
    title: 'ملزمة العملي — مراجعة كيريو JavaScript',
    blurb: 'الـ٣٠ فصل بترتيب الفيديو، وبنك توفاس، ونموذج الإجابة.',
    url: LESSONS.find((l) => l.slug === 'practical-1')?.bookletUrl,
    meta: 'العملي',
  },
]

/** One booklet per lecture, straight from the lesson list. */
export function lectureBooklets(grade: Grade): LibraryItem[] {
  return LESSONS.filter((l) => l.grade === grade && !l.kind && l.bookletUrl)
    .sort((a, b) => a.n - b.n)
    .map((l) => ({
      id: `${l.grade}-${l.slug}`,
      grade: l.grade,
      title: `${l.eyebrow} — ${l.title}`,
      blurb: l.blurb,
      url: l.bookletUrl,
    }))
}

// ── حل التقييمات ─────────────────────────────────────────────────────────────

/**
 * Worked answers to the MINISTRY's assessments — not to our own banks, whose
 * keys stay server-only behind `homework.ts`.
 *
 * First-sec files are hosted on this site under /files/answers; they are built
 * in mr-anas-hq (curriculum/first-sec/ministry-weekly-evals). Each page puts
 * the ministry sheet beside its answers.
 */
export const ANSWER_KEYS: readonly LibraryItem[] = [
  // تانية بكالوريا
  {
    id: 'second-bacc-unit-1-assessments',
    grade: 'second_bacc',
    title: 'حل كتاب التقييمات — الوحدة الأولى',
    blurb: 'نموذج إجابة كل أسئلة كتاب تقييمات الوزارة للوحدة الأولى، مع سبب كل إجابة.',
    url: LESSONS.find((l) => l.slug === 'unit-1-review')?.answerKeyUrl,
    meta: 'الوحدة الأولى',
  },
  {
    id: 'second-bacc-unit-2-assessments',
    grade: 'second_bacc',
    title: 'حل كتاب التقييمات — الوحدة الثانية',
    blurb: 'نموذج إجابة تقييمات الوزارة للوحدة الثانية — الأمن السيبراني.',
    url: undefined,
    meta: 'الوحدة الثانية',
  },

  // أولى ثانوي — the ministry's weekly assessments, term 1
  {
    id: 'first-sec-week-1',
    grade: 'first_sec',
    title: 'حل التقييم الأسبوعي — الأسبوع الأول',
    blurb: 'المعلومات والوسائط، وأخلاقيات المعلومات، والبيانات الشخصية.',
    url: '/files/answers/first-sec/week-1.pdf',
    meta: '١٨ سؤال',
  },
  {
    id: 'first-sec-week-2',
    grade: 'first_sec',
    title: 'حل التقييم الأسبوعي — الأسبوع الثاني',
    blurb: 'الملكية الفكرية، واستخدام المعلومات، وتهديدات أمن المعلومات.',
    url: '/files/answers/first-sec/week-2.pdf',
    meta: '٣١ سؤال',
  },
  {
    id: 'first-sec-week-3',
    grade: 'first_sec',
    title: 'حل التقييم الأسبوعي — الأسبوع الثالث',
    blurb: 'أمن المعلومات وتقنياته، والنظام الثنائي وكمية البيانات.',
    url: '/files/answers/first-sec/week-3.pdf',
    meta: '٣١ سؤال',
  },
  {
    id: 'first-sec-week-4',
    grade: 'first_sec',
    title: 'حل التقييم الأسبوعي — الأسبوع الرابع',
    blurb: 'النظام السادس عشر، والتمثيل الرقمي للأحرف.',
    url: '/files/answers/first-sec/week-4.pdf',
    meta: '٣١ سؤال',
  },
]

export function itemsFor(list: readonly LibraryItem[], grade: Grade): LibraryItem[] {
  return list.filter((i) => i.grade === grade)
}
