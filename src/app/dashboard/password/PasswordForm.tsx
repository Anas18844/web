'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { changePasswordAction, type ActionState } from '../actions'

const field =
  'w-full min-h-[3rem] rounded border border-navy-line bg-navy px-4 py-3 text-base text-ink ' +
  'transition-[border-color,box-shadow] duration-200 focus:border-gold ' +
  'focus:shadow-[0_0_0_3px_rgba(203,163,82,0.14)] focus:outline-none'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 flex min-h-[3rem] w-full items-center justify-center rounded bg-gold px-6 text-base font-extrabold text-navy transition-[background-color,opacity] duration-200 hover:bg-gold-deep hover:text-ink disabled:opacity-60"
    >
      {pending ? 'بنحفظ…' : 'احفظ كلمة السر'}
    </button>
  )
}

export function PasswordForm({ forced }: { forced: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(changePasswordAction, {})

  return (
    <form
      action={action}
      className="grid gap-4 rounded border border-navy-line bg-navy-soft/40 p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.9)]"
    >
      <div>
        <label htmlFor="current" className="mb-2 block text-sm font-bold text-ink">
          كلمة السر الحالية
        </label>
        <input
          id="current"
          name="current"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          className={field}
        />
      </div>

      <div>
        <label htmlFor="next" className="mb-2 block text-sm font-bold text-ink">
          كلمة السر الجديدة
        </label>
        <input
          id="next"
          name="next"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          className={field}
        />
        <p className="mt-1.5 text-xs text-ink-faint">
          ١٢ حرف على الأقل. الحساب ده بيقرا أرقام طلبة، فمتستخدمش كلمة سر بتستخدمها
          في مكان تاني.
        </p>
      </div>

      <div>
        <label htmlFor="confirm" className="mb-2 block text-sm font-bold text-ink">
          أكّد كلمة السر الجديدة
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className={field}
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200"
        >
          {state.error}
        </p>
      )}

      <Submit />

      {!forced && (
        <Link
          href="/dashboard"
          className="mt-1 text-center text-xs font-bold text-ink-faint transition-colors duration-200 hover:text-gold"
        >
          رجوع من غير تغيير
        </Link>
      )}
    </form>
  )
}
