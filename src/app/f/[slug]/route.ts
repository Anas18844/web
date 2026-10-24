import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Serves a private one-off form (migration 013) from the database, so its HTML
 * never sits in this public repository. Anyone with the link can open it; the
 * slug is the only key, so it is long and random. Never indexed, never cached.
 */
const SLUG = /^[a-z0-9-]{8,64}$/

const headers = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
}

const notFound = () =>
  new Response('Not found', { status: 404, headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' } })

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!SLUG.test(slug)) return notFound()

  const { data, error } = await getSupabaseAdmin()
    .from('private_pages')
    .select('html, expires_at')
    .eq('slug', slug)
    .maybeSingle()
  if (error) return new Response('Server error', { status: 500, headers })
  if (!data) return notFound()
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return new Response('هذا الرابط لم يعد متاحًا.', {
      status: 410,
      headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  return new Response(data.html, { headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } })
}
