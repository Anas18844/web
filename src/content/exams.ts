import 'server-only'

/**
 * الامتحانات — the weekly exam bank.
 *
 * ⚠️ `server-only`, for the same reason as homework.ts: it holds the answer key.
 * The build FAILS if this is ever imported into a client component.
 *
 * ── How an exam differs from homework, and why it is a separate file ──
 *
 * Homework is practice: anyone may sit it, booked or not, and a YouTube viewer
 * is welcome. An exam is assessment — it is GATED on having done the homework
 * first, which means it needs a phone number before a single question is shown,
 * and a signed pass to submit. Folding the two into one model would have meant
 * one set of rules bent to cover both, and the bending would have happened on
 * the side that matters more.
 *
 * The paper is a real printed exam (two A4 pages, 20 marks). Its shape is kept
 * — four sections, the mark badge on each, the numbered questions — because a
 * student who has practised on paper should recognise this instantly. What
 * changes is that it marks itself.
 */

export type ExamImage = { src: string; width: number; height: number }

/** اختر الإجابة الصحيحة — one mark each. */
export type ExamMcq = {
  id: number
  q: string
  options: readonly string[]
  /** ⚠️ Never leaves the server before submission. */
  answer: number
  /** Words the paper emphasises — «مصدر قلق», «يتعارض». Rendered bold. */
  emphasis?: readonly string[]
}

/** ○ / × — one mark each. */
export type ExamTrueFalse = {
  id: number
  statement: string
  /** ⚠️ true = ○ (correct statement). */
  answer: boolean
}

/**
 * أكمل ما يلي — a paragraph with gaps.
 *
 * Stored as alternating prose and gaps rather than one string with markers, so
 * the renderer never has to parse the sentence to find where an input goes.
 */
export type ExamBlanks = {
  id: number
  title: string
  marks: number
  /** Prose runs; a gap sits between each consecutive pair. */
  segments: readonly string[]
  /** ⚠️ One per gap. `segments.length - 1` of them. */
  answers: readonly string[]
  /** Marks per correct gap — the paper says two, and no partial credit. */
  marksPerBlank: number
}

/** A written answer, marked on meaning. */
export type ExamEssay = {
  id: number
  q: string
  marks: number
  /** ⚠️ Never leaves the server before submission. */
  model: string
  /** How the marks split, shown to the student after marking. */
  rubric: string
}

export type Exam = {
  slug: string
  grade: 'first_sec' | 'second_bacc'
  week: string
  title: string
  lesson: string
  /** Minutes. Printed on the paper; shown as guidance, not enforced. */
  minutes: number
  passMark: number
  /**
   * The homework a student must have completed before sitting this.
   * Without a submission for this slug on their phone, they cannot start.
   */
  requiresHomework: string
  mcq: readonly ExamMcq[]
  trueFalse: readonly ExamTrueFalse[]
  blanks: ExamBlanks
  essay: readonly ExamEssay[]
}

