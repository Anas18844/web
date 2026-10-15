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
  /** The unit it belongs to. Absent: the practical, or a weekly sheet. */
  unit?: number
  /** What it is, for the label on the row: شرح · تدريبات · حل التقييمات … */
  kind: 'explain' | 'practice' | 'answers' | 'lecture' | 'practical' | 'weekly'
}

// ── الملازم ──────────────────────────────────────────────────────────────────

/** Whole-unit booklets and books, newest unit first. */
export const BOOKLETS: readonly LibraryItem[] = [
  {
    id: 'second-bacc-unit-2-practice',
    unit: 2, kind: 'practice',
    grade: 'second_bacc',
    title: 'كتاب تدريبات الوحدة الثانية — الأمن السيبراني',
    blurb: 'تدريبات كل درس: اختيار من متعدد ومقالي ورسومات، ومقارنات وصح وخطأ، وأسئلة مستويات عليا، ومراجعة مستمرة على الوحدة الأولى.',
    url: 'https://drive.google.com/file/d/1Aerg1ljeeIVio61t3nd-QCk3D5jL4cKr/view?usp=sharing',
    meta: 'تدريبات',
  },
  {
    id: 'second-bacc-unit-2',
    unit: 2, kind: 'explain',
    grade: 'second_bacc',
    title: 'ملزمة شرح الوحدة الثانية — الأمن السيبراني',
    blurb: 'الوحدة الثانية كاملة بترتيب الشرح: التشفير والمصادقة، وتصميم أمن الشبكات، والاستجابة للحوادث وإدارة المخاطر.',
    // Hosted here, not on Drive: no Drive access from the build machine
    // (2026-10-15). Built in mr-anas-hq, curriculum/second-bacc/u2-cybersecurity/booklet.
    url: '/files/booklets/second-bacc-unit-2.pdf',
    meta: '٤٧ صفحة · شرح'
  },
  {
    id: 'second-bacc-unit-1',
    unit: 1, kind: 'explain',
    grade: 'second_bacc',
    title: 'ملزمة الوحدة الأولى كاملة — تكنولوجيا المعلومات والمجتمع',
    blurb: 'الدروس الأربعة في ملزمة واحدة — للمذاكرة على الورق ومن غير نت.',
    url: 'https://drive.google.com/file/d/1UpyIKfNviAIPPf2RByik09BvSSd-ZITv/view?usp=drive_link',
    meta: 'الوحدة كاملة',
  },
  {
    id: 'second-bacc-practical-1',
    kind: 'practical',
    grade: 'second_bacc',
    title: 'ملزمة العملي — مراجعة كيريو JavaScript',
    blurb: 'الـ٣٠ فصل بترتيب الفيديو، وبنك توفاس، ونموذج الإجابة.',
    url: LESSONS.find((l) => l.slug === 'practical-1')?.bookletUrl,
    meta: 'العملي',
  },

  // أولى ثانوي — one booklet per unit: a short summary, 40 questions, the answers,
  // and a QR to the unit's video. Built in mr-anas-hq, curriculum/first-sec/<unit>/booklet.
  {
    id: 'first-sec-unit-3',
    unit: 3, kind: 'explain',
    grade: 'first_sec',
    title: 'ملزمة الوحدة الثالثة — أمن المعلومات',
    blurb: 'ملخص بسيط للدروس الخمسة صفحة لكل درس، و٤٠ سؤال (٣٠ اختيار من متعدد و١٠ صح أو خطأ) بالإجابات، وكود يفتح فيديو الشرح.',
    url: '/files/booklets/first-sec-unit-3.pdf',
    meta: '١٢ صفحة · ملخص + ٤٠ سؤال',
  },
  {
    id: 'first-sec-unit-2',
    unit: 2, kind: 'explain',
    grade: 'first_sec',
    title: 'ملزمة الوحدة الثانية — القوانين والحقوق في مجتمع المعلومات',
    blurb: 'ملخص بسيط للدروس التلاتة صفحة لكل درس، و٤٠ سؤال (٣٠ اختيار من متعدد و١٠ صح أو خطأ) بالإجابات، وكود يفتح فيديو الشرح.',
    url: '/files/booklets/first-sec-unit-2.pdf',
    meta: '١٠ صفحات · ملخص + ٤٠ سؤال',
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
      unit: l.unit,
      kind: 'lecture' as const,
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
    unit: 1, kind: 'answers',
    grade: 'second_bacc',
    title: 'حل كتاب التقييمات — الوحدة الأولى',
    blurb: 'نموذج إجابة كل أسئلة كتاب تقييمات الوزارة للوحدة الأولى، مع سبب كل إجابة.',
    url: LESSONS.find((l) => l.slug === 'unit-1-review')?.answerKeyUrl,
    meta: 'الوحدة الأولى',
  },
  // Units 2–4: built 2026-10-15 in mr-anas-hq (templates/ministry-eval), hosted
  // here because there is no Drive access from the build machine.
  {
    id: 'second-bacc-unit-2-assessments',
    unit: 2, kind: 'answers',
    grade: 'second_bacc',
    title: 'حل كتاب التقييمات — الوحدة الثانية',
    blurb: 'نموذج إجابة الأداءات والتقييمات للوحدة الثانية — الأمن السيبراني، الدروس التلاتة.',
    url: '/files/answers/second-bacc/unit-2.pdf',
    meta: 'الوحدة الثانية · ٢٩ صفحة',
  },
  {
    id: 'second-bacc-unit-3-assessments',
    unit: 3, kind: 'answers',
    grade: 'second_bacc',
    title: 'حل كتاب التقييمات — الوحدة الثالثة',
    blurb: 'نموذج إجابة الأداءات والتقييمات للوحدة الثالثة — تطبيقات الويب، الدروس التلاتة.',
    url: '/files/answers/second-bacc/unit-3.pdf',
    meta: 'الوحدة الثالثة · ٢٦ صفحة',
  },
  {
    id: 'second-bacc-unit-4-assessments',
    unit: 4, kind: 'answers',
    grade: 'second_bacc',
    title: 'حل كتاب التقييمات — الوحدة الرابعة',
    blurb: 'نموذج إجابة الأداءات والتقييمات للوحدة الرابعة — تصميم الويب والوسائط، الدروس الأربعة.',
    url: '/files/answers/second-bacc/unit-4.pdf',
    meta: 'الوحدة الرابعة · ٤٠ صفحة',
  },

  // أولى ثانوي — the ministry's weekly assessments, term 1
  {
    id: 'first-sec-week-1',
    kind: 'weekly',
    grade: 'first_sec',
    title: 'حل التقييم الأسبوعي — الأسبوع الأول',
    blurb: 'المعلومات والوسائط، وأخلاقيات المعلومات، والبيانات الشخصية.',
    url: '/files/answers/first-sec/week-1.pdf',
    meta: '١٨ سؤال',
  },
  {
    id: 'first-sec-week-2',
    kind: 'weekly',
    grade: 'first_sec',
    title: 'حل التقييم الأسبوعي — الأسبوع الثاني',
    blurb: 'الملكية الفكرية، واستخدام المعلومات، وتهديدات أمن المعلومات.',
    url: '/files/answers/first-sec/week-2.pdf',
    meta: '٣١ سؤال',
  },
  {
    id: 'first-sec-week-3',
    kind: 'weekly',
    grade: 'first_sec',
    title: 'حل التقييم الأسبوعي — الأسبوع الثالث',
    blurb: 'أمن المعلومات وتقنياته، والنظام الثنائي وكمية البيانات.',
    url: '/files/answers/first-sec/week-3.pdf',
    meta: '٣١ سؤال',
  },
  {
    id: 'first-sec-week-4',
    kind: 'weekly',
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

const KIND_ORDER: LibraryItem['kind'][] = ['explain', 'practice', 'answers', 'lecture', 'practical', 'weekly']

/** Everything of one grade and one unit: the booklet, the practice book, then the answer key. */
export function unitItems(grade: Grade, unit: number): LibraryItem[] {
  return [...BOOKLETS, ...ANSWER_KEYS]
    .filter((i) => i.grade === grade && i.unit === unit)
    .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind))
}

export const KIND_LABEL: Record<LibraryItem['kind'], string> = {
  explain: 'ملزمة الشرح',
  practice: 'كتاب التدريبات',
  answers: 'حل التقييمات',
  lecture: 'ملزمة المحاضرة',
  practical: 'العملي',
  weekly: 'تقييم أسبوعي',
}
