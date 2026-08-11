import { z } from 'zod'
import { EG_MOBILE, normalizePhone } from './phone'
import { isValidArabicTripleName, normalizeName } from './name'

/**
 * Server-side validation for the lead endpoint.
 *
 * The capture runs in two steps and so does the validation. Step one asks for
 * the three things a follow-up call actually needs — who, which number, which
 * year — and saves immediately. Step two enriches that row. Neither schema
 * knows about the other's fields, so a half-filled submission can never be
 * rejected for missing something it was never asked for.
 *
 * ⚠️ Server-only: never import this from a client component — it would pull zod
 * into the browser bundle. Client-side helpers live in `./phone` and `./name`.
 */

const phone = z
  .string()
  .transform(normalizePhone)
  .refine((v) => EG_MOBILE.test(v), 'invalid_phone')

/** Fields shared by both steps: context we collect without asking. */
const context = {
  intent: z.enum(['curriculum', 'intro_session', 'updates', 'parent']),
  pageContext: z.string().trim().max(120).optional(),
  utm: z.record(z.string().max(120)).optional(),
  /**
   * Honeypot. Accepted by the schema on purpose: the route handler checks it
   * and answers with a success shape, so bots never learn the field is a trap.
   */
  company: z.string().max(200).optional(),
  /** Milliseconds the form stayed open. Sub-second submissions are bots. */
  elapsed: z.number().int().nonnegative().optional(),
}

/** STEP ONE — the whole point of the redesign: three fields, then save. */
export const leadStep1Schema = z.object({
  name: z.string().transform(normalizeName).refine(isValidArabicTripleName, 'invalid_name'),
  phone,
  grade: z.enum(['first_sec', 'second_bacc']),
  ...context,
})

/** STEP TWO — everything else, attached to the row step one created. */
export const leadStep2Schema = z
  .object({
    id: z.string().uuid(),
    token: z.string().min(16).max(200),
    whatsapp: phone,
    attendance: z.enum(['online', 'center']),
    branch: z.enum(['helwan', 'hadayek_helwan', 'may15', 'other']).optional(),
    heardFrom: z.enum(['facebook', 'youtube', 'google', 'tiktok', 'friend', 'other']),
    note: z.string().trim().max(500).optional().or(z.literal('')),
  })
  // A branch only makes sense for centre students, and is required for them.
  .refine((d) => (d.attendance === 'center' ? Boolean(d.branch) : true), {
    message: 'branch_required',
    path: ['branch'],
  })
  .transform((d) => ({ ...d, branch: d.attendance === 'center' ? d.branch : undefined }))

export type LeadStep1Input = z.infer<typeof leadStep1Schema>
export type LeadStep2Input = z.infer<typeof leadStep2Schema>
