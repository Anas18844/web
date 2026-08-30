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

  /* `platformDemo` and `platformStills` were removed with the /platform page —
     nothing renders them any more, and an asset slot nothing reads is a slot
     someone eventually fills for nothing. */

  /** Weekly parent report sample — the strongest single asset for a parent. */
  parentReportSample: null as ImageAsset | null,

  /**
   * The WhatsApp channel's own picture, shown on the confirmation screen.
   *
   * It has to be the SAME image the channel itself uses. A student taps
   * "تابع القناة" and lands in WhatsApp a second later; if the picture there
   * does not match the one they just tapped, the moment reads as a wrong link
   * rather than as arriving — and this is the one screen where a student has
   * already trusted us with a phone number.
   *
   * Square, because WhatsApp crops channel pictures to a circle and anything
   * else loses its edges. NULL until the file lands, and the card renders
   * perfectly well without it.
   *
   * ✅ AVAILABLE — the same portrait the channel itself uses, resized to 512
   * and flattened onto the brand navy (the source carried an alpha channel,
   * and a transparent pixel behind a circular crop is the sort of thing that
   * looks fine everywhere except the one browser that fills it white).
   */
  whatsappChannel: {
    src: '/images/whatsapp-channel.png',
    alt: 'قناة مستر أنس أحمد على واتساب',
    width: 512,
    height: 512,
  } as ImageAsset | null,
} as const
