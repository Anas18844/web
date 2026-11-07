import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * The team application form (November 2026) and the owner's decisions on it.
 *
 * Applications arrive through the private-form system (migration 013): the
 * page lives in private_pages, every send is one row in form_responses with
 * `payload.answers = [{ id, q, a }]`. A person who sends twice gets two rows;
 * the latest one per WhatsApp number is the application. Decisions live in
 * hiring_status (migration 016), keyed by the same number.
 */
export const HIRING_FORM = 'join-mr-anas-team-k7q3x9'

export const TEAMS = ['دعم علمي', 'دعم تقني', 'دعم وخدمات'] as const

export const STATUSES = {
  new: 'جديد',
  contacted: 'اتكلمنا',
  interview: 'إنترفيو',
  accepted: 'مقبول',
  rejected: 'مرفوض',
} as const
export type HiringStatus = keyof typeof STATUSES

export type Applicant = {
  phone: string
  name: string
  age: string
  area: string
  status: string
  study: string
  teams: string[]
  research: string
  skills: string[]
  work: string
  servicesExp: string
  laptop: string
  times: string[]
  bio: string
  sentAt: string
  sends: number
  decision: HiringStatus
  note: string
  decidedBy: string
}

type Answer = { id?: string; a?: unknown }

const text = (v: unknown) => (typeof v === 'string' ? v : Array.isArray(v) ? v.join('، ') : '')
const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : typeof v === 'string' && v ? [v] : [])

export async function getHiringData(): Promise<{
  applicants: Applicant[]
  expiresAt: string | null
  /** False until migration 016 has been run; the board then hides the status controls. */
  statusReady: boolean
}> {
  const db = getSupabaseAdmin()

  const [page, rows, decisions] = await Promise.all([
    db.from('private_pages').select('expires_at').eq('slug', HIRING_FORM).maybeSingle(),
    db
      .from('form_responses')
      .select('payload, created_at')
      .eq('form', HIRING_FORM)
      .order('created_at', { ascending: false })
      .limit(5000),
    db.from('hiring_status').select('phone, status, note, updated_by').eq('form', HIRING_FORM),
  ])
  if (rows.error) throw new Error(rows.error.message)

  const statusReady = !decisions.error
  const byPhone = new Map((decisions.data ?? []).map((d) => [d.phone as string, d]))

  // Newest first, so the first row seen per number is the application.
  const seen = new Map<string, Applicant>()
  for (const row of rows.data ?? []) {
    const answers: Answer[] = Array.isArray(row.payload?.answers) ? row.payload.answers : []
    const get = (id: string) => answers.find((x) => x?.id === id)?.a
    const phone = text(get('phone'))
    const key = phone || `?${row.created_at}`
    const prev = seen.get(key)
    if (prev) {
      prev.sends += 1
      continue
    }
    const d = byPhone.get(phone)
    seen.set(key, {
      phone,
      name: text(get('name')),
      age: text(get('age')),
      area: text(get('area')),
      status: text(get('status')),
      study: text(get('study')),
      teams: list(get('teams')),
      research: text(get('research')),
      skills: list(get('skills')),
      work: text(get('work')),
      servicesExp: text(get('services_exp')),
      laptop: text(get('laptop')),
      times: list(get('times')),
      bio: text(get('bio')),
      sentAt: row.created_at as string,
      sends: 1,
      decision: (d?.status as HiringStatus) ?? 'new',
      note: (d?.note as string) ?? '',
      decidedBy: (d?.updated_by as string) ?? '',
    })
  }

  return {
    applicants: [...seen.values()],
    expiresAt: (page.data?.expires_at as string | undefined) ?? null,
    statusReady,
  }
}

export async function setHiringStatus(phone: string, status: HiringStatus, note: string, by: string) {
  const { error } = await getSupabaseAdmin()
    .from('hiring_status')
    .upsert(
      { form: HIRING_FORM, phone, status, note, updated_by: by, updated_at: new Date().toISOString() },
      { onConflict: 'form,phone' },
    )
  if (error) throw new Error(error.message)
}
