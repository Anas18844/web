import 'server-only'

/**
 * Essay marking.
 *
 * Ported from the standalone page's `grader.js`, with the one change its own
 * README demanded before this went anywhere near a platform: THE KEY LIVES ON
 * THE SERVER. It used to sit in a `config.js` that loaded in the student's
 * browser, where any student could read it from the network tab and spend the
 * credit.
 *
 * Two properties are kept exactly as they were, because both were deliberate:
 *
 *   1. ONE call for all ten essays, not ten calls. Ten round trips per student
 *      is ten times the latency and ten times the cost for no gain.
 *   2. It ALWAYS returns a mark. If the model is unreachable, slow, or talking
 *      nonsense, it falls back to local word matching and says so. A student
 *      who has finished a paper must never be told "try again later" — they
 *      have already done the work.
 */

/**
 * The whole grading budget, retries included.
 *
 * It has to fit inside the serverless function's own limit with room to spare:
 * if grading overruns, the student gets a 504 and NO result at all, which is
 * strictly worse than a paper marked by word-matching. So the budget is the
 * hard ceiling and every attempt is cut to whatever is left of it.
 */
const TOTAL_BUDGET_MS = 45_000
/** No single attempt may eat the whole budget and leave nothing for a retry. */
// A full ten-essay prompt measured 14.8s without a schema, so a 12s cap
// was aborting calls that were about to succeed.
const ATTEMPT_TIMEOUT_MS = 22_000

/**
 * Waits between attempts. Short, because a student is watching a spinner —
 * this is not a background job that can afford exponential patience.
 */
const RETRY_DELAYS_MS = [700, 1800]

/**
 * The models to try, in order.
 *
 * A chain rather than a single name, because the failure seen in production was
 * a 503 "this model is currently experiencing high demand" — retrying the SAME
 * overloaded model harder does not help. Falling to a sibling does.
 *
 * A 404 on an unknown model id is treated like any other failure here: the
 * chain simply moves on. That makes the list safe to extend without checking
 * whether every entry exists on every account.
 *
 * Override with GEMINI_MODELS as a comma-separated list, or GEMINI_MODEL for a
 * single one.
 */
const MODELS: string[] = (
  process.env.GEMINI_MODELS ||
  process.env.GEMINI_MODEL ||
  // Only what this account can actually SERVE, probed directly:
  //   gemini-flash-latest    → 200
  //   gemini-2.5-flash       → 404 "no longer available to serve"
  //   gemini-2.5-flash-lite  → 404 "no longer available to serve"
  //   gemini-pro-latest      → 429 quota exceeded
  //
  // Note that listing a model is NOT the same as being able to call it —
  // /v1beta/models happily returns models that then 404 on generateContent.
  // Every extra entry here costs a student a wasted attempt, so the list stays
  // at what was verified.
  'gemini-flash-latest'
)
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean)

/**
 * Errors worth trying again.
 *
 * 503 is the one that prompted this: Google returns "This model is currently
 * experiencing high demand… please try again later", which is an instruction,
 * not a verdict. Without a retry a two-second capacity spike silently demotes
 * every paper submitted during it to word-matching — and the student is told
 * their essay marking was rougher than it needed to be.
 *
 * 4xx is NOT retryable. A bad key or a malformed request fails identically on
 * the second attempt and only costs the student more waiting.
 */
function isRetryable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  if (/HTTP (429|500|502|503|504)/.test(message)) return true
  // A timeout or a dropped connection says nothing about whether it would
  // work now.
  if (/abort|network|fetch failed|ETIMEDOUT|ECONNRESET/i.test(message)) return true
  return false
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * ⚠️ There was a check here that REFUSED keys beginning `AQ.`, on the theory
 * that they were ephemeral Live-API tokens which can list models but not
 * generate. That theory was wrong, and it was tested against the real key
 * before shipping only by luck:
 *
 *   POST gemini-flash-latest:generateContent  →  200  (1.7s, then 5.1s)
 *
 * The key generates perfectly well. The production failures were capacity —
 * 503 "high demand" and slow responses — which is what the retry loop below
 * exists for. Judging a credential by the shape of its prefix would have
 * broken a working deployment to fix a problem that was never there.
 */

/** A mark at or above this counts the essay as correct. */
export const PASS_THRESHOLD = 60

export type EssayItem = { n: number; q: string; model: string; student: string }
export type EssayResult = { n: number; match: number; note: string; correct: boolean }

