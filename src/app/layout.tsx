import type { Metadata, Viewport } from 'next'
import { Cairo, IBM_Plex_Sans_Arabic } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { GoogleTagManager } from '@next/third-parties/google'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Reveal } from '@/components/Reveal'
import { RouteAnalytics } from '@/components/RouteAnalytics'
import { RouteFade } from '@/components/RouteFade'
import { SiteChrome } from '@/components/SiteChrome'
import { PageSpine } from '@/components/PageSpine'
import { MobileDock } from '@/components/MobileDock'
import { site } from '@/content/site'
import './globals.css'

/**
 * next/font downloads and self-hosts both faces at build time, so there is not
 * a single request to an external domain at runtime (roadmap §3.4).
 *
 * Two faces, two jobs. Cairo carries the reading — it is the calmest Arabic
 * geometric sans at paragraph sizes and the site is mostly paragraphs. IBM Plex
 * Sans Arabic carries the headlines only: it was drawn for an engineering
 * company, its terminals are cut flat rather than rounded, and next to Cairo it
 * reads as the technical voice against the teaching voice. That is the whole
 * point of the pairing — the page is a programmer teaching, and the type says
 * so before a word is read.
 *
 * Plex is loaded at ONE weight, and that is deliberate. Every h1 and h2 on this
 * site is `font-extrabold`; Plex Sans Arabic tops out at 700, so 700 is what
 * every heading resolves to and any other weight would be preloaded and never
 * drawn. (No faux-bold results: browsers only synthesise when the matched face
 * is under 600.) Cutting the second weight took ~47KB off the preload — real
 * bytes on the critical path, spent on nothing.
 */
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-cairo',
})

const display = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['700'],
  display: 'swap',
  variable: '--font-display',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.subject} من الصفر`,
    template: `%s — ${site.name}`,
  },
  description:
    'اتعلّم البرمجة من حد بيشتغل بيها كل يوم. ٤ سنين تدريس في iSchool وأشبال مصر الرقمية، و٤ سنين شغل هندسي مع Microsoft Egypt — لطلاب أولى وتانية ثانوي.',
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
      '٤ سنين تدريس في iSchool وأشبال مصر الرقمية ورواد، و٤ سنين شغل هندسي مع Microsoft Egypt وiTech Solutions — لطلاب أولى وتانية ثانوي.',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — اتعلّم البرمجة من حد بيشتغل بيها`,
    description:
      'خبرة تدريس وشغل هندسي حقيقي — لطلاب أولى وتانية ثانوي.',
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
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${display.variable}`}>
      {/*
       * Google Tag Manager — the single tag container for the whole site.
       * GA4 and any other tags are configured inside GTM, never pasted here,
       * so this stays the only tracking snippet the codebase owns.
       * (@vercel/analytics below is separate: product analytics, not GTM.)
       */}
      <GoogleTagManager gtmId="GTM-NVTM4X76" />
      {/* `grain` lays the film-texture tile over the whole document — the
          cheapest single ingredient of the "printed surface" feel. */}
      <body className="grain flex min-h-dvh flex-col">
        {/*
         * Marks the document JS-capable before anything below it is painted,
         * so scroll-reveal can start hidden without a flash — and so a visitor
         * without JavaScript is never served a hidden page at all.
         */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
        {/*
         * Everything inside SiteChrome is the marketing shell, and it is absent
         * on /dashboard — a signed-in team member looking at student records
         * does not need a "book now" bar following them down the page.
         */}
        <SiteChrome>
          <a href="#main" className="skip-link">
            تخطَّ إلى المحتوى
          </a>
          {/* The path — one trace down the reader's edge, filling as they
              descend. Fixed, so it must sit outside <main>, where a page-level
              transform could never become its containing block. */}
          <PageSpine />
          <SiteHeader />
        </SiteChrome>

        <main id="main" className="flex-1">
          <RouteFade>{children}</RouteFade>
        </main>

        <SiteChrome>
          <SiteFooter />
          <MobileDock />
        </SiteChrome>

        <Reveal />
        <RouteAnalytics />
        <Analytics />
      </body>
    </html>
  )
}