const WEEK_1: Exam = {
  slug: 'second-bacc-week-1',
  grade: 'second_bacc',
  week: 'الأسبوع الأول',
  title: 'امتحان الأسبوع الأول',
  lesson: 'الدرس الأول — تطوّر تكنولوجيا المعلومات',
  minutes: 20,
  passMark: 10,
  requiresHomework: 'second-bacc-lecture-1',

  mcq: [
    {
      id: 1,
      q: 'جهاز في متحف يعمل بالصمّامات المفرّغة ويملأ غرفة بأكملها، واستُخدم في حسابات علمية وأغراض عسكرية. إلى أي فترة ينتمي؟',
      options: [
        'الأربعينيات – الستينيات',
        'السبعينيات – الثمانينيات',
        'التسعينيات – الألفية',
        'العقد الثاني من الألفية',
      ],
      answer: 0,
    },
    {
      id: 2,
      q: 'قال صديقك: «ملفاتي على السحابة، يعني مش موجودة على أي جهاز خالص». أي تصحيح ينطبق على كلامه؟',
      options: [
        'صحيح، فالسحابة مساحة تخزين غير مادية',
        'خطأ، فالسحابة أجهزة في مكان حقيقي',
        'خطأ، فالسحابة برنامج على جهازك',
        'صحيح، فالسحابة شبكة داخل المنزل',
      ],
      answer: 1,
    },
    {
      id: 3,
      q: 'رجل ذهب إلى محل ملابس قريب من بيته واشترى قميصًا ودفع نقدًا. هل يُعد هذا تجارة إلكترونية؟',
      options: [
        'نعم، لأنه اشترى سلعة ودفع ثمنها',
        'نعم، لأن للمحل صفحة على الإنترنت',
        'لا، فالتجارة الإلكترونية عبر الإنترنت',
        'لا، لأن الملابس لا تُباع إلكترونيًا',
      ],
      answer: 2,
    },
    {
      id: 4,
      q: 'مجتمع قرّر التحوّل الكامل إلى الدفع غير النقدي. أي مما يلي يمثّل مصدر قلق حقيقيًا، لا ميزة؟',
      emphasis: ['مصدر قلق'],
      options: [
        'سرعة إتمام عملية الدفع دون انتظار',
        'الاستغناء عن حمل النقد الورقي',
        'شخص بلا بطاقة مصرفية ولا هاتف ذكي',
        'إمكانية الدفع برمز QR في المتاجر',
      ],
      answer: 2,
    },
    {
      id: 5,
      q: 'سيارة ذاتية القيادة ظهر أمامها جسم فجأة. لو أُرسلت بيانات المستشعرات إلى السحابة وانتظرت الردّ، فما المشكلة؟',
      options: [
        'ارتفاع تكلفة الاشتراك في الإنترنت',
        'التأخير في المعالجة يؤثّر في السلامة',
        'السحابة لا تخزّن بيانات المركبات',
        'المستشعرات تتوقّف عند السرعة العالية',
      ],
      answer: 1,
    },
    {
      id: 6,
      q: 'أي العبارات التالية عن الحوسبة الكمومية يتعارض مع ما درسته؟',
      emphasis: ['يتعارض'],
      options: [
        'نهج يستخدم خصائص ميكانيكا الكم',
        'قد توفّر تفوّقًا في مسائل محدّدة',
        'بديل عام لكل الحواسيب التقليدية',
        'لا تُسرّع جميع أنواع الحسابات',
      ],
      answer: 2,
    },
    {
      id: 7,
      q: 'انتشرت الحوسبة السحابية من العقد الثاني من الألفية، ومع ذلك ظهرت بعدها الحوسبة الطرفية. أي تفسير يتّسق مع الدرس؟',
      options: [
        'الطرفية ألغت السحابة وحلّت محلّها',
        'بيانات تحتاج معالجة قرب مكان حدوثها',
        'السحابة لم تعد تُستخدم بعد الطرفية',
        'الطرفية أقدم من الحواسيب الشخصية',
      ],
      answer: 1,
    },
    {
      id: 8,
      q: 'شركة توصيل تستخدم مركبات ذاتية القيادة لتسليم طلبات اشتراها العملاء من موقعها ودفعوا ثمنها بتطبيق. حدّد التغيّرين والتقنية:',
      options: [
        'تجارة إلكترونية ودفع غير نقدي · قيادة ذاتية',
        'عمل عن بُعد وتعلّم إلكتروني · واقع معزّز',
        'شبكات تواصل وتعلّم · حوسبة كمومية',
        'دفع غير نقدي وتواصل · واقع افتراضي',
      ],
      answer: 0,
    },
  ],

  trueFalse: [
    {
      id: 1,
      statement:
        'شبكات التواصل الاجتماعي خدمة تتيح للمستخدمين التواصل فيما بينهم ونشر المعلومات ومشاركتها بسرعة.',
      answer: true,
    },
    {
      id: 2,
      statement: 'الواقع المعزّز تقنية تضع المستخدم داخل بيئة رقمية كاملة يولّدها الحاسب.',
      answer: false,
    },
    {
      id: 3,
      statement: 'نظارة تعرض معلومات رقمية فوق محرّك حقيقي أمامك تستخدم الواقع الافتراضي.',
      answer: false,
    },
    {
      id: 4,
      statement: 'في صيانة جهاز حقيقي يكون الواقع المعزّز أنسب من الواقع الافتراضي.',
      answer: true,
    },
  ],

  blanks: {
    id: 9,
    title: 'أكمل ما يلي',
    marks: 6,
    marksPerBlank: 2,
    segments: [
      'ظهرت الحواسيب الإلكترونية في أربعينيات القرن العشرين، واستُخدمت أولًا في أغراض عسكرية وحسابات علمية. ثم انتشرت',
      'في السبعينيات والثمانينيات، فبدأ استخدامها على نطاق أوسع بين الأفراد. وفي التسعينيات أُتيح',
      'للاستخدام التجاري وانتشر الويب، فتوسّع الوصول العالمي إلى المعلومات. وفي العقد الأول من الألفية ظهرت',
      '، فانتشر الإنترنت عبر الهواتف المحمولة بسرعة.',
    ],
    answers: ['الحواسب الشخصية', 'الإنترنت', 'الهواتف الذكية'],
  },

  essay: [
    {
      id: 10,
      q: 'ما الفرق بين البت التقليدي والكيوبت من حيث عدد الحالات؟ وما المبدأ الذي يستخدمه الكيوبت؟',
      marks: 2,
      model:
        'البت التقليدي يحمل حالة واحدة في كل وقت — إما 0 أو 1. الكيوبت يستخدم مبدأ التراكب الكمومي، فيكون في 0 و1 في الوقت نفسه.',
      rubric: 'درجة لكل شقّ: عدد الحالات، ومبدأ التراكب الكمومي.',
    },
  ],
}

