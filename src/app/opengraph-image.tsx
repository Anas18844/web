import { ImageResponse } from 'next/og'
import { site } from '@/content/site'

/**
 * The share card (roadmap §3.1-د).
 *
 * This matters more than it looks: a parent's first impression of the brand is
 * usually this card inside a WhatsApp message, before they ever open the site
 * (Doc 01 §3). It is generated at build/request time on the server, so it costs
 * the visitor's browser nothing.
 *
 * TODO(assets): replace with a designer-made static PNG when one exists —
 * then this file can be deleted and `public/og.png` referenced instead.
 */
export const alt = `${site.name} — ${site.subject}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const FONT_URL =
  'https://cdn.jsdelivr.net/fontsource/fonts/cairo@latest/arabic-700-normal.woff'

async function loadArabicFont(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(FONT_URL, { cache: 'force-cache' })
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

export default async function Image() {
  const font = await loadArabicFont()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0D1B33',
          padding: '72px',
          fontFamily: font ? 'Cairo' : 'sans-serif',
          direction: font ? 'rtl' : 'ltr',
        }}
      >
        {/* Gold corner square — the recurring signature mark from the identity. */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ width: 56, height: 56, background: '#CBA352' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {font ? (
            <>
              <div style={{ fontSize: 62, color: '#FFFFFF', lineHeight: 1.3 }}>
                اتعلّم البرمجة من حد بيشتغل بيها كل يوم
              </div>
              <div style={{ fontSize: 30, color: '#AEBACC', marginTop: 24 }}>
                iSchool · أشبال مصر الرقمية · Microsoft Egypt · iTech Solutions
              </div>
            </>
          ) : (
            <div style={{ fontSize: 58, color: '#FFFFFF' }}>{site.nameEn}</div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '2px solid #23385C',
            paddingTop: 28,
          }}
        >
          <div style={{ fontSize: 32, color: '#CBA352' }}>
            {font ? site.name : site.nameEn}
          </div>
          <div style={{ fontSize: 26, color: '#7E8CA3' }}>{font ? site.motto : ''}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: 'Cairo', data: font, style: 'normal', weight: 700 }]
        : undefined,
    },
  )
}
