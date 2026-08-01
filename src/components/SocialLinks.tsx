import Image from 'next/image'
import { site } from '@/content/site'

/**
 * The official channel card, shown beside the form.
 *
 * Two jobs: it gives the visitor who is not ready to submit a lighter way to
 * stay in touch (never punish hesitation — Doc 05 §6.5), and it doubles as the
 * "these accounts are really ours" signal against impersonation.
 *
 * Server component: inline SVGs, zero client JS.
 */

type Channel = {
  key: string
  label: string
  href: string
  icon: React.ReactNode
}

const ICON = 'h-5 w-5 shrink-0'

export function SocialLinks() {
  const channels: Channel[] = [
    site.channels.youtube && {
      key: 'youtube',
      label: 'يوتيوب',
      href: site.channels.youtube,
      icon: (
        <svg className={ICON} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.5 15.6V8.4l6.3 3.6-6.3 3.6Z" />
        </svg>
      ),
    },
    site.channels.linkedin && {
      key: 'linkedin',
      label: 'لينكدإن',
      href: site.channels.linkedin,
      icon: (
        <svg className={ICON} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.4 20.4h-3.6v-5.6c0-1.3 0-3-1.9-3-1.8 0-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.7-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.2ZM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2ZM7.1 20.4H3.5V9h3.6v11.4ZM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6C0 23.2.8 24 1.8 24h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0Z" />
        </svg>
      ),
    },
    site.channels.facebook && {
      key: 'facebook',
      label: 'فيسبوك',
      href: site.channels.facebook,
      icon: (
        <svg className={ICON} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
        </svg>
      ),
    },
    site.channels.instagram && {
      key: 'instagram',
      label: 'إنستجرام',
      href: site.channels.instagram,
      icon: (
        <svg className={ICON} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38C1.35 2.68.93 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13.67.66 1.34 1.08 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.13-1.38.66-.67 1.08-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.13C21.32 1.35 20.65.93 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z" />
        </svg>
      ),
    },
    site.channels.tiktok && {
      key: 'tiktok',
      label: 'تيك توك',
      href: site.channels.tiktok,
      icon: (
        <svg className={ICON} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
        </svg>
      ),
    },
    {
      key: 'email',
      label: 'إيميل',
      href: `mailto:${site.email}`,
      icon: (
        <svg
          className={ICON}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m2 7 10 6 10-6" />
        </svg>
      ),
    },
  ].filter(Boolean) as Channel[]

  return (
    <div className="rounded border border-navy-line bg-navy/60 p-6">
      <div className="flex items-center gap-3">
        <Image
          src="/images/logo.png"
          alt=""
          width={48}
          height={48}
          sizes="48px"
          loading="lazy"
          className="h-12 w-12 rounded border border-navy-line object-cover"
        />
        <div>
          <p className="font-extrabold text-ink">{site.name}</p>
          <p className="text-xs text-ink-faint">Mr Anas Ahmed</p>
        </div>
      </div>

      <p className="mt-5 text-sm text-ink-muted">تابعنا على كل المنصات — نفس الاسم في كل مكان:</p>

      <ul className="mt-4 grid grid-cols-2 gap-2">
        {channels.map((channel) => (
          <li key={channel.key}>
            <a
              href={channel.href}
              {...(channel.key === 'email'
                ? {}
                : { target: '_blank', rel: 'noopener noreferrer' })}
              className="group flex items-center gap-2.5 rounded border border-transparent px-3 py-2.5 text-sm font-bold text-ink-muted transition-[color,border-color,background-color] duration-200 hover:border-gold/40 hover:bg-gold/[0.06] hover:text-gold"
            >
              {/* The icon leads the colour change by a beat, so the row reads
                  as one object responding rather than two. */}
              <span className="transition-transform duration-200 group-hover:scale-110">
                {channel.icon}
              </span>
              <span>{channel.label}</span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-4 break-all text-xs text-ink-faint" dir="ltr">
        {site.email}
      </p>
    </div>
  )
}
