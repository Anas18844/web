'use server'

import { revalidatePath } from 'next/cache'
import { audit, requireAdmin } from '@/lib/auth'
import {
  actualSchema,
  planSchema,
  saveMonth,
  saveSettings,
  settingsSchema,
} from '@/lib/finance-repo'
import { seasonMonths } from '@/lib/finance'
import type { ActionState } from '@/app/dashboard/actions'

/**
 * The finance planner's two writes. Same rule as every dashboard action: the
 * permission check is the first statement, before the form is even read.
 */

/** An empty box means "not set", which is not the same as zero. */
function optional(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? '').trim()
  return text === '' ? null : Number(text)
}

function required(value: FormDataEntryValue | null): number {
  return Number(String(value ?? '').trim() || '0')
}

const firstIssue = (error: { issues: { path: (string | number)[] }[] }) =>
  `فيه رقم مش مظبوط (${error.issues[0]?.path.join(' ← ')}). الأرقام لازم تكون موجبة.`

export async function saveSettingsAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  let actor
  try {
    actor = await requireAdmin()
  } catch {
    return { error: 'الصفحة دي للأدمن بس.' }
  }

  const names = form.getAll('hours_name')
  const hours = names
    .map((name, i) => ({
      name: String(name).trim(),
      hours: required(form.getAll('hours_hours')[i]),
      studio: form.getAll('hours_studio')[i] === '1',
      editing: form.getAll('hours_editing')[i] === '1',
    }))
    // Clearing a row's name is how a row is removed.
    .filter((h) => h.name !== '')

  const fixed = form
    .getAll('fixed_name')
    .map((name, i) => ({
      name: String(name).trim(),
      amount: required(form.getAll('fixed_amount')[i]),
      from: String(form.getAll('fixed_from')[i] ?? '').trim() || null,
    }))
    .filter((f) => f.name !== '')

  const seasonStart = String(form.get('seasonStart') ?? '')
  const weights: Record<string, number> = {}
  for (const key of seasonMonths(/^\d{4}-\d{2}$/.test(seasonStart) ? seasonStart : '2026-10')) {
    const percent = optional(form.get(`weight_${key}`))
    // Only the exceptions are stored; a full month is the default.
    if (percent !== null && percent !== 100) weights[key] = percent / 100
  }

  const parsed = settingsSchema.safeParse({
    seasonStart,
    prices: {
      month: required(form.get('price_month')),
      term: required(form.get('price_term')),
      year: required(form.get('price_year')),
      revision: optional(form.get('price_revision')),
    },
    platformShare: required(form.get('platformShare')) / 100,
    center: {
      price: required(form.get('center_price')),
      rent: required(form.get('center_rent')),
      booklet: required(form.get('center_booklet')),
      assistant: required(form.get('center_assistant')),
      sessionsPerMonth: required(form.get('center_sessions')),
    },
    rates: {
      studio: required(form.get('rate_studio')),
      editing: required(form.get('rate_editing')),
    },
    hours,
    fixed,
    weights,
  })
  if (!parsed.success) return { error: firstIssue(parsed.error) }

  try {
    await saveSettings(actor, parsed.data)
  } catch (error) {
    return { error: `ماتحفظش: ${error instanceof Error ? error.message : String(error)}` }
  }
  await audit(actor, 'update', { after: { finance: 'settings' } })
  revalidatePath('/dashboard/finance')
  return { ok: true, message: 'اتحفظت الافتراضات' }
}

export async function saveMonthAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  let actor
  try {
    actor = await requireAdmin()
  } catch {
    return { error: 'الصفحة دي للأدمن بس.' }
  }

  const key = String(form.get('month') ?? '')
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key)) return { error: 'الشهر مش معروف' }

  const plan = planSchema.safeParse({
    monthlySubs: required(form.get('monthlySubs')),
    termSubs: required(form.get('termSubs')),
    yearSubs: required(form.get('yearSubs')),
    revisionSubs: required(form.get('revisionSubs')),
    centerStudents: required(form.get('centerStudents')),
    hours: optional(form.get('hours')),
  })
  if (!plan.success) return { error: firstIssue(plan.error) }

  const actual = actualSchema.safeParse({
    platform: optional(form.get('actual_platform')),
    center: optional(form.get('actual_center')),
    filming: optional(form.get('actual_filming')),
    editing: optional(form.get('actual_editing')),
    salaries: optional(form.get('actual_salaries')),
    other: optional(form.get('actual_other')),
  })
  if (!actual.success) return { error: firstIssue(actual.error) }

  const note = String(form.get('note') ?? '').trim().slice(0, 1000) || null

  try {
    await saveMonth(actor, key, { plan: plan.data, actual: actual.data, note })
  } catch (error) {
    return { error: `ماتحفظش: ${error instanceof Error ? error.message : String(error)}` }
  }
  await audit(actor, 'update', { after: { finance: key } })
  revalidatePath('/dashboard/finance')
  return { ok: true, message: 'اتحفظ الشهر' }
}
