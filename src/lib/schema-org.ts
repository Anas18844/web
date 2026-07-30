import { site, institutions } from '@/content/site'
import { home } from '@/content/copy'

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
      'تعليم البرمجة والذكاء الاصطناعي لطلاب الصف الأول والثاني الثانوي، وطلاب كليات الحاسبات والهندسة والعلوم، والمتعلمين ذاتياً — بشرح من مهندس ممارس، ومنصة بتصحيح آلي، ومتابعة بالبيانات.',
    founder: { '@id': PERSON_ID },
    areaServed: { '@type': 'Country', name: 'مصر' },
    ...(sameAs().length ? { sameAs: sameAs() } : {}),
  }
}

export function courseSchema() {
  return {
    '@type': 'Course',
    name: 'البرمجة والذكاء الاصطناعي — من الصفر',
    url: `${site.url}/courses`,
    description:
      'مسار تعليمي في البرمجة والذكاء الاصطناعي يبدأ من الصفر، لطلاب الصف الأول والثاني الثانوي، وطلاب كليات الحاسبات والهندسة والعلوم، والمتعلمين ذاتياً. الحصص والمراجعات وحل الامتحانات والملازم تُنشر مجاناً على يوتيوب، والمنصة والسنتر اختياريان لمن يريد متابعة أقرب.',
    inLanguage: 'ar',
    provider: { '@id': ORG_ID },
    teaches: 'التفكير البرمجي، حل المشكلات، كتابة كود نظيف، وأساسيات الذكاء الاصطناعي',
    isAccessibleForFree: true,
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
      audienceType: 'طلاب الثانوي، وطلاب كليات الحاسبات والهندسة والعلوم، والمتعلمون ذاتياً',
    },
    hasCourseInstance: [
      {
        '@type': 'CourseInstance',
        name: 'المحتوى المجاني على يوتيوب',
        courseMode: 'online',
        description:
          'الحصص والمراجعات وحل الامتحانات والملازم — تُنشر مجاناً بالكامل ودون اشتراك.',
        isAccessibleForFree: true,
      },
      {
        '@type': 'CourseInstance',
        name: 'المنصة التعليمية (اختيارية)',
        courseMode: 'online',
        description:
          'لمن يريد متابعة فردية وواجبات وامتحانات وتصحيحاً آلياً للكود — ليست شرطاً للنجاح.',
      },
      {
        '@type': 'CourseInstance',
        name: 'الحصص الحضورية (اختيارية)',
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
