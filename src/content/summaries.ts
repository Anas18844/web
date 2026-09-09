/**
 * الملخصات — lesson summaries.
 *
 * The revision page a student reads BEFORE the homework. It is the same lesson
 * the paper examines, which is why the two are wired to each other in both
 * directions: a summary ends by sending the reader to the homework, and the
 * homework's opening screen offers the summary to anyone who has not revised.
 *
 * Unlike `homework.ts` this file is NOT server-only — a summary has nothing to
 * hide. Every word of it is meant to be read.
 *
 * Content is stored as typed blocks rather than HTML. The source was a
 * standalone page with a dozen bespoke layouts; turning those into named block
 * types means the next lecture's summary is written as data, in this file, by
 * someone who does not have to touch a component to do it.
 */

export type SummaryImage = { src: string; width: number; height: number }

export type SummaryBlock =
  /** The one-sentence "الفكرة" that opens an axis. */
  | { t: 'idea'; x: string }
  | { t: 'p'; x: string }
  /** A titled box of prose. `tone: 'warn'` is the exam-trap callout. */
  | { t: 'card'; title?: string; body: readonly string[]; tone?: 'plain' | 'warn' }
  | { t: 'figure'; image: SummaryImage; caption: string; alt: string }
  /** Dated eras. `now` marks the stage we are living in. */
  | { t: 'timeline'; items: readonly { era: string; title: string; body: string; now?: boolean }[] }
  /** A numbered list where the number carries meaning (five social changes). */
  | { t: 'numbered'; items: readonly { title: string; body: string }[] }
  /** Two things compared side by side — bit vs qubit, AR vs VR. */
  | { t: 'compare'; items: readonly { badge: string; title: string; body: string }[] }
  /** A causal chain: smaller components → more of them → faster. */
  | { t: 'chain'; steps: readonly string[] }
  /** One number that carries the whole axis. */
  | { t: 'stat'; value: string; label: string; body: string }
  /** The Arabic/English glossary. */
  | { t: 'terms'; items: readonly { ar: string; en: string }[] }
  /** The closing story, with the arc as a strip. */
  | { t: 'closing'; title: string; body: string; flow: readonly string[] }

export type SummaryAxis = {
  id: string
  n: number
  title: string
  blocks: readonly SummaryBlock[]
}

export type Summary = {
  slug: string
  grade: 'first_sec' | 'second_bacc'
  lecture: string
  title: string
  lesson: string
  /** The question the whole lesson answers. */
  drivingQuestion: string
  meta: readonly string[]
  axes: readonly SummaryAxis[]
  /** The homework this summary prepares a student for. */
  homeworkSlug?: string
}

const IMG = '/images/homework/lecture-1'

/**
 * The summary and the homework are the same lecture, so they share one set of
 * images rather than shipping two compressed copies of the same twelve files.
 */
const img = (name: string, width: number, height: number): SummaryImage => ({
  src: `${IMG}/${name}.webp`,
  width,
  height,
})

