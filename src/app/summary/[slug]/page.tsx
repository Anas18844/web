import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { Block } from '@/components/summary/SummaryBlocks'
import { SUMMARIES, findSummary } from '@/content/summaries'
import { findHomework, totalMarks } from '@/content/homework'
import { toArabicDigits } from '@/lib/arabic'

export function generateStaticParams() {
  return SUMMARIES.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const summary = findSummary((await params).slug)
  if (!summary) return {}

  return {
    title: `${summary.title} — ${summary.lesson}`,
    description: `${summary.lesson}. ${summary.drivingQuestion}`,
    alternates: { canonical: `/summary/${summary.slug}` },
  }
}

const ar = (n: number) => toArabicDigits(n)

/**
 * A lesson summary — the page a student reads before the homework.
 *
 * Entirely static and entirely server-rendered: no state, no fetch, no client
 * component anywhere on it. The only moving part is the reading-progress rail,
 * which is a scroll-driven CSS animation the site already owns.
 *
 * It closes by sending the reader to the homework, and the homework's opening
 * screen sends anyone who has not revised back here. Neither page is a
 * dead end.
 */
export default async function SummaryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const summary = findSummary((await params).slug)
  if (!summary) notFound()

  const homework = summary.homeworkSlug ? findHomework(summary.homeworkSlug) : undefined

  return (
    <>
      {/* Reading progress — the site's own trace, drawn by the reader. */}
      <div
        aria-hidden="true"
        className="pointer-events-none sticky top-16 z-40 h-0.5 w-full bg-transparent"
      >
        <span className="read-progress block h-full w-full bg-gold" />
      </div>

      <article>
        <header className="wash-start border-b border-navy-line bg-navy-deep py-12 sm:py-16">
          <Container width="content">
            <span aria-hidden="true" className="trace-rule hero-enter mb-5" />
            <p className="hero-enter text-sm font-bold text-gold">{summary.lecture}</p>
            <h1 className="hero-enter mt-2 text-display font-extrabold leading-tight text-ink">
              {summary.lesson}
            </h1>

            {/* The question the lesson answers, stated before any content.
                A summary that opens with a definition teaches a list; one that
                opens with a question teaches an argument. */}
            <div className="hero-enter-late mt-7 rounded border border-gold/40 bg-gold/[0.07] p-5">
              <p className="text-xs font-bold text-gold">السؤال اللي بيقود الدرس كله</p>
              <p className="mt-2 text-subtitle font-extrabold leading-relaxed text-ink">
                {summary.drivingQuestion}
              </p>
            </div>

            <p className="hero-enter-late mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
              {summary.meta.map((m, i) => (
                <span key={m} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden="true">·</span>}
                  {m}
                </span>
              ))}
            </p>
          </Container>
        </header>

        {/* ── Jump links ─────────────────────────────────────────────── */}
        <nav
          aria-label="محاور الدرس"
          className="sticky top-16 z-30 border-b border-navy-line bg-navy-deep/90 backdrop-blur-xl"
        >
          <Container width="content" className="flex gap-2 overflow-x-auto py-3">
            {summary.axes.map((axis) => (
              <a
                key={axis.id}
                href={`#${axis.id}`}
                className="shrink-0 rounded border border-navy-line px-3 py-1.5 text-xs font-bold text-ink-muted transition-colors duration-200 hover:border-gold/50 hover:text-gold"
              >
                <span className="font-mono text-gold">{ar(axis.n)}</span> {axis.title}
              </a>
            ))}
          </Container>
        </nav>

        <Container width="content" className="py-10 sm:py-14">
          {summary.axes.map((axis) => (
            <section key={axis.id} id={axis.id} className="scroll-mt-32 pb-12 last:pb-0">
              <header className="mb-6 flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-gold/50 bg-gold/10 font-mono text-lg font-extrabold text-gold">
                  {ar(axis.n)}
                </span>
                <h2 className="text-title font-extrabold text-ink">{axis.title}</h2>
              </header>

              <div className="grid gap-5">
                {axis.blocks.map((block, i) => (
                  <Block key={i} block={block} />
                ))}
              </div>
            </section>
          ))}

          {/* ── The handover ─────────────────────────────────────────── */}
          {homework && (
            <div className="mt-6 rounded border border-gold/50 bg-gold/[0.09] p-6 text-center sm:p-8">
              <h2 className="text-title font-extrabold text-ink">ذاكرت الملخص؟ اختبر نفسك دلوقتي</h2>
              <p className="mt-3 text-body text-ink-muted">
                {ar(homework.mcq.length + homework.essay.length)} سؤال بتصحيح فوري —{' '}
                {ar(homework.mcq.length)} اختيار و{ar(homework.essay.length)} مقالي، من{' '}
                {ar(totalMarks(homework))} درجة.
              </p>

              <Link
                href={`/homework/${homework.slug}`}
                data-cta="summary_to_homework"
                className="shine mt-6 inline-flex min-h-[3.25rem] w-full max-w-sm items-center justify-center rounded bg-gold px-8 text-base font-extrabold text-navy transition-[background-color,box-shadow] duration-200 hover:bg-gold-deep hover:text-ink hover:shadow-[0_0_28px_-8px_rgba(203,163,82,0.9)]"
              >
                ابدأ الواجب ←
              </Link>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/summary"
              className="text-sm font-bold text-gold transition-colors duration-200 hover:text-ink"
            >
              كل الملخصات
            </Link>
          </div>
        </Container>
      </article>
    </>
  )
}