// ── Local fallback ───────────────────────────────────────────────────────────

/**
 * Arabic normalisation: strips diacritics and folds the letters students vary
 * on. Without it "الإجابة" and "الاجابه" are different strings, and a correct
 * answer is marked wrong for a reason no teenager would accept.
 */
function normalise(s: string): string {
  return (s || '')
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^ء-يa-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

const STOP = new Set(['في', 'من', 'علي', 'عن', 'الي', 'هو', 'هي', 'ما', 'التي', 'الذي', 'و', 'او', 'مع'])

export function localMatch(student: string, model: string): number {
  const s = normalise(student)
  const m = normalise(model)
  if (!s) return 0
  if (s === m) return 100

  const modelWords = m.split(' ').filter((w) => w.length > 1 && !STOP.has(w))
  const studentWords = new Set(s.split(' ').filter((w) => w.length > 1))
  if (modelWords.length === 0) return 0

  let hits = 0
  for (const w of modelWords) {
    if (studentWords.has(w)) {
      hits++
      continue
    }
    // A shared four-letter stem: Arabic inflection changes endings, not roots.
    for (const x of studentWords) {
      if (w.length >= 4 && x.length >= 4 && (x.startsWith(w.slice(0, 4)) || w.startsWith(x.slice(0, 4)))) {
        hits++
        break
      }
    }
  }

  return Math.round((hits / modelWords.length) * 100)
}

// ── The model ────────────────────────────────────────────────────────────────

function buildPrompt(items: EssayItem[]): string {
  const lines = items
    .map(
      (it) =>
        `${it.n}) السؤال: ${it.q}\n   الإجابة النموذجية: ${it.model}\n   إجابة الطالب: ${it.student || '(لم يجب)'}`,
    )
    .join('\n\n')

  return `أنت مصحّح امتحان لمادة «البرمجة والذكاء الاصطناعي» — الصف الثاني بكالوريا في مصر.

مهمتك: قارن إجابة الطالب بالإجابة النموذجية لكل سؤال، وقدّر نسبة التطابق في **المعنى** من 0 إلى 100.

قواعد التصحيح:
- الحكم على المعنى لا على الحروف. لو الطالب كتب المصطلح صحيحًا بصياغة مختلفة أو بمرادف، تُحسب صحيحة.
- تجاهل الأخطاء الإملائية البسيطة والتشكيل و«ال» التعريف.
- الإجابة الأطول من النموذجية لا تُخصَّم ما دامت تحتوي المعنى الصحيح.
- الإجابة الفارغة أو الخارجة عن الموضوع = 0.
- الإجابة التي تذكر مصطلحًا مختلفًا تمامًا = 0 حتى لو كانت جملة سليمة.

أعد النتيجة JSON فقط بالشكل التالي، بنفس عدد العناصر وبنفس الترتيب:
[{"n":1,"match":85,"note":"سبب مختصر بالعربية لا يتجاوز 8 كلمات"}]

الأسئلة:

${lines}`
}

/**
 * Pulls the JSON array out of a free-text reply.
 *
 * Without structured output the model returns prose that CONTAINS JSON, and it
 * commonly wraps it in a ```json fence or adds a sentence before it. Parsing
 * the whole string fails on both, so the fence is stripped and, failing that,
 * the outermost [ … ] is sliced out.
 *
 * Returns null rather than throwing: the caller treats that as a failed
 * attempt and either retries or falls back to word matching, which is the same
 * path every other upstream problem takes.
 */
function extractJsonArray(text: string): { n: number; match: number; note?: string }[] | null {
  const candidates = [
    text,
    // ```json … ```  or  ``` … ```
    text.replace(/^[\s\S]*?```(?:json)?\s*/i, '').replace(/```[\s\S]*$/, ''),
    // The outermost bracketed run, for a reply with commentary around it.
    (() => {
      const start = text.indexOf('[')
      const end = text.lastIndexOf(']')
      return start >= 0 && end > start ? text.slice(start, end + 1) : ''
    })(),
  ]

  for (const candidate of candidates) {
    const trimmed = candidate.trim()
    if (!trimmed) continue
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed
    } catch {
      /* try the next shape */
    }
  }

  return null
}

