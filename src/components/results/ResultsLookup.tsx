'use client'

import { useState } from 'react'
import { site } from '@/content/site'

type Offer = 'self' | 'friend' | 'full' | 'friend2' | 'top2' | null
type ResultFile = { kind: string; label: string; name: string; path: string }
type Meta = { first: string; score: number; of: number; offer: Offer; files: ResultFile[] }
type Opened = Meta & { key: CryptoKey; slug: string }
/** A center student's result (migration 012). Only their own row. */
type Center = { first: string; score: number; of: number; rank: number; tied: boolean; top: boolean }
/** One exam the number has a result in (newest first). */
type Exam = { slug: string; title: string; center: Center | null; results: { token: string; key: string }[] }
type Shown = { slug: string; title: string; center: Center | null; found: Opened[] }

const base = (slug: string) => `/files/results/${slug}/`
const ar = (n: number) => n.toLocaleString('ar-EG')

async function importKey(b64: string) {
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt'])
}

/** Fetch one sealed file (12-byte nonce + AES-GCM ciphertext) and open it. */
async function open(key: CryptoKey, slug: string, path: string) {
  const res = await fetch(base(slug) + path)
  if (!res.ok) throw new Error('fetch')
  const buf = new Uint8Array(await res.arrayBuffer())
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf.slice(0, 12) }, key, buf.slice(12))
}

/**
 * The results page: type the number you sat the exam with, get your report
 * (and certificate / parent copy when you have one) as a download.
 */
