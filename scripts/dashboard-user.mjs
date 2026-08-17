#!/usr/bin/env node
/**
 * Creates a dashboard account — or rather, prints the SQL that creates one.
 *
 *   node scripts/dashboard-user.mjs anas@example.com "أنس أحمد" admin
 *
 * The password is asked for interactively and never appears in the command, so
 * it does not end up in shell history, in a screenshot of a terminal, or in a
 * process list on a shared machine.
 *
 * It prints SQL rather than connecting to the database on purpose: creating the
 * first administrator should not require the production service key to be
 * present on whichever laptop happens to be running this. Paste the statement
 * into the Supabase SQL editor and you are done.
 *
 * The hash is scrypt with the same parameters src/lib/auth.ts verifies against.
 * If you change them there, change them here — they are two halves of one lock.
 */

import { randomBytes, scryptSync } from 'node:crypto'
import { createInterface } from 'node:readline'
import { stdin, stdout, argv, exit } from 'node:process'

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 }
const KEYLEN = 64

const [email, name, role] = argv.slice(2)

if (!email || !name || !role) {
  console.error(`
Usage:
  node scripts/dashboard-user.mjs <email> "<الاسم>" <admin|team>

Examples:
  node scripts/dashboard-user.mjs anas@example.com "أنس أحمد" admin
  node scripts/dashboard-user.mjs sara@example.com "سارة محمد" team
`)
  exit(1)
}

if (role !== 'admin' && role !== 'team') {
  console.error(`\n  ✗ Role must be exactly "admin" or "team" — got "${role}".\n`)
  exit(1)
}

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error(`\n  ✗ "${email}" is not a valid email address.\n`)
  exit(1)
}

/**
 * Non-interactive mode, for a terminal without a TTY (CI, a hook, an agent):
 *
 *   DASHBOARD_PASSWORD='…' node scripts/dashboard-user.mjs a@b.com "الاسم" admin
 *
 * The prompt below reads from the terminal, which fails outright when stdin is
 * a null device — and failing there with a confusing readline error is a worse
 * outcome than offering this door.
 */
const fromEnv = process.env.DASHBOARD_PASSWORD

if (fromEnv) {
  emit(fromEnv)
  exit(0)
}

const rl = createInterface({ input: stdin, output: stdout })

/** Reads a line without echoing it to the terminal. */
function askHidden(question) {
  return new Promise((resolve) => {
    const onData = (char) => {
      const s = String(char)
      if (s === '\n' || s === '\r' || s === '') {
        stdin.removeListener('data', onData)
      } else {
        stdout.clearLine(0)
        stdout.cursorTo(0)
        stdout.write(question + '*'.repeat(rl.line.length))
      }
    }
    stdout.write(question)
    stdin.on('data', onData)
    rl.question('', (value) => {
      stdout.write('\n')
      resolve(value)
    })
  })
}

const password = await askHidden('Password: ')
const again = await askHidden('Repeat:   ')
rl.close()

if (password !== again) {
  console.error('\n  ✗ The two passwords do not match.\n')
  exit(1)
}

emit(password)

function emit(password) {
  /**
   * Twelve characters, not eight. This account can read every student's phone
   * number in the database; the usual "at least 8" advice is for accounts that
   * cannot.
   */
  if (password.length < 12) {
    console.error(
      `\n  ✗ Too short (${password.length} characters). Use at least 12.\n` +
        `    This login can read every student's phone number.\n`,
    )
    exit(1)
  }

  const salt = randomBytes(16)
  const hash = scryptSync(password.normalize('NFKC'), salt, KEYLEN, SCRYPT_PARAMS)
  const stored = `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`

  const sqlEscape = (v) => v.replace(/'/g, "''")

  /**
   * `must_change_password` is TRUE on every account this script creates, with
   * no way to turn it off from here — and that is the point. Whoever runs this
   * knows the password they just typed. Until the owner replaces it, that
   * password is known to two people and can read every student's phone number.
   * The flag blocks every dashboard screen except the one that changes it.
   */
  console.log(`
─────────────────────────────────────────────────────────────────────────────
 Paste this into the Supabase SQL editor:
─────────────────────────────────────────────────────────────────────────────

insert into public.dashboard_users (email, name, password_hash, role, must_change_password)
values (
  '${sqlEscape(email.trim().toLowerCase())}',
  '${sqlEscape(name)}',
  '${stored}',
  '${role}',
  true
)
on conflict (email) do update
  set name = excluded.name,
      password_hash = excluded.password_hash,
      role = excluded.role,
      active = true,
      must_change_password = true;

─────────────────────────────────────────────────────────────────────────────
 ${role === 'admin' ? '⚠️  ADMIN — reads phone numbers, edits, deletes.' : 'Team — no phone numbers, add only.'}
 The account must change this password on first login before it sees anything.
 Running this again for the same email resets that account's password.
─────────────────────────────────────────────────────────────────────────────
`)
}
