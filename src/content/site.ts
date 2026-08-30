/**
 * Site configuration — identity, contact points, audience, and credentials.
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
    /**
     * The announcements CHANNEL — one-way, not a group.
     *
     * The distinction matters for what the site is allowed to say about it:
     * a student who follows this does not join a room where other students can
     * see them, and their number is not shown to anyone. Calling it a "group"
     * would promise the opposite of what it does.
     *
     * Offered at the end of the form, where it is the natural next step rather
     * than a second thing competing with the one action the page wants.
     */
    channel:
      process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL ||
      'https://whatsapp.com/channel/0029VbDIp68HQbS2zYldQ317',
  },

  email: process.env.NEXT_PUBLIC_EMAIL || 'eng.anas.ai.official@gmail.com',

  /**
   * Official channels — all published under the same handle: Mr Anas Ahmed.
   *
   * Defaults are hardcoded so the site is correct out of the box; the env vars
   * exist only as an override. These same URLs feed the entity's `sameAs`,
   * which is what ties the accounts together for search engines and LLMs.
   *
   * NOTE: the LinkedIn vanity URL genuinely contains a 🍉 emoji. It is
   * percent-encoded here (%F0%9F%8D%89) so the href stays valid everywhere.
   */
  channels: {
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || 'https://youtube.com/@MrAnasAhmedOfficial',
    linkedin:
      process.env.NEXT_PUBLIC_LINKEDIN_URL ||
      'https://www.linkedin.com/in/anas-ahmed-%F0%9F%8D%89-1805a7243',
    facebook:
      process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://www.facebook.com/MrAnasAhmedOfficial/',
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || 'https://www.tiktok.com/@mranasahmedofficial',
    instagram:
      process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://www.instagram.com/mranasahmedofficial/',
    telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL || '',
  },

  /**
   * ⚠️ OPEN DECISION #4 (roadmap §2.1): the published response-time promise (SLA).
   * Non-numeric until the founder commits to a number — a published promise
   * must always be kept (Principle 10).
   */
  /* `responsePromise` was removed in August 2026 along with the sentence it
     completed. It promised a response time on the confirmation screen, which
     is the one place a promise like that is read as a countdown. */
} as const

/**
 * Where the teaching happened and where the engineering work happens.
 *
 * This is the core trust device on the site: the student does not trust a job
 * title, they trust places they recognise. Names only for now — each entry has
 * a slot for a logo/photo in `assets.ts` and appears the moment one exists.
 */
export const institutions = {
  teaching: [
    { name: 'iSchool', note: 'تدريب وتدريس برمجة' },
    { name: 'أشبال مصر الرقمية', note: 'مبادرة قومية لتعليم البرمجة' },
    { name: 'رواد', note: 'تدريب وتدريس' },
  ],
  industry: [
    { name: 'Microsoft Egypt', note: 'هندسة برمجيات وذكاء اصطناعي' },
    { name: 'iSchool', note: 'أنظمة وتقنيات تعليمية' },
    { name: 'ميم سكول', note: 'منتجات تعليمية رقمية' },
    { name: 'iTech Solutions', note: 'أنظمة ERP وذكاء اصطناعي' },
  ],
} as const

/** Grades offered in the capture form. */
export const GRADES = [
  { value: 'first_sec', label: 'أولى ثانوي' },
  { value: 'second_bacc', label: 'تانية بكالوريا' },
] as const

/** Attendance mode. Choosing `center` reveals the branch question. */
export const ATTENDANCE = [
  { value: 'online', label: 'أونلاين' },
  { value: 'center', label: 'سنتر' },
] as const

/**
 * Centre branches — asked only when attendance is `center`.
 *
 * `closed` marks a branch that has filled up. It stays in the list and is
 * still shown, because the list is also the only place the site says where
 * these centres ARE — removing a full branch would tell a student in حدائق
 * حلوان that we are not in their area at all, which is both untrue and the
 * more expensive mistake.
 *
 * The public form renders these as disabled options and says nothing about
 * why. The DASHBOARD ignores the flag entirely: the team still has to be able
 * to record a student at a full branch, whether that is someone already
 * enrolled or a name being kept for when a place opens.
 */
export const BRANCHES = [
  { value: 'helwan', label: 'حلوان' },
  { value: 'hadayek_helwan', label: 'حدائق حلوان', closed: true },
  { value: 'may15', label: 'مدينة ١٥ مايو', closed: true },
  { value: 'other', label: 'مكان تاني' },
] as const

/**
 * Acquisition source. This is the only reliable answer to "which channel
 * actually brings students" — analytics alone cannot see word of mouth.
 */
export const HEARD_FROM = [
  { value: 'facebook', label: 'فيسبوك' },
  { value: 'youtube', label: 'يوتيوب' },
  { value: 'google', label: 'جوجل' },
  { value: 'tiktok', label: 'تيك توك' },
  { value: 'friend', label: 'صديق' },
  { value: 'other', label: 'مكان تاني' },
] as const

/** Capture intents. Each form instance declares which one it serves. */
export const INTENTS = {
  curriculum: 'ابدأ معانا',
  intro_session: 'حجز مقعد في الحصة التعريفية',
  updates: 'إشعارات ومستجدات',
  parent: 'تواصل ولي أمر',
} as const

export type Intent = keyof typeof INTENTS
export type Grade = (typeof GRADES)[number]['value']
export type Attendance = (typeof ATTENDANCE)[number]['value']
export type Branch = (typeof BRANCHES)[number]['value']
export type HeardFrom = (typeof HEARD_FROM)[number]['value']

/** Builds a wa.me link carrying the page context, so the reply starts informed. */
export function whatsappLink(context: string): string {
  const message = `السلام عليكم، أنا جاي من الموقع (${context}) وحابب أعرف تفاصيل أكتر.`
  return `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`
}
