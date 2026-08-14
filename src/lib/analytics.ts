'use client'

import { track } from '@vercel/analytics'

/**
 * The measurement layer.
 *
 * Every event on this site leaves through this file and nowhere else, and it
 * leaves through two doors at once:
 *
 *   1. `dataLayer` — read by Google Tag Manager (GTM-NVTM4X76). GA4, the Meta
 *      pixel, the TikTok pixel and anything else are configured INSIDE the GTM
 *      container, mapped onto the event names below. That is why this codebase
 *      contains exactly one tracking snippet: adding an ad platform is a change
 *      in GTM, not a deploy, and there is no way to end up double-counting a
 *      conversion because two SDKs both decided to own it.
 *   2. Vercel Analytics — product analytics, kept separate on purpose. It is
 *      the number we trust when an ad platform reports something flattering.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE RULE THAT SHAPES THIS FILE
 *
 * The privacy policy says, in the site's own words: «البيانات دي مش بتتباع ولا
 * بتتشارك مع أي طرف تاني لأي سبب». The dataLayer is read by GTM, and GTM
 * forwards to Google, Meta and TikTok. So a student's name or phone number
 * reaching the dataLayer — even hashed, even for "advanced matching" — would
 * make that sentence false.
 *
 * So it is not left to whoever writes the next `events.x()` call to remember.
 * `redact()` below strips identifying keys from every payload on the way out,
 * and shouts in development if one was ever passed. What ships is the SHAPE of
 * the funnel — which step, which year group, which page, which campaign — and
 * never who walked through it.
 * ─────────────────────────────────────────────────────────────────────────────
 */

type Value = string | number | boolean | undefined
export type Payload = Record<string, Value>

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

/**
 * Anything whose NAME suggests it identifies a person. Matched on the key, not
 * the value, because a key is the thing a future caller controls and the thing
 * a reviewer reads. `note` is in here because it is a free-text box: whatever a
 * student types in it is unknowable in advance, which makes it the one field
 * that can contain literally anything.
 */
const IDENTIFYING = /name|phone|whatsapp|mobile|email|mail|note|address|birth|nationalid/i

function redact(payload: Payload): Payload {
  const clean: Payload = {}

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === '') continue

    if (IDENTIFYING.test(key)) {
      if (process.env.NODE_ENV !== 'production') {
        // Loud in development, silent in production: a mistake here has to be
        // impossible to miss while building, and impossible to notice while a
        // student is using the site.
        console.error(
          `[analytics] "${key}" looks like personal data and was dropped. ` +
            `Nothing identifying may enter the dataLayer — see src/lib/analytics.ts.`,
        )
      }
      continue
    }

    clean[key] = typeof value === 'string' ? value.slice(0, 100) : value
  }

  return clean
}

/**
 * The single exit. Both destinations are wrapped: analytics must never be able
 * to throw into a click handler, because the click that matters most on this
 * site is the one that submits a lead.
 */
export function emit(event: string, payload: Payload = {}): void {
  if (typeof window === 'undefined') return

  const data = redact(payload)

  try {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event, ...data })
  } catch {
    /* A blocked or overwritten dataLayer is not a reason to break a form. */
  }

  try {
    track(event, data as Record<string, string | number | boolean | null>)
  } catch {
    /* Same. */
  }
}

/**
 * The event vocabulary. Anything GTM listens for is named here, so the list a
 * person configures triggers against and the list the code can actually fire
 * are the same list.
 *
 * ── The two that pay for the ads ──
 *   lead_started    — step one saved. A real phone number exists in the
 *                     database. This is the conversion worth optimising ad
 *                     delivery against: it fires for every student who gets
 *                     that far, including the ones who never finish step two.
 *   lead_submitted  — the whole form is in.
 *
 * Everything else is diagnostics or funnel shape.
 */
export const events = {
  // ── The funnel ────────────────────────────────────────────────────────────
  /** A primary call to action was clicked. `location` says which one. */
  ctaClicked: (location: string) => emit('cta_click', { location }),

  /** The capture form came into view — the denominator for form drop-off. */
  formViewed: (pageContext: string) => emit('form_viewed', { pageContext }),

  /**
   * Validation stopped a submit. `fields` is the list of field names that
   * failed — the names of our own inputs, never their contents. If one field
   * dominates this event, that field is written wrong, not filled in wrong.
   */
  formRejected: (step: 1 | 2, fields: readonly string[]) =>
    emit('form_rejected', { step, fields: fields.join(',') }),

  /** Step one saved: name, phone and year are in the database. */
  leadStarted: (intent: string, grade: string) => emit('lead_started', { intent, grade }),

  /** Step two is on screen — the student cleared the first gate. */
  leadStep2Reached: (intent: string, grade: string) =>
    emit('lead_step2_reached', { intent, grade }),

  /** The whole form is in. */
  leadSubmitted: (intent: string, grade: string) => emit('lead_submitted', { intent, grade }),

  // ── Diagnostics: these count failures, not people ─────────────────────────
  /**
   * The step-one early save failed and the form moved on without it — the
   * complete lead goes out at the end of step two instead. A spike here means
   * a server is refusing step-one payloads (stale deploy, dead DB) even though
   * students are still getting through, which is the failure that hides.
   */
  leadStep1Deferred: (intent: string, grade: string) =>
    emit('lead_step1_deferred', { intent, grade }),

  /**
   * Step two could not save the extra answers even after the recovery attempt.
   * The student still saw the confirmation — their name, phone and year are
   * safe from step one — but somebody has to know the rest went missing.
   */
  leadRecoveryFailed: (intent: string, grade: string) =>
    emit('lead_recovery_failed', { intent, grade }),

  /**
   * Nothing reached the server, so the lead went into the on-device outbox to
   * be delivered later. The student was confirmed — correctly, their part is
   * done — but this number rising means the API is refusing writes.
   */
  leadQueued: (intent: string, grade: string) => emit('lead_queued', { intent, grade }),

  /** A queued lead was delivered later by the outbox. */
  leadRecovered: () => emit('lead_recovered'),

  // ── Everything else ───────────────────────────────────────────────────────
  whatsappClicked: (context: string) => emit('whatsapp_clicked', { context }),
  proofViewed: (proof: string) => emit('proof_viewed', { proof }),

  /** A Knowledge Center article was opened, and how far it was read. */
  articleOpened: (slug: string, category: string) =>
    emit('article_opened', { slug, category }),
  articleRead: (slug: string, category: string) => emit('article_read', { slug, category }),

  /**
   * A client-side route change. NOT fired on first load — the GTM container
   * already fires on container load there, and pushing again would count every
   * landing twice. See RouteAnalytics.
   */
  pageView: (path: string, title: string) => emit('page_view', { path, title }),
}
