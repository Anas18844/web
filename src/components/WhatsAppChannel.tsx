'use client'

import Image from 'next/image'
import { WhatsAppMark } from '@/components/WhatsAppButton'
import { events } from '@/lib/analytics'
import { common } from '@/content/copy'
import { site } from '@/content/site'
import { assets } from '@/content/assets'

/**
 * The announcements channel, offered at the one moment it is welcome.
 *
 * A student who has just booked has no question — they have a wait. This gives
 * that wait somewhere to go, and it is the only point on the site where the
 * visitor is guaranteed to be paying attention.
 *
 * It is a CHANNEL, not a group, and the copy says so: following it does not
 * put a student in a room with other students and does not show their number
 * to anyone. Calling it a group would promise the opposite of what it does,
 * and this site is read by parents of minors.
 *
 * A plain external link rather than the `wa.me` builder in WhatsAppButton —
 * that one composes a pre-filled message to a person, which is a different
 * action entirely.
 *
 * The picture is the channel's OWN picture, so that tapping through to
 * WhatsApp looks like arriving rather than like a wrong link. It is an
 * optional slot: while `assets.whatsappChannel` is null the card renders
 * without it and nothing is missing — no placeholder, no empty frame
 * (Principle 22).
 */
export function WhatsAppChannel({ context }: { context: string }) {
  const picture = assets.whatsappChannel

  return (
    <div className="rounded border border-[#25D366]/35 bg-[#25D366]/[0.07] p-5 text-start">
      <div className="flex items-start gap-4">
        {picture && (
          <Image
            src={picture.src}
            alt={picture.alt}
            width={picture.width}
            height={picture.height}
            sizes="56px"
            className="h-14 w-14 shrink-0 rounded-full border border-[#25D366]/40 object-cover"
          />
        )}

        <div className="min-w-0">
          <p className="text-base font-extrabold text-ink">{common.form.channelTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {common.form.channelBody}
          </p>
        </div>
      </div>

      <a
        href={site.whatsapp.channel}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => events.channelFollowed(context)}
        className="mt-4 inline-flex min-h-[3rem] w-full items-center justify-center gap-2.5 rounded bg-[#25D366] px-6 py-3 text-base font-extrabold text-[#06301A] transition-[background-color,box-shadow,transform] duration-200 hover:bg-[#1FBE5A] hover:shadow-[0_0_28px_-8px_rgba(37,211,102,0.85)] active:translate-y-px motion-reduce:active:translate-y-0"
      >
        <WhatsAppMark />
        {common.form.channelCta}
      </a>
    </div>
  )
}
