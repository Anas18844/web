import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { site } from '@/content/site'
import './globals.css'

/**
 * next/font downloads and self-hosts the font at build time, so there is not a
 * single request to an external domain at runtime (roadmap §3.4).
 *
 * ⚠️ OPEN DECISION #2: the exact brand typeface is still TBD. Cairo matches the
 * documented direction (bold geometric Arabic sans). To swap it later, change
 * this import only — every component reads `var(--font-cairo)` through Tailwind.
 */
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-cairo',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.subject} من الصفر`,
    template: `%s — ${site.name}`,
  },
  description:
    'اتعلّم البرمجة من حد بيشتغل بيها كل يوم. ٤ سنين تدريس في iSchool وأشبال مصر الرقمية ورواد، و٤ سنين شغل هندسي مع Microsoft Egypt وiTech Solutions. لطلاب الثانوي والجامعة والمتعلمين ذاتياً.',
  applicationName: site.name,
  authors: [{ name: site.name }],
  creator: site.name,
  keywords: [
    'تعلم البرمجة',
    'البرمجة والذكاء الاصطناعي',
    'برمجة أولى ثانوي',
    'برمجة تانية ثانوي',
    'بكالوريا',
    'مسار الهندسة وعلوم الحاسب',
    'ICPC',
    'مستر أنس أحمد',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    siteName: site.name,
    title: `${site.name} — اتعلّم البرمجة من حد بيشتغل بيها`,
    description:
      '٤ سنين تدريس في iSchool وأشبال مصر الرقمية ورواد، و٤ سنين شغل هندسي مع Microsoft Egypt وiTech Solutions — لطلاب الثانوي والجامعة والمتعلمين ذاتياً.',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — اتعلّم البرمجة من حد بيشتغل بيها`,
    description:
      'خبرة تدريس وشغل هندسي حقيقي — لطلاب الثانوي والجامعة والمتعلمين ذاتياً.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#0D1B33',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="skip-link">
          تخطَّ إلى المحتوى
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  )
}
