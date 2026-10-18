'use client'

import { useState } from 'react'
import { site } from '@/content/site'

type Offer = 'self' | 'friend' | 'full' | null
type ResultFile = { kind: string; label: string; name: string; path: string }
type Meta = { first: string; score: number; of: number; offer: Offer; files: ResultFile[] }
type Opened = Meta & { key: CryptoKey }

const BASE = '/files/results/unit-1/'
const ar = (n: number) => n.toLocaleString('ar-EG')

async function importKey(b64: string) {
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt'])
}

/** Fetch one sealed file (12-byte nonce + AES-GCM ciphertext) and open it. */
async function open(key: CryptoKey, path: string) {
  const res = await fetch(BASE + path)
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
  const [found, setFound] = useState<Opened[]>([])
  const [downloading, setDownloading] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setFound([])
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
      const opened: Opened[] = []
      for (const r of body.results as { token: string; key: string }[]) {
        const key = await importKey(r.key)
        const meta = JSON.parse(new TextDecoder().decode(await open(key, `${r.token}.meta`))) as Meta
        opened.push({ ...meta, key })
      }
      setFound(opened)
    } catch {
      setError('النت فصل أو حصلت مشكلة. جرّب تاني.')
    } finally {
      setBusy(false)
    }
  }

  async function download(r: Opened, f: ResultFile) {
    setDownloading(f.path)
    try {
      const pdf = await open(r.key, f.path)
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
            ولي الأمر يكتب رقم الطالب نفسه، وهيلاقي تقرير ولي الأمر جنب تقرير الطالب.
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

      {found.map((r, i) => (
        <section key={i} className="rounded border border-gold/40 bg-gold/5 p-5" aria-live="polite">
          <p className="text-lg font-extrabold text-ink">أهلًا يا {r.first} 👋</p>
          <p className="mt-2 text-body text-ink-muted">
            درجتك في الامتحان الشامل للوحدة الأولى:{' '}
            <span className="text-xl font-extrabold text-gold">
              {ar(r.score)} من {ar(r.of)}
            </span>
          </p>

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
  )
}

/** The 20% notice — same rules as the offer page in the PDF (BIZ-45 · BIZ-46 · BIZ-47). */
function OfferNotice({ offer }: { offer: Exclude<Offer, null> }) {
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
