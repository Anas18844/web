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
    default: `${site.name} — ${site.subject} | بكالوريا`,
    template: `%s — ${site.name}`,
  },
  description:
    'مهندس بيشتغل بالبرمجة كل يوم وبيدرّسها لطلاب البكالوريا — مسار الهندسة وعلوم الحاسب. حصة مركّزة، منصة بتصحّح كودك، ومتابعة أسبوعية لولي الأمر بالبيانات.',
  applicationName: site.name,
  authors: [{ name: site.name }],
  creator: site.name,
  keywords: [
    'البرمجة والذكاء الاصطناعي',
    'بكالوريا',
    'تانية ثانوي',
    'مسار الهندسة وعلوم الحاسب',
    'مستر أنس أحمد',
    'برمجة تانية ثانوي',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    siteName: site.name,
    title: `${site.name} — ${site.subject}`,
    description:
      'منظومة كاملة لمادة البرمجة والذكاء الاصطناعي: حصة مركّزة، منصة بتصحّح كودك، ومتابعة أسبوعية لولي الأمر.',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — ${site.subject}`,
    description:
      'منظومة كاملة لمادة البرمجة والذكاء الاصطناعي لطلاب البكالوريا — مسار الهندسة وعلوم الحاسب.',
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
