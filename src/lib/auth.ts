import 'server-only'

import { cookies } from 'next/headers'
import { getSupabaseAdmin, resolveConfig } from '@/lib/supabase'
import {
  deriveSecret,
  hashPassword,
  issueToken,
  verifyPassword,
  verifyToken,
} from '@/lib/session-crypto'

/**
 * Dashboard authentication.
 *
 * `server-only` at the top is load-bearing: it makes the BUILD FAIL if any of
 * this is ever imported into a client component. Session signing that
 * accidentally ships to a browser is not a bug you find later, so it is made
 * impossible to introduce rather than something to remember.
 *
 * The cryptography itself lives in session-crypto.ts, which imports nothing
 * from Next and can therefore be tested in a plain Node process — see
 * scripts/verify-auth.mjs. This file is the part that needs a request: cookies,
 * the database, and the two guards every action begins with.
 *
 * Two roles, and the difference is enforced here and in the data layer, never
 * in the interface:
 *
 *   admin — every field including phone numbers, may edit and delete.
 *   team  — everything except phone numbers, may add, may not change or remove.
 */

export type Role = 'admin' | 'team'

export type SessionUser = {
  id: string
  email: string
  name: string
  role: Role
  /**
   * The current password was issued by someone else — from the creation script,
   * or a reset. Every screen except /dashboard/password refuses to render while
   * this is true, so a password a third party knows cannot be used to read
   * student records even once.
   */
  mustChangePassword: boolean
}

export { hashPassword, verifyPassword }

const COOKIE = 'dash_session'
const MAX_AGE_SECONDS = 12 * 60 * 60

/**
 * `DASHBOARD_SESSION_SECRET` if set, otherwise derived from the Supabase
 * service key — which must already exist for anything on this site to work, so
 * there is no second variable to forget and no way to end up silently signing
 * sessions with an empty string.
 *
 * One consequence worth knowing: rotating the Supabase key logs everybody out.
 * That is correct behaviour, not a side effect.
 */
function sessionSecret(): string {
  return deriveSecret(process.env.DASHBOARD_SESSION_SECRET, resolveConfig().key)
}

// ── Log in / out ─────────────────────────────────────────────────────────────

/**
 * Returns the user on success, null on a genuine credential failure, and
 * THROWS when the system itself is broken.
 *
 * Those last two are deliberately not the same thing, and the distinction was
 * put in after watching this exact code report "wrong email or password" for a
 * database whose table did not exist yet. A misconfiguration that impersonates
 * a user error is the single most expensive kind of bug on this project — it
 * sends someone to re-type a password for two days while the real fault sits
 * untouched one layer down.
 *
 * So: a query ERROR is a system fault and travels up. A missing row, an
 * inactive account or a bad password is a credential failure and returns null.
 *
 * Credential failures share ONE outcome, because distinguishing them tells
 * whoever is guessing which half of the pair to keep trying, which turns a
 * login form into a directory of staff emails. A query error leaks nothing
 * about any account, so it is safe to be specific about.
 */
export async function signIn(email: string, password: string): Promise<SessionUser | null> {
  const normalized = email.trim().toLowerCase()
  if (!normalized || !password) return null

  const { data, error } = await getSupabaseAdmin()
    .from('dashboard_users')
    .select('id, email, name, role, password_hash, active, must_change_password')
    .eq('email', normalized)
    .maybeSingle()

  if (error) {
    throw new Error(
      `تعذّر الوصول لجدول المستخدمين (${error.message}). غالبًا الميجريشن 004 لسه ماتشغّلش.`,
    )
  }

  if (!data || !data.active) {
    // Hash anyway. Returning early on an unknown email makes the response
    // measurably faster than for a known one, which is a way to enumerate
    // accounts without ever logging in.
    verifyPassword(password, `scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`)
    return null
  }

  if (!verifyPassword(password, data.password_hash)) return null

  const user: SessionUser = {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role as Role,
    mustChangePassword: Boolean(data.must_change_password),
  }

  const jar = await cookies()
  jar.set(COOKIE, issueToken(user, sessionSecret(), MAX_AGE_SECONDS * 1000), {
    // Unreadable to JavaScript, so an XSS anywhere on the site cannot steal it.
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })

  await getSupabaseAdmin()
    .from('dashboard_users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', user.id)

  return user
}

export async function signOut(): Promise<void> {
  const jar = await cookies()
  jar.delete(COOKIE)
}

