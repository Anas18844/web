import { z } from 'zod'
import { EG_MOBILE, normalizePhone } from './phone'

/**
 * Server-side validation for the lead endpoint.
 *
 * ⚠️ Server-only: never import this from a client component — it would pull zod
 * into the browser bundle. Client-side phone helpers live in `./phone`.
 */
export const leadSchema = z.object({
  name: z.string().trim().min(2, 'short').max(60),
  whatsapp: z
    .string()
    .transform(normalizePhone)
    .refine((v) => EG_MOBILE.test(v), 'invalid'),
  grade: z.enum(['first', 'second', 'other']),
  intent: z.enum(['curriculum', 'intro_session', 'updates', 'parent']),
  referredBy: z.string().trim().max(60).optional().or(z.literal('')),
  note: z.string().trim().max(300).optional().or(z.literal('')),
  pageContext: z.string().trim().max(120).optional(),
  utm: z.record(z.string().max(120)).optional(),
  /**
   * Honeypot. Accepted by the schema on purpose: the route handler checks it
   * and answers with a success shape, so bots never learn the field is a trap.
   */
  company: z.string().max(200).optional(),
  /** Milliseconds the form stayed open. Sub-second submissions are bots. */
  elapsed: z.number().int().nonnegative().optional(),
})

export type LeadInput = z.infer<typeof leadSchema>
