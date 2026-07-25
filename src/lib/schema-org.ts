import { site } from '@/content/site'
import { home } from '@/content/copy'

/**
 * Structured data = the entity layer (Doc 06 §5).
 *
 * Two rules that matter more than the markup itself:
 *  1. The facts stated here must match, word for word, the facts on the page
 *     and in every channel bio. Contradiction between sources is what destroys
 *     an entity in the eyes of search engines and LLMs.
 *  2. Retired names go in `alternateName` so old searches still resolve to us.
 */

const PERSON_ID = `${site.url}/#person`
const ORG_ID = `${site.url}/#organization`

function sameAs(): string[] {
  return Object.values(site.channels).filter((url): url is string => Boolean(url))
}

export function personSchema() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: site.name,
    alternateName: [site.nameEn, ...site.formerNames],
    url: site.url,
    jobTitle: 'مهندس برمجيات وأتمتة — ومدرّس البرمجة والذكاء الاصطناعي',
    description:
      'مهندس يعمل في الذكاء الاصطناعي والأتمتة، ويدرّس مادة البرمجة والذكاء الاصطناعي لطلاب البكالوريا في مسار الهندسة وعلوم الحاسب.',
    knowsAbout: [
      'البرمجة والذكاء الاصطناعي',
      'نظام البكالوريا المصري',
      'مسار الهندسة وعلوم الحاسب',
      'JavaScript',
      'تعليم البرمجة',
    ],
    knowsLanguage: ['ar', 'en'],
    ...(sameAs().length ? { sameAs: sameAs() } : {}),
  }
}

export function organizationSchema() {
  return {
    '@type': 'EducationalOrganization',
    '@id': ORG_ID,
    name: `${site.name} — ${site.subject}`,
    url: site.url,
    slogan: site.motto,
    description:
      'منظومة تعليمية لمادة البرمجة والذكاء الاصطناعي لطلاب البكالوريا: حصص مكثفة، منصة تعليمية بتصحيح آلي، ومتابعة أسبوعية لأولياء الأمور.',
    founder: { '@id': PERSON_ID },
    areaServed: { '@type': 'Country', name: 'مصر' },
    ...(sameAs().length ? { sameAs: sameAs() } : {}),
  }
}

export function courseSchema() {
  return {
    '@type': 'Course',
    name: 'البرمجة والذكاء الاصطناعي — الصف الثاني الثانوي (بكالوريا)',
    description:
      'كورس مادة البرمجة والذكاء الاصطناعي لطلاب الصف الثاني الثانوي في نظام البكالوريا، مسار الهندسة وعلوم الحاسب — حضورياً في القاهرة وأونلاين لباقي المحافظات.',
    inLanguage: 'ar',
    provider: { '@id': ORG_ID },
    educationalLevel: 'الصف الثاني الثانوي — نظام البكالوريا',
    teaches: 'أساسيات البرمجة، التفكير الخوارزمي، وحل المشكلات',
  }
}

export function faqSchema() {
  return {
    '@type': 'FAQPage',
    mainEntity: home.practical.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    url: site.url,
    name: site.name,
    inLanguage: 'ar',
    publisher: { '@id': PERSON_ID },
  }
}

/** Bundles every entity into one graph — the cleanest signal for crawlers. */
export function homeGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      personSchema(),
      organizationSchema(),
      courseSchema(),
      websiteSchema(),
      faqSchema(),
    ],
  }
}

export function pageGraph(extra: Record<string, unknown>[] = []) {
  return {
    '@context': 'https://schema.org',
    '@graph': [personSchema(), organizationSchema(), ...extra],
  }
}
