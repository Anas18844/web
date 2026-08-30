/**
 * All Arabic copy for the site, in one editable file.
 *
 * The governing correction (founder, July 2026):
 *   The student does not get convinced by the title "engineer". The student
 *   wants to know whether they can TRUST this teacher. So we do not argue
 *   "why an engineer teaches" — we name the places we taught at and worked
 *   with, and we prove them with photos and screenshots.
 *
 * Copy rules still enforced (Docs 01–03, Principles 5/6/9/20/21):
 *  - Specific facts and numbers instead of adjectives.
 *  - No superlatives, no absolute promises.
 *  - Student voice = close and young. Parent voice = calm and serious.
 */

export const home = {
  hero: {
    eyebrow: 'برمجة وذكاء اصطناعي · أولى وتانية ثانوي',
    title: 'هفهمك البرمجة من الأساس لحد ما توصل للدرجة النهائية',
    lead: 'من غير حفظ، ومن غير ما تكون فاهم أي حاجة قبل كده. بنبدأ من الصفر، وبنمشي بنظام بيتابعك خطوة بخطوة لحد الامتحان.',
    primaryCta: 'احجز دلوقتي',
  },

  /** Credential numbers — every one of them is a fact stated by the founder. */
  numbers: {
    title: 'الخبرة بالأرقام',
    items: [
      { value: '+٤ سنين', label: 'تدريس برمجة في iSchool وأشبال مصر الرقمية ورواد' },
      { value: '+٤ سنين', label: 'شغل فعلي في سوق البرمجيات والذكاء الاصطناعي' },
      { value: '+١٠٠ طالب', label: 'تدريب على مسابقات ICPC العالمية وهاكاثونات' },
      { value: 'LinkedIn', label: 'اختيار أكتر من مرة ضمن المؤثرين في المجال' },
    ],
  },

  /**
   * Who this is for — the two grades we serve, and only those two.
   *
   * The university and self-learner segments were removed in August 2026: the
   * centre teaches the secondary programming syllabus and nothing else. Any
   * wording that implies a wider audience has to come out with them, or the
   * page promises a service that does not exist.
   */
  audience: {
    title: 'أنا بدرّس لمين؟',
    items: [
      {
        title: 'طالب أولى ثانوي',
        body: 'مادة البرمجة والذكاء الاصطناعي بقت جزء من دراستك. هنبدأ معاك من الصفر ونبني أساس مايتهزّش، مش مجرد مذاكرة للامتحان.',
      },
      {
        title: 'طالب تانية ثانوي',
        body: 'اخترت البرمجة كمادة تخصص في مسار الهندسة وعلوم الحاسب، ودي مادة داخلة مجموعك. هنشتغل على المنهج وعلى الفهم الحقيقي في نفس الوقت.',
      },
    ],
  },

  /**
   * A deliberately short block on the home page. Everything else about the
   * founder lives on /about — the home page is about the student, not him.
   */
  aboutTeaser: {
    title: 'مين مستر أنس؟',
    body: 'مدرّس ومهندس — مهنتين بشتغل فيهم بالتوازي من ٤ سنين. اشتغلت مع Microsoft Egypt وiTech Solutions وiSchool، ودرّست البرمجة لآلاف الطلاب، ودرّست ثانوية عامة ٣ سنين قبل كده.',
    stats: [
      { value: '+٢٠ منتج', label: 'بيستخدمهم أكتر من مليون مستخدم' },
      { value: '+٩ أوراق بحثية', label: 'في الذكاء الاصطناعي — على IEEE وGoogle Scholar' },
      { value: 'Expert', label: 'على Codeforces' },
    ],
    cta: 'اعرف التفاصيل كاملة',
  },


  /**
   * The teaching system — renamed from "بنشتغل إزاي؟" in August 2026.
   *
   * The founder's brief: the SYSTEM is what holds the student, not the
   * student's willpower. Every item below is therefore a mechanism, not an
   * adjective — a test, a named person, a correction method, an exam, a
   * support line. Keep it that way; the moment one of them turns into
   * "متابعة مميزة" it stops meaning anything.
   */
  system: {
    title: 'نظام الشرح',
    intro:
      'النظام معمول عشان ميسيبش الطالب يقع. مش بيعتمد على إنك تكون منظّم أو متحمّس — بيمشّيك خطوة بخطوة، وكل خطوة فيها حد بيتابعك بالاسم.',
    pillars: [
      {
        id: 'quiz',
        title: 'امتحان تقييمي كل حصة',
        body: 'قبل كل حصة فيه امتحان قصير على اللي فات. مش تقييم للدرجة — ده بيوريك إنت واقف فين قبل ما تكمّل، وبيمنع المنهج إنه يتراكم عليك من غير ما تحس.',
      },
      {
        id: 'mentor',
        title: 'مشرف مخصوص لكل طالب',
        body: 'كل طالب ليه مشرف بالاسم مسؤول عنه وعن مستواه. مش حد بيرد على الأسئلة وبس — ده حد شغلته إن مستواك يعلى، وبيتحاسب على ده.',
      },
      {
        id: 'correction',
        title: 'تصحيح الواجب سؤال سؤال',
        body: 'الواجب مابيتصححش بدرجة إجمالية. كل سؤال بيتصحّح لوحده، فبتعرف بالظبط غلطت فين وليه — مش إنك خدت ٦ من ١٠ وخلاص.',
      },
      {
        id: 'formats',
        title: 'تدريب على الاختياري والمقالي',
        body: 'النظام الحديث فيه اختيار من متعدد وفيه مقالي، وكل واحد فيهم بيتحل بطريقة مختلفة. بنتدرّب على الاتنين طول السنة، مش في آخرها.',
      },
      {
        id: 'monthly',
        title: 'امتحان شهري بمستويات',
        body: 'كل شهر امتحان شامل، وبعده الأسئلة بتتقسّم مستويات — متوسط ومتقدم. بتشتغل على المستوى اللي يناسبك دلوقتي، وبتتنقل لما تجهز.',
      },
      {
        id: 'support',
        title: 'دعم فني وعلمي ونفسي',
        body: 'تلات خطوط منفصلة: مشكلة في المنصة، سؤال في المادة، أو إنك حاسس إنك واقف ومش قادر تكمّل. التالت ده اللي أغلب الأماكن بتتجاهله.',
      },
    ],
  },

  /** The graduation promise, in the founder's words. */
  outcome: {
    title: 'هتخرج من هنا بإيه؟',
    body: 'هتخرج وإنت قادر تعمل أي حاجة بالعلم اللي اتعلمته — مش بمعلومات بتنساها بعد الامتحان بأسبوع. ده اللي النظام كله متبني عشانه.',
    signature: 'مستر أنس شخص كرّس حياته في مجال تطوير التعليم التقني.',
  },

  /**
   * The invitation to مركز المعرفة.
   *
   * Deliberately not an offer — an invitation to keep learning. The three
   * headlines under it are pulled live from the Knowledge Center, so the
   * section proves the claim instead of making it.
   */
  knowledge: {
    title: 'مركز المعرفة',
    body: 'لو عندك سؤال، أو عايز تفضل متابع اللي بيحصل في البرمجة، أو محتاج نصايح مذاكرة وشروحات ومقالات تعليمية — كل ده بينزل هنا أول بأول.',
    latestLabel: 'آخر اللي نزل',
    cta: 'ادخل مركز المعرفة',
  },

  /** Title and button only — the parent page does the explaining, not this. */
  parentBridge: {
    title: 'لو حضرتك ولي أمر',
    cta: 'اتفضل من هنا',
  },

  /**
   * The capture section is now the form and nothing else — no heading, no
   * standfirst, no second button competing with it. The only thing under the
   * form is the WhatsApp route, in WhatsApp's own green, for the visitor who
   * would rather talk than type.
   */
  capture: {
    whatsappCta: 'أو كلّمنا على واتساب',
  },
} as const

