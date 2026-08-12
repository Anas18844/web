import type { Config } from 'tailwindcss'

/**
 * Design Tokens — single source of truth for the brand's visual language.
 * Values come from `brand_identity_anas_ahmed.md`.
 *
 * ⚠️ Two identity decisions are still open (documented as TBD in the brand file).
 * When they are settled, change them HERE ONLY — nothing else in the codebase
 * hardcodes a brand colour.
 *   1. Final navy: currently the proposed unified value #0D1B33.
 *   2. Gold: logo uses #CBA352, thumbnails use #B8922E. Both are kept below
 *      (`gold.DEFAULT` / `gold.deep`) until the founder unifies them.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      /**
       * SURFACE-AWARE COLOURS.
       *
       * The page runs on two surfaces now — navy and white — so the tokens
       * that have to flip between them read from CSS variables instead of
       * hex. `:root` holds the dark values; `.surface-light` (applied by the
       * `paper` section tones) overrides them. Every existing `text-ink`,
       * `text-ink-muted`, `border-navy-line` and `text-gold` in the codebase
       * therefore inverts on a white section without being touched.
       *
       * What deliberately does NOT flip: `navy` and `navy.deep`, because they
       * are the dark surfaces themselves, and `gold.brand`, because a solid
       * gold button has to stay the same gold everywhere.
       */
      colors: {
        navy: {
          DEFAULT: '#0D1B33', // primary dark background
          deep: '#0A1526', // deeper wells / footer
          soft: 'rgb(var(--navy-soft) / <alpha-value>)', // raised surfaces (cards)
          line: 'rgb(var(--navy-line) / <alpha-value>)', // hairlines & borders
        },
        paper: {
          DEFAULT: '#FFFFFF', // the white surface
          soft: '#F3F7FC', // its quieter sibling, for adjacent light sections
        },
        gold: {
          // Accent-on-surface: #CBA352 on navy, a deeper gold on white where
          // the logo tone would fail contrast against paper.
          DEFAULT: 'rgb(var(--gold) / <alpha-value>)',
          brand: '#CBA352', // the logo gold — solid fills only, never flips
          deep: '#B8922E', // thumbnail gold — solid blocks on white text
        },
        cyan: {
          DEFAULT: '#48C8D5', // accent only, used sparingly (the logo "solution path")
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)', // body text — passes AA on both
          faint: 'rgb(var(--ink-faint) / <alpha-value>)', // meta text, labels
        },
        /** Card fill — a navy tint on dark, plain white on paper. */
        card: 'rgb(var(--surface-card) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-cairo)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        // The identity is built on sharp, angular cuts — no soft curves.
        none: '0',
        DEFAULT: '2px',
        sm: '2px',
        md: '3px',
        lg: '4px',
      },
      maxWidth: {
        content: '68rem',
        prose: '44rem',
      },
      fontSize: {
        // Mobile-first scale, tuned for Arabic (which needs slightly more leading).
        'display': ['clamp(2rem, 7vw, 3.5rem)', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'title': ['clamp(1.5rem, 4.5vw, 2.25rem)', { lineHeight: '1.35' }],
        'subtitle': ['clamp(1.125rem, 3vw, 1.375rem)', { lineHeight: '1.7' }],
        'body': ['1.0625rem', { lineHeight: '1.9' }],
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        // One restrained animation only, used for the form's success state.
        'fade-up': 'fade-up 320ms ease-out both',
      },
    },
  },
  plugins: [],
}

export default config
