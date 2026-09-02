import Image from 'next/image'
import type { SummaryBlock } from '@/content/summaries'
import { toArabicDigits } from '@/lib/arabic'

/**
 * Renders one summary block.
 *
 * A server component with no interactivity at all — this is a page a student
 * reads, and the reading progress rail is the only moving part on it. Keeping
 * this server-side means a forty-block revision page costs the browser nothing
 * beyond the HTML.
 */
export function Block({ block }: { block: SummaryBlock }) {
  switch (block.t) {
    // ── The one sentence that carries the axis ────────────────────────────
    case 'idea':
      return (
        <p className="border-s-2 border-gold bg-gold/[0.06] px-5 py-4 text-body leading-relaxed text-ink">
          <span className="font-extrabold text-gold">الفكرة: </span>
          {block.x}
        </p>
      )

    case 'p':
      return <p className="text-body leading-relaxed text-ink-muted">{block.x}</p>

    // ── A titled box; `warn` is the exam-trap ─────────────────────────────
    case 'card': {
      const warn = block.tone === 'warn'
      return (
        <div
          className={`rounded border p-5 ${
            warn ? 'border-gold/50 bg-gold/[0.08]' : 'border-navy-line bg-navy-soft/30'
          }`}
        >
          {block.title && (
            <h3 className={`mb-2.5 font-extrabold ${warn ? 'text-gold' : 'text-ink'}`}>
              {block.title}
            </h3>
          )}
          <div className="grid gap-2.5">
            {block.body.map((line, i) => (
              <p key={i} className="text-body leading-relaxed text-ink-muted">
                {line}
              </p>
            ))}
          </div>
        </div>
      )
    }

    case 'figure':
      return (
        <figure>
          {/*
            Height-capped like the homework images and for the same reason:
            these are portrait book scans, and one of them unconstrained is a
            screenful of picture between a student and the next sentence.
          */}
          <Image
            src={block.image.src}
            alt={block.alt}
            width={block.image.width}
            height={block.image.height}
            sizes="(min-width: 768px) 640px, 100vw"
            className="max-h-80 w-auto max-w-full rounded border border-navy-line object-contain"
          />
          <figcaption className="mt-2.5 text-sm leading-relaxed text-ink-faint">
            {block.caption}
          </figcaption>
        </figure>
      )

    // ── Eras ──────────────────────────────────────────────────────────────
    case 'timeline':
      return (
        <ol className="relative grid gap-6 border-s-2 border-navy-line ps-6">
          {block.items.map((item, i) => (
            <li key={i} className="relative">
              {/* The marker sits ON the rail, so the eye reads a sequence
                  rather than a list that happens to have a line beside it. */}
              <span
                aria-hidden="true"
                className={`absolute -start-[1.9rem] top-1.5 h-3 w-3 rounded-full border-2 ${
                  item.now ? 'border-gold bg-gold' : 'border-navy-line bg-navy-deep'
                }`}
              />
              <p
                className={`font-mono text-xs font-bold ${item.now ? 'text-gold' : 'text-ink-faint'}`}
              >
                {item.era}
              </p>
              <p className="mt-1 font-extrabold text-ink">{item.title}</p>
              <p className="mt-1 text-body leading-relaxed text-ink-muted">{item.body}</p>
            </li>
          ))}
        </ol>
      )

    case 'numbered':
      return (
        <ol className="grid gap-4">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-gold/15 font-mono text-sm font-extrabold text-gold">
                {toArabicDigits(i + 1)}
              </span>
              <div className="min-w-0">
                <p className="font-extrabold text-ink">{item.title}</p>
                <p className="mt-1 text-body leading-relaxed text-ink-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )

    case 'compare':
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {block.items.map((item, i) => (
            <div key={i} className="rounded border border-navy-line bg-navy-soft/30 p-5">
              <span className="inline-block rounded-sm bg-gold/15 px-2.5 py-1 font-mono text-xs font-bold text-gold">
                {item.badge}
              </span>
              <p className="mt-3 font-extrabold text-ink">{item.title}</p>
              <p className="mt-1.5 text-body leading-relaxed text-ink-muted">{item.body}</p>
            </div>
          ))}
        </div>
      )

    // ── Cause and effect ──────────────────────────────────────────────────
    case 'chain':
      return (
        <div className="flex flex-wrap items-center gap-3">
          {block.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="rounded border border-gold/40 bg-gold/[0.07] px-4 py-2.5 text-sm font-bold text-ink">
                {step}
              </span>
              {i < block.steps.length - 1 && (
                <span aria-hidden="true" className="text-gold">
                  ←
                </span>
              )}
            </div>
          ))}
        </div>
      )

    case 'stat':
      return (
        <div className="flex flex-wrap items-center gap-5 rounded border border-gold/40 bg-gold/[0.07] p-6">
          <p className="font-mono text-5xl font-extrabold text-gold">{block.value}</p>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-ink">{block.label}</p>
            <p className="mt-1.5 text-body leading-relaxed text-ink-muted">{block.body}</p>
          </div>
        </div>
      )

    case 'terms':
      return (
        <div className="overflow-hidden rounded border border-navy-line">
          <table className="w-full border-collapse text-start text-sm">
            <thead>
              <tr className="border-b border-navy-line bg-navy-soft/60 text-xs text-ink-faint">
                <th className="px-4 py-2.5 text-start font-bold">المصطلح</th>
                <th className="px-4 py-2.5 text-start font-bold">English</th>
              </tr>
            </thead>
            <tbody>
              {block.items.map((term) => (
                <tr key={term.en} className="border-b border-navy-line/60 last:border-0">
                  <td className="px-4 py-2.5 font-bold text-ink">{term.ar}</td>
                  <td dir="ltr" className="px-4 py-2.5 text-start font-mono text-xs text-ink-muted">
                    {term.en}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'closing':
      return (
        <div className="rounded border border-gold/40 bg-gold/[0.07] p-6">
          <h3 className="text-lg font-extrabold text-gold">{block.title}</h3>
          <p className="mt-3 text-body leading-relaxed text-ink">{block.body}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {block.flow.map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="rounded-sm border border-navy-line bg-navy-deep/60 px-3 py-1.5 text-xs font-bold text-ink">
                  {step}
                </span>
                {i < block.flow.length - 1 && (
                  <span aria-hidden="true" className="text-gold">
                    ←
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )
  }
}