/**
 * ⚠️ REMOVED (August 2026): the `platform` export and the /platform page it fed.
 *
 * The platform itself has not gone anywhere — it is still what "نظام الشرح" on
 * the home page describes, and the parents page still explains the follow-up it
 * produces. What went is the standalone page arguing for it.
 */

/**
 * The /about page — "مين مستر أنس".
 *
 * This is the one place where the engineering title is used freely: a visitor
 * who clicked through here is explicitly asking who this person is, so the
 * credentials answer the question instead of interrupting the pitch.
 */
export const about = {
  meta: {
    title: 'مين مستر أنس؟',
    description:
      'مدرّس ومهندس — ٤ سنين بالتوازي. اشتغل مع Microsoft Egypt وiTech Solutions وiSchool، و+٢٠ منتج بيستخدمهم مليون مستخدم، و+٩ أوراق بحثية على IEEE.',
  },

  hero: {
    eyebrow: 'التعريف الكامل',
    title: 'مين مستر أنس؟',
    lead: 'مدرّس ومهندس. مهنتين بشتغل فيهم بالتوازي من ٤ سنين — ومش بصدفة، لأن كل واحدة فيهم بتخدم التانية.',
  },

  engineer: {
    title: 'كمهندس',
    body: 'شغلي الأساسي هندسة برمجيات وذكاء اصطناعي. اشتغلت مع شركات كبيرة، وبنيت منتجات بيستخدمها ناس فعلاً — مش مشاريع في الدرج.',
    companies: ['Microsoft Egypt', 'iTech Solutions', 'iSchool', 'Bade3 Program for AI'],
    highlights: [
      {
        value: '+٢٠ منتج',
        label: 'شاركت في بنائها، وبيستخدمها دلوقتي أكتر من مليون مستخدم',
      },
      {
        value: '+٥٠ استشارة',
        label: 'في البيزنس والنمو والتقنية والذكاء الاصطناعي',
      },
      {
        value: '+٩ أوراق بحثية',
        label: 'في الذكاء الاصطناعي والخوارزميات التطورية وAgentic AI — منشورة على IEEE وGoogle Scholar',
      },
    ],
  },

  education: {
    title: 'الدراسة',
    body: 'بدرس في كلية الحاسبات والذكاء الاصطناعي — جامعة حلوان، وبالتوازي معاها أخدت منحة الجامعة الأمريكية بالقاهرة (AUC) في هندسة الحاسوب.',
    items: [
      { title: 'جامعة حلوان', detail: 'كلية الحاسبات والذكاء الاصطناعي' },
      { title: 'الجامعة الأمريكية بالقاهرة (AUC)', detail: 'منحة في هندسة الحاسوب' },
    ],
  },

  competitive: {
    title: 'البرمجة التنافسية',
    body: 'وصلت لمستوى Expert على Codeforces، ودرّبت أكتر من ١٠٠ طالب على مسابقات البرمجة العالمية ICPC وهاكاثونات تانية. اللي بتتعلمه في المسابقات مش مجرد كود — بتتعلم تفكّر تحت ضغط، وده بالظبط اللي بحاول أنقله للطالب.',
  },

  linkedin: {
    title: 'على لينكدإن',
    body: 'بشارك شغلي وخبرتي مع مجتمع تقني بيتجاوز ٦٠٠٠ متابع، وجزء كبير من شغلي هناك هو توجيه الطلاب الخارجين لسوق العمل: يبدأوا منين، ويتعلموا إيه، وإزاي يدخلوا أول شغل. وهتلاقي لينكات كل الشهادات على الصفحة.',
  },

  whyTeaching: {
    title: 'طب ليه قررت أدرّس طلبة ثانوي؟',
    body: [
      'الحقيقة إن ده مش قرار جديد. أنا فعلاً درّست طلبة ثانوية عامة من ٢٠٢٣ لـ ٢٠٢٦ في مادة الفيزياء، ونسبة كبيرة منهم جابت الدرجة النهائية في المادة.',
      'وكمان أخدت التدريبات اللازمة للتدريس نفسه — زي شهادة ToT (تدريب المدربين)، وشهادات متخصصة في تدريس الأطفال والمراهقين من iSchool. لأن اللي بيعرف المعلومة مش بالضرورة بيعرف يوصّلها لطالب عنده ١٦ سنة.',
      'فلما جيت أدرّس البرمجة، مكنتش ببدأ من الصفر في التدريس ولا في البرمجة — الاتنين كانوا موجودين بالفعل.',
    ],
  },

  cta: {
    title: 'عايز تبدأ؟',
    body: 'لو وصلت لهنا يبقى عندك صورة واضحة. الخطوة الجاية بسيطة — سيب بياناتك ونتكلم.',
    button: 'ابدأ من هنا',
  },
} as const

