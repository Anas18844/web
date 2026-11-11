/**
 * The comprehensive exam now on the site — the one place its schedule and rules live.
 *
 * Unit 2 (owner, 2026-11-05): same system and rules as unit 1. Egypt left
 * daylight-saving time on the last Thursday of October, so November is +02:00.
 * Fri 6 Nov 20:00 → last start Sat 7 Nov 18:00 → closed 20:00 (extended, 65d0262).
 * Retake (owner, 2026-11-12), same paper and same rules, for the online students
 * who have not sat it yet: Fri 13 Nov 20:00 → last start Sat 14 Nov 16:00 →
 * closed 18:00. A number that already has an attempt gets that attempt back.
 *
 * History, unit 1:
 *
 * Plan: mr-anas-hq/brain/plans/2026-10-online-unit-exam/plan.md
 *
 * Every time here is an absolute instant with its offset written out. Egypt is
 * on daylight-saving time (UTC+3) until the last Thursday of October, so both
 * exam nights are +03:00. The server decides with these; the browser only
 * displays them.
 *
 * First sitting: Fri 9 Oct 20:00 → last start Sat 10 Oct 16:00 → closed 18:00.
 * Retake (owner, 2026-10-15), same paper and same rules, open to anyone:
 * Fri 16 Oct 20:00 → last start Sat 17 Oct 16:00 → closed 18:00. A number that
 * already has an attempt gets that attempt back, not a new one.
 */
export const UNIT_EXAM = {
  slug: 'unit-2',
  title: 'الامتحان الشامل للوحدة الثانية',
  unit: 'الوحدة الثانية · الأمن السيبراني',
  grade: 'الصف الثاني بكالوريا · البرمجة والذكاء الاصطناعي',

  /** The exam opens — the countdown on the page runs to this moment. */
  opensAt: '2026-11-13T20:00:00+02:00',
  /** Last moment a student may START, so everyone gets the full two hours. */
  lastStartAt: '2026-11-14T16:00:00+02:00',
  /** Nothing is accepted after this — same instant as the site announcement
   *  (SECOND_BACC_COMPREHENSIVE_EXAM.endsAt). lastStartAt + minutes must not pass it. */
  closesAt: '2026-11-14T18:00:00+02:00',

  minutes: 120,
  questions: 45,
  marks: 70,

  /** Shown to students who are not on the platform (fact BIZ-45). */
  outsiderDiscount: 20,
} as const

export const UNIT_EXAM_RULES: string[] = [
  'الوقت ساعتين كاملين، وبيبدأ أول ما تسجّل بياناتك وتدوس «ابدأ».',
  'لو النت قطع أو الموبايل قفل، ادخل تاني بنفس الرقم: هتلاقي امتحانك وإجاباتك، والوقت ماشي.',
  'إجاباتك بتتحفظ لوحدها أول بأول، ومش محتاج تدوس «حفظ».',
  'النسخ واللصق ممنوعين، وخروجك من صفحة الامتحان بيتسجّل.',
  'التصحيح مش فوري: الإجابات بتتصحح بعد الامتحان، والنتيجة بتوصلك على الواتساب.',
]

export const UNIT_EXAM_AI_WARNING =
  'الإجابات بتتراجع وقت التصحيح، وأي إجابة يظهر إنها منقولة من أداة ذكاء اصطناعي هيتخصم عليها أكتر من الإجابة الغلط. اكتب بأسلوبك، حتى لو إجابتك ناقصة.'

export type UnitExamPhase = 'before' | 'open' | 'late' | 'closed'

/** Where the exam stands at a given instant (server time). */
export function unitExamPhase(now: number): UnitExamPhase {
  // Local testing only: UNIT_EXAM_FORCE_PHASE=open opens the exam on the owner's
  // machine before the real time. Ignored in production.
  const forced = process.env.NODE_ENV !== 'production' ? process.env.UNIT_EXAM_FORCE_PHASE : undefined
  if (forced === 'before' || forced === 'open' || forced === 'late' || forced === 'closed') return forced
  if (now < Date.parse(UNIT_EXAM.opensAt)) return 'before'
  if (now < Date.parse(UNIT_EXAM.lastStartAt)) return 'open'
  if (now < Date.parse(UNIT_EXAM.closesAt)) return 'late'
  return 'closed'
}
