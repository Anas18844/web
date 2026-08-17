'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { audit, changePassword, requireAdmin, requireUser, signIn, signOut } from '@/lib/auth'
import { createLead, deleteLead, getLead, updateLead } from '@/lib/leads-repo'
import { EG_MOBILE, normalizePhone } from '@/lib/phone'

/**
 * Every write the dashboard can perform.
 *
 * The pattern is the same in all of them and it is not decoration: the FIRST
 * statement is the permission check, before the input is even looked at. A
 * server action is a public HTTP endpoint — Next gives it an id and anyone who
 * finds that id can call it with any arguments they like. Whether the button
 * was rendered is irrelevant, which is why nothing here trusts that it was.
 */

export type ActionState = { ok?: boolean; error?: string; message?: string }

// ── Session ──────────────────────────────────────────────────────────────────

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')

  if (!email || !password) return { error: 'اكتب البريد وكلمة السر' }

  let user
  try {
    user = await signIn(email, password)
  } catch (error) {
    // A misconfigured deployment must say so, not pretend the password is
    // wrong — that was two days of debugging the last time it happened here.
    const message = error instanceof Error ? error.message : String(error)
    return { error: `النظام مش مظبوط: ${message}` }
  }

  // One message for every failure. Naming which half was wrong turns this form
  // into a way to find out which email addresses have accounts.
  if (!user) return { error: 'البريد أو كلمة السر غلط' }

  await audit(user, 'login')
  redirect('/dashboard')
}

export async function logoutAction(): Promise<void> {
  await signOut()
  redirect('/dashboard/login')
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let actor
  try {
    // The one caller allowed through with an issued password — it is the way
    // out of that state.
    actor = await requireUser({ allowPendingPassword: true })
  } catch {
    return { error: 'الجلسة انتهت. سجّل دخول تاني.' }
  }

  const current = String(formData.get('current') || '')
  const next = String(formData.get('next') || '')
  const confirm = String(formData.get('confirm') || '')

  if (next !== confirm) return { error: 'كلمتين السر الجديدة مش زي بعض' }

  const result = await changePassword(actor, current, next)
  if (!result.ok) return { error: result.error }

  redirect('/dashboard')
}

// ── Adding a lead by hand ────────────────────────────────────────────────────

const leadSchema = z.object({
  name: z.string().trim().min(3, 'اكتب اسم الطالب'),
  phone: z.string().trim(),
  whatsapp: z.string().trim().optional(),
  grade: z.enum(['first_sec', 'second_bacc'], { message: 'اختار الصف' }),
  attendance: z.enum(['online', 'center']).optional().or(z.literal('')),
  branch: z.enum(['helwan', 'hadayek_helwan', 'may15', 'other']).optional().or(z.literal('')),
  heard_from: z
    .enum(['facebook', 'youtube', 'google', 'tiktok', 'friend', 'other'])
    .optional()
    .or(z.literal('')),
  note: z.string().trim().max(2000).optional(),
  status: z.enum(['new', 'contacted', 'booked', 'enrolled', 'closed']).optional(),
})

/** Both roles may add. Adding is not reading. */
export async function createLeadAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let actor
  try {
    actor = await requireUser()
  } catch {
    return { error: 'الجلسة انتهت. سجّل دخول تاني.' }
  }

  const parsed = leadSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'فيه بيانات ناقصة' }
  }

  const input = parsed.data
  const phone = normalizePhone(input.phone)
  if (!EG_MOBILE.test(phone)) return { error: 'رقم الموبايل مش صحيح (مثال: 01012345678)' }

  const whatsapp = input.whatsapp ? normalizePhone(input.whatsapp) : phone
  if (!EG_MOBILE.test(whatsapp)) return { error: 'رقم الواتساب مش صحيح' }

  // The database enforces this too; catching it here produces a sentence a
  // person can act on instead of a constraint-violation string.
  if (input.attendance !== 'center' && input.branch) {
    return { error: 'الفرع بيتحدّد لطلاب السنتر بس' }
  }

  try {
    const id = await createLead(actor, {
      ...input,
      phone,
      whatsapp,
      attendance: input.attendance || null,
      branch: input.branch || null,
      heard_from: input.heard_from || null,
    })

    // The audit record carries no phone number: it is written by whoever added
    // the lead, and read later by whoever is investigating — possibly someone
    // who is not allowed to see numbers at all.
    await audit(actor, 'create', {
      leadId: id,
      after: { name: input.name, grade: input.grade, source: 'manual' },
    })

    revalidatePath('/dashboard')
    return { ok: true, message: 'الطالب اتسجّل' }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/duplicate|unique/i.test(message)) return { error: 'الرقم ده متسجّل قبل كده' }
    return { error: `ماتسجّلش: ${message}` }
  }
}

// ── Admin only ───────────────────────────────────────────────────────────────

const patchSchema = leadSchema.partial().extend({ id: z.string().uuid() })

export async function updateLeadAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let actor
  try {
    actor = await requireAdmin()
  } catch (error) {
    return {
      error:
        error instanceof Error && error.message === 'FORBIDDEN'
          ? 'التعديل للأدمن بس'
          : 'الجلسة انتهت. سجّل دخول تاني.',
    }
  }

  const parsed = patchSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات مش مظبوطة' }

  const { id, ...patch } = parsed.data

  if (patch.phone) {
    const phone = normalizePhone(patch.phone)
    if (!EG_MOBILE.test(phone)) return { error: 'رقم الموبايل مش صحيح' }
    patch.phone = phone
  }
  if (patch.whatsapp) {
    const whatsapp = normalizePhone(patch.whatsapp)
    if (!EG_MOBILE.test(whatsapp)) return { error: 'رقم الواتساب مش صحيح' }
    patch.whatsapp = whatsapp
  }

  try {
    const before = await getLead('admin', id)
    await updateLead(id, patch)
    await audit(actor, 'update', { leadId: id, before, after: patch })

    revalidatePath('/dashboard')
    return { ok: true, message: 'التعديل اتحفظ' }
  } catch (error) {
    return { error: `ماتحفظش: ${error instanceof Error ? error.message : String(error)}` }
  }
}

export async function deleteLeadAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let actor
  try {
    actor = await requireAdmin()
  } catch (error) {
    return {
      error:
        error instanceof Error && error.message === 'FORBIDDEN'
          ? 'الحذف للأدمن بس'
          : 'الجلسة انتهت. سجّل دخول تاني.',
    }
  }

  const id = String(formData.get('id') || '')
  if (!id) return { error: 'مفيش طالب محدّد' }

  /**
   * A deliberate speed bump. Deleting a lead destroys the only record of a
   * student who asked for help, and this dashboard is explicitly meant to
   * drive decisions that are hard to reverse — so the person doing it types
   * the word rather than clicking twice by reflex.
   */
  if (String(formData.get('confirm') || '').trim() !== 'احذف') {
    return { error: 'اكتب «احذف» في الخانة عشان تأكّد' }
  }

  try {
    const before = await deleteLead(id)
    await audit(actor, 'delete', { leadId: id, before })

    revalidatePath('/dashboard')
    return { ok: true, message: 'الطالب اتمسح' }
  } catch (error) {
    return { error: `ماتمسحش: ${error instanceof Error ? error.message : String(error)}` }
  }
}
