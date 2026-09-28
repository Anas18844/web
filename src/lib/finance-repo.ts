import 'server-only'

import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { SessionUser } from '@/lib/auth'
import {
  DEFAULT_SETTINGS,
  EMPTY_ACTUAL,
  defaultPlan,
  seasonMonths,
  type FinanceSettings,
  type MonthActual,
  type MonthPlan,
  type MonthRecord,
} from '@/lib/finance'

/**
 * Reads and writes the finance planner's two tables.
 *
 * Whatever is stored is parsed before the model sees it, and anything that
 * does not parse falls back to the defaults rather than throwing — a bad row
 * should show up as a wrong-looking number the owner can fix from the page,
 * not as a page that will not open.
 *
 * A missing table is the one failure that is reported instead of hidden: the
 * page says "run migration 010" rather than quietly showing defaults that look
 * like saved data.
 */

const money = z.coerce.number().finite().min(0)
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)

export const settingsSchema = z.object({
  seasonStart: month,
  prices: z.object({
    month: money,
    term: money,
    year: money,
    revision: money.nullable(),
  }),
  platformShare: z.coerce.number().min(0).max(1),
  center: z.object({
    price: money,
    rent: money,
    booklet: money,
    assistant: money,
    sessionsPerMonth: money,
  }),
  rates: z.object({ studio: money, editing: money }),
  hours: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        hours: money,
        studio: z.boolean(),
        editing: z.boolean(),
      }),
    )
    .max(30),
  fixed: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        amount: money,
        from: month.nullable(),
      }),
    )
    .max(30),
  weights: z.record(month, z.coerce.number().min(0).max(1)),
})

export const planSchema = z.object({
  monthlySubs: money,
  termSubs: money,
  yearSubs: money,
  revisionSubs: money,
  centerStudents: money,
  hours: money.nullable(),
})

export const actualSchema = z.object({
  platform: money.nullable(),
  center: money.nullable(),
  filming: money.nullable(),
  editing: money.nullable(),
  salaries: money.nullable(),
  other: money.nullable(),
})

export type FinanceData = {
  settings: FinanceSettings
  records: Record<string, MonthRecord>
  /** Set when the tables cannot be read — usually migration 010 not run yet. */
  problem: string | null
  /** False until the owner saves the assumptions once. */
  settingsSaved: boolean
}

export async function getFinance(): Promise<FinanceData> {
  const db = getSupabaseAdmin()
  const [settingsRes, monthsRes] = await Promise.all([
    db.from('finance_settings').select('data').eq('id', 1).maybeSingle(),
    db.from('finance_months').select('month, plan, actual, note'),
  ])

  const problem = settingsRes.error ?? monthsRes.error
  const parsedSettings = settingsSchema.safeParse(settingsRes.data?.data)
  const settings = parsedSettings.success ? parsedSettings.data : DEFAULT_SETTINGS

  const stored = new Map((monthsRes.data ?? []).map((row) => [row.month as string, row]))
  const records: Record<string, MonthRecord> = {}
  seasonMonths(settings.seasonStart).forEach((key, i) => {
    const row = stored.get(key)
    const plan = planSchema.safeParse(row?.plan)
    const actual = actualSchema.safeParse(row?.actual)
    records[key] = {
      plan: plan.success ? plan.data : defaultPlan(i),
      actual: actual.success ? actual.data : EMPTY_ACTUAL,
      note: (row?.note as string | null) ?? null,
    }
  })

  return {
    settings,
    records,
    problem: problem
      ? `تعذّر قراءة جداول الحسابات (${problem.message}). غالبًا الميجريشن 010 لسه ماتشغّلش.`
      : null,
    settingsSaved: parsedSettings.success,
  }
}

export async function saveSettings(actor: SessionUser, settings: FinanceSettings): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('finance_settings')
    .upsert({ id: 1, data: settings, updated_at: new Date().toISOString(), updated_by: actor.id })
  if (error) throw new Error(error.message)
}

export async function saveMonth(
  actor: SessionUser,
  key: string,
  record: { plan: MonthPlan; actual: MonthActual; note: string | null },
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('finance_months')
    .upsert({
      month: key,
      plan: record.plan,
      actual: record.actual,
      note: record.note,
      updated_at: new Date().toISOString(),
      updated_by: actor.id,
    })
  if (error) throw new Error(error.message)
}
