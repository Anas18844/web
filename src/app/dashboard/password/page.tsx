import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { site } from '@/content/site'
import { PasswordForm } from './PasswordForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'غيّر كلمة السر', robots: { index: false, follow: false } }

/**
 * Where a newly-created account lands, and cannot leave.
 *
 * An account starts with a password somebody else chose — typed into a
 * terminal, pasted into a message, written on a handover note. Until it is
 * replaced, that password is known to at least one person who is not its owner,
 * and it can read every student's phone number.
 *
 * So `guardPage()` sends every other dashboard screen here while the flag is
 * set. This page is the only one that does not check it, because it is the way
 * out.
 */
export default async function PasswordPage() {
  const user = await getSessionUser()
  if (!user) redirect('/dashboard/login')

  const forced = user.mustChangePassword

  return (
    <main className="flex min-h-dvh items-center justify-center bg-navy-deep px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/images/logo.png"
            alt=""
            width={48}
            height={48}
            priority
            className="h-12 w-12 rounded border border-navy-line object-cover"
          />
          <h1 className="mt-4 text-xl font-extrabold text-ink">
            {forced ? 'اختار كلمة سر جديدة' : 'غيّر كلمة السر'}
          </h1>
          <p className="mt-2 text-sm text-ink-faint">
            {user.name} · {site.name}
          </p>
        </div>

        {forced && (
          <p className="mb-5 rounded border border-gold/40 bg-gold/10 px-4 py-3 text-xs leading-relaxed text-ink">
            الحساب ده اتعمل بكلمة سر مؤقتة حد تاني يعرفها. لازم تغيّرها قبل ما
            تشوف بيانات الطلبة.
          </p>
        )}

        <PasswordForm forced={forced} />
      </div>
    </main>
  )
}
