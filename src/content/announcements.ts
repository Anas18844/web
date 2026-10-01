/**
 * Time-boxed notices — an exam window, a schedule change.
 *
 * Each one carries its own end time and stops rendering after it, so a notice
 * can never outlive the thing it announces just because nobody remembered to
 * delete it. The pages are static, so that check runs in the browser
 * (`ExamNotice`), not at build time.
 *
 * Times are Cairo time with an explicit offset: Egypt is on summer time
 * (UTC+3) until the last Thursday of October.
 */

export type ExamAnnouncement = {
  /** Short line for the bar across the top of every page. */
  short: string
  /** The full sentence, for the lesson page it belongs to. */
  title: string
  body: string
  /** Where the bar sends the student. */
  href: string
  /** The lesson page that shows the full notice: `${gradeSlug}/${lessonSlug}`. */
  lessonPath: string
  /** ISO with offset. After this the notice disappears everywhere. */
  endsAt: string
}

export const SECOND_BACC_COMPREHENSIVE_EXAM: ExamAnnouncement = {
  short: 'الامتحان الشامل لتانية بكالوريا على الموقع: من الجمعة ٩ أكتوبر ٨ مساءً لحد السبت ١٠ أكتوبر ٦ مساءً',
  title: 'الامتحان الشامل هيكون على الموقع',
  body: 'من يوم الجمعة ٩ أكتوبر الساعة ٨ مساءً، لحد يوم السبت ١٠ أكتوبر الساعة ٦ مساءً. راجع الوحدة وحل البنك قبله.',
  href: '/lessons/second-bacc/unit-1-review',
  lessonPath: 'second-bacc/unit-1-review',
  endsAt: '2026-10-10T18:00:00+03:00',
}
