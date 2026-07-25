/**
 * Site configuration — identity, contact points, and the copy that depends on
 * decisions still open with the founder.
 *
 * Everything here is editable through the GitHub web UI without a developer.
 */

export const site = {
  /** Approved name (brand_identity §1). The old name is kept only as an entity alias. */
  name: 'مستر أنس أحمد',
  nameEn: 'Mr. Anas Ahmed',
  /** Retired names — used ONLY as schema.org alternateName so old searches still resolve. */
  formerNames: ['م. أنس أحمد', 'Eng. Anas Ahmed'],

  motto: 'بنحل مشكلة',

  subject: 'البرمجة والذكاء الاصطناعي',
  audience: 'طلاب البكالوريا — مسار الهندسة وعلوم الحاسب',

  /**
   * ⚠️ OPEN DECISION #1 (roadmap §2.1): the final domain is not settled.
   * Until it is, this reads from the environment and falls back to the Vercel
   * preview URL. Do not publish the link externally before the decision.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000'),

  whatsapp: {
    /** International format, digits only — used to build wa.me links. */
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '201039356737',
    display: '0103 935 6737',
  },

  channels: {
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || '',
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || '',
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || '',
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
    telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL || '',
  },

  /**
   * ⚠️ OPEN DECISION #4 (roadmap §2.1): the published response-time promise (SLA).
   * The wording below is deliberately non-numeric until the founder commits to a
   * number. Replace with e.g. 'وهنرد عليك خلال ٢٤ ساعة' the moment it is decided —
   * a published promise must always be kept (Principle 10).
   */
  responsePromise: 'وهنتواصل معاك على الواتساب في أقرب وقت',
} as const

/** Grade options for the capture form (Doc 05 — routing depends on this field). */
export const GRADES = [
  { value: 'second', label: 'تانية ثانوي' },
  { value: 'first', label: 'أولى ثانوي' },
  { value: 'other', label: 'غير كده' },
] as const

/** Capture intents. Each form instance declares which one it serves. */
export const INTENTS = {
  curriculum: 'تحليل المنهج أول ما ينزل',
  intro_session: 'حجز مقعد في الحصة التعريفية',
  updates: 'إشعارات قرارات الوزارة',
  parent: 'تواصل ولي أمر',
} as const

export type Intent = keyof typeof INTENTS
export type Grade = (typeof GRADES)[number]['value']

/** Builds a wa.me link carrying the page context, so the reply starts informed. */
export function whatsappLink(context: string): string {
  const message = `السلام عليكم، أنا جاي من الموقع (${context}) وحابب أعرف تفاصيل أكتر.`
  return `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`
}
