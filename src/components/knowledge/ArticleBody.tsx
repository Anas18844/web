import type { Block } from '@/content/knowledge'

/**
 * Renders an article body from structured blocks rather than a string of HTML.
 *
 * The reason is editorial, not technical: a block list cannot carry a stray
 * inline style, a pasted font, or a heading level that skips from h2 to h4.
 * Every article on the site is therefore typeset identically, and the reading
 * measure is enforced in one place instead of being re-decided per article.
 */
export function ArticleBody({ blocks }: { blocks: readonly Block[] }) {
  return (
    <div className="grid gap-6">
      {blocks.map((block, i) => {
        switch (block.t) {
          case 'h':
            return (
              <h2
                key={i}
                className="mt-4 text-xl font-extrabold leading-snug text-ink sm:mt-6 sm:text-2xl"
              >
                {block.x}
              </h2>
            )

          case 'p':
            return (
              <p key={i} className="text-body text-ink-muted">
                {block.x}
              </p>
            )

          case 'ul':
            return (
              <ul key={i} className="grid gap-3">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-3 text-body text-ink-muted">
                    <span aria-hidden="true" className="mt-1 shrink-0 text-gold">
                      ▪
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )

          case 'ol':
            return (
              <ol key={i} className="grid gap-3">
                {block.items.map((item, n) => (
                  <li key={item} className="flex gap-3 text-body text-ink-muted">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 w-6 shrink-0 text-sm font-extrabold text-gold"
                    >
                      {'٠١٢٣٤٥٦٧٨٩'[n + 1] ?? n + 1}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            )

          case 'note':
            return (
              <p
                key={i}
                className="card card-lit bg-navy-soft/25 px-5 py-4 text-body font-bold text-ink sm:px-6 sm:py-5"
              >
                {block.x}
              </p>
            )

          case 'code':
            return (
              /* Code is always LTR, even inside an RTL document — a snippet
                 mirrored to match the page is a snippet that will not run. */
              <pre
                key={i}
                dir="ltr"
                className="overflow-x-auto rounded border border-navy-line bg-navy-deep p-5 text-start"
              >
                <code className={`language-${block.lang} font-mono text-sm leading-7 text-ink-muted`}>
                  {block.x}
                </code>
              </pre>
            )
        }
      })}
    </div>
  )
}
