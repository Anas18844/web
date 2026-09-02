import 'server-only'

/**
 * الواجبات — the homework bank.
 *
 * ⚠️ `server-only` is the whole security model of this file.
 *
 * It holds the CORRECT ANSWERS. If it were ever imported into a client
 * component the build would fail — which is the point, because the alternative
 * is a student opening devtools and reading `answer: 2` off every question. The
 * original standalone page shipped the answers to the browser and its own
 * README flagged that as the first thing to fix before going near a platform.
 *
 * So: the page component reads this on the SERVER, strips the answers with
 * `toPublic()`, and sends only what is needed to draw the paper. Marking also
 * happens on the server. The browser never holds a key to this exam.
 */

export type HomeworkImage = { src: string; width: number; height: number }

export type McqQuestion = {
  id: number
  level: 'easy' | 'mid' | 'hard'
  axis: string
  image?: HomeworkImage
  q: string
  options: readonly string[]
  /** ⚠️ Never leaves the server before a student has submitted. */
  answer: number
}

export type EssayQuestion = {
  id: number
  axis: string
  q: string
  /** ⚠️ Never leaves the server before a student has submitted. */
  model: string
}

export type Homework = {
  slug: string
  grade: 'first_sec' | 'second_bacc'
  lecture: string
  title: string
  lesson: string
  /** Marks needed to pass, out of `totalMarks`. */
  passMark: number
  /** Essay answers longer than this are a sign the student misread the task. */
  maxWords: number
  mcq: readonly McqQuestion[]
  essay: readonly EssayQuestion[]
}

/** MCQ are one mark each; essays are two. 30 + 20 = 50. */
export const ESSAY_MARK = 2

export function totalMarks(hw: Homework): number {
  return hw.mcq.length + hw.essay.length * ESSAY_MARK
}