const LECTURE_1: Summary = {
  slug: 'second-bacc-lecture-1',
  grade: 'second_bacc',
  lecture: 'المحاضرة الأولى',
  title: 'ملخص المحاضرة الأولى',
  lesson: 'تطوّر تكنولوجيا المعلومات والتحوّل الاجتماعي',
  drivingQuestion: 'إزاي كمبيوتر كان بيملأ أوضة كاملة… أصبح في جيبك؟',
  meta: ['ثانية بكالوريا', 'مسار الهندسة', 'دفعة ٢٠٢٧', 'الفصل الأول'],
  homeworkSlug: 'second-bacc-lecture-1',
  axes: [
    {
      id: 'history',
      n: 1,
      title: 'تاريخ تكنولوجيا المعلومات',
      blocks: [
        { t: 'idea', x: 'خمس مراحل، وكل مرحلة قرّبت الكمبيوتر من الإنسان أكتر.' },
        {
          t: 'figure',
          image: img('timeline', 1000, 356),
          alt: 'الخط الزمني لمراحل تطور تكنولوجيا المعلومات',
          caption: 'الخط الزمني — من الحواسيب العملاقة إلى الحوسبة السحابية',
        },
        {
          t: 'timeline',
          items: [
            {
              era: '١٩٤٠ — ١٩٦٠',
              title: 'حواسيب إلكترونية عملاقة بالصمامات المفرغة',
              body: 'منها ENIAC — تملأ غرفة كاملة، واستُخدمت في الأغراض العسكرية والحسابات العلمية.',
            },
            {
              era: '١٩٧٠ — ١٩٨٠',
              title: 'انتشار الحواسب الشخصية (PCs)',
              body: 'الكمبيوتر خرج من المؤسسات ودخل البيت — بداية استخدام الأفراد للحاسب.',
            },
            {
              era: 'التسعينيات',
              title: 'إتاحة الإنترنت للاستخدام التجاري وظهور الويب',
              body: 'الأجهزة اتكلّمت مع بعض — وصول عالمي للمعلومات، وظهور البريد الإلكتروني.',
            },
            {
              era: '٢٠٠٠ — ٢٠١٠',
              title: 'ظهور الهواتف الذكية',
              body: 'الإنترنت خرج من المكتب — انتشار سريع وواسع عبر الهواتف المحمولة.',
            },
            {
              era: '٢٠١٠ +',
              title: 'الحوسبة السحابية والبيانات الضخمة والذكاء الاصطناعي',
              body: 'تكنولوجيا المعلومات بقت خدمة تُقدَّم عبر الإنترنت.',
              now: true,
            },
          ],
        },
        {
          t: 'figure',
          image: img('eniac', 732, 1000),
          alt: 'حاسوب ENIAC',
          caption: 'ENIAC — أول الحواسيب الإلكترونية، كان يملأ غرفة كاملة',
        },
        {
          t: 'card',
          title: 'إيه هي «السحابة» بالظبط؟',
          body: [
            'الفيديو اللي بتتفرّج عليه على يوتيوب، والملف اللي على جوجل درايف — مش متخزّنين في جهازك.',
            'السحابة مش حاجة في السما: هي أجهزة حقيقية موجودة في مكان حقيقي، وإنت بتوصل لها عن طريق الإنترنت.',
          ],
        },
        {
          t: 'figure',
          image: img('cloud', 1000, 667),
          alt: 'الحوسبة السحابية',
          caption: 'من كتاب المدرسة — الحوسبة السحابية: تقديم موارد تكنولوجيا المعلومات كخدمة عبر الإنترنت',
        },
      ],
    },

    {
      id: 'moore',
      n: 2,
      title: 'قانون مور',
      blocks: [
        { t: 'idea', x: 'كل ما المكوّنات تصغر، نحط عدد أكبر، فالجهاز يبقى أسرع.' },
        {
          t: 'stat',
          value: '×٢',
          label: 'كل عامين تقريبًا',
          body: 'عدد الترانزستورات في الشريحة الواحدة كان بيتضاعف — وده اللي خلّى الكمبيوتر يطلع من الغرفة لجيبك.',
        },
        {
          t: 'figure',
          image: img('moore-curve', 816, 512),
          alt: 'منحنى قانون مور',
          caption: 'من كتاب المدرسة — الشكل ١.١.١: عدد الترانزستورات في الشريحة عبر الزمن',
        },
        { t: 'chain', steps: ['مكوّنات أصغر', 'عدد أكبر', 'سرعة أكبر'] },
        {
          t: 'figure',
          image: img('chips', 1000, 711),
          alt: 'صمام مفرغ وترانزستور ودائرة متكاملة',
          caption: 'صمّام مفرّغ ← ترانزستور ← دائرة متكاملة — ثلاثة أجيال من المكوّنات',
        },
        {
          t: 'card',
          title: 'الصعوبات',
          body: [
            'التصغير بيواجه صعوبات هندسية وعوائق فيزيائية — زي تيارات التسرّب والنفق الكمومي.',
          ],
        },
        {
          t: 'card',
          title: 'الحلول',
          body: [
            'تعدّد الأنوية والمعالجة على التوازي والتصميمات المتخصّصة — بدل ما نصغّر أكتر، بنشغّل أكتر من معالج مع بعض.',
          ],
        },
        {
          t: 'card',
          tone: 'warn',
          body: [
            'قانون مور ملاحظة لاتجاه تاريخي — وليس قانونًا فيزيائيًا ثابتًا. دي أكتر نقطة بتتسأل في الامتحان.',
          ],
        },
      ],
    },

    {
      id: 'social',
      n: 3,
      title: 'الاستخدامات — التغيّرات الاجتماعية',
      blocks: [
        {
          t: 'idea',
          x: 'التكنولوجيا ما غيّرتش الأجهزة بس — غيّرت طريقة تواصلنا وشغلنا وتعلّمنا ودفعنا.',
        },
        {
          t: 'figure',
          image: img('social-changes', 1000, 258),
          alt: 'التغيرات الاجتماعية الخمسة',
          caption: 'من كتاب المدرسة — خمسة تحوّلات مجتمعية أحدثتها تكنولوجيا المعلومات',
        },
        {
          t: 'numbered',
          items: [
            {
              title: 'شبكات التواصل الاجتماعي',
              body: 'منصّات تتيح للمستخدمين التواصل ونشر المحتوى ومشاركته بسرعة.',
            },
            {
              title: 'التجارة الإلكترونية',
              body: 'بيع السلع والخدمات وشراؤها عبر الإنترنت — مثل أمازون وإيباي.',
            },
            {
              title: 'العمل عن بُعد',
              body: 'أداء المهام من المنزل أو من موقع آخر بعيد باستخدام الإنترنت.',
            },
            {
              title: 'التعلّم عبر الإنترنت',
              body: 'تقديم الدروس والمواد التعليمية عبر الإنترنت.',
            },
            {
              title: 'الدفع غير النقدي',
              body: 'الدفع بالبطاقات المصرفية أو تطبيقات الهاتف أو رموز QR.',
            },
          ],
        },
        {
          t: 'figure',
          image: img('cashless', 1000, 911),
          alt: 'الدفع غير النقدي',
          caption: 'من كتاب المدرسة — الدفع بتطبيق الهاتف بدلًا من النقد',
        },
      ],
    },

    {
      id: 'emerging',
      n: 4,
      title: 'التقنيات الناشئة',
      blocks: [
        { t: 'idea', x: 'التكنولوجيا اللي بتتبني دلوقتي — وإجابة سؤال «إيه الخطوة الجاية؟»' },
        {
          t: 'card',
          title: 'القيادة الذاتية والحوسبة الطرفية',
          body: [
            'المركبة بتستخدم الذكاء الاصطناعي مع كاميرات ومستشعرات عشان تدرك محيطها وتاخد قرار القيادة.',
            'وعشان أي تأخير في القرار بيأثّر على السلامة، بعض البيانات بتتعالج على متن المركبة نفسها بدل إرسالها للسحابة — ودي الحوسبة الطرفية، الهدف منها تقليل زمن الاستجابة.',
          ],
        },
        {
          t: 'figure',
          image: img('edge-car', 1000, 500),
          alt: 'الحوسبة الطرفية في السيارة ذاتية القيادة',
          caption: 'من كتاب المدرسة — السيارة تتخذ قرارها على متنها دون انتظار السحابة',
        },
        {
          t: 'compare',
          items: [
            {
              badge: 'AR',
              title: 'الواقع المعزَّز',
              body: 'يضيف عناصر أو معلومات رقمية فوق مشهد من العالم الحقيقي.',
            },
            {
              badge: 'VR',
              title: 'الواقع الافتراضي',
              body: 'يضع المستخدم داخل بيئة افتراضية مولَّدة بالحاسب بالكامل.',
            },
          ],
        },
        {
          t: 'figure',
          image: img('ar-vr', 1000, 464),
          alt: 'الفرق بين الواقع المعزز والواقع الافتراضي',
          caption: 'من كتاب المدرسة — الفرق: المعزَّز يضيف للحقيقي، والافتراضي يستبدله بالكامل',
        },
      ],
    },

    {
      id: 'quantum',
      n: 5,
      title: 'الحوسبة الكمومية',
      blocks: [
        { t: 'idea', x: 'نهج حوسبي مختلف تمامًا، بيستخدم خصائص ميكانيكا الكم.' },
        {
          t: 'figure',
          image: img('bit-qubit', 1000, 436),
          alt: 'مقارنة البت التقليدي بالكيوبت',
          caption: 'من كتاب المدرسة — البت الكلاسيكي مقابل الكيوبت',
        },
        {
          t: 'compare',
          items: [
            {
              badge: 'Bit',
              title: 'البت التقليدي',
              body: 'يحمل حالة واحدة في كل وقت — إما ٠ وإما ١.',
            },
            {
              badge: 'Qubit',
              title: 'الكيوبت',
              body: 'يستخدم مبدأ التراكب الكمومي — ٠ و١ في الوقت نفسه.',
            },
          ],
        },
        {
          t: 'card',
          tone: 'warn',
          body: [
            'الحوسبة الكمومية ليست بديلًا عامًا لكل الحواسيب التقليدية — قد تفيد في فئات محدَّدة من المسائل، ولا تُسرّع جميع أنواع الحسابات.',
          ],
        },
      ],
    },

    {
      id: 'closing',
      n: 6,
      title: 'الخلاصة',
      blocks: [
        {
          t: 'closing',
          title: 'قصة واحدة',
          body: 'الدرس مش مجموعة مصطلحات. في كل مرحلة أضافت تكنولوجيا المعلومات جهازًا جديدًا، وغيّرت معه طريقة تواصل المجتمع وعمله وتجارته. الكمبيوتر كان بعيد عن الإنسان — وكل مرحلة قرّبته منه أكتر.',
          flow: ['غرفة كاملة', 'كمبيوتر شخصي', 'إنترنت', 'في جيبك', 'في كل مكان'],
        },
        {
          t: 'terms',
          items: [
            { ar: 'قانون مور', en: "Moore's Law" },
            { ar: 'الترانزستور', en: 'Transistor' },
            { ar: 'الدائرة المتكاملة', en: 'Integrated Circuit' },
            { ar: 'الصمام المفرّغ', en: 'Vacuum Tube' },
            { ar: 'النفق الكمومي', en: 'Quantum Tunneling' },
            { ar: 'الحوسبة السحابية', en: 'Cloud Computing' },
            { ar: 'شبكات التواصل الاجتماعي', en: 'Social Networking Services (SNS)' },
            { ar: 'التجارة الإلكترونية', en: 'E-commerce' },
            { ar: 'العمل عن بُعد', en: 'Remote Work' },
            { ar: 'التعلّم عبر الإنترنت', en: 'Online Learning' },
            { ar: 'الدفع غير النقدي', en: 'Cashless Payment' },
            { ar: 'القيادة الذاتية', en: 'Self-Driving' },
            { ar: 'الحوسبة الطرفية', en: 'Edge Computing' },
            { ar: 'الواقع المعزَّز', en: 'Augmented Reality (AR)' },
            { ar: 'الواقع الافتراضي', en: 'Virtual Reality (VR)' },
            { ar: 'الحوسبة الكمومية', en: 'Quantum Computing' },
            { ar: 'الكيوبت / التراكب الكمومي', en: 'Qubit / Superposition' },
          ],
        },
      ],
    },
  ],
}