export const parents = {
  meta: {
    title: 'لولي الأمر — الخبرة وإزاي بنتابع ابنك',
    description:
      'لولي الأمر: ٤ سنين تدريس في iSchool وأشبال مصر الرقمية ورواد، و٤ سنين شغل هندسي مع Microsoft Egypt — وإزاي بيتم متابعة الطالب أسبوعياً بالبيانات.',
  },
  hero: {
    eyebrow: 'صفحة مخصصة لولي الأمر',
    title: 'حضرتك مش محتاج تصدّقنا — محتاج تشوف',
    lead: 'الصفحة دي بتوضّح مين اللي هيدرّس لابن حضرتك، واشتغل فين بالظبط، وإزاي هتعرف مستواه أول بأول.',
  },

  credentials: {
    title: 'مين اللي هيدرّس؟',
    body: 'أنس أحمد — مهندس ذكاء اصطناعي وبرمجيات، وخبرة ٤ سنين في تدريس البرمجة داخل كيانات معروفة، و٤ سنين شغل فعلي في سوق البرمجيات.',
    teaching: 'التدريس: iSchool · أشبال مصر الرقمية · رواد — بالإضافة لتدريب مهندسين شغالين في قطاع البرمجيات.',
    industry: 'الشغل: Microsoft Egypt · iSchool · ميم سكول · iTech Solutions — في الذكاء الاصطناعي والبرمجيات وأنظمة ERP.',
    competitions: 'تدريب أكتر من ١٠٠ طالب على مسابقات البرمجة العالمية ICPC وهاكاثونات.',
  },

  followUp: {
    title: 'اللي بيوصل لحضرتك',
    items: [
      {
        title: 'تقرير أسبوعي على الواتساب',
        body: 'فيه حضور الطالب، ونتيجته في الامتحان القبلي، والتزامه بالواجبات. أرقام محددة، مش تقييم عام زي «مستواه كويس».',
      },
      {
        title: 'امتحان قبلي كل حصة',
        body: 'قبل كل حصة فيه امتحان قصير على اللي فات. ده بيدّي مؤشر متكرر على مستوى الطالب طول السنة، مش مرة واحدة في آخرها.',
      },
      {
        title: 'تصحيح فردي مش جماعي',
        body: 'الواجب بيتصحّح أوتوماتيك، وبعدين بيتفتح للطالب فيديو بيشرح غلطه هو تحديداً — عشان الطالب ميبقاش رقم وسط مجموعة.',
      },
      {
        title: 'صراحة في التقييم',
        body: 'لو مستوى الطالب محتاج شغل أكتر، حضرتك هتعرف. مش هنطمّن حضرتك على الفاضي عشان الاشتراك يستمر.',
      },
    ],
  },

  transparency: {
    title: 'اللي مش هنقوله لحضرتك',
    body: 'مش هنقول إن النتيجة مضمونة، ولا إن ابن حضرتك هيبقى مبرمج محترف في شهرين. اللي بنلتزم بيه: خبرة حقيقية قابلة للتحقق، ومتابعة منتظمة بالبيانات، وشفافية كاملة لو المستوى نزل.',
  },

  evaluate: {
    title: 'قيّم بنفسك',
    body: 'أسهل طريقة: خلي ابن حضرتك يجرّب أول حصة ويشوف الشرح والمنصة، وحضرتك تشوف التقرير. وبعدين تقرر. ولو حابب تتكلم مع حد قبل كده، رقمنا تحت.',
  },

  capture: {
    title: 'اطلب تواصل',
    body: 'سيب بيانات حضرتك وهنتواصل معاك على الواتساب. لو تحب مكالمة، اكتبها في خانة الملاحظة وهنتصل.',
  },
} as const