async function callGemini(
  items: EssayItem[],
  budgetMs: number,
  model: string,
): Promise<{ n: number; match: number; note?: string }[]> {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) throw new Error('GEMINI_API_KEY is not set')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Math.max(1_000, budgetMs))

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': key },
        signal: controller.signal,
        /**
         * ⚠️ NO `responseMimeType` and NO `responseSchema`, and that is load
         * bearing rather than an oversight.
         *
         * This account cannot use structured output. Asking for it returns
         * 503 "this model is currently experiencing high demand" — a capacity
         * message for what is actually a capability limit, which is why this
         * looked for so long like Google being busy. Probed directly:
         *
         *   tiny prompt, no schema        → 200
         *   tiny prompt + json mime type  → 503
         *   tiny prompt + responseSchema  → 503
         *   BIG prompt,  no schema        → 200
         *   BIG prompt + responseSchema   → 503
         *
         * Prompt size is irrelevant; the schema is the whole difference. So the
         * JSON is requested in the prompt and parsed out of the reply instead.
         */
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(items) }] }],
          generationConfig: {
            // Zero, so the same paper marked twice gets the same score. A
            // student comparing with a friend must not find the marker
            // disagreed with itself.
            temperature: 0,
          },
        }),
      },
    )

    if (!res.ok) throw new Error(`HTTP ${res.status} — ${(await res.text()).slice(0, 200)}`)

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof text !== 'string') throw new Error('no text in response')

    const parsed = extractJsonArray(text)
    if (!parsed) throw new Error(`could not parse JSON from reply: ${text.slice(0, 120)}`)
    return parsed
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Marks every essay and reports which marker did it.
 *
 * `source: 'local'` is not a failure to hide — the result card says so, because
 * a student whose essay was marked by word-matching deserves to know why the
 * note is terse, and a teacher seeing a run of them knows the marker is down.
 */
export async function gradeEssays(
  items: EssayItem[],
): Promise<{ source: 'gemini' | 'local'; error: string | null; results: EssayResult[] }> {
  if (items.length === 0) return { source: 'local', error: null, results: [] }

  /**
   * Try, then try again if the failure was the kind that passes.
   *
   * Google's 503 says "high demand, please try again later" in as many words.
   * Treating that as final meant a two-second capacity spike marked an entire
   * cohort's essays by word-matching — and told each of them so on their
   * result card.
   *
   * Every attempt is capped by whatever is LEFT of the budget, so a slow first
   * call cannot leave the retry with no time, and the whole thing cannot
   * outlive the serverless function around it.
   */
  const startedAt = Date.now()
  const left = () => TOTAL_BUDGET_MS - (Date.now() - startedAt)

  let lastError: unknown = null
  let raw: { n: number; match: number; note?: string }[] | null = null
  let usedModel: string | null = null

  outer: for (const model of MODELS) {
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      if (left() < 1_500) break outer

      try {
        raw = await callGemini(items, Math.min(ATTEMPT_TIMEOUT_MS, left()), model)
        usedModel = model
        lastError = null
        break outer
      } catch (error) {
        lastError = error

        // Not a wobble — a wrong key, a malformed request. The next model
        // would fail the same way, so stop the whole chain rather than
        // spending the student's wait on it three more times.
        if (!isRetryable(error) && !/HTTP 404/.test(String(error))) break outer

        // Out of retries for this model; let the chain try the next one.
        if (attempt === RETRY_DELAYS_MS.length) break

        const wait = RETRY_DELAYS_MS[attempt]
        if (left() < wait + 1_500) break outer
        await sleep(wait)
      }
    }
  }

  try {
    if (!raw) throw lastError ?? new Error('grading did not run')
    const byNumber = new Map(raw.map((r) => [r.n, r]))

    return {
      source: 'gemini',
      error: usedModel && usedModel !== MODELS[0] ? `marked by ${usedModel}` : null,
      results: items.map((it) => {
        const r = byNumber.get(it.n)
        const match =
          r && typeof r.match === 'number'
            ? Math.max(0, Math.min(100, r.match))
            : localMatch(it.student, it.model)
        return { n: it.n, match, note: r?.note || '', correct: match >= PASS_THRESHOLD }
      }),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      source: 'local',
      error: message,
      results: items.map((it) => {
        const match = localMatch(it.student, it.model)
        return {
          n: it.n,
          match,
          note: 'تصحيح تلقائي محلي',
          correct: match >= PASS_THRESHOLD,
        }
      }),
    }
  }
}
