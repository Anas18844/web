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

const TIMEOUT_MS = 45_000
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'

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

async function callGemini(items: EssayItem[]): Promise<{ n: number; match: number; note?: string }[]> {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) throw new Error('GEMINI_API_KEY is not set')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': key },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(items) }] }],
          generationConfig: {
            // Zero, so the same paper marked twice gets the same score. A
            // student comparing with a friend must not find the marker
            // disagreed with itself.
            temperature: 0,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  n: { type: 'INTEGER' },
                  match: { type: 'INTEGER' },
                  note: { type: 'STRING' },
                },
                required: ['n', 'match'],
              },
            },
          },
        }),
      },
    )

    if (!res.ok) throw new Error(`HTTP ${res.status} — ${(await res.text()).slice(0, 200)}`)

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) throw new Error('unexpected response shape')
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

  try {
    const raw = await callGemini(items)
    const byNumber = new Map(raw.map((r) => [r.n, r]))

    return {
      source: 'gemini',
      error: null,
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