/**
 * The /knowledge page — "مركز المعرفة".
 *
 * The one page on the site that sells nothing, on purpose. Its job is to make
 * a claim the rest of the site cannot make for itself: that this is somewhere
 * a student keeps learning, not somewhere they buy something once. Every
 * commercial device — the capture form, the WhatsApp bar, the price talk — is
 * deliberately absent here, because a page that ends in a form contradicts the
 * sentence it opens with.
 */
export const knowledge = {
  meta: {
    title: 'مركز المعرفة',
    description:
      'شروحات ومقالات تعليمية في البرمجة والذكاء الاصطناعي: إزاي تبدأ من الصفر، خطط مذاكرة، شرح مفاهيم، وأخطاء شائعة — لطلاب أولى وتانية ثانوي.',
  },

  hero: {
    eyebrow: 'مركز المعرفة',
    title: 'مكان تفضل تتعلم منه',
    lead: 'شروحات ونصايح مذاكرة وإجابات للأسئلة اللي بتتكرر — مقالات تعليمية بتنفعك سواء ذاكرت معانا أو لأ. بننشر هنا أول بأول.',
  },

  featuredLabel: 'ابدأ من هنا',
  browseTitle: 'كل المقالات',
  browseIntro: 'دوّر باسم المقال أو اختار موضوع.',

  search: {
    label: 'ابحث في المقالات',
    placeholder: 'ابحث… مثال: لوب، مذاكرة، ذكاء اصطناعي',
    all: 'الكل',
    empty: 'مفيش نتيجة للبحث ده',
    emptyHint: 'جرّب كلمة أقصر، أو اختار موضوع من فوق. ولو فيه حاجة نفسك نشرحها ومش لاقيها، ابعتلنا وهنكتب فيها.',
    clear: 'امسح البحث',
    /* Plain strings with a `{n}` token, not a formatter: these cross into a
       client component, and functions cannot be serialised across that
       boundary. Arabic needs all four forms — see `arabicPlural`. */
    count: {
      one: 'مقال واحد',
      two: 'مقالين',
      few: '{n} مقالات',
      many: '{n} مقال',
    },
  },

  article: {
    back: 'كل المقالات',
    relatedTitle: 'اقرأ بعد كده',
    tagsLabel: 'الموضوعات',
  },
} as const

