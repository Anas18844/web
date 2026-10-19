// Same JSON as /api/admin/unit-exam/export?format=json, from the command line:
//   node scripts/export-unit-exam.mjs <out.json>
// Reads the service key from the local env files through Next's own loader.
import nextEnv from '@next/env'
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

nextEnv.loadEnvConfig(process.cwd())
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rhrwuqjkqflceuddfsso.supabase.co'
const key = ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY', 'SUPABASE_SECRET_KEY', 'SUPABASE_SECRET', 'SUPABASE_KEY']
  .map((n) => process.env[n]?.trim()).find(Boolean)
if (!key) throw new Error('no service key in env')
const db = createClient(url, key, { auth: { persistSession: false } })
const must = (r) => { if (r.error) throw r.error; return r.data }

const attempts = must(await db.from('unit_exam_attempts').select('*').eq('exam_slug', 'unit-1').order('created_at'))
const now = Date.now()
const full = []
for (const a of attempts) {
  const answers = must(await db.from('unit_exam_answers').select('question_id, value, rev, flagged, updated_at').eq('attempt_id', a.id))
  const ev = must(await db.from('unit_exam_events').select('type').eq('attempt_id', a.id))
  const events = {}
  for (const e of ev) events[e.type] = (events[e.type] ?? 0) + 1
  const reason = a.end_reason ?? (now > Date.parse(a.ends_at) ? 'timeout' : null)
  full.push({ ...a, end_reason: reason, events, answers })
}
fs.writeFileSync(process.argv[2], JSON.stringify({ slug: 'unit-1', exported_at: new Date().toISOString(), attempts: full }, null, 1))
console.log('attempts', full.length)