/**
 * The current user, or null.
 *
 * The signature is checked first (cheap, no network), then the account is
 * re-read from the database. That second step is why a deactivated account
 * stops working immediately rather than whenever its cookie expires — and it
 * is where a role change takes effect. The role in the cookie is never
 * trusted as the final word; the row is.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null

  let claims
  try {
    claims = verifyToken(token, sessionSecret())
  } catch {
    return null
  }
  if (!claims) return null

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('dashboard_users')
      .select('id, email, name, role, active, must_change_password')
      .eq('id', claims.id)
      .maybeSingle()

    if (error || !data || !data.active) return null

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role as Role,
      mustChangePassword: Boolean(data.must_change_password),
    }
  } catch {
    return null
  }
}

/**
 * The guard every dashboard screen starts with.
 *
 * Returns null when there is no session, and the string '/dashboard/password'
 * when there is one that must not be allowed any further. The caller redirects.
 * Keeping it as one function means a new screen cannot forget half the rule —
 * the half that would let a temporary password read the student list.
 */
export async function guardPage(): Promise<
  { redirect: string } | { user: SessionUser }
> {
  const user = await getSessionUser()
  if (!user) return { redirect: '/dashboard/login' }
  if (user.mustChangePassword) return { redirect: '/dashboard/password' }
  return { user }
}

/**
 * Sets a new password and clears the forced-change flag.
 *
 * Re-verifies the CURRENT password even though the person is already signed in.
 * A session left open on an unlocked laptop is exactly the situation where
 * someone else changes the password and locks the owner out of their own
 * students, and knowing the old one is what distinguishes the owner.
 */
export async function changePassword(
  user: SessionUser,
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('dashboard_users')
    .select('password_hash')
    .eq('id', user.id)
    .maybeSingle()

  if (error) return { ok: false, error: `تعذّر الوصول للحساب: ${error.message}` }
  if (!data) return { ok: false, error: 'الحساب مش موجود' }

  if (!verifyPassword(currentPassword, data.password_hash)) {
    return { ok: false, error: 'كلمة السر الحالية غلط' }
  }

  // Twelve, because this login can read every student's phone number. The
  // usual "at least eight" is advice for accounts that cannot.
  if (newPassword.length < 12) {
    return { ok: false, error: 'كلمة السر الجديدة لازم ١٢ حرف على الأقل' }
  }

  if (verifyPassword(newPassword, data.password_hash)) {
    return { ok: false, error: 'دي نفس كلمة السر الحالية' }
  }

  const { error: writeError } = await supabase
    .from('dashboard_users')
    .update({
      password_hash: hashPassword(newPassword),
      must_change_password: false,
      password_changed_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (writeError) return { ok: false, error: `ماتغيّرتش: ${writeError.message}` }

  return { ok: true }
}

/**
 * Throws unless someone is signed in AND their password is their own.
 *
 * The second half matters as much as the first. Redirecting the pages is not
 * enough on its own: a server action is a public endpoint, so an account still
 * carrying an issued password could otherwise be used to write leads without
 * ever loading a screen. `allowPendingPassword` exists for exactly one caller —
 * the action that changes the password.
 */
export async function requireUser(
  { allowPendingPassword = false }: { allowPendingPassword?: boolean } = {},
): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new Error('UNAUTHENTICATED')
  if (user.mustChangePassword && !allowPendingPassword) throw new Error('PASSWORD_CHANGE_REQUIRED')
  return user
}

/**
 * Throws unless the signed-in user is an admin.
 *
 * Every destructive action calls this as its FIRST statement. Hiding a delete
 * button is a courtesy to the person who should not press it; this is what
 * stops it being pressed.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== 'admin') throw new Error('FORBIDDEN')
  return user
}

// ── Audit ────────────────────────────────────────────────────────────────────

/**
 * Records an action. Best-effort by construction: a failure to write history
 * must never roll back the thing that happened, or the dashboard breaks every
 * time the audit table has a bad minute.
 */
export async function audit(
  actor: SessionUser,
  action: 'create' | 'update' | 'delete' | 'login' | 'export',
  details: { leadId?: string; before?: unknown; after?: unknown } = {},
): Promise<void> {
  try {
    await getSupabaseAdmin().from('dashboard_audit').insert({
      actor_id: actor.id,
      actor_email: actor.email,
      actor_role: actor.role,
      action,
      lead_id: details.leadId ?? null,
      before: details.before ?? null,
      after: details.after ?? null,
    })
  } catch {
    /* Never block the operation on its own record. */
  }
}