const LECTURE_1_MCQ: readonly McqQuestion[] = [
  {
    id: 1,
    level: 'easy',
    axis: 'التاريخ',
    image: { src: '/images/homework/lecture-1/eniac.webp', width: 732, height: 1000 },
    q: 'في أي فترة زمنية ظهرت الحواسيب الإلكترونية ومنها ENIAC؟',
    options: [
      'الأربعينيات – الستينيات',
      'السبعينيات – الثمانينيات',
      'التسعينيات',
      'العقد الأول من الألفية',
    ],
    answer: 0,
  },
  {
    id: 2,
    level: 'easy',
    axis: 'التاريخ',
    image: { src: '/images/homework/lecture-1/mainframe.webp', width: 1000, height: 666 },
    q: 'ما التقنية التي اعتمدت عليها الحواسيب الأولى؟',
    options: [
      'الدوائر المتكاملة',
      'الصمامات المفرغة',
      'الترانزستورات',
      'المعالجات متعددة الأنوية',
    ],
    answer: 1,
  },
  {
    id: 3,
    level: 'easy',
    axis: 'التاريخ',
    q: 'استُخدمت الحواسيب الأولى أساسًا في:',
    options: [
      'الألعاب والترفيه',
      'التجارة الإلكترونية',
      'الأغراض العسكرية والحسابات العلمية',
      'شبكات التواصل الاجتماعي',
    ],
    answer: 2,
  },
  {
    id: 4,
    level: 'easy',
    axis: 'التاريخ',
    q: 'في أي فترة انتشرت الحواسب الشخصية (PCs)؟',
    options: [
      'الأربعينيات – الستينيات',
      'السبعينيات – الثمانينيات',
      'التسعينيات',
      'من العقد الثاني من الألفية',
    ],
    answer: 1,
  },
  {
    id: 5,
    level: 'easy',
    axis: 'التاريخ',
    q: 'ما أبرز ما حدث في التسعينيات؟',
    options: [
      'ظهور الهواتف الذكية',
      'انتشار الحوسبة السحابية',
      'إتاحة الإنترنت للاستخدام التجاري وظهور الويب',
      'ظهور الصمامات المفرغة',
    ],
    answer: 2,
  },
  {
    id: 6,
    level: 'easy',
    axis: 'التاريخ',
    q: 'ما الذي ظهر في العقد الأول من الألفية؟',
    options: [
      'الحواسب الشخصية',
      'الهواتف الذكية',
      'الحوسبة الكمومية',
      'البريد الإلكتروني',
    ],
    answer: 1,
  },
  {
    id: 7,
    level: 'easy',
    axis: 'التاريخ',
    image: { src: '/images/homework/lecture-1/cloud.webp', width: 1000, height: 667 },
    q: 'ما الذي انتشر من العقد الثاني من الألفية فصاعدًا؟',
    options: [
      'الصمامات المفرغة',
      'الحواسب الشخصية',
      'الحوسبة السحابية وتحليل البيانات الضخمة',
      'الويب التجاري',
    ],
    answer: 2,
  },
  {
    id: 8,
    level: 'easy',
    axis: 'قانون مور',
    image: { src: '/images/homework/lecture-1/moore-curve.webp', width: 816, height: 512 },
    q: 'ينص قانون مور على أن عدد الترانزستورات في الشريحة يتضاعف تقريبًا كل:',
    options: [
      'ستة أشهر',
      'عام واحد',
      'عامين',
      'عشرة أعوام',
    ],
    answer: 2,
  },
  {
    id: 9,
    level: 'easy',
    axis: 'التاريخ',
    image: { src: '/images/homework/lecture-1/cloud.webp', width: 1000, height: 667 },
    q: 'الحوسبة السحابية هي:',
    options: [
      'تخزين الملفات على القرص الصلب فقط',
      'تكنولوجيا المعلومات المقدَّمة كخدمة عبر الإنترنت',
      'نوع من الصمامات المفرغة',
      'شبكة داخلية لا تتصل بالإنترنت',
    ],
    answer: 1,
  },
  {
    id: 10,
    level: 'easy',
    axis: 'التغيرات الاجتماعية',
    image: { src: '/images/homework/lecture-1/social-changes.webp', width: 1000, height: 258 },
    q: 'التجارة الإلكترونية تعني:',
    options: [
      'شراء السلع من المتاجر الفعلية نقدًا',
      'بيع السلع والخدمات وشراؤها عبر الإنترنت',
      'تصنيع الأجهزة الإلكترونية',
      'تبادل الرسائل بين المستخدمين',
    ],
    answer: 1,
  },
  {
    id: 11,
    level: 'easy',
    axis: 'التغيرات الاجتماعية',
    q: 'العمل عن بُعد هو نمط عمل يؤدي فيه الشخص مهامه:',
    options: [
      'داخل مقر الشركة فقط',
      'من المنزل أو موقع آخر بعيد باستخدام الإنترنت',
      'في فترات مسائية فقط',
      'بدون استخدام أي أجهزة',
    ],
    answer: 1,
  },
  {
    id: 12,
    level: 'easy',
    axis: 'التغيرات الاجتماعية',
    q: 'التعلُّم عبر الإنترنت نمط تعليمي تُقدَّم فيه:',
    options: [
      'الدروس والمواد التعليمية عبر الإنترنت',
      'الكتب الورقية فقط',
      'الحصص داخل الفصل فقط',
      'الامتحانات الشفوية فقط',
    ],
    answer: 0,
  },
  {
    id: 13,
    level: 'easy',
    axis: 'التغيرات الاجتماعية',
    image: { src: '/images/homework/lecture-1/cashless.webp', width: 1000, height: 911 },
    q: 'الدفع غير النقدي يتم بوسائل مثل:',
    options: [
      'العملات المعدنية والورقية',
      'البطاقات المصرفية وتطبيقات الهاتف ورموز QR',
      'الشيكات الورقية فقط',
      'المقايضة',
    ],
    answer: 1,
  },
  {
    id: 14,
    level: 'easy',
    axis: 'التقنيات الناشئة',
    image: { src: '/images/homework/lecture-1/edge-car.webp', width: 1000, height: 500 },
    q: 'الحوسبة الطرفية هي معالجة البيانات:',
    options: [
      'على الجهاز نفسه فورًا بدلًا من إرسالها إلى السحابة',
      'في مراكز بيانات بعيدة فقط',
      'بعد انتهاء اليوم',
      'يدويًا بواسطة المستخدم',
    ],
    answer: 0,
  },
  {
    id: 15,
    level: 'easy',
    axis: 'التقنيات الناشئة',
    image: { src: '/images/homework/lecture-1/ar-vr.webp', width: 1000, height: 464 },
    q: 'الواقع المعزَّز (AR) تقنية:',
    options: [
      'تضع المستخدم داخل بيئة افتراضية كاملة',
      'تضيف عناصر أو معلومات رقمية إلى مشهد من العالم الحقيقي',
      'تُستخدم في الحوسبة الكمومية',
      'تُلغي الحاجة إلى الإنترنت',
    ],
    answer: 1,
  },
  {
    id: 16,
    level: 'mid',
    axis: 'التاريخ',
    image: { src: '/images/homework/lecture-1/timeline.webp', width: 1000, height: 356 },
    q: 'اختر الترتيب الزمني الصحيح لمراحل تطور تكنولوجيا المعلومات:',
    options: [
      'ظهور الحاسب ← تسويق الإنترنت تجاريًا ← الهواتف الذكية ← الحوسبة السحابية',
      'تسويق الإنترنت تجاريًا ← ظهور الحاسب ← الحوسبة السحابية ← الهواتف الذكية',
      'الهواتف الذكية ← تسويق الإنترنت تجاريًا ← ظهور الحاسب ← الحوسبة السحابية',
      'ظهور الحاسب ← الهواتف الذكية ← تسويق الإنترنت تجاريًا ← الحوسبة السحابية',
    ],
    answer: 0,
  },
  {
    id: 17,
    level: 'mid',
    axis: 'التاريخ',
    q: 'ماذا تعني «السحابة» في الحقيقة؟',
    options: [
      'سحابة فعلية في السماء',
      'برنامج مثبَّت على جهازك',
      'أجهزة حقيقية موجودة في مكان حقيقي تصل إليها عبر الإنترنت',
      'شبكة لاسلكية داخل المنزل',
    ],
    answer: 2,
  },
  {
    id: 18,
    level: 'mid',
    axis: 'التقنيات الناشئة',
    image: { src: '/images/homework/lecture-1/ar-vr.webp', width: 1000, height: 464 },
    q: 'ما الفرق الجوهري بين الواقع المعزَّز والواقع الافتراضي؟',
    options: [
      'المعزَّز يضيف عناصر رقمية للعالم الحقيقي، والافتراضي يضع المستخدم في بيئة رقمية كاملة',
      'المعزَّز يحتاج إنترنت والافتراضي لا يحتاج',
      'الافتراضي أرخص من المعزَّز',
      'لا يوجد فرق بينهما',
    ],
    answer: 0,
  },
  {
    id: 19,
    level: 'mid',
    axis: 'الحوسبة الكمومية',
    image: { src: '/images/homework/lecture-1/bit-qubit.webp', width: 1000, height: 436 },
    q: 'من الشكل: البت التقليدي يحمل:',
    options: [
      'حالتين في الوقت نفسه',
      'حالة واحدة في كل وقت',
      'ثلاث حالات',
      'لا يحمل أي حالة',
    ],
    answer: 1,
  },
  {
    id: 20,
    level: 'mid',
    axis: 'الحوسبة الكمومية',
    image: { src: '/images/homework/lecture-1/bit-qubit.webp', width: 1000, height: 436 },
    q: 'الكيوبت (qubit) يستخدم مبدأ:',
    options: [
      'التسارع الخطي',
      'التراكب الكمومي',
      'الاستقراء الرياضي',
      'النفق الضوئي',
    ],
    answer: 1,
  },
  {
    id: 21,
    level: 'mid',
    axis: 'التغيرات الاجتماعية',
    image: { src: '/images/homework/lecture-1/social-changes.webp', width: 1000, height: 258 },
    q: 'أيٌّ مما يلي ليس من التغيرات الاجتماعية الخمسة التي ذكرها الدرس؟',
    options: [
      'شبكات التواصل الاجتماعي',
      'التجارة الإلكترونية',
      'الحوسبة الكمومية',
      'الدفع غير النقدي',
    ],
    answer: 2,
  },
  {
    id: 22,
    level: 'mid',
    axis: 'قانون مور',
    image: { src: '/images/homework/lecture-1/chips.webp', width: 1000, height: 711 },
    q: 'ما الذي أبطأ الاتجاه الذي وصفه قانون مور؟',
    options: [
      'قلة الطلب على الحواسيب',
      'تحديات هندسية وفيزيائية مثل تيارات التسرب والنفق الكمومي',
      'ارتفاع أسعار الإنترنت',
      'انتشار الهواتف الذكية',
    ],
    answer: 1,
  },
  {
    id: 23,
    level: 'mid',
    axis: 'قانون مور',
    q: 'مع صعوبة الاستمرار في التصغير، أصبح تحسين الأداء يعتمد على:',
    options: [
      'زيادة حجم الشريحة فقط',
      'تعدد الأنوية والمعالجة المتوازية والتصميمات المتخصصة',
      'إلغاء الترانزستورات',
      'استخدام الصمامات المفرغة مجددًا',
    ],
    answer: 1,
  },
  {
    id: 24,
    level: 'mid',
    axis: 'التقنيات الناشئة',
    image: { src: '/images/homework/lecture-1/edge-car.webp', width: 1000, height: 500 },
    q: 'لماذا تعالج السيارة ذاتية القيادة بعض البيانات على متنها؟',
    options: [
      'لتوفير تكلفة الإنترنت',
      'لأن التأخير في معالجة بيانات القيادة قد يؤثر في السلامة',
      'لأنها لا تستطيع الاتصال بالإنترنت',
      'لتخزين البيانات مدة أطول',
    ],
    answer: 1,
  },
  {
    id: 25,
    level: 'hard',
    axis: 'قانون مور',
    image: { src: '/images/homework/lecture-1/moore-curve.webp', width: 816, height: 512 },
    q: 'أيٌّ من العبارات التالية عن قانون مور صحيح؟',
    options: [
      'قانون فيزيائي ثابت لا يتغير',
      'ملاحظة تجريبية لاتجاه تاريخي وليس قانونًا فيزيائيًا ثابتًا',
      'قانون صادر عن وزارة التربية والتعليم',
      'معادلة رياضية تحسب سرعة الإنترنت',
    ],
    answer: 1,
  },
  {
    id: 26,
    level: 'hard',
    axis: 'الحوسبة الكمومية',
    q: 'أيٌّ من العبارات التالية عن الحوسبة الكمومية غير صحيح؟',
    options: [
      'نهج حوسبي يستخدم خصائص ميكانيكا الكم',
      'قد توفر تفوقًا في فئات محددة من المسائل',
      'بديل عام يحل محل جميع الحواسيب التقليدية',
      'لا تُسرّع جميع أنواع الحسابات',
    ],
    answer: 2,
  },
  {
    id: 27,
    level: 'hard',
    axis: 'التغيرات الاجتماعية',
    q: 'قرية لم يكن فيها اتصال بالإنترنت، ثم أصبحت خدمات الدفع بتطبيقات الهاتف متاحة فيها. أي تغيّر اجتماعي حدث؟',
    options: [
      'التعلم عبر الإنترنت',
      'الدفع غير النقدي',
      'العمل عن بُعد',
      'الواقع الافتراضي',
    ],
    answer: 1,
  },
  {
    id: 28,
    level: 'hard',
    axis: 'قانون مور',
    image: { src: '/images/homework/lecture-1/moore-curve.webp', width: 816, height: 512 },
    q: 'بالنظر إلى الشكل، ماذا يمثل المحور الرأسي؟',
    options: [
      'سعر المعالج بالدولار',
      'عدد الترانزستورات في الشريحة',
      'سرعة الإنترنت',
      'عدد المستخدمين',
    ],
    answer: 1,
  },
  {
    id: 29,
    level: 'hard',
    axis: 'التقنيات الناشئة',
    q: 'طالب يرتدي نظارة ترى الفصل الحقيقي أمامه وتُظهر فوقه معلومات رقمية عن الدرس. ما التقنية المستخدمة؟',
    options: [
      'الواقع الافتراضي (VR)',
      'الواقع المعزَّز (AR)',
      'الحوسبة الكمومية',
      'الحوسبة السحابية',
    ],
    answer: 1,
  },
  {
    id: 30,
    level: 'hard',
    axis: 'التاريخ',
    q: 'ما الفكرة الرئيسة التي يربط بها الدرس مراحل تطور تكنولوجيا المعلومات؟',
    options: [
      'كل مرحلة ألغت المرحلة التي قبلها',
      'في كل مرحلة أضافت تكنولوجيا المعلومات جهازًا جديدًا وغيّرت معه طريقة تواصل المجتمع وعمله وتجارته',
      'التطور اقتصر على زيادة سرعة الأجهزة فقط',
      'التطور لم يؤثر في المجتمع',
    ],
    answer: 1,
  },]

