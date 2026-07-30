/**
 * Asset Registry — the contract with Document 04 (Proof & Evidence Framework).
 *
 * Governing rule from the founder: we do not *claim* experience, we *prove* it.
 * Every credential below has a reserved photo/screenshot slot. While a slot is
 * `null` (or an empty array), the component renders NOTHING — never a
 * placeholder, never a "coming soon" (Principle 22). The site ships complete
 * with what exists today and upgrades the moment an asset lands.
 *
 * TO ADD AN ASSET LATER:
 *   1. Drop the file in /public/images.
 *   2. Fill the slot below. Nothing else changes.
 */

export type ImageAsset = {
  src: string
  alt: string
  width: number
  height: number
}

export type VideoAsset = {
  /** YouTube video id — we use a click-to-load facade, never an eager embed. */
  youtubeId: string
  title: string
}

export const assets = {
  /**
   * Hero banner — ✅ AVAILABLE.
   * Founder on the left, brand circuit motif on the right. Doubles as the
   * "am I in the right place?" continuity signal with the YouTube thumbnails.
   */
  hero: {
    src: '/images/hero.png',
    alt: 'مستر أنس أحمد — مهندس ذكاء اصطناعي وبرمجيات ومدرّس برمجة',
    width: 1376,
    height: 768,
  } as ImageAsset | null,

  // ---------------------------------------------------------------------------
  // PROOF OF TEACHING — photos from the places named on the site.
  // WHY: the student trusts recognisable places, not a job title.
  // ---------------------------------------------------------------------------
  /** Photos from teaching at iSchool / أشبال مصر الرقمية / رواد. */
  teachingPhotos: [] as ImageAsset[],

  /** Screenshot/photo proving engineer-training sessions in the software industry. */
  engineerTrainingProof: null as ImageAsset | null,

  // ---------------------------------------------------------------------------
  // PROOF OF INDUSTRY WORK — ✅ AVAILABLE
  // ---------------------------------------------------------------------------
  /** The three roles, on one banner: iSchool · Microsoft · iTech Solutions. */
  companiesBanner: {
    src: '/images/companies.jpeg',
    alt: 'iSchool — Coding Instructor · Microsoft — Software Engineer · iTech Solutions — AI Engineer',
    width: 1600,
    height: 396,
  } as ImageAsset | null,

  /** Photo at Microsoft — physical proof beats a logo list. */
  industryPhotos: [
    {
      src: '/images/microsoft.png',
      alt: 'مستر أنس أحمد داخل مقر Microsoft',
      width: 896,
      height: 1195,
    },
  ] as ImageAsset[],

  // ---------------------------------------------------------------------------
  // PROOF OF COMPETITIONS & COMMUNITY
  // ---------------------------------------------------------------------------
  /** Photos from ICPC / hackathon training. ⏳ not supplied yet. */
  competitionPhotos: [] as ImageAsset[],

  /** ✅ Codeforces profile showing the Expert rank. */
  codeforcesProof: {
    src: '/images/codeforces-expert.png',
    alt: 'حساب مستر أنس أحمد على Codeforces بمستوى Expert وتقييم 1645',
    width: 1107,
    height: 612,
  } as ImageAsset | null,

  /** ✅ LinkedIn profile — the reach itself is the proof. */
  linkedinProof: {
    src: '/images/linkedin-profile.png',
    alt: 'حساب مستر أنس أحمد على لينكدإن — أكثر من ٦٠٠٠ متابع',
    width: 889,
    height: 530,
  } as ImageAsset | null,

  // ---------------------------------------------------------------------------
  // PROOF OF THE SYSTEM
  // ---------------------------------------------------------------------------
  /** A real teaching clip — the strongest single proof for a student. */
  teachingSample: null as VideoAsset | null,

  /** The platform in real use: code → run → auto-grade → correction video. */
  platformDemo: null as VideoAsset | null,

  /** Stills of the platform, for visitors who will not play a video. Max 2. */
  platformStills: [] as ImageAsset[],

  /** Weekly parent report sample — the strongest single asset for a parent. */
  parentReportSample: null as ImageAsset | null,
} as const
