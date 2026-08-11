import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Proof that the browser asking to complete a lead is the browser that created
 * it.
 *
 * Step one returns the new row's id so step two can attach to it. An id on its
 * own is a capability anyone could guess or replay, so it travels with a short
 * HMAC of itself. Without the signature the endpoint would let a stranger
 * overwrite another student's answers.
 *
 * Server-only — `node:crypto` never reaches the browser bundle.
 */

function secret(): string {
  const value = process.env.LEAD_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!value) throw new Error('LEAD_TOKEN_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is not set')
  return value
}

export function signLeadId(id: string): string {
  return createHmac('sha256', secret()).update(id).digest('base64url')
}

/** Constant-time compare — a fast reject leaks how much of the token matched. */
export function verifyLeadToken(id: string, token: string): boolean {
  let expected: Buffer
  try {
    expected = Buffer.from(signLeadId(id))
  } catch {
    return false
  }
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
