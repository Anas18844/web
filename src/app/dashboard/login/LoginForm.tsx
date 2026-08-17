'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { loginAction, type ActionState } from '../actions'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 flex min-h-[3rem] w-full items-center justify-center rounded bg-gold px-6 text-base font-extrabold text-navy transition-[background-color,opacity] duration-200 hover:bg-gold-deep hover:text-ink disabled:opacity-60"
    >
      {pending ? 'بنتأكد…' : 'دخول'}
    </button>
  )
}

const field =
  'w-full min-h-[3rem] rounded border border-navy-line bg-navy px-4 py-3 text-base text-ink ' +
  'placeholder:text-ink-faint/70 transition-[border-color,box-shadow] duration-200 ' +
  'focus:border-gold focus:shadow-[0_0_0_3px_rgba(203,163,82,0.14)]'

export function LoginForm() {
  const [state, action] = useActionState<ActionState, FormData>(loginAction, {})

  return (
    <form
      action={action}
      className="grid gap-4 rounded border border-navy-line bg-navy-soft/40 p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.9)] sm:p-7"
    >
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-bold text-ink">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          required
          autoComplete="username"
          autoFocus
          className={`${field} text-start`}
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-bold text-ink">
          كلمة السر
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
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
    </form>
  )
}
