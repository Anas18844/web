import 'server-only'

/**
 * One student, one number — the pieces every write path shares.
 *
 * This lives on its own because three unrelated callers need it: the public
 * form's API route, its no-JavaScript fallback, and the dashboard action the
 * team uses to add a student who arrived by WhatsApp. Putting it in any one of
 * them would mean the other two either import from a route file or, far more
 * likely, quietly grow their own version that drifts.
 */

/**
 * A number we already hold.
 *
 * Thrown rather than returned so it cannot be dropped by a caller that only
 * checks for an id — every path either produces a lead or raises this, and
 * there is no third outcome that silently writes a second row.
 */
export class AlreadyRegisteredError extends Error {
  constructor(readonly existing: { name: string | null; source: string | null }) {
    super('already_registered')
    this.name = 'AlreadyRegisteredError'
  }
}

/**
 * Postgres unique_violation — the index from migration 009 saying no.
 *
 * This is the case the SELECT above it cannot catch: two requests that both
 * looked, both found nothing, and both went on to insert. The check produces
 * the kind message; this produces the guarantee.
 */
export function isDuplicateRow(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null
  return e?.code === '23505' || /duplicate key value|leads_phone_key/i.test(e?.message ?? '')
}

/** True when the student should be stopped and told, rather than written. */
export function isAlreadyRegistered(error: unknown): boolean {
  return error instanceof AlreadyRegisteredError || isDuplicateRow(error)
}
