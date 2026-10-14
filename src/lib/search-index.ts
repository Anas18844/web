import { GRADE_SLUG, LESSONS, gradeLabel } from '@/content/lessons'
import { SUMMARIES } from '@/content/summaries'
import { articles } from '@/content/knowledge'
import { ANSWER_KEYS, BOOKLETS } from '@/content/library'
import { normalizeArabic } from '@/lib/arabic'
import type { SearchEntry } from '@/lib/search-types'

/**
 * The site-wide search index (October 2026), built on the server at build time.
 *
 * `lessons.ts` imports the server-only homework file, so the browser cannot
 * build this itself. The page builds it and hands the client a plain array:
 * titles, a line of context, a link, and one pre-folded `text` field to match
 * against. No answer key and no article body goes in — only what a student
 * would type to find a page.
 */

export type { SearchEntry, SearchKind } from '@/lib/search-types'

const fold = (...parts: (string | undefined)[]) => normalizeArabic(parts.filter(Boolean).join(' '))
const isExternal = (href: string) => /^(https?:\/\/|\/files\/|\/interactive\/)/.test(href)

/** Pages that answer a question rather than hold content. */
const PAGES: SearchEntry[] = [
  {
    kind: 'page',
    title: 'منصة كود أب — الاشتراك',
    sub: 'محتوى الشهر، ومستويات الأسئلة التسعة، وأنظمة الاشتراك، وطريقة الدفع.',
    href: '/platform',
    text: fold('منصه كود اب code up اشتراك اشترك الدفع فودافون كاش انستاباي فوري سعر اسعار باقه شهري سنوي محاضرات'),
  },
  {
    kind: 'page',
    title: 'مين مستر أنس',
    sub: 'الخبرة في التدريس والهندسة، والدراسة والأبحاث.',
    href: '/about',
    text: fold('مين مستر انس المدرس الخبره مهندس مايكروسوفت microsoft ابحاث'),
  },
  {
    kind: 'page',
    title: 'لولي الأمر',
    sub: 'المتابعة الأسبوعية، والتقرير على واتساب، والتواصل.',
    href: '/parents',
    text: fold('ولي الامر الاهل تقرير متابعه واتساب تواصل'),
  },
  {
    kind: 'page',
    title: 'الحسابات الرسمية',
    sub: 'يوتيوب، وفيسبوك، وتيك توك، وإنستجرام، وواتساب.',
    href: '/links',
    text: fold('الحسابات الرسميه لينكات روابط يوتيوب youtube فيسبوك تيك توك انستجرام واتساب قناه'),
  },
]

export function buildSearchIndex(): SearchEntry[] {
  const lessons: SearchEntry[] = LESSONS.map((l) => ({
    kind: 'lesson',
    title: `${l.eyebrow} — ${l.title}`,
    sub: `${gradeLabel(l.grade)} · ${l.blurb}`,
    href: `/lessons/${GRADE_SLUG[l.grade]}/${l.slug}`,
    text: fold(l.eyebrow, l.title, l.blurb, gradeLabel(l.grade)),
  }))

  const summaries: SearchEntry[] = SUMMARIES.map((s) => ({
    kind: 'summary',
    title: `ملخص ${s.lecture} — ${s.title}`,
    sub: s.axes.map((a) => a.title).join(' · '),
    href: `/summary/${s.slug}`,
    text: fold('ملخص', s.lecture, s.title, s.lesson, s.drivingQuestion, ...s.axes.map((a) => a.title)),
  }))

  const library: SearchEntry[] = [...BOOKLETS, ...ANSWER_KEYS]
    .filter((i) => i.url)
    .map((i) => ({
      kind: ANSWER_KEYS.includes(i) ? ('answers' as const) : ('booklet' as const),
      title: i.title,
      sub: `${gradeLabel(i.grade)} · ${i.blurb}`,
      href: i.url!,
      external: isExternal(i.url!),
      text: fold(i.title, i.blurb, i.meta, gradeLabel(i.grade), ANSWER_KEYS.includes(i) ? 'حل اجابه نموذج تقييم' : 'ملزمه pdf'),
    }))

  const knowledge: SearchEntry[] = articles.map((a) => ({
    kind: 'article',
    title: a.title,
    sub: a.dek,
    href: `/knowledge/${a.slug}`,
    text: fold(a.title, a.dek, ...a.tags),
  }))

  return [...lessons, ...library, ...summaries, ...knowledge, ...PAGES]
}