/**
 * ── المحاضرة الثانية — كيف يعمل الذكاء الاصطناعي ──────────────────────────
 *
 * Mapped from the lesson's own content.js onto the block types above; every
 * string is the source's, only the shape changed. It needed no new block type,
 * which is the point of having them: the lecture was written by someone who
 * never opened this file, and it still fits.
 */
const LECTURE_2: Summary = {
  slug: 'second-bacc-lecture-2',
  grade: 'second_bacc',
  lecture: 'المحاضرة الثانية',
  title: 'ملخص المحاضرة الثانية',
  lesson: "كيف يعمل الذكاء الاصطناعي",
  drivingQuestion: "هل ChatGPT هو الذكاء الاصطناعي؟",
  meta: ["الوحدة الأولى · تكنولوجيا المعلومات والمجتمع","الصف الثاني بكالوريا","كتاب الوزارة · الجزء الأول · ص 12 ← 17"],
  homeworkSlug: 'second-bacc-lecture-2',
  axes: [
      {
          "id": "ai",
          "n": 1,
          "title": "الذكاء الاصطناعي",
          "blocks": [
              {
                  "t": "idea",
                  "x": "مجال يضم أنظمة حاسوبية تستطيع تنفيذ مهام كان يقوم بها الإنسان."
              },
              {
                  "t": "card",
                  "title": "AI يقدر يعمل إيه؟ — خمس مهام",
                  "body": [
                      "📊 التعلّم من البيانات",
                      "📈 التنبؤ",
                      "👁️ التعرّف",
                      "✨ توليد المحتوى",
                      "⚖️ اتخاذ القرارات أو دعمها"
                  ]
              },
              {
                  "t": "p",
                  "x": "أمثلة: التعرّف على الكلام والصور، والترجمة."
              },
              {
                  "t": "card",
                  "title": "مهم",
                  "body": [
                      "معظم أنظمة الذكاء الاصطناعي الحالية ضيّقة النطاق — مصمَّمة لمهمة محدَّدة أو مجموعة محدودة من المهام. مش لكل حاجة."
                  ],
                  "tone": "warn"
              },
              {
                  "t": "p",
                  "x": "هل كل أنظمة الذكاء الاصطناعي بتشتغل بنفس الطريقة؟"
              }
          ]
      },
      {
          "id": "map",
          "n": 2,
          "title": "قبل ما نفكّك… شوف الصورة الكبيرة",
          "blocks": [
              {
                  "t": "terms",
                  "items": [
                      {
                          "ar": "الذكاء الاصطناعي",
                          "en": "AI"
                      },
                      {
                          "ar": "التعلّم الآلي",
                          "en": "ML"
                      },
                      {
                          "ar": "التعلم العميق",
                          "en": "DL"
                      },
                      {
                          "ar": "التوليدي",
                          "en": "GenAI"
                      }
                  ]
              },
              {
                  "t": "p",
                  "x": "الشكل 1.2.1 — من الأوسع ← إلى الأكثر تخصصًا"
              }
          ]
      },
      {
          "id": "ml",
          "n": 3,
          "title": "التعلّم الآلي",
          "blocks": [
              {
                  "t": "p",
                  "x": "Machine Learning — ML"
              },
              {
                  "t": "p",
                  "x": "بدل ما أقول للكمبيوتر كل حاجة… لو خليته يتعلّم؟"
              },
              {
                  "t": "idea",
                  "x": "فرع من الذكاء الاصطناعي تتعلّم فيه النماذج أنماطًا من البيانات لإجراء تنبؤات أو تصنيفات أو دعم قرارات، بدلًا من برمجة كل قاعدة صراحةً."
              },
              {
                  "t": "compare",
                  "items": [
                      {
                          "badge": "📋",
                          "title": "قواعد مبرمَجة صراحةً",
                          "body": "أنا أكتب كل قاعدة بإيدي"
                      },
                      {
                          "badge": "🔍",
                          "title": "أنماط يتعلّمها النموذج",
                          "body": "هو يستنتجها من البيانات"
                      }
                  ]
              },
              {
                  "t": "card",
                  "title": "مثالان من الكتاب",
                  "body": [
                      "🚫 تصنيف الرسائل المزعجة",
                      "🛒 توصية المنتجات"
                  ]
              },
              {
                  "t": "numbered",
                  "items": [
                      {
                          "title": "بيانات",
                          "body": "أمثلة كتير سابقة"
                      },
                      {
                          "title": "أنماط",
                          "body": "يستنتج المشترك بينها"
                      },
                      {
                          "title": "تنبؤ / تصنيف",
                          "body": "يحكم على حالة جديدة"
                      }
                  ]
              }
          ]
      },
      {
          "id": "dl",
          "n": 4,
          "title": "التعلم العميق",
          "blocks": [
              {
                  "t": "p",
                  "x": "Deep Learning — DL"
              },
              {
                  "t": "p",
                  "x": "طيب لو البيانات بقت أعقد من كده؟"
              },
              {
                  "t": "card",
                  "body": [
                      "🖼️ صور  ·  🔊 صوت  ·  💬 لغة  ·  🎬 فيديو"
                  ]
              },
              {
                  "t": "idea",
                  "x": "أسلوب من أساليب التعلّم الآلي — مش حاجة منفصلة عنه. يعتمد على شبكات عصبية متعددة الطبقات، ويمكنه تعلّم تمثيلات أو أنماط معقّدة من البيانات."
              },
              {
                  "t": "stat",
                  "value": "DL ⊂ ML",
                  "label": "العلاقة",
                  "body": "التعلم العميق أسلوب داخل التعلّم الآلي، مش مجال منفصل عنه."
              },
              {
                  "t": "card",
                  "title": "الشبكة العصبية الاصطناعية — Artificial Neural Network — ANN",
                  "body": [
                      "نموذج حاسوبي مستوحى بصورة مبسّطة من فكرة ترابط العصبونات. أجزاء بسيطة جدًا مترابطة في طبقات، وأوزان الوحدات بتتغيّر أثناء التدريب عشان تتعلّم الأنماط من البيانات.",
                      "تحليل صور الأشعة."
                  ]
              },
              {
                  "t": "p",
                  "x": "أمثلة: تحليل الصور، والتعرّف على الكلام."
              },
              {
                  "t": "card",
                  "title": "ليه AI ممكن يتلخبط في حاجة نادرًا ما شافها في بياناته؟",
                  "body": [
                      "لأن التعلم العميق بيحتاج بيانات كبيرة نسبيًا عشان يتعلّم أنماطًا موثوقة."
                  ]
              }
          ]
      },
      {
          "id": "genai",
          "n": 5,
          "title": "الذكاء الاصطناعي التوليدي",
          "blocks": [
              {
                  "t": "p",
                  "x": "Generative AI — GenAI"
              },
              {
                  "t": "p",
                  "x": "فاكرين السؤال؟ طيب ChatGPT بقى فين؟ دلوقتي بقى عندك الخريطة — حطّه بنفسك."
              },
              {
                  "t": "idea",
                  "x": "أنظمة تُنشئ محتوى جديدًا اعتمادًا على الأنماط اللي اتعلّمتها من بيانات التدريب. وغالبية أنظمته الحديثة بتعتمد على نماذج التعلم العميق."
              },
              {
                  "t": "card",
                  "title": "مش نصوص بس — بيولّد أنواع محتوى مختلفة",
                  "body": [
                      "📝 نصوص",
                      "🖼️ صور",
                      "🔊 صوت",
                      "💻 برمجيات"
                  ]
              },
              {
                  "t": "p",
                  "x": "أمثلة: ChatGPT، وأدوات توليد الصور."
              }
          ]
      },
      {
          "id": "hallucination",
          "n": 6,
          "title": "هل AI دايمًا بيقول الحقيقة؟",
          "blocks": [
              {
                  "t": "idea",
                  "x": "ممكن يكون واثق… وغلط"
              },
              {
                  "t": "p",
                  "x": "الهلوسة — نص يبدو معقولًا لكنه غير صحيح في الواقع."
              },
              {
                  "t": "numbered",
                  "items": [
                      {
                          "title": "Generate",
                          "body": "خُد الناتج"
                      },
                      {
                          "title": "Check",
                          "body": "اقراه واسأل: منطقي؟"
                      },
                      {
                          "title": "Verify",
                          "body": "أكّده من مصدر موثوق"
                      }
                  ]
              },
              {
                  "t": "card",
                  "title": "ليه خطر إنك تسلّم تقرير مدرسي من غير ما تتأكد؟ وإيه اللي المفروض تعمله بدل كده؟",
                  "body": [
                      "سؤال مفتوح — جاوبه بنفسك قبل ما تكمّل."
                  ],
                  "tone": "warn"
              }
          ]
      },
      {
          "id": "wrap",
          "n": 7,
          "title": "اربط الصورة كلها",
          "blocks": [
              {
                  "t": "compare",
                  "items": [
                      {
                          "badge": "AI",
                          "title": "الذكاء الاصطناعي",
                          "body": "المجال الواسع"
                      },
                      {
                          "badge": "ML",
                          "title": "التعلّم الآلي",
                          "body": "فرع منه"
                      },
                      {
                          "badge": "DL",
                          "title": "التعلم العميق",
                          "body": "أسلوب داخل ML"
                      },
                      {
                          "badge": "GenAI",
                          "title": "التوليدي",
                          "body": "غالبًا يعتمد على DL"
                      }
                  ]
              },
              {
                  "t": "card",
                  "title": "خمسة مصطلحات تخرج بيها",
                  "body": [
                      "الذكاء الاصطناعي — AI · مجال يضم أنظمة تنفّذ مهامًا ذكية",
                      "التعلّم الآلي — ML · يتعلّم الأنماط من البيانات",
                      "التعلم العميق — DL · شبكات عصبية متعددة الطبقات",
                      "الشبكة العصبية — ANN · وحدات مترابطة تتغيّر أوزانها",
                      "التوليدي — GenAI · يُنشئ محتوى جديدًا",
                      "الهلوسة — ناتج يبدو معقولًا لكنه غير صحيح"
                  ]
              },
              {
                  "t": "card",
                  "title": "احترس — أربعة أخطاء بتتكرر في الامتحان",
                  "body": [
                      "التعلم العميق ليس منفصلًا عن التعلّم الآلي — بل نوع منه",
                      "الذكاء الاصطناعي والتعلّم الآلي ليس لهما المعنى نفسه",
                      "مرشِّح الرسائل المزعجة ليس مثالًا على الذكاء الاصطناعي التوليدي",
                      "العلاقة بين المفاهيم مبسّطة — وليست تسلسلًا صارمًا في كل حالة"
                  ],
                  "tone": "warn"
              },
              {
                  "t": "closing",
                  "title": "نرجع للسؤال الأول… تقدر تجاوب دلوقتي؟",
                  "body": "لو جاوبت على دول كلهم، الدرس خلص معاك.",
                  "flow": [
                      "إيه الفرق بين البرمجة والذكاء الاصطناعي؟",
                      "هل ChatGPT هو الذكاء الاصطناعي؟",
                      "طيب ChatGPT إيه بالظبط؟",
                      "ML فين على الخريطة؟",
                      "وDL فين؟",
                      "وليه لازم نتحقق من إجابات AI؟"
                  ]
              }
          ]
      }
  ],
}

export const SUMMARIES: readonly Summary[] = [LECTURE_1, LECTURE_2]

export function findSummary(slug: string): Summary | undefined {
  return SUMMARIES.find((s) => s.slug === slug)
}

export function summariesFor(grade: Summary['grade']): readonly Summary[] {
  return SUMMARIES.filter((s) => s.grade === grade)
}

/** The summary that prepares a student for a given homework, if there is one. */
export function summaryForHomework(homeworkSlug: string): Summary | undefined {
  return SUMMARIES.find((s) => s.homeworkSlug === homeworkSlug)
}
