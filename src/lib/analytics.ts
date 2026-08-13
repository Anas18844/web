'use client'

import { track } from '@vercel/analytics'

/**
 * The V1 events (roadmap §3.1-هـ). Deliberately few: anything else is noise at
 * first-season traffic levels.
 *
 * `leadStarted` exists because the capture now saves on step one — without it
 * there is no way to see how many students give us a phone number and then
 * stop, which is the single number the two-step form was built to expose.
 */
export const events = {
  leadStarted: (intent: string, grade: string) => track('lead_started', { intent, grade }),
  leadSubmitted: (intent: string, grade: string) => track('lead_submitted', { intent, grade }),
  /**
   * Step two could not save the extra answers even after the recovery attempt.
   * The student still saw the confirmation — their name, phone and year are
   * safe from step one — but somebody has to know the rest went missing, and
   * a silent fallback with no signal is how a broken form stays broken.
   */
  leadRecoveryFailed: (intent: string, grade: string) =>
    track('lead_recovery_failed', { intent, grade }),
  whatsappClicked: (context: string) => track('whatsapp_clicked', { context }),
  proofViewed: (proof: string) => track('proof_viewed', { proof }),
}
