const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

/**
 * Reads UTM parameters from the current URL plus the referrer.
 * Without this, we cannot tell which content actually brings students
 * rather than views (roadmap §3.1-هـ / Principle 32).
 */
export function collectUtm(): Record<string, string> {
  if (typeof window === 'undefined') return {}

  const params = new URLSearchParams(window.location.search)
  const out: Record<string, string> = {}

  for (const key of UTM_KEYS) {
    const value = params.get(key)
    if (value) out[key] = value.slice(0, 120)
  }

  if (document.referrer) {
    try {
      const host = new URL(document.referrer).hostname
      if (host && host !== window.location.hostname) out.referrer = host
    } catch {
      /* malformed referrer — ignore */
    }
  }

  return out
}
