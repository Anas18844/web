import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { ResultsLookup } from '@/components/results/ResultsLookup'

export const metadata: Metadata = {
  title: 'نتيجة الامتحان الشامل',
  description: 'نتيجة الامتحان الشامل للوحدة الأولى، تانية بكالوريا: اكتب الرقم اللي امتحنت بيه ونزّل تقريرك PDF.',
  alternates: { canonical: '/results' },
  robots: { index: false },
}

/** Unit-1 results by phone number (owner, 2026-10-18). See lib/results.ts. */
export default function ResultsPage() {
  return (
    <div className="bg-navy-deep py-10 sm:py-14">
      <Container width="content">
        <div className="mx-auto max-w-2xl">
          <div className="card p-6 sm:p-8">
            <span aria-hidden="true" className="trace-rule mb-5" />
            <p className="text-sm font-bold text-gold">تانية بكالوريا</p>
            <h1 className="mt-2 text-title font-extrabold text-ink">نتيجة الامتحان الشامل</h1>
            <p className="mt-2 text-body text-ink-muted">
              الوحدة الأولى. اكتب نفس الرقم اللي امتحنت بيه، وهتلاقي تقريرك جاهز للتحميل.
            </p>
            <div className="mt-7">
              <ResultsLookup />
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
