'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { audit, requireAdmin } from '@/lib/auth'
import { STATUSES, setHiringStatus, type HiringStatus } from '@/lib/hiring'

/**
 * The owner's decision on one applicant. Admin only, and the permission check
 * comes first (see app/dashboard/actions.ts).
 */
const Input = z.object({
  phone: z.string().regex(/^01[0125]\d{8}$/),
  status: z.enum(Object.keys(STATUSES) as [HiringStatus, ...HiringStatus[]]),
  note: z.string().trim().max(1000),
})

export async function setStatusAction(
  _prev: { ok?: boolean; error?: string },
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireAdmin()
  const parsed = Input.safeParse({
    phone: formData.get('phone'),
    status: formData.get('status'),
    note: formData.get('note') ?? '',
  })
  if (!parsed.success) return { error: 'البيانات مش مظبوطة' }

  try {
    await setHiringStatus(parsed.data.phone, parsed.data.status, parsed.data.note, user.email)
  } catch (e) {
    return { error: `ماتحفظش: ${e instanceof Error ? e.message : e}. اتأكد إن migration 016 اتشغّل.` }
  }
  await audit(user, 'update', { after: { what: 'hiring', phone: parsed.data.phone, status: parsed.data.status } })

  revalidatePath('/dashboard/hiring')
  return { ok: true }
}
