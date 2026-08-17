import Image from 'next/image'
import Link from 'next/link'
import { logoutAction } from '@/app/dashboard/actions'
import type { SessionUser } from '@/lib/auth'
import { site } from '@/content/site'

/**
 * The frame every dashboard screen sits in.
 *
 * The role badge is not decoration. A team member who does not know they are a
 * team member reads a screen with no phone numbers on it and concludes the
 * numbers are missing from the database — so the interface says, permanently
 * and in the corner of every page, which account is looking and what it can do.
 */
export function Shell({
  user,
  children,
  toolbar,
}: {
  user: SessionUser
  children: React.ReactNode
  toolbar?: React.ReactNode
}) {
  const isAdmin = user.role === 'admin'

  return (
    <div className="min-h-dvh bg-navy-deep">
      <header className="sticky top-0 z-40 border-b border-navy-line bg-navy-deep/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[100rem] flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/logo.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded border border-navy-line object-cover"
            />
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-ink">لوحة التحكم</p>
              <p className="text-[0.7rem] text-ink-faint">{site.name}</p>
            </div>
          </div>

          <div className="ms-auto flex items-center gap-3">
            <div className="text-end leading-tight">
              <p className="text-sm font-bold text-ink">{user.name}</p>
              <p
                className={`text-[0.7rem] font-bold ${isAdmin ? 'text-gold' : 'text-ink-faint'}`}
              >
                {isAdmin ? 'أدمن — صلاحية كاملة' : 'فريق — إضافة فقط، بدون أرقام'}
              </p>
            </div>

            <Link
              href="/dashboard/password"
              className="rounded border border-navy-line px-3 py-2 text-xs font-bold text-ink-muted transition-colors duration-200 hover:border-gold/50 hover:text-gold"
            >
              كلمة السر
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded border border-navy-line px-3 py-2 text-xs font-bold text-ink-muted transition-colors duration-200 hover:border-gold/50 hover:text-gold"
              >
                خروج
              </button>
            </form>
          </div>

          {toolbar && <div className="w-full">{toolbar}</div>}
        </div>
      </header>

      <main className="mx-auto max-w-[100rem] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  )
}

/** A single headline number. The label says what it counts, precisely. */
export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint?: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="rounded border border-navy-line bg-navy-soft/40 p-4">
      <p className="text-xs font-bold text-ink-faint">{label}</p>
      <p
        className={`mt-1.5 font-mono text-2xl font-extrabold ${accent ? 'text-gold' : 'text-ink'}`}
      >
        {value}
      </p>
      {hint && <div className="mt-1.5">{hint}</div>}
    </div>
  )
}

export function Panel({
  title,
  note,
  children,
  className,
}: {
  title: string
  note?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded border border-navy-line bg-navy-soft/30 p-5 ${className ?? ''}`}>
      <header className="mb-4">
        <h2 className="text-sm font-extrabold text-ink">{title}</h2>
        {note && <p className="mt-1 text-xs text-ink-faint">{note}</p>}
      </header>
      {children}
    </section>
  )
}
