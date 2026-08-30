import { site, institutions } from '@/content/site'

/**
 * Structured data = the entity layer (Doc 06 §5).
 *
 * Two rules that matter more than the markup itself:
 *  1. The facts stated here must match, word for word, the facts on the page
 *     and in every channel bio. Contradiction between sources is what destroys
 *     an entity in the eyes of search engines and LLMs.
 *  2. Retired names go in `alternateName` so old searches still resolve to us.
 *
 * The credentials below (places taught at, places worked with) are the same
 * ones shown on the page — they are the trust device, so the machines get them
 * in structured form too.
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
    url: `${site.url}/about`,
    jobTitle: 'مهندس ذكاء اصطناعي وبرمجيات — ومدرّس برمجة',
    description:
      'مدرّس ومهندس يعملان بالتوازي منذ ٤ سنوات. مهندس ذكاء اصطناعي وبرمجيات عمل مع Microsoft Egypt وiTech Solutions وiSchool وBade3 Program for AI، وشارك في بناء أكثر من ٢٠ منتجاً يستخدمها أكثر من مليون مستخدم، وله أكثر من ٩ أوراق بحثية في الذكاء الاصطناعي والخوارزميات التطورية وAgentic AI منشورة على IEEE وGoogle Scholar. درّس الفيزياء لطلاب الثانوية بين ٢٠٢٣ و٢٠٢٦، ودرّب أكثر من ١٠٠ طالب على مسابقات ICPC.',
    knowsAbout: [
      'البرمجة',
      'الذكاء الاصطناعي',
      'هندسة البرمجيات',
      'الخوارزميات التطورية',
      'Agentic AI',
      'مسابقات ICPC',
      'تعليم البرمجة',
      'البرمجة والذكاء الاصطناعي للثانوية',
    ],
    knowsLanguage: ['ar', 'en'],
    worksFor: institutions.industry.map((org) => ({
      '@type': 'Organization',
      name: org.name,
    })),
    alumniOf: [
      {
        '@type': 'CollegeOrUniversity',
        name: 'جامعة حلوان — كلية الحاسبات والذكاء الاصطناعي',
      },
      {
        '@type': 'CollegeOrUniversity',
        name: 'الجامعة الأمريكية بالقاهرة (AUC) — منحة في هندسة الحاسوب',
      },
    ],
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
      'تعليم البرمجة والذكاء الاصطناعي لطلاب الصف الأول والثاني الثانوي — بشرح من مهندس ممارس، ونظام متابعة فيه امتحان تقييمي كل حصة ومشرف مخصص لكل طالب وتصحيح للواجب سؤالاً بسؤال.',
    founder: { '@id': PERSON_ID },
    areaServed: { '@type': 'Country', name: 'مصر' },
    /**
     * The mark, stated explicitly.
     *
     * A <link rel="icon"> tells a BROWSER what to put in the tab. It is not
     * what tells Google which image belongs to this organisation — that comes
     * from here, and its absence is why a search result can show a blank
     * square next to a site whose favicon is working perfectly.
     *
     * `logo` must be a real, crawlable, absolute URL. `/icon.png` is the 192px
     * square generated from the brand mark on the brand navy; a transparent or
     * non-square file is the usual reason this silently does nothing.
     */
    logo: {
      '@type': 'ImageObject',
      url: `${site.url}/icon.png`,
      width: 192,
      height: 192,
    },
    image: `${site.url}/icon.png`,
    ...(sameAs().length ? { sameAs: sameAs() } : {}),
  }
}

export function courseSchema() {
  return {
    '@type': 'Course',
    name: 'البرمجة والذكاء الاصطناعي — من الصفر',
    url: `${site.url}/#start`,
    description:
      'مسار تعليمي في البرمجة والذكاء الاصطناعي يبدأ من الصفر، لطلاب الصف الأول والثاني الثانوي. التحضير مبني على مراجع ومناهج أجنبية تُعرَّب ويُضاف إليها، والمتابعة بنظام فيه امتحان تقييمي كل حصة ومشرف مخصص لكل طالب وامتحان شهري بمستويات.',
    inLanguage: 'ar',
    provider: { '@id': ORG_ID },
    teaches: 'التفكير البرمجي، حل المشكلات، كتابة كود نظيف، وأساسيات الذكاء الاصطناعي',
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
      audienceType: 'طلاب الصف الأول والثاني الثانوي',
    },
    /**
     * The free-first claims came out in August 2026 along with the sections
     * that made them. Structured data has to match what the page says — a
     * `isAccessibleForFree: true` that the site no longer states anywhere is
     * exactly the kind of contradiction that costs an entity its credibility.
     */
    hasCourseInstance: [
      {
        '@type': 'CourseInstance',
        name: 'المنصة التعليمية',
        courseMode: 'online',
        description:
          'الحصص والواجبات والامتحانات، بتصحيح للكود ومتابعة فردية من مشرف مخصص لكل طالب.',
      },
      {
        '@type': 'CourseInstance',
        name: 'الحصص الحضورية',
        courseMode: 'onsite',
        description: 'سناتر في حلوان وحدائق حلوان ومدينة ١٥ مايو.',
        location: [
          { '@type': 'Place', name: 'حلوان، القاهرة' },
          { '@type': 'Place', name: 'حدائق حلوان، القاهرة' },
          { '@type': 'Place', name: 'مدينة ١٥ مايو، القاهرة' },
        ],
      },
    ],
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
    ],
  }
}

export function pageGraph(extra: Record<string, unknown>[] = []) {
  return {
    '@context': 'https://schema.org',
    '@graph': [personSchema(), organizationSchema(), ...extra],
  }
}