export const links = {
  meta: {
    title: 'الروابط والحسابات الرسمية',
    description:
      'السجل الرسمي الوحيد لحسابات وروابط مستر أنس أحمد. أي حساب تاني بالاسم ده مش تابع لنا.',
  },
  title: 'الحسابات الرسمية',
  lead: 'دي كل الحسابات الرسمية. أي حساب أو صفحة تانية بالاسم ده — مش تابعة لنا ولا مسؤولين عن أي محتوى عليها.',
  contactTitle: 'التواصل المباشر',
} as const

export const privacy = {
  meta: {
    title: 'سياسة الخصوصية',
    description: 'إزاي بنتعامل مع البيانات اللي بتسيبها على الموقع.',
  },
  title: 'سياسة الخصوصية',
  updated: 'آخر تحديث: أغسطس ٢٠٢٦',
  sections: [
    {
      title: 'إيه البيانات اللي بنجمعها؟',
      body: 'الاسم، ورقم الواتساب، وإنت في أنهي مرحلة — وده كل حاجة. مش بنطلب رقم قومي ولا عنوان ولا بيانات دفع على الموقع. لو حبيت تكتب اسم اللي رشّحنا لك، ده اختياري تماماً.',
    },
    {
      title: 'بنستخدمها في إيه؟',
      body: 'في حاجة واحدة بس: إننا نتواصل معاك بخصوص الحصص والمنصة والمواعيد. مش بنستخدمها في أي غرض تاني.',
    },
    {
      title: 'بنشاركها مع حد؟',
      body: 'لأ. البيانات دي مش بتتباع ولا بتتشارك مع أي طرف تاني لأي سبب.',
    },
    /**
     * Added with the measurement layer (August 2026), because the policy has to
     * match what the system actually does — and the site now runs a tag manager
     * that can forward to Google, Meta and TikTok. Saying nothing about that
     * while the section above promises "no third party" would have made the
     * whole page untrue.
     *
     * The promise below is not a wording choice, it is enforced: `redact()` in
     * src/lib/analytics.ts strips identifying keys before anything reaches the
     * dataLayer. If this paragraph ever has to change, that function is the
     * thing that changed.
     */
    {
      title: 'وأدوات القياس؟',
      body: 'بنستخدم أدوات بتقولنا كام حد دخل الموقع، وجه منين، وقعد على أنهي صفحة، وضغط على أنهي زرار. الأدوات دي بتشوف سلوك مجهول الهوية — صفحات وضغطات وأرقام. اسمك ورقمك مابيوصلوش لها أبداً: البيانات اللي بتسيبها في الفورم بتروح لقاعدة بياناتنا بس، وبتفضل عندنا.',
    },
    {
      title: 'الطلاب تحت ١٨ سنة',
      body: 'كتير من اللي بيسجّلوا طلاب قُصَّر، وعشان كده بنجمع أقل قدر ممكن من البيانات. ولي الأمر يقدر يطلب منّا في أي وقت إننا نمسح بيانات ابنه أو بنته، وبيتنفذ فوراً.',
    },
    {
      title: 'الصور والأسماء',
      body: 'مش بننشر صورة ولا اسم ولا نتيجة أي طالب على الموقع أو على أي قناة من غير موافقة صريحة منه ومن ولي أمره.',
    },
    {
      title: 'عايز تمسح بياناتك؟',
      body: 'ابعتلنا على الواتساب وهنمسحها — من غير أسئلة.',
    },
  ],
} as const

