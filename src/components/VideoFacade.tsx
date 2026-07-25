'use client'

import { useState } from 'react'
import Image from 'next/image'
import { events } from '@/lib/analytics'
import type { VideoAsset } from '@/content/assets'

/**
 * Click-to-load YouTube facade (roadmap §6).
 *
 * The iframe player costs ~1MB+ and blocks the main thread; we refuse to pay
 * that before the visitor shows intent. Until clicked this is just a thumbnail.
 */
export function VideoFacade({
  video,
  proofName,
  caption,
}: {
  video: VideoAsset
  proofName: string
  caption?: string
}) {
  const [playing, setPlaying] = useState(false)

  return (
    <figure className="w-full">
      <div className="relative aspect-video w-full overflow-hidden rounded border border-navy-line bg-navy-deep">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&hl=ar`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setPlaying(true)
              events.proofViewed(proofName)
            }}
            className="group absolute inset-0 h-full w-full"
            aria-label={`تشغيل: ${video.title}`}
          >
            <Image
              src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover opacity-80 transition-opacity group-hover:opacity-100"
            />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-gold text-navy transition-transform group-hover:scale-105">
                {/* Play triangle — mirrored for RTL is wrong here; playback is universal LTR. */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>
      {caption && (
        <figcaption className="mt-3 text-sm text-ink-faint">{caption}</figcaption>
      )}
    </figure>
  )
}
