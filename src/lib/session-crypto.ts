import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

/**
 * The security primitives, deliberately kept free of Next.js.
 *
 * `auth.ts` imports `next/headers` and `server-only`, which makes every one of
 * its exports impossible to load in a plain Node process — and therefore
 * impossible to test outside a running app. That is a bad property for the two
 * functions in this codebase that decide whether a person can read a student's
 * phone number.
 *
 * So the parts that are pure — hashing a password, signing a session, and
 * detecting a forged one — live here with no framework imports at all, and
 * `scripts/verify-auth.mjs` exercises them directly.
 */

const SCRYPT_KEYLEN = 64

/**
 * Memory-hard on purpose. scrypt with these parameters costs enough RAM per
 * guess that a GPU cannot parallelise the attack the way it can against a fast
 * hash — which is the entire reason a password is never stored as SHA-256.
 */
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 } as const

/** `scrypt$<salt-hex>$<hash-hex>` — the format stored in dashboard_users. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password.normalize('NFKC'), salt, SCRYPT_KEYLEN, SCRYPT_PARAMS)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, saltHex, hashHex] = stored.split('$')
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false

    const expected = Buffer.from(hashHex, 'hex')
    const actual = scryptSync(
      password.normalize('NFKC'),
      Buffer.from(saltHex, 'hex'),
      expected.length,
      SCRYPT_PARAMS,
    )

    // Constant-time. A plain === leaks how much of the hash matched through
    // how long the comparison took, which is enough to recover it byte by byte.
    return timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

// ── Session tokens ───────────────────────────────────────────────────────────

export type SessionClaims = {
  id: string
  email: string
  name: string
  role: 'admin' | 'team'
  exp: number
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

/**
 * `<base64url payload>.<signature>`.
 *
 * The ROLE travels inside the signed payload. That is the point: a team member
 * who edits the cookie to say "admin" changes the payload, which invalidates
 * the signature, and the session is rejected outright rather than promoted.
 */
export function issueToken(claims: Omit<SessionClaims, 'exp'>, secret: string, ttlMs: number) {
  const payload = Buffer.from(JSON.stringify({ ...claims, exp: Date.now() + ttlMs })).toString(
    'base64url',
  )
  return `${payload}.${sign(payload, secret)}`
}

export function verifyToken(token: string, secret: string): SessionClaims | null {
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expected = sign(payload, secret)

  // Length is checked first because timingSafeEqual THROWS on a length
  // mismatch, and an exception here would be an unhandled 500 on every request
  // carrying a malformed cookie.
  if (expected.length !== signature.length) return null
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionClaims
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return null
    if (data.role !== 'admin' && data.role !== 'team') return null
    return data
  } catch {
    return null
  }
}

/** Derives the signing secret from whatever the deployment actually has. */
export function deriveSecret(explicit: string | undefined, fallbackKey: string | null): string {
  const trimmed = explicit?.trim()
  if (trimmed && trimmed.length >= 16) return trimmed

  if (!fallbackKey) {
    throw new Error(
      'Cannot sign dashboard sessions: neither DASHBOARD_SESSION_SECRET nor a Supabase service key is set.',
    )
  }

  return createHmac('sha256', fallbackKey).update('dashboard-session-v1').digest('hex')
}
