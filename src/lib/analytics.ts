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
   * The step-one early save failed and the form moved on without it — the
   * complete lead goes out at the end of step two instead. A spike in this
   * event means a server is refusing step-one payloads (stale deploy, dead
   * DB) even though students are still getting through.
   */
  leadStep1Deferred: (intent: string, grade: string) =>
    track('lead_step1_deferred', { intent, grade }),
  /**
   * Step two could not save the extra answers even after the recovery attempt.
   * The student still saw the confirmation — their name, phone and year are
   * safe from step one — but somebody has to know the rest went missing, and
   * a silent fallback with no signal is how a broken form stays broken.
   */
  leadRecoveryFailed: (intent: string, grade: string) =>
    track('lead_recovery_failed', { intent, grade }),
  /**
   * Nothing reached the server, so the lead went into the on-device outbox to
   * be delivered later. The student was confirmed — correctly, their part is
   * done — but this number rising means the API is refusing writes and needs
   * looking at, not that students are dropping out.
   */
  leadQueued: (intent: string, grade: string) => track('lead_queued', { intent, grade }),
  whatsappClicked: (context: string) => track('whatsapp_clicked', { context }),
  proofViewed: (proof: string) => track('proof_viewed', { proof }),
}