const LECTURE_1_ESSAY: readonly EssayQuestion[] = [
  {
    id: 1,
    axis: 'قانون مور',
    q: 'ما اسم الملاحظة التجريبية القائلة إن عدد الترانزستورات في الدائرة المتكاملة يتضاعف تقريبًا كل عامين؟',
    model: 'قانون مور',
  },
  {
    id: 2,
    axis: 'التغيرات الاجتماعية',
    q: 'ما المصطلح الذي يشير إلى بيع السلع والخدمات وشرائها عبر الإنترنت؟',
    model: 'التجارة الإلكترونية',
  },
  {
    id: 3,
    axis: 'التغيرات الاجتماعية',
    q: 'ما المصطلح الذي يصف أداء الشخص عمله من المنزل أو من موقع بعيد عبر الإنترنت؟',
    model: 'العمل عن بُعد',
  },
  {
    id: 4,
    axis: 'التغيرات الاجتماعية',
    q: 'ما المصطلح الذي يشير إلى إجراء المدفوعات بالبطاقات ورموز QR دون استخدام النقد؟',
    model: 'الدفع غير النقدي',
  },
  {
    id: 5,
    axis: 'التقنيات الناشئة',
    q: 'ما المصطلح الذي يشير إلى التقنية التي تستخدم الذكاء الاصطناعي لقيادة مركبة بأقل تدخل بشري؟',
    model: 'القيادة الذاتية',
  },
  {
    id: 6,
    axis: 'التقنيات الناشئة',
    q: 'ما المصطلح الذي يعني معالجة البيانات على الجهاز نفسه فورًا بدلًا من إرسالها إلى السحابة؟',
    model: 'الحوسبة الطرفية',
  },
  {
    id: 7,
    axis: 'الحوسبة الكمومية',
    q: 'ما الخصائص التي تستخدمها الحوسبة الكمومية لمعالجة المعلومات؟',
    model: 'خصائص ميكانيكا الكم',
  },
  {
    id: 8,
    axis: 'التاريخ',
    q: 'ما التقنية التي استُخدمت في الحواسيب الإلكترونية الأولى مثل ENIAC؟',
    model: 'الصمامات المفرغة',
  },
  {
    id: 9,
    axis: 'التاريخ',
    q: 'إلى جانب الوصول العالمي إلى المعلومات، ما الخدمة التي انتشرت مع الإنترنت في التسعينيات؟',
    model: 'البريد الإلكتروني',
  },
  {
    id: 10,
    axis: 'الحوسبة الكمومية',
    q: 'ما المبدأ الذي يستخدمه الكيوبت وليس البت التقليدي؟',
    model: 'مبدأ التراكب الكمومي',
  },]