const WEEK_2: Exam = {
  slug: 'second-bacc-week-2',
  grade: 'second_bacc',
  week: 'الأسبوع الثاني',
  title: 'امتحان الأسبوع الثاني',
  lesson: 'الدرس الثاني — كيف يعمل الذكاء الاصطناعي؟',
  minutes: 20,
  passMark: 10,
  requiresHomework: 'second-bacc-lecture-2',

  mcq: [
    {
      id: 1,
      q: 'تطبيق على هاتفك يتعرّف على نوع النبات من صورته بدقة عالية، لكنه لا يستطيع ترجمة جملة واحدة. أي وصف ينطبق عليه؟',
      options: [
        'نظام عام يؤدّي كل المهام البشرية',
        'نظام ضيّق النطاق لمهمة محدّدة',
        'نظام تقليدي بلا ذكاء اصطناعي',
        'نظام توليدي يُنشئ نباتات جديدة',
      ],
      answer: 1,
    },
    {
      id: 2,
      q: 'مدرسة تريد نظامًا يتوقّع الطلاب المعرّضين للغياب المتكرّر، فدرّبت نموذجًا على سجلات حضور الأعوام السابقة بدل كتابة قاعدة لكل حالة. على أي أساس يحكم على طالب جديد؟',
      options: [
        'قاعدة كتبها المبرمج لكل طالب',
        'قائمة أسماء ثابتة لا تتغيّر أبدًا',
        'محتوى جديد يولّده عن كل طالب',
        'أنماط استنتجها من سجلات سابقة',
      ],
      answer: 3,
    },
    {
      id: 3,
      q: 'مساعد صوتي يتعرّف على كلامك باستخدام شبكة عصبية متعددة الطبقات. أين يقع على خريطة المفاهيم التي درستها؟',
      options: [
        'داخل التعلّم الآلي وداخل الذكاء الاصطناعي',
        'داخل الذكاء الاصطناعي وخارج التعلّم الآلي',
        'خارج الذكاء الاصطناعي وداخل التعلّم الآلي',
        'خارج التعلّم الآلي وخارج الذكاء الاصطناعي',
      ],
      answer: 0,
    },
    {
      id: 4,
      q: 'قال صديقك: «ChatGPT هو الذكاء الاصطناعي نفسه». أي تصحيح ينطبق على كلامه؟',
      options: [
        'صحيح، فهو المجال الذي يضم كل شيء',
        'خطأ، فهو أداة تنسخ نصوص الإنترنت',
        'خطأ، فهو مثال على الذكاء التوليدي',
        'صحيح، فهو أول نظام ذكاء اصطناعي ظهر',
      ],
      answer: 2,
    },
    {
      id: 5,
      q: 'نظام يتعرّف على طرازات السيارات من صورها بدقة عالية، لكنه يخطئ كثيرًا مع طراز نادر ظهر في صور قليلة. ما الإجراء الأنسب لتحسين أدائه؟',
      options: [
        'كتابة قاعدة ثابتة لكل طراز نادر',
        'إضافة صور كثيرة له لبيانات التدريب',
        'حذف صور الطراز النادر من البيانات',
        'تشغيل النظام على شاشة عرض أكبر حجمًا',
      ],
      answer: 1,
    },
    {
      id: 6,
      q: 'طالبة طلبت من أداة توليدية ثلاثة مراجع لبحثها، فأعطتها عناوين كتب مقنعة بأسماء مؤلفيها. ما التصرّف السليم قبل أن تكتبها في قائمة المراجع؟',
      options: [
        'تضعها كما هي لأنها تبدو مقنعة',
        'تسأل الأداة نفسها هل هي صحيحة',
        'تحذف بحثها كله لأن الأداة خاطئة',
        'تبحث عن كل كتاب في مصدر موثوق',
      ],
      answer: 3,
    },
    {
      id: 7,
      q: 'أب يحضر اجتماع شركته من بيته عبر الإنترنت، وابنته تتابع شرح مادتها على منصّة تعليمية. ما التغيّران الاجتماعيان بالترتيب؟',
      options: [
        'العمل عن بُعد ثم التعلّم عبر الإنترنت',
        'التعلّم عبر الإنترنت ثم العمل عن بُعد',
        'العمل عن بُعد ثم التجارة الإلكترونية',
        'شبكات التواصل ثم التعلّم عبر الإنترنت',
      ],
      answer: 0,
    },
    {
      id: 8,
      q: 'شركة ناشئة تريد تدريب نموذج تعلّم عميق على ملايين الصور، لكنها لا تملك خوادم ولا مركز بيانات. أي تقنية من الدرس الأول تناسبها، ولماذا؟',
      options: [
        'الطرفية، لأنها تعالج على الهاتف نفسه',
        'الكمومية، لأنها تُسرّع جميع الحسابات',
        'السحابية، لأنها توفّر الموارد كخدمة',
        'الواقع المعزّز، لأنه يضيف فوق الصور',
      ],
      answer: 2,
    },
  ],

  trueFalse: [
    {
      id: 1,
      statement: 'أثناء تدريب الشبكة العصبية الاصطناعية يتغيّر عدد طبقاتها، لا أوزان وحداتها.',
      answer: false,
    },
    {
      id: 2,
      statement: 'تعتمد غالبية أنظمة الذكاء الاصطناعي التوليدي الحديثة على نماذج التعلم العميق.',
      answer: true,
    },
    {
      id: 3,
      statement:
        'تعالج السيارة ذاتية القيادة بعض بياناتها على متنها، لأن انتظار ردّ السحابة قد يؤثّر في السلامة.',
      answer: true,
    },
    {
      id: 4,
      statement: 'أُتيح الإنترنت للاستخدام التجاري بعد انتشار الهواتف الذكية.',
      answer: false,
    },
  ],

  blanks: {
    id: 9,
    title: 'أكمل ما يلي',
    marks: 6,
    marksPerBlank: 2,
    segments: [
      'الذكاء الاصطناعي مجال واسع يضم أنظمة حاسوبية تستطيع تنفيذ مهام كان يقوم بها الإنسان. ومن فروعه',
      'الذي تتعلّم فيه النماذج أنماطًا من البيانات بدل برمجة كل قاعدة صراحةً. أما',
      'فيعتمد على شبكات عصبية متعددة الطبقات، ومن أمثلته تحليل الصور والتعرّف على الكلام. وقد تُنتج بعض الأدوات نصًا يبدو معقولًا لكنه غير صحيح في الواقع، ويُسمّى ذلك',
      '.',
    ],
    answers: ['التعلّم الآلي', 'التعلم العميق', 'الهلوسة'],
  },

  essay: [
    {
      /**
       * A «صحّح الخطأ» question, which is an essay in everything that matters
       * here: it is marked on meaning and it splits into two named halves.
       *
       * The printed key writes the model answer in note form — «تعلّم آلي؛
       * يصنّف ولا يُنشئ محتوى». It is spelled out as a full sentence here
       * because this string is what the marker compares a student's sentence
       * against, and a two-word note is a harsh thing to be measured by. The
       * meaning is the paper's own, taken from its two mark lines.
       */
      id: 10,
      q: 'صحّح الخطأ في العبارة التالية، واذكر السبب: «مرشِّح الرسائل المزعجة مثال على الذكاء الاصطناعي التوليدي».',
      marks: 2,
      model:
        'العبارة خطأ: مرشِّح الرسائل المزعجة مثال على التعلّم الآلي، لا الذكاء الاصطناعي التوليدي؛ لأنه يصنّف الرسائل ولا يُنشئ محتوى جديدًا.',
      rubric:
        'درجة للتصحيح: مثال على التعلّم الآلي لا التوليدي · درجة للسبب: يصنّف الرسائل ولا يُنشئ محتوى جديدًا.',
    },
  ],
}