export function ResultsLookup() {
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [shown, setShown] = useState<Shown[]>([])
  const [downloading, setDownloading] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setShown([])
    setBusy(true)
    try {
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const body = await res.json().catch(() => null)
      if (!body?.ok) {
        setError(body?.message ?? 'حصلت مشكلة. جرّب تاني.')
        return
      }
      const out: Shown[] = []
      for (const ex of body.exams as Exam[]) {
        const found: Opened[] = []
        for (const r of ex.results) {
          const key = await importKey(r.key)
          const meta = JSON.parse(new TextDecoder().decode(await open(key, ex.slug, `${r.token}.meta`))) as Meta
          found.push({ ...meta, key, slug: ex.slug })
        }
        out.push({ slug: ex.slug, title: ex.title, center: ex.center, found })
      }
      setShown(out)
    } catch {
      setError('النت فصل أو حصلت مشكلة. جرّب تاني.')
    } finally {
      setBusy(false)
    }
  }

  async function download(r: Opened, f: ResultFile) {
    setDownloading(f.path)
    try {
      const pdf = await open(r.key, r.slug, f.path)
      const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = f.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      setError('الملف منزلش. جرّب تاني.')
    } finally {
      setDownloading('')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="rs-phone" className="mb-2 block text-sm font-bold text-ink">
            رقم الموبايل اللي امتحنت بيه
          </label>
          <input
            id="rs-phone"
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            placeholder="01xxxxxxxxx"
            className="w-full rounded border border-navy-line bg-navy-deep px-4 py-3 text-lg text-ink"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-ink-muted">
            طلاب السنتر: اكتب نفس الرقم اللي كتبته في ورقة الامتحان. وولي الأمر يكتب رقم الطالب نفسه.
          </p>
        </div>
        {error && (
          <p role="alert" className="rounded bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !phone.trim()}
          className="w-full rounded bg-gold py-4 text-lg font-extrabold text-navy-deep disabled:opacity-60"
        >
          {busy ? 'بندوّر…' : 'اعرض نتيجتي'}
        </button>
      </form>

      {shown.map((ex) => (
        <div key={ex.slug} className="space-y-4">
          <h2 className="border-b border-navy-line pb-2 text-lg font-extrabold text-gold">
            الامتحان الشامل · {ex.title}
          </h2>
          {ex.center && <CenterCard r={ex.center} title={ex.title} slug={ex.slug} hasReport={ex.found.length > 0} />}
          {ex.found.map((r, i) => (
        <section key={i} className="rounded border border-gold/40 bg-gold/5 p-5" aria-live="polite">
          <p className="text-lg font-extrabold text-ink">أهلًا يا {r.first} 👋</p>
          <p className="mt-2 text-body text-ink-muted">
            درجتك في الامتحان الشامل لـ{ex.title}:{' '}
            <span className="text-xl font-extrabold text-gold">
              {ar(r.score)} من {ar(r.of)}
            </span>
          </p>

          {r.files.some((f) => f.kind === 'certificate') && (
            <p className="mt-3 rounded border-2 border-gold bg-navy-deep px-4 py-3 font-extrabold text-gold">
              🏆 مبروك، من أوائل الامتحان! شهادة التقدير بتاعتك أول ملف تحت.
            </p>
          )}

          {r.offer && <OfferNotice offer={r.offer} />}

          <div className="mt-5 grid gap-3">
            {r.files.map((f) => (
              <button
                key={f.path}
                type="button"
                onClick={() => download(r, f)}
                disabled={!!downloading}
                className="flex min-h-12 items-center justify-between gap-3 rounded border border-navy-line bg-navy-deep px-4 py-3 text-start font-bold text-ink transition-colors hover:border-gold disabled:opacity-60"
              >
                <span>📄 {f.label}</span>
                <span className="text-sm text-gold">{downloading === f.path ? 'بينزل…' : 'تحميل PDF'}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            جوه التقرير: الإجابة في كل سؤال، وشرح كل غلطة، وخطة مذاكرة لمدة ٧ أيام.
          </p>
        </section>
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Score and rank of a center student; the ten with a certificate hear about it.
 * Paper students of unit 2 on: the paper was fully reviewed and comes back to
 * them (owner, 2026-11-12). Center students who sat it online get the report below.
 */
function CenterCard({ r, title, slug, hasReport }: { r: Center; title: string; slug: string; hasReport: boolean }) {
  return (
    <section className="rounded border border-gold/40 bg-gold/5 p-5" aria-live="polite">
      <p className="text-lg font-extrabold text-ink">أهلًا يا {r.first} 👋</p>
      <p className="mt-2 text-body text-ink-muted">
        درجتك في الامتحان الشامل لـ{title}:{' '}
        <span className="text-xl font-extrabold text-gold">
          {ar(r.score)} من {ar(r.of)}
        </span>
      </p>
      <p className="mt-2 text-body text-ink-muted">
        ترتيبك على طلاب السنتر:{' '}
        <span className="whitespace-nowrap text-xl font-extrabold text-gold">المركز {ar(r.rank)}</span>
        {r.tied && <span className="text-sm"> (مركز مكرر)</span>}
      </p>

      {r.top && (
        <div className="mt-5 rounded border-2 border-gold bg-navy-deep p-4">
          <p className="font-extrabold text-gold">🏆 مبروك، من أوائل السنتر!</p>
          <p className="mt-2 text-sm font-bold leading-relaxed text-ink">
            ليك شهادة تقدير وجايزة، وهتستلمهم في السنتر.
          </p>
        </div>
      )}

      {hasReport ? null : slug === 'unit-1' ? (
        <p className="mt-4 rounded border border-navy-line bg-navy-deep px-4 py-3 text-sm leading-relaxed text-ink-muted">
          📄 تقرير الأداء بتاعك (أخطاءك وشرح كل غلطة وتراجع إيه) هينزل هنا في نفس الصفحة قريب، وهتفتحه بنفس الرقم.
        </p>
      ) : (
        <p className="mt-4 rounded border border-navy-line bg-navy-deep px-4 py-3 text-sm leading-relaxed text-ink-muted">
          📝 ورقة امتحانك اتراجعت بالكامل، وهتتسلملك في السنتر عشان تشوف كل سؤال وإجابته. ولو فيه أي سؤال
          لسه مش واضح، اسأل عليه في الحصة أو على واتساب.
        </p>
      )}
    </section>
  )
}

/**
 * The 20% notice. Unit 1: the offer page in the PDF (BIZ-45 · BIZ-46 · BIZ-47).
 * Unit 2 (owner, 2026-11-12), online and exam-only students, not the center:
 * friend2 = 20% for any classmate they bring, on any package; top2 = that plus 20% for themselves.
 */
function OfferNotice({ offer }: { offer: Exclude<Offer, null> }) {
  if (offer === 'friend2' || offer === 'top2') return <OfferUnit2 top={offer === 'top2'} />
  const wa = `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent('عايز أشترك في منصة Code Up بخصم الـ20% بتاع الامتحان الشامل')}`
  return (
    <div className="mt-5 rounded border-2 border-gold bg-navy-deep p-4">
      <p className="font-extrabold text-gold">
        {offer === 'full' ? '🏆 هدايا التفوق: الدرجة النهائية تستاهل تتكرّم' : '🎁 مستوى يستاهل نكمّل سوا'}
      </p>
      <ul className="mt-3 space-y-2 text-sm font-bold leading-relaxed text-ink">
        <li>🎁 خصم ٢٠٪ ليك على الاشتراك في منصة Code Up</li>
        {offer === 'friend' && <li>👥 وكمان خصم ٢٠٪ لزميل واحد، عشان درجتك فوق الـ٦٠</li>}
        {offer === 'full' && (
          <>
            <li>👥 وخصم ٢٠٪ لاتنين من صحابك</li>
            <li>💰 ومكافأة مالية لو التفوق استمر في امتحان الشهر الجاي</li>
          </>
        )}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        إزاي الخصم يتفعّل؟ ابعت رسالة على واتساب{' '}
        <bdi dir="ltr" className="font-bold text-ink">{site.whatsapp.display}</bdi> بطلب الاشتراك، وبيطلعلك كود خصم
        صالح لمدة شهر من يوم إصداره، على باقة الشهر أو باقة الترم.
      </p>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block rounded bg-gold px-4 py-2 text-sm font-extrabold text-navy-deep"
      >
        اطلب كود الخصم على واتساب
      </a>
    </div>
  )
}

function OfferUnit2({ top }: { top: boolean }) {
  const wa = `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent('عايز كود خصم الـ20% بتاع الامتحان الشامل للوحدة التانية')}`
  return (
    <div className="mt-5 rounded border-2 border-gold bg-navy-deep p-4">
      <p className="font-extrabold text-gold">🎁 هدية الامتحان الشامل</p>
      <ul className="mt-3 space-y-2 text-sm font-bold leading-relaxed text-ink">
        {top && <li>🏆 خصم ٢٠٪ ليك على الاشتراك في منصة Code Up، عشان إنت من الأوائل</li>}
        <li>👥 خصم ٢٠٪ لأي زميل تجيبه معاك، على أي باقة يختارها</li>
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        إزاي الخصم يتفعّل؟ ابعت رسالة على واتساب{' '}
        <bdi dir="ltr" className="font-bold text-ink">{site.whatsapp.display}</bdi>، وزميلك يقول إنه جاي من طرفك،
        وبيطلع كود الخصم.
      </p>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block rounded bg-gold px-4 py-2 text-sm font-extrabold text-navy-deep"
      >
        اطلب كود الخصم على واتساب
      </a>
    </div>
  )
}
