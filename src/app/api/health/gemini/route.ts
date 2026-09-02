import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Why is essay marking falling back to word matching?
 *
 *   https://<site>/api/health/gemini
 *
 * Built for the same reason as /api/health: from the outside, "the AI marker
 * did not run" looks identical whether the key is missing, the key is the
 * wrong KIND of key, the model name does not exist, or Google is simply busy.
 * Guessing between those cost a day on the Supabase side of this project, and
 * the fix then was a URL that just answers.
 *
 * NO KEY MATERIAL IS RETURNED — only its shape, and the status codes Google
 * replies with.
 *
 * The listing probe is open, because it is free and reveals nothing. The
 * generation probe costs quota, so it is behind HEALTH_TOKEN — otherwise this
 * endpoint is a way for a stranger to spend the credit.
 */

/**
 * The key's FAMILY, not the key.
 *
 * This distinction is the whole reason the endpoint exists. Google AI Studio
 * keys start `AIza`. A value starting `AQ.` is an ephemeral token issued for
 * the Live API — it authenticates well enough to list models and is not valid
 * for `generateContent`, which is exactly the "GET works, POST does not"
 * symptom recorded in the original homework README.
 */
function describeKey(key: string | undefined) {
  if (!key) return { present: false, family: null, length: 0 }

  const family = key.startsWith('AIza')
    ? 'AIza… — a standard AI Studio API key'
    : key.startsWith('AQ.')
      ? '⚠️ AQ.… — an EPHEMERAL Live-API token, not an API key. It can list models but cannot generate. Create a normal key in Google AI Studio.'
      : key.startsWith('ya29.')
        ? '⚠️ ya29.… — an OAuth access token, not an API key.'
        : 'unrecognised prefix'

  return { present: true, family, length: key.length }
}

export async function GET(request: Request) {
  const key = process.env.GEMINI_API_KEY?.trim()
  const models = (
    process.env.GEMINI_MODELS ||
    process.env.GEMINI_MODEL ||
    'gemini-flash-latest,gemini-2.5-flash,gemini-2.0-flash'
  )
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)

  const report: Record<string, unknown> = {
    key: describeKey(key),
    modelsConfigured: models,
    time: new Date().toISOString(),
  }

  if (!key) {
    return NextResponse.json(
      { ...report, verdict: 'GEMINI_API_KEY is not set on this deployment.' },
      { status: 503 },
    )
  }

  // ── Probe 1: can it list models? Free, and answers "is the key valid at all".
  const listStarted = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'X-goog-api-key': key },
      signal: controller.signal,
    })
    clearTimeout(timer)

    const body = await res.json().catch(() => null)
    const names: string[] =
      body?.models?.map((m: { name: string }) => m.name.replace('models/', '')) ?? []

    report.listModels = {
      status: res.status,
      ms: Date.now() - listStarted,
      modelCount: names.length,
      // Only whether the models we intend to call are actually available.
      configuredModelsAvailable: models.map((m) => ({ model: m, available: names.includes(m) })),
      error: res.ok ? null : String(body?.error?.message ?? '').slice(0, 200),
    }
  } catch (error) {
    report.listModels = {
      status: 'failed',
      ms: Date.now() - listStarted,
      error: error instanceof Error ? error.message : String(error),
    }
  }

  // ── Probe 2: can it actually generate? Costs quota, so it is gated.
  const token = process.env.HEALTH_TOKEN
  const provided = new URL(request.url).searchParams.get('key')
  const mayGenerate = Boolean(token && provided && provided === token)

  if (!mayGenerate) {
    report.generate = token
      ? 'add ?key=<HEALTH_TOKEN> to run the generation probe'
      : 'set HEALTH_TOKEN to enable the generation probe'
  } else {
    report.generate = []
    for (const model of models) {
      const started = Date.now()
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 15_000)
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-goog-api-key': key },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Reply with the single word: ok' }] }],
              generationConfig: { temperature: 0, maxOutputTokens: 10 },
            }),
          },
        )
        clearTimeout(timer)
        const text = await res.text()
        ;(report.generate as unknown[]).push({
          model,
          status: res.status,
          ms: Date.now() - started,
          reply: res.ok ? text.slice(0, 120) : String(text).slice(0, 200),
        })
        if (res.ok) break
      } catch (error) {
        ;(report.generate as unknown[]).push({
          model,
          status: 'failed',
          ms: Date.now() - started,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }

  return NextResponse.json(report)
}
