/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    // YouTube thumbnails are the only remote images used (video facades).
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com' }],
  },
  /**
   * /courses was removed in August 2026. A 301 rather than a 404 so any link
   * already shared, indexed or printed still lands somewhere useful — and so
   * whatever ranking the URL earned passes to the home page instead of dying.
   */
  async redirects() {
    return [{ source: '/courses', destination: '/', permanent: true }]
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
