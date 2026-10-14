import type { Metadata } from 'next'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { SiteSearch } from '@/components/search/SiteSearch'
import { buildSearchIndex } from '@/lib/search-index'

export const metadata: Metadata = {
  title: 'بحث',
  description: 'ابحث في الدروس والملخصات والملازم وحل التقييمات ومقالات مركز المعرفة.',
  alternates: { canonical: '/search' },
  // A results page with no query is an empty box: nothing for a crawler.
  robots: { index: false, follow: true },
}

export default function SearchPage() {
  return (
    <>
      <PageHero
        eyebrow="بحث"
        title="بتدوّر على إيه؟"
        lead="الدروس، والملخصات، والملازم، وحل التقييمات، ومقالات مركز المعرفة — كلهم في مكان واحد."
      />
      <Section width="prose">
        <SiteSearch entries={buildSearchIndex()} />
      </Section>
    </>
  )
}
