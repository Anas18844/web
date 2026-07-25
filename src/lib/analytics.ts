'use client'

import { track } from '@vercel/analytics'

/**
 * The three V1 events (roadmap §3.1-هـ). Deliberately no more than three:
 * anything else is noise at first-season traffic levels.
 */
export const events = {
  leadSubmitted: (intent: string, grade: string) => track('lead_submitted', { intent, grade }),
  whatsappClicked: (context: string) => track('whatsapp_clicked', { context }),
  proofViewed: (proof: string) => track('proof_viewed', { proof }),
}
