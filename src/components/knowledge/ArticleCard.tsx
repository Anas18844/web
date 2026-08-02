import Link from 'next/link'
import { cn } from '@/lib/utils'

export type CardData = {
  slug: string
  title: string
  dek: string
  categoryLabel: string
  date: string
  dateLabel: string
  minutesLabel: string
}

/**
 * One article in a listing.
 *
 * The whole card is the hit area — the link's ::after covers it — but the
 * accessible name stays just the headline, so a screen reader announces
 * "قراءة: <title>" instead of reading the standfirst, the date and the
 * reading time as one run-on link. `.card` is already `relative` and already
 * lights its trace on `:focus-within`, so keyboard focus gets the same
 * feedback the mouse does for free.
 */
export function ArticleCard({ article, className }: { article: CardData; className?: string }) {
  return (
    <article className={cn('card flex flex-col p-6 sm:p-7', className)}>
      <Meta categoryLabel={article.categoryLabel} minutesLabel={article.minutesLabel} />

      <h3 className="mt-4 text-lg font-extrabold leading-snug text-ink sm:text-xl">
        <Link
          href={`/knowledge/${article.slug}`}
          className="transition-colors duration-200 after:absolute after:inset-0 hover:text-gold"
        >
          {article.title}
        </Link>
      </h3>

      <p className="mt-3 flex-1 text-[0.975rem] leading-8 text-ink-muted">{article.dek}</p>

      <time dateTime={article.date} className="mt-5 text-xs text-ink-faint">
        {article.dateLabel}
      </time>
    </article>
  )
}

/**
 * Category and reading time, separated by a hairline. Reading time is a
 * commitment signal, not decoration — a student deciding whether to open
 * something between two classes is answering "do I have time for this".
 */
export function Meta({
  categoryLabel,
  minutesLabel,
  className,
}: {
  categoryLabel: string
  minutesLabel: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 text-xs font-bold', className)}>
      <span className="text-gold">{categoryLabel}</span>
      <span aria-hidden="true" className="h-3 w-px bg-navy-line" />
      <span className="font-semibold text-ink-faint">{minutesLabel}</span>
    </div>
  )
}
