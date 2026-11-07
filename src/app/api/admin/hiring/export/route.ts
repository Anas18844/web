import { NextResponse } from 'next/server'
import { audit, requireAdmin } from '@/lib/auth'
import { STATUSES, getHiringData } from '@/lib/hiring'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Every applicant (latest send per number) as CSV for Excel. Admin only. */
export async function GET() {
  let user
  try {
    user = await requireAdmin()
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const { applicants } = await getHiringData()
  await audit(user, 'export', { after: { what: 'hiring', applicants: applicants.length } })

  const head = ['الاسم', 'واتساب', 'السن', 'المنطقة', 'الحالة', 'الكلية', 'الفرق', 'المهارات', 'مشاريع وأبحاث',
    'خبرة خدمة عملاء', 'لينك الشغل', 'اللابتوب', 'الأوقات', 'النبذة', 'وقت التقديم', 'عدد مرات التقديم', 'القرار', 'ملاحظة']
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = applicants.map((a) =>
    [a.name, a.phone, a.age, a.area, a.status, a.study, a.teams.join('، '), a.skills.join('، '), a.research,
      a.servicesExp, a.work, a.laptop, a.times.join('، '), a.bio, a.sentAt, a.sends, STATUSES[a.decision], a.note]
      .map(cell)
      .join(','),
  )
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')

  // BOM so Excel opens the Arabic correctly.
  return new NextResponse('﻿' + [head.map(cell).join(','), ...lines].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="hiring-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
