import { z } from 'zod'
import { EG_MOBILE, normalizePhone } from './phone'
import { isValidArabicTripleName, normalizeName } from './name'

/**
 * Server-side validation for the lead endpoint.
 *
 * ⚠️ Server-only: never import this from a client component — it would pull zod
 * into the browser bundle. Client-side helpers live in `./phone` and `./name`.
 */

const phone = z
  .string()
  .transform(normalizePhone)
  .refine((v) => EG_MOBILE.test(v), 'invalid_phone')

export const leadSchema = z
  .object({
    name: z
      .string()
      .transform(normalizeName)
      .refine(isValidArabicTripleName, 'invalid_name'),
    phone,
    whatsapp: phone,
    grade: z.enum(['first_sec', 'second_bacc']),
    attendance: z.enum(['online', 'center']),
    branch: z.enum(['helwan', 'hadayek_helwan', 'may15', 'other']).optional(),
    heardFrom: z.enum(['facebook', 'youtube', 'google', 'tiktok', 'friend', 'other']),
    intent: z.enum(['curriculum', 'intro_session', 'updates', 'parent']),
    note: z.string().trim().max(500).optional().or(z.literal('')),
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
  // A branch only makes sense for centre students, and is required for them.
  .refine((d) => (d.attendance === 'center' ? Boolean(d.branch) : true), {
    message: 'branch_required',
    path: ['branch'],
  })
  .transform((d) => ({ ...d, branch: d.attendance === 'center' ? d.branch : undefined }))

export type LeadInput = z.infer<typeof leadSchema>