export const common = {
  nav: {
    home: 'الرئيسية',
    knowledge: 'مركز المعرفة',
    about: 'مين مستر أنس',
    parents: 'لولي الأمر',
    start: 'سجّل معانا',
  },
  form: {
    /**
     * The capture runs in two steps. Step one asks for the three things a
     * follow-up call needs and saves immediately; step two enriches the row we
     * already have. The wording of step two has to make that visible — a
     * student who thinks they are only half-registered will not fill it in.
     */
    step2Label: 'الخطوة ٢ من ٢',
    step1Submit: 'كمّل',
    step1Submitting: 'بنحفظ…',

    step2Title: 'وصلنا بياناتك ✓',
    step2Body: 'باقي شوية تفاصيل عشان نظبّط المسار المناسب لك ونتواصل معاك على الواتساب.',

    name: 'اسم الطالب ثلاثي',
    namePlaceholder: 'مثال: أحمد محمد علي',
    nameHint: 'بالعربي، ثلاثي',

    phone: 'رقم التليفون',
    phonePlaceholder: '01xxxxxxxxx',

    whatsapp: 'رقم الواتساب',
    whatsappHint: 'مش بيتنشر ولا بيتشارك مع حد',
    sameAsPhone: 'نفس رقم التليفون',

    grade: 'الصف',
    gradePlaceholder: 'اختار…',

    attendance: 'هتذاكر معانا إزاي؟',

    branch: 'أنهي فرع؟',
    branchPlaceholder: 'اختار الفرع…',

    heardFrom: 'عرفت عننا منين؟',
    heardFromPlaceholder: 'اختار…',

    note: 'اسألنا لو حابب (اختياري)',
    notePlaceholder: 'أي سؤال في بالك',

    submit: 'ابعت',
    submitting: 'بنبعت…',
    successTitle: 'وصلنا طلبك ✓',
    successBody: 'هنبعتلك رسالة تأكيد على الواتساب دلوقتي،',
    whatsappCta: 'أو كلّمنا على الواتساب دلوقتي',

    /**
     * The channel comes FIRST on the confirmation screen, above the "talk to
     * us" button. A student who has just booked does not have a question yet —
     * they have a wait. This gives that wait somewhere to go, and it is the
     * one moment on the site where a student is guaranteed to be paying
     * attention.
     */
    channelTitle: 'تابع القناة عشان توصلك كل الأخبار',
    channelBody:
      'المواعيد والمجموعات وأي تحديث بينزل هناك الأول. قناة إعلانات — إنت بتتابع بس، ورقمك مش بيظهر لحد.',
    channelCta: 'تابع القناة على واتساب',

    errorGeneric: 'حصلت مشكلة وإحنا بنبعت. جرّب تاني، أو كلّمنا على الواتساب.',
    errorNameEmpty: 'اكتب اسم الطالب من فضلك',
    errorNameArabic: 'اكتب الاسم بالعربي من فضلك',
    errorNameTriple: 'محتاجين الاسم ثلاثي (الاسم واسم الأب والجد)',
    errorPhone: 'اكتب رقم موبايل مصري صحيح (مثال: 01012345678)',
    errorWhatsapp: 'اكتب رقم واتساب مصري صحيح (مثال: 01012345678)',
    errorGrade: 'اختار الصف',
    errorAttendance: 'اختار أونلاين ولا سنتر',
    errorBranch: 'اختار الفرع',
    errorHeardFrom: 'اختار عرفت عننا منين',
  },
  footer: {
    rights: 'كل الحقوق محفوظة',
    privacy: 'الخصوصية',
    links: 'الحسابات الرسمية',
  },
  notFound: {
    title: 'الصفحة دي مش موجودة',
    body: 'يمكن الرابط اتغيّر أو اتكتب غلط. ترجع للصفحة الرئيسية؟',
    cta: 'الرئيسية',
  },
} as const
