'use client'

import { useEffect, useRef } from 'react'

/**
 * A modal built on the native <dialog> element.
 *
 * `showModal()` gives focus trapping, Escape-to-close, inertness of the page
 * behind it and the top layer, all from the platform. Every one of those is
 * something a hand-rolled div modal gets wrong, and getting them wrong on a
 * screen that edits student records is not a small thing.
 */
export function Dialog({
  title,
  description,
  onClose,
  children,
}: {
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const node = ref.current
    if (node && !node.open) node.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // Clicking the backdrop closes it. The backdrop IS the dialog element
      // itself, so the check is "did the click land on the dialog rather than
      // on anything inside it".
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close()
      }}
      className="w-[min(38rem,calc(100vw-2rem))] rounded border border-navy-line bg-navy-deep p-0 text-ink backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="max-h-[85dvh] overflow-y-auto p-5 sm:p-6">
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-ink">{title}</h2>
            {description && <p className="mt-1 text-xs text-ink-faint">{description}</p>}
          </div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="اقفل"
            className="shrink-0 rounded border border-navy-line px-2.5 py-1 text-xs font-bold text-ink-muted transition-colors duration-200 hover:border-gold/50 hover:text-gold"
          >
            ✕
          </button>
        </header>

        {children}
      </div>
    </dialog>
  )
}
