#!/usr/bin/env node
/**
 * Day-to-day account maintenance, without opening the SQL editor.
 *
 *   node scripts/dashboard-account.mjs list
 *   node scripts/dashboard-account.mjs rename <oldEmail> <newEmail>
 *   node scripts/dashboard-account.mjs disable <email>
 *   node scripts/dashboard-account.mjs enable  <email>
 *   node scripts/dashboard-account.mjs reset   <email>
 *
 * `rename` UPDATES the existing row rather than inserting a new one. That
 * matters more than it looks: the audit trail references accounts by id, so
 * creating a fresh row for a changed address would orphan every action the
 * person had already taken and leave a stale login behind that still works.
 *
 * `disable` is how access is revoked — never a delete, for the same reason.
 * `getSessionUser()` re-reads the row on every request, so a disabled account
 * stops working within one page load rather than when its cookie expires.
 */

import { readFileSync } from 'node:fs'
import { randomBytes, scryptSync } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const env = {}
for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/)
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
}

const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!key) {
  console.error('\n  ✗ SUPABASE_SERVICE_ROLE_KEY is not in .env.local\n')
  process.exit(1)
}

const supabase = createClient(
  env.SUPABASE_URL || 'https://rhrwuqjkqflceuddfsso.supabase.co',
  key,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const hash = (password) => {
  const salt = randomBytes(16)
  const derived = scryptSync(password.normalize('NFKC'), salt, 64, { N: 16384, r: 8, p: 1 })
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`
}

const show = async () => {
  const { data, error } = await supabase
    .from('dashboard_users')
    .select('email, name, role, active, must_change_password, last_login_at')
    .order('created_at')
  if (error) {
    console.error(`  ✗ ${error.message}`)
    process.exit(1)
  }
  console.table(data ?? [])
}

const [command, a, b] = process.argv.slice(2)
const norm = (v) => v?.trim().toLowerCase()

switch (command) {
  case 'list':
    await show()
    break

  case 'rename': {
    if (!a || !b) {
      console.error('\n  ✗ Usage: rename <oldEmail> <newEmail>\n')
      process.exit(1)
    }
    const { data, error } = await supabase
      .from('dashboard_users')
      .update({ email: norm(b) })
      .eq('email', norm(a))
      .select('id, email, role')
    if (error) {
      console.error(`\n  ✗ ${error.message}\n`)
      process.exit(1)
    }
    if (!data?.length) {
      console.error(`\n  ✗ No account with the email ${a}\n`)
      process.exit(1)
    }
    console.log(`\n  ✓ ${a}  →  ${data[0].email}   (${data[0].role}, same id, password unchanged)\n`)
    await show()
    break
  }

  case 'disable':
  case 'enable': {
    if (!a) {
      console.error(`\n  ✗ Usage: ${command} <email>\n`)
      process.exit(1)
    }
    const { data, error } = await supabase
      .from('dashboard_users')
      .update({ active: command === 'enable' })
      .eq('email', norm(a))
      .select('email, active')
    if (error || !data?.length) {
      console.error(`\n  ✗ ${error?.message ?? 'no such account'}\n`)
      process.exit(1)
    }
    console.log(`\n  ✓ ${data[0].email} — active: ${data[0].active}\n`)
    await show()
    break
  }

  case 'reset': {
    if (!a) {
      console.error('\n  ✗ Usage: reset <email>\n')
      process.exit(1)
    }
    const password = randomBytes(15).toString('base64').replace(/[+/=]/g, 'x').slice(0, 20)
    const { data, error } = await supabase
      .from('dashboard_users')
      /**
       * `password_changed_at` is cleared, not stamped. The column means "when
       * the OWNER last chose their password" — leaving the previous value in
       * place would make an issued password look like one the owner set, which
       * is the opposite of what it is.
       */
      .update({
        password_hash: hash(password),
        must_change_password: true,
        password_changed_at: null,
      })
      .eq('email', norm(a))
      .select('email, role')
    if (error || !data?.length) {
      console.error(`\n  ✗ ${error?.message ?? 'no such account'}\n`)
      process.exit(1)
    }
    console.log(`\n  ✓ ${data[0].email}\n    temporary password: ${password}`)
    console.log('    must be changed on first login\n')
    break
  }

  default:
    console.error(`
Usage:
  node scripts/dashboard-account.mjs list
  node scripts/dashboard-account.mjs rename <oldEmail> <newEmail>
  node scripts/dashboard-account.mjs disable <email>
  node scripts/dashboard-account.mjs enable  <email>
  node scripts/dashboard-account.mjs reset   <email>
`)
    process.exit(1)
}