/**
 * Every assignment on the site.
 *
 * A grade with no assignment yet simply has no entry — the index page says so
 * plainly rather than showing an empty card that looks broken.
 */
export const HOMEWORK: readonly Homework[] = [
  {
    slug: 'second-bacc-lecture-1',
    grade: 'second_bacc',
    lecture: 'المحاضرة الأولى',
    title: 'واجب المحاضرة الأولى',
    lesson: 'تطور تكنولوجيا المعلومات والتحول الاجتماعي',
    passMark: 25,
    maxWords: 7,
    mcq: LECTURE_1_MCQ,
    essay: LECTURE_1_ESSAY,
  },
]

export function findHomework(slug: string): Homework | undefined {
  return HOMEWORK.find((h) => h.slug === slug)
}

export function homeworkFor(grade: Homework['grade']): readonly Homework[] {
  return HOMEWORK.filter((h) => h.grade === grade)
}

// ── The public projection ────────────────────────────────────────────────────

export type PublicMcq = Omit<McqQuestion, 'answer'>
export type PublicEssay = Omit<EssayQuestion, 'model'>

export type PublicHomework = {
  slug: string
  grade: Homework['grade']
  lecture: string
  title: string
  lesson: string
  passMark: number
  maxWords: number
  totalMarks: number
  mcq: readonly PublicMcq[]
  essay: readonly PublicEssay[]
}

/**
 * Everything the browser is allowed to have.
 *
 * `answer` and `model` are destructured out and thrown away rather than
 * omitted by convention — a `delete` or a hand-written object literal is one
 * careless edit away from leaking, and this projection is the only thing
 * standing between a student and a full answer key.
 */
export function toPublic(hw: Homework): PublicHomework {
  return {
    slug: hw.slug,
    grade: hw.grade,
    lecture: hw.lecture,
    title: hw.title,
    lesson: hw.lesson,
    passMark: hw.passMark,
    maxWords: hw.maxWords,
    totalMarks: totalMarks(hw),
    mcq: hw.mcq.map(({ answer: _answer, ...rest }) => rest),
    essay: hw.essay.map(({ model: _model, ...rest }) => rest),
  }
}
