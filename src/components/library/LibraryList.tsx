import { Icon, IconPlate, type IconName } from '@/components/ui/Icon'
import { KIND_LABEL, type LibraryItem } from '@/content/library'

/**
 * One list of free PDFs — booklets or answer keys.
 *
 * A row, not a card grid: a student scanning for "the unit 2 booklet" reads
 * titles down a column, and a row keeps the download button on the same line
 * as the thing it downloads at every width.
 *
 * An item without a url is announced, not missing: it says «بتنزل قريب»
 * instead of linking to nothing — the same honesty as a lesson step.
 */
/** An answer key gets a check mark and «نزّل الحل»; everything else is a book. */
const isAnswers = (i: LibraryItem) => i.kind === 'answers' || i.kind === 'weekly'

export function LibraryList({
  items,
  icon,
  cta,
}: {
  items: readonly LibraryItem[]
  icon?: IconName
  cta?: string
}) {
  return (
    <ul data-reveal-stagger className="grid gap-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-4 rounded border border-navy-line bg-navy-soft/30 p-5 transition-colors duration-200 hover:border-gold/40 sm:flex-row sm:items-center sm:p-6"
        >
          <IconPlate name={icon ?? (isAnswers(item) ? 'check' : 'book')} />

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gold">{KIND_LABEL[item.kind]}</p>
            <h3 className="mt-0.5 text-base font-extrabold leading-snug text-ink sm:text-lg">{item.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{item.blurb}</p>
            {item.meta && <p className="mt-2 text-xs font-bold text-ink-faint">{item.meta}</p>}
          </div>

          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              data-cta={`library_${item.id}`}
              className="inline-flex min-h-[2.75rem] shrink-0 items-center justify-center gap-2 rounded bg-gold px-5 text-sm font-extrabold text-navy transition-colors duration-200 hover:bg-gold-deep hover:text-ink"
            >
              <Icon name="book" size={18} />
              {cta ?? (isAnswers(item) ? 'نزّل الحل' : 'نزّل PDF')}
            </a>
          ) : (
            <span className="inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded border border-dashed border-navy-line px-5 text-sm font-bold text-ink-faint">
              بتنزل قريب
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
