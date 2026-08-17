import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'لوحة التحكم', template: '%s — لوحة التحكم' },
  // Not a suggestion to a crawler that it should stay away — it should never
  // have been reachable without a session in the first place. This is the
  // second lock, not the first.
  robots: { index: false, follow: false, nocache: true },
}

/**
 * The dashboard is a different product from the marketing site that surrounds
 * it, and this layout is where the two are separated.
 *
 * It replaces the public shell entirely: no header, no footer, no floating
 * call to action, no page spine. Those exist to move a visitor towards a form.
 * Everyone past this point has already signed in — pointing them at a signup
 * button would be noise on a screen that is meant to be read carefully.
 *
 * The brand stays: the same navy, the same gold, the same 2px corners and the
 * same hairline rules. It should be recognisably the same organisation, and
 * unmistakably not the same page.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-navy-deep">{children}</div>
}
