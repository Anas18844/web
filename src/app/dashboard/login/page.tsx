import type { Metadata } from 'next'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { site } from '@/content/site'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: 'دخول لوحة التحكم',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  // Already signed in — bounce straight through rather than showing a form
  // that would only redirect after being filled in.
  if (await getSessionUser()) redirect('/dashboard')

  return (
    <main className="flex min-h-dvh items-center justify-center bg-navy-deep px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-9 flex flex-col items-center text-center">
          <Image
            src="/images/logo.png"
            alt=""
            width={56}
            height={56}
            priority
            className="h-14 w-14 rounded border border-navy-line object-cover"
          />
          <h1 className="mt-5 text-2xl font-extrabold text-ink">لوحة التحكم</h1>
          <p className="mt-2 text-sm text-ink-faint">{site.name}</p>
        </div>

        <LoginForm />

        <p className="mt-8 text-center text-xs leading-relaxed text-ink-faint">
          الصفحة دي فيها بيانات طلبة حقيقية. متسيبش الجلسة مفتوحة على جهاز مش بتاعك.
        </p>
      </div>
    </main>
  )
}