export const EXAMS: readonly Exam[] = [WEEK_1, WEEK_2]

export function findExam(slug: string): Exam | undefined {
  return EXAMS.find((e) => e.slug === slug)
}

export function examsFor(grade: Exam['grade']): readonly Exam[] {
  return EXAMS.filter((e) => e.grade === grade)
}

/** MCQ 8 + true/false 4 + blanks 6 + essay 2 = 20. */
export function totalMarks(exam: Exam): number {
  return (
    exam.mcq.length +
    exam.trueFalse.length +
    exam.blanks.marks +
    exam.essay.reduce((t, e) => t + e.marks, 0)
  )
}

/**
 * The exam as the browser is allowed to see it — every question, no answers.
 *
 * The page never renders from `Exam` directly. This is the only shape that
 * crosses to the client, and it is built by deletion so a field added to the
 * answer key later cannot leak by being forgotten here.
 */
export type PublicExam = {
  slug: string
  week: string
  title: string
  lesson: string
  minutes: number
  totalMarks: number
  mcq: readonly Omit<ExamMcq, 'answer'>[]
  trueFalse: readonly Omit<ExamTrueFalse, 'answer'>[]
  blanks: Omit<ExamBlanks, 'answers'> & { gaps: number }
  /**
   * No `rubric` either. It reads like marking guidance but it is half the
   * answer — week 2's says «مثال على التعلّم الآلي لا التوليدي» — and it used to
   * travel with the paper. The result card gets it from the marked response.
   */
  essay: readonly Omit<ExamEssay, 'model' | 'rubric'>[]
}

export function toPublic(exam: Exam): PublicExam {
  return {
    slug: exam.slug,
    week: exam.week,
    title: exam.title,
    lesson: exam.lesson,
    minutes: exam.minutes,
    totalMarks: totalMarks(exam),
    mcq: exam.mcq.map(({ answer: _answer, ...rest }) => rest),
    trueFalse: exam.trueFalse.map(({ answer: _answer, ...rest }) => rest),
    blanks: (() => {
      const { answers, ...rest } = exam.blanks
      return { ...rest, gaps: answers.length }
    })(),
    essay: exam.essay.map(({ model: _model, rubric: _rubric, ...rest }) => rest),
  }
}
