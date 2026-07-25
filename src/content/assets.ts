/**
 * Asset Registry — the contract with Document 04 (Proof & Evidence Framework).
 *
 * Every proof asset has a reserved slot here. While a slot is `null`, the
 * component that uses it renders NOTHING — never a placeholder, never a
 * "coming soon" (Doc 04 §1.6 / Principle 22). The site ships complete with
 * whatever exists today and upgrades the moment an asset lands.
 *
 * TO ADD AN ASSET LATER:
 *   1. Drop the file in /public/images (or note the YouTube id).
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
   * Founder portrait — Layer 1, immediate identity.
   * WHY: visual continuity with the YouTube thumbnails is the proof that the
   * visitor is "in the right place" (Doc 01, stage 2).
   */
  founderPortrait: null as ImageAsset | null,

  /**
   * Teaching sample — the single most important proof asset for students.
   * WHY: watching him teach is the only undebatable evidence of teaching
   * ability (Doc 04 §2.1, rank 1).
   */
  teachingSample: null as VideoAsset | null,

  /**
   * Platform in real use (code → run → auto-grade → correction video).
   * WHY: turns "we have a platform" from a market cliché into a scene no
   * competitor owns (Doc 04 §2.1, rank 2).
   */
  platformDemo: null as VideoAsset | null,

  /**
   * Stills of the platform — for visitors who will not play a video.
   * Keep to a maximum of two (Doc 04 §3.5 — dosage rule).
   */
  platformStills: [] as ImageAsset[],

  /**
   * Weekly parent report sample — the strongest single asset for parents.
   * WHY: makes the core promise to the parent tangible (Doc 04 §2.2, rank 1).
   * NOTE: any real student data must be blurred or consented.
   */
  parentReportSample: null as ImageAsset | null,

  /**
   * A photo from a real session at the centre.
   * WHY: physical presence reads as seriousness in this market.
   */
  sessionPhoto: null as ImageAsset | null,
} as const

/** Named centres, once contracts are confirmed. Empty = generic copy is used. */
export const centres: { name: string; area: string }[] = []
