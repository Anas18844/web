/**
 * Notices — an exam window, a change in where lessons are published.
 *
 * A time-boxed one carries its own end time and stops rendering after it, so
 * it can never outlive the thing it announces just because nobody remembered
 * to delete it. The pages are static, so that check runs in the browser
 * (`Notice`), not at build time. Without `endsAt` a notice stays until it is
 * removed from this file.
 *
 * Times are Cairo time with an explicit offset: Egypt is on summer time
 * (UTC+3) until the last Thursday of October.
 */

export type Announcement = {
  /** Short line for the bar across the top of every page. */
  short: string
  /** The full notice, for the pages it belongs to. */
  title: string
  body: string
  /** Where the bar (and the card's button, if any) sends the student. */
  href: string
  /** Button on the card. Absent: the card is text only. */
  cta?: string
  /** ISO with offset. After this the notice disappears everywhere. */
  endsAt?: string
}

export const SECOND_BACC_COMPREHENSIVE_EXAM: Announcement = {
  short: 'الامتحان الشامل لتانية بكالوريا على الموقع: بيفتح الجمعة ٩ أكتوبر ٨ مساءً، وآخر بداية السبت ١٠ أكتوبر ٤ العصر · ادخل من هنا',
  title: 'الامتحان الشامل للوحدة الأولى على الموقع',
  body: 'ساعتين من لحظة ما تبدأ، و٤٥ سؤال وسؤال بونص. بيفتح الجمعة ٩ أكتوبر الساعة ٨ مساءً، وآخر ميعاد تبدأ فيه السبت ١٠ أكتوبر الساعة ٤ العصر عشان تاخد الساعتين كاملين. ادخل باسمك الثلاثي ورقم موبايلك، ولو النت قطع ارجع بنفس الاسم والرقم هتلاقي امتحانك. راجع الوحدة وحل البنك قبله.',
  href: '/exam/unit-1',
  cta: 'ادخل صفحة الامتحان',
  // The bar goes when no one can start any more (UNIT_EXAM.lastStartAt).
  // Students already inside keep their two hours on the exam page itself.
  endsAt: '2026-10-10T16:00:00+03:00',
}

/**
 * From October 2026 second-bacc lectures go up on Code Up only. The site keeps
 * the unit reviews and the practical (العملي) for that grade, and the lectures
 * already up stay up.
 */
export const SECOND_BACC_MOVED_TO_CODE_UP: Announcement = {
  short: 'خبر مهم لتانية بكالوريا: المحاضرات الجاية هتنزل على منصة كود أب، والموقع للمراجعات والعملي بس',
  title: 'خبر مهم لطلاب تانية بكالوريا',
  body: 'للأسف، مفيش دروس جديدة هتنزل على الموقع لتانية بكالوريا غير المراجعات والعملي. المحاضرات من هنا ورايح هتنزل على منصة كود أب (Code Up).',
  href: '/platform',
  cta: 'اعرف إزاي تشترك في منصة كود أب',
}

/** Top bar, in order. Expired ones hide themselves. */
export const SITE_NOTICES: readonly Announcement[] = [
  SECOND_BACC_MOVED_TO_CODE_UP,
  SECOND_BACC_COMPREHENSIVE_EXAM,
]
