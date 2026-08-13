'use client'

/**
 * The lead outbox — the guarantee that a submission survives everything.
 *
 * The form used to depend on one fetch succeeding. If that fetch failed — the
 * API down, a deploy mid-request, a phone dropping off the network in a lift,
 * a database refusing writes — the student either saw a red box or was thanked
 * for data we never kept. Both are unacceptable: the first loses the student,
 * the second loses them silently, which is worse.
 *
 * So a submission is no longer a request. It is a record written to
 * localStorage FIRST, and then delivered whenever delivery becomes possible:
 * immediately, on the next page load, when the browser comes back online, or
 * on a backoff timer. The interface never waits on the network to decide what
 * to show, and nothing is ever thrown away because a server had a bad minute.
 *
 * Everything here is best-effort by construction: every entry point swallows
 * its own errors, because a broken outbox must never be able to break a form.
 */

const KEY = 'lead-outbox-v1'
/** Older than this and the student has almost certainly enquired elsewhere. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const MAX_ATTEMPTS = 10
/** 2s, 4s, 8s … capped, so a long outage does not become a busy loop. */
const backoff = (attempts: number) => Math.min(2000 * 2 ** attempts, 5 * 60_000)

export type OutboxJob = {
  /** Client-generated, so a retry is recognisable as the same submission. */
  key: string
  body: Record<string, unknown>
  queuedAt: number
  attempts: number
  nextAttemptAt: number
}

function read(): OutboxJob[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const jobs = JSON.parse(raw) as OutboxJob[]
    if (!Array.isArray(jobs)) return []
    const now = Date.now()
    return jobs.filter((j) => j && j.key && now - j.queuedAt < MAX_AGE_MS)
  } catch {
    return []
  }
}

function write(jobs: OutboxJob[]): void {
  try {
    if (jobs.length === 0) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, JSON.stringify(jobs))
  } catch {
    /* Private mode, quota, disabled storage — the send still gets attempted. */
  }
}

export function pendingCount(): number {
  return read().length
}

/**
 * Records a submission and returns its key.
 *
 * A later submission for the same student REPLACES the earlier one rather than
 * queueing beside it: step two carries everything step one did, so delivering
 * both would only risk two rows for one person.
 */
export function enqueue(body: Record<string, unknown>, key: string): void {
  const jobs = read().filter((j) => j.key !== key)
  jobs.push({ key, body, queuedAt: Date.now(), attempts: 0, nextAttemptAt: 0 })
  write(jobs)
}

let flushing = false
let timer: ReturnType<typeof setTimeout> | null = null

/**
 * Attempts delivery of everything due.
 *
 * A 4xx means the server understood and refused — retrying identical bytes
 * would only fail identically, so the job is dropped. Anything else (5xx, a
 * network throw, an offline device) is treated as "not yet" and rescheduled.
 */
export async function flush(): Promise<{ sent: number; remaining: number }> {
  if (flushing || typeof window === 'undefined') return { sent: 0, remaining: pendingCount() }
  flushing = true

  let sent = 0
  try {
    const now = Date.now()
    const jobs = read()
    const keep: OutboxJob[] = []

    for (const job of jobs) {
      if (job.nextAttemptAt > now) {
        keep.push(job)
        continue
      }

      try {
        const res = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(job.body),
          keepalive: true,
        })

        if (res.ok) {
          sent++
          continue
        }

        // Refused, not failed. Keeping it would retry the same rejection.
        if (res.status >= 400 && res.status < 500) continue

        throw new Error(String(res.status))
      } catch {
        const attempts = job.attempts + 1
        if (attempts >= MAX_ATTEMPTS) continue
        keep.push({ ...job, attempts, nextAttemptAt: Date.now() + backoff(attempts) })
      }
    }

    /**
     * Merge, never overwrite.
     *
     * `jobs` was read before the network work began, and a student can submit
     * while that work is still in flight. Writing the stale snapshot back
     * would erase their lead — silently, after they had already been shown the
     * confirmation. So anything that appeared in storage meanwhile is carried
     * forward, and only the keys this pass actually handled are replaced.
     */
    const handled = new Set(jobs.map((j) => j.key))
    const arrivedDuringFlush = read().filter((j) => !handled.has(j.key))
    const next = [...keep, ...arrivedDuringFlush]

    write(next)
    schedule(next)
    return { sent, remaining: next.length }
  } finally {
    flushing = false
  }
}

/** Wakes the outbox when the soonest job is due. */
function schedule(jobs: OutboxJob[]): void {
  if (timer) clearTimeout(timer)
  if (jobs.length === 0) return
  const soonest = Math.min(...jobs.map((j) => j.nextAttemptAt))
  const delay = Math.max(1000, soonest - Date.now())
  timer = setTimeout(() => void flush(), delay)
}

let started = false

/**
 * Starts the delivery loop. Safe to call from every mount — it only ever
 * attaches its listeners once.
 */
export function startOutbox(): void {
  if (started || typeof window === 'undefined') return
  started = true

  // A fresh page load, a reconnection, or a tab coming back to the foreground
  // are all strong evidence that conditions changed — a different network, a
  // finished deploy, a database that is answering again. Waiting out a backoff
  // that was earned during the outage would leave a student's lead sitting on
  // the device for minutes after delivery became possible, so each of these
  // clears the timer and tries at once.
  void retryNow()
  window.addEventListener('online', () => void retryNow())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void retryNow()
  })
}

/** Drops any pending backoff and attempts delivery immediately. */
export async function retryNow(): Promise<{ sent: number; remaining: number }> {
  const jobs = read()
  if (jobs.length > 0) write(jobs.map((j) => ({ ...j, nextAttemptAt: 0 })))
  return flush()
}
