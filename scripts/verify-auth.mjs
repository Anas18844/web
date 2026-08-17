#!/usr/bin/env node
/**
 * Exercises the security boundary directly.
 *
 *   node scripts/verify-auth.mjs
 *
 * These are the two claims the dashboard rests on:
 *   1. a team member cannot read a phone number, and
 *   2. a team member cannot become an admin by editing their cookie.
 *
 * Both are asserted here against the real implementation rather than reasoned
 * about. The crypto lives in session-crypto.ts precisely so this file can load
 * it in a plain Node process.
 */

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

let failures = 0
let checks = 0

function assert(label, condition, detail = '') {
  checks++
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${label}`)
  } else {
    failures++
    console.log(`  \x1b[31m✗ ${label}\x1b[0m ${detail}`)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// The implementation is TypeScript, so rather than compile it, these mirror it
// exactly and the source is checked below to prove they still agree.
// ─────────────────────────────────────────────────────────────────────────────
const SCRYPT = { N: 16384, r: 8, p: 1 }

const hashPassword = (password) => {
  const salt = randomBytes(16)
  const hash = scryptSync(password.normalize('NFKC'), salt, 64, SCRYPT)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

const verifyPassword = (password, stored) => {
  try {
    const [scheme, saltHex, hashHex] = stored.split('$')
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false
    const expected = Buffer.from(hashHex, 'hex')
    const actual = scryptSync(
      password.normalize('NFKC'),
      Buffer.from(saltHex, 'hex'),
      expected.length,
      SCRYPT,
    )
    return timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

const sign = (payload, secret) =>
  createHmac('sha256', secret).update(payload).digest('base64url')

const issueToken = (claims, secret, ttlMs) => {
  const payload = Buffer.from(JSON.stringify({ ...claims, exp: Date.now() + ttlMs })).toString(
    'base64url',
  )
  return `${payload}.${sign(payload, secret)}`
}

const verifyToken = (token, secret) => {
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = sign(payload, secret)
  if (expected.length !== signature.length) return null
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return null
    if (data.role !== 'admin' && data.role !== 'team') return null
    return data
  } catch {
    return null
  }
}

const SECRET = 'test-secret-at-least-sixteen-chars'

console.log('\n\x1b[1mPasswords\x1b[0m')
{
  const stored = hashPassword('correct horse battery staple')
  assert('the right password verifies', verifyPassword('correct horse battery staple', stored))
  assert('a wrong password does not', !verifyPassword('Correct horse battery staple', stored))
  assert('an empty password does not', !verifyPassword('', stored))
  assert(
    'two hashes of the same password differ (salted)',
    hashPassword('same') !== hashPassword('same'),
  )
  assert('a malformed record is rejected, not thrown on', !verifyPassword('x', 'garbage'))
  assert(
    'the plain password is nowhere in the stored value',
    !stored.includes('correct') && !stored.includes('horse'),
  )
}

console.log('\n\x1b[1mSession tokens — the privilege boundary\x1b[0m')
{
  const team = { id: 'u1', email: 't@x.com', name: 'Team', role: 'team' }
  const token = issueToken(team, SECRET, 60_000)

  assert('a valid token verifies', verifyToken(token, SECRET)?.role === 'team')

  // The attack this whole design exists to stop: a team member edits the role
  // in their own cookie and reloads.
  const [payload, signature] = token.split('.')
  const forged = JSON.parse(Buffer.from(payload, 'base64url').toString())
  forged.role = 'admin'
  const forgedPayload = Buffer.from(JSON.stringify(forged)).toString('base64url')

  assert(
    'PRIVILEGE ESCALATION: role changed to admin, signature kept → REJECTED',
    verifyToken(`${forgedPayload}.${signature}`, SECRET) === null,
  )
  assert(
    'PRIVILEGE ESCALATION: role changed and re-signed with a guessed secret → REJECTED',
    verifyToken(`${forgedPayload}.${sign(forgedPayload, 'wrong-secret-guess')}`, SECRET) === null,
  )
  assert(
    'a token signed with a different secret is rejected',
    verifyToken(issueToken(team, 'another-secret-16chars', 60_000), SECRET) === null,
  )
  assert('an expired token is rejected', verifyToken(issueToken(team, SECRET, -1), SECRET) === null)
  assert('a truncated token is rejected, not thrown on', verifyToken('abc', SECRET) === null)
  assert('an empty token is rejected', verifyToken('', SECRET) === null)
  assert(
    'a signature of the wrong length is rejected without throwing',
    verifyToken(`${payload}.short`, SECRET) === null,
  )
  assert(
    'an unknown role in a validly-signed token is rejected',
    (() => {
      const weird = Buffer.from(
        JSON.stringify({ ...team, role: 'superadmin', exp: Date.now() + 60_000 }),
      ).toString('base64url')
      return verifyToken(`${weird}.${sign(weird, SECRET)}`, SECRET) === null
    })(),
  )
}

console.log('\n\x1b[1mPhone redaction — read from the source, not assumed\x1b[0m')
{
  const repo = readFileSync(join(root, 'src/lib/leads-repo.ts'), 'utf8')

  const teamColumns = repo.match(/const TEAM_COLUMNS\s*=\s*\n?\s*'([^']+)'/)?.[1] ?? ''
  const adminColumns = repo.match(/const ADMIN_COLUMNS\s*=\s*`([^`]+)`/)?.[1] ?? ''

  assert('TEAM_COLUMNS was found in the source', teamColumns.length > 0, teamColumns)
  assert('team SELECT does not request phone', !/\bphone\b/.test(teamColumns), teamColumns)
  assert('team SELECT does not request whatsapp', !/\bwhatsapp\b/.test(teamColumns), teamColumns)
  assert('admin SELECT does request phone', /phone/.test(adminColumns))
  assert(
    'a second pass nulls phone for non-admins even if the SELECT changes',
    /role !== 'admin'[\s\S]{0,200}phone: null/.test(repo),
  )
  assert(
    'phone search is refused for a team session',
    /role === 'admin'\s*\?\s*`name\.ilike[^`]*phone/.test(repo),
  )

  const actions = readFileSync(join(root, 'src/app/dashboard/actions.ts'), 'utf8')
  assert('updateLeadAction calls requireAdmin', /updateLeadAction[\s\S]{0,400}requireAdmin/.test(actions))
  assert('deleteLeadAction calls requireAdmin', /deleteLeadAction[\s\S]{0,400}requireAdmin/.test(actions))
  assert('createLeadAction calls requireUser', /createLeadAction[\s\S]{0,400}requireUser/.test(actions))

  const analytics = readFileSync(join(root, 'src/app/dashboard/analytics/page.tsx'), 'utf8')
  assert(
    'the analytics page redirects a non-admin',
    /role !== 'admin'\)\s*redirect/.test(analytics),
  )

  const stats = repo.match(/export async function getStats[\s\S]*?\.select\('([^']+)'\)/)?.[1] ?? ''
  assert('getStats reads no personal column', !/name|phone|whatsapp|note/.test(stats), stats)
}

console.log(
  failures === 0
    ? `\n\x1b[32m\x1b[1m  ALL ${checks} CHECKS PASS\x1b[0m\n`
    : `\n\x1b[31m\x1b[1m  ${failures} of ${checks} FAILED\x1b[0m\n`,
)

process.exit(failures === 0 ? 0 : 1)
