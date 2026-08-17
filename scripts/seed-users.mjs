#!/usr/bin/env node
/**
 * Creates dashboard accounts directly, using the same client the app uses.
 *
 * Written after a raw REST call with the `sb_secret_` key returned 401 for
 * every table: the newer key format is not simply an apikey header, and
 * reverse-engineering that was a worse use of time than going through the
 * library that already works in production.
 *
 *   node scripts/seed-users.mjs
 *
 * Reads .env.local itself — this runs outside Next, so nothing has loaded it.
 * Every account is created with `must_change_password: true`, so the temporary
 * password below cannot read a single student record: it can only reach the
 * screen that replaces it.
 */

import { readFileSync } from 'node:fs'
import { randomBytes, scryptSync } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// ── Config, read the same way the app reads it ───────────────────────────────
const env = {}
for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
  const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/)
  if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
}

const url = env.SUPABASE_URL || 'https://rhrwuqjkqflceuddfsso.supabase.co'
const key = env.SUPABASE_SERVICE_ROLE_KEY

if (!key) {
  console.error('\n  ✗ SUPABASE_SERVICE_ROLE_KEY is not in .env.local\n')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ── The same hashing src/lib/session-crypto.ts verifies against ──────────────
const hash = (password) => {
  const salt = randomBytes(16)
  const derived = scryptSync(password.normalize('NFKC'), salt, 64, { N: 16384, r: 8, p: 1 })
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`
}

/** 20 characters from a cryptographic RNG — nobody chose these. */
const tempPassword = () =>
  randomBytes(15).toString('base64').replace(/[+/=]/g, 'x').slice(0, 20)

/**
 * Accounts come from a JSON FILE, not an argument. Passing JSON on a Windows
 * PowerShell command line silently strips the quotes and hands the script
 * something that is not JSON at all — a failure worth designing out rather
 * than escaping around.
 */
const listPath = process.argv[2]

if (!listPath) {
  console.error('\n  ✗ Usage: node scripts/seed-users.mjs <accounts.json>\n')
  process.exit(1)
}

const accounts = JSON.parse(readFileSync(listPath, 'utf8'))

if (!Array.isArray(accounts) || accounts.length === 0) {
  console.error('\n  ✗ The file must hold [{"email":"…","name":"…","role":"admin|team"}]\n')
  process.exit(1)
}

for (const a of accounts) {
  if (a.role !== 'admin' && a.role !== 'team') {
    console.error(`\n  ✗ ${a.email}: role must be "admin" or "team", got "${a.role}"\n`)
    process.exit(1)
  }
}

/**
 * Preflight: migration 005 has to be in place before a single account exists.
 *
 * This is a refusal, not a warning. Without `must_change_password`, the
 * generated password below becomes that account's PERMANENT password — and it
 * was printed to a terminal, so somebody other than its owner has seen it. An
 * account that can read every student's phone number must never start life in
 * that state, so the script stops rather than degrading quietly.
 */
{
  const { error } = await supabase.from('dashboard_users').select('must_change_password').limit(1)

  if (error && /must_change_password/.test(error.message)) {
    console.error(`
  ✗ Migration 005 has not been run.

    The column that forces a password change on first login is missing, so a
    temporary password issued now would be permanent — and it gets printed to
    this terminal.

    Run web/supabase/migrations/005_password_change.sql in the Supabase SQL
    editor, then run this again.
`)
    process.exit(1)
  }
}

console.log('')
const issued = []

for (const account of accounts) {
  const password = tempPassword()

  const { error } = await supabase.from('dashboard_users').upsert(
    {
      email: account.email.trim().toLowerCase(),
      name: account.name,
      password_hash: hash(password),
      role: account.role,
      active: true,
      must_change_password: true,
      // Null, not now(): this column means "when the owner last chose their
      // own password", and an issued one was not chosen by them.
      password_changed_at: null,
    },
    { onConflict: 'email' },
  )

  if (error) {
    console.error(`  ✗ ${account.email} — ${error.message}`)
    process.exitCode = 1
  } else {
    console.log(`  ✓ ${account.email}  (${account.role})`)
    issued.push({ ...account, password })
  }
}

if (issued.length > 0) {
  console.log('\n─── TEMPORARY PASSWORDS — must be changed on first login ───\n')
  for (const a of issued) {
    console.log(`  ${a.role.padEnd(6)}  ${a.email.padEnd(28)}  ${a.password}`)
  }
  console.log('')
}

// Read back, so the report is what the database says rather than what this
// script believes it wrote.
const { data } = await supabase
  .from('dashboard_users')
  .select('email, name, role, active, must_change_password')
  .order('created_at')

console.log('─── rows now in dashboard_users ───\n')
console.table(data ?? [])
