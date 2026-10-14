/* ============================================================
   lesson.js — الدرس 2-3 · الاستجابة للحوادث وإدارة المخاطر (المحاضرة السابعة)
   المحتوى من السبورة ../deck/js/slides.js، وكتاب الوحدة
   ../../booklet/content-3-l03.html، وأسئلة الكتاب في ../bank/.
   المحرّك والتفاعلات الجاهزة (W.*) من templates/interactive/.
   المشاهد الخاصة بالدرس هنا: الفدية رغم الحماية، ومثلث السرية والسلامة والتوافر،
   وانتشار البرمجية مع الاحتواء ومن غيره، وغرفة العمليات، وحاسبة المصفوفة،
   وقواعد الدمج (طلب المالك 2026-10-14)، وترتيب الأولويات.
   الأرقام 1–3 للمستويات توضيح من السبورة وكتاب الوحدة، والكتاب بيقول «درجة» من غير أرقام.
   ============================================================ */

const pcHTML = (i, name, e = '💻') => `<div class="ir-pc safe" data-pc="${i}"><span class="pi" data-n="pc${i}">${e}</span>${name}</div>`;
const fileHTML = (i, n) => `<div class="ir-file" data-f="${i}"><span class="fi">📄</span>${n}</div>`;
const FILES = ['درجات الطلاب', 'الغياب', 'الجداول', 'المرتبات', 'بيانات أولياء الأمور', 'الامتحانات', 'الشهادات', 'الحسابات'];
async function lockFiles(t, b, n, on = true) {
  for (let i = 0; i < n; i++) {
    const f = b.querySelector(`[data-f="${i}"]`);
    f.className = 'ir-file ' + (on ? 'lock' : 'back'); f.querySelector('.fi').textContent = on ? '🔒' : '📄'; pop(f);
    await wait(260 * SLOW / 2); alive(t);
  }
}


/* ── المستويات ومصفوفة الكتاب ──
   المحور: 0 منخفض · 1 متوسط · 2 مرتفع (ودرجته في المثال i + 1).
   النتيجة من مصفوفة الكتاب (الشكل 2.3.2)، وهي نفسها حاصل الضرب:
   1 منخفض جدًا · 2 منخفض · 3 أو 4 متوسط · 6 مرتفع · 9 مرتفع جدًا */
const AX = ['منخفض', 'متوسط', 'مرتفع'];
const LV = ['منخفض جدًا', 'منخفض', 'متوسط', 'مرتفع', 'مرتفع جدًا'];
const LVC = ['#3ddc97', '#9be15d', '#ffc94d', '#ff9f43', '#ff6b6b'];
const score = (i, l) => (i + 1) * (l + 1);
const level = (i, l) => { const s = score(i, l); return s === 9 ? 4 : s === 6 ? 3 : s >= 3 ? 2 : s === 2 ? 1 : 0; };
const lvTag = k => `<span class="lv" style="background:${LVC[k]}">${LV[k]}</span>`;
// قواعد الدمج: إزاي تطلع النتيجة من غير ما تحفظ المصفوفة
function rule(i, l) {
  const a = Math.min(i, l), z = Math.max(i, l);
  if (a === z && a === 1) return '⚖️ متوسط × متوسط ← يفضل متوسط';
  if (a === z) return `⏫ نفس الطرف مرتين ← يزيد درجة: ${AX[a]} × ${AX[a]} = ${LV[level(a, a)]}`;
  if (a === 0 && z === 2) return '↔️ الطرفين مع بعض ← النتيجة في النص بالظبط: متوسط';
  return `➡️ متوسط مع ${AX[a === 1 ? z : a]} ← النتيجة بتروح للطرف: ${LV[level(i, l)]}`;
}
// المصفوفة زي الكتاب: التأثير صفوف (المرتفع فوق)، والاحتمالية أعمدة بتزيد من الشمال لليمين
function matrixHTML({ hide = false, nums = true } = {}) {
  let h = '<div class="ir-mx" dir="ltr"><div class="ir-grid">';
  for (let r = 2; r >= 0; r--) {
    h += `<div class="ir-rl">💥 تأثير<br>${AX[r]}</div>`;
    for (let c = 0; c < 3; c++) {
      const k = level(r, c);
      h += `<div class="ir-cell${hide ? ' hide' : ''}" data-r="${r}" data-c="${c}" style="--lc:${LVC[k]}"><span>${LV[k]}${nums ? `<span class="cs">${ar(r + 1)} × ${ar(c + 1)} = ${ar(score(r, c))}</span>` : ''}</span><div class="ir-tok"></div></div>`;
    }
  }
  h += '<div></div>' + AX.map(a => `<div class="ir-cl">🎲 احتمالية<br>${a}</div>`).join('');
  return h + '</div><div class="ir-xlab">🎲 الاحتمالية بتزيد ناحية اليمين ➜</div></div>';
}
const cell = (b, r, c) => b.querySelector(`.ir-cell[data-r="${r}"][data-c="${c}"]`);


/* ═══════════════ البداية ═══════════════ */

const OPEN = [
  {
    title: 'المحاضرة اللي فاتت في 30 ثانية',
    text: 'اقلب الكروت وافتكر: كل حاجة من المحاضرة السادسة كانت بتعمل إيه في الشبكة؟',
    tags: [['مراجعة سريعة']],
    tip: 'المحاضرة 5 <b>أمّنّا الاتصال</b> · المحاضرة 6 <b>صمّمنا الشبكة</b> · والنهارده: <b>لو حصل حادث رغم كل ده؟</b>',
    build: W.flips({
      small: true, all: true,
      cards: [
        ['🧱', 'جدار الحماية', 'يسمح أو يمنع حسب قواعد'],
        ['🚇', 'VPN', 'نفق مشفّر فوق شبكة عامة'],
        ['🏠', 'DMZ', 'يعزل الخوادم المواجهة للجمهور'],
        ['🧅', 'الدفاع في العمق', 'طبقات متعددة: لو واحدة وقعت الباقي يقلل الخطر'],
        ['🔍', 'انعدام الثقة', 'مفيش ثقة تلقائية · تحقق من كل وصول']
      ].map(([e, n, d]) => ({ front: `<div class="big">${e}</div><b>${n}</b><small>كانت بتعمل إيه؟</small>`, back: `<div class="big">${e}</div><span class="ans" style="font-size:17px">${d}</span>` })),
      reveal: { html: '✅ حطينا كل الطبقات دي… <b>يبقى مستحيل يحصل اختراق؟</b> 🤔', btn: 'يلا نشوف ←', go: [0, 1] }
    })
  },
  {
    title: 'كل الحماية شغالة… وبرضه حصل حادث!',
    text: 'شبكة المدرسة فيها كل الطبقات اللي أخدناها. دوس «▶ شغّل» وشوف إيميل واحد بيعمل إيه.',
    tags: [['سؤال المحاضرة', 'warn']],
    tip: 'الحماية <b>بتقلل</b> المخاطر، مش ضمان 100%. فلازم نعرف حاجتين: <b>نتصرف إزاي</b> لما الحادث يحصل؟ و<b>نبدأ بأنهي خطر</b>؟',
    build(b, t) {
      b.innerHTML = `
      <div class="ir-guards"><span>🧱 جدار الحماية ✓</span><span>🚇 VPN ✓</span><span>🏠 DMZ ✓</span><span>🛡️ مكافحة الفيروسات ✓</span><span>🔍 انعدام الثقة ✓</span></div>
      ${sceneHTML([
        { n: 'hk', icon: '😈', name: 'مهاجم', role: 'على الإنترنت' },
        { n: 'emp', icon: '👨‍💼', name: 'موظف', role: 'في المدرسة', extra: '<div class="status" data-st></div>' },
        { n: 'srv', icon: '🗄️', name: 'خادم الملفات' }
      ], [{}, {}])}
      <div class="ir-files">${FILES.map((n, i) => fileHTML(i, n)).join('')}</div>
      <div class="ir-ransom" data-r hidden><span class="ri">💀</span>ملفاتك اتشفّرت! ادفع عشان ترجّعها</div>
      <div class="btn-row"><button class="primary" data-go>▶ شغّل</button></div>
      <div class="verdict" data-v></div>
      <div class="ir-q" data-q hidden>❓ <b>السؤال الرئيسي (من الكتاب):</b> عندما يقع حادث أمني، كيف ينبغي للمؤسسة أن <b>تنظّم استجابتها</b> عبر مراحلها العامة، وكيف تقرر <b>أي المخاطر تعالجها أولًا</b>؟<small>الإجابة هي الدرس كله: مراحل الاستجابة الست 🚨 وتقييم المخاطر 🎲</small></div>`;
      const Q = s => b.querySelector(s), I = k => Q(`[data-n="${k}"]`), v = Q('[data-v]'), btn = Q('[data-go]');
      btn.onclick = safe(async () => {
        btn.disabled = true; Q('[data-r]').hidden = true; Q('[data-q]').hidden = true; tone(v, '', ''); tone(Q('[data-st]'), '', '');
        b.querySelectorAll('.ir-file').forEach(f => { f.className = 'ir-file'; f.querySelector('.fi').textContent = '📄'; });
        await glide(t, b, I('hk'), I('emp'), '📧 فاتورة مستعجلة.zip', 'pub', 1600);
        tone(Q('[data-st]'), '🖱️ فتح المرفق…', 'meh');
        tone(v, '📧 إيميل شكله عادي… والموظف فتح المرفق', 'meh');
        await wait(700); alive(t);
        await glide(t, b, I('emp'), I('srv'), '🦠 برمجية فدية', 'plain', 1400);
        tone(v, '🔒 البرمجية بتشفّر الملفات واحد ورا التاني…', 'bad');
        await lockFiles(t, b, FILES.length);
        const r = Q('[data-r]'); r.hidden = false; pop(r);
        tone(v, '😱 كل الطبقات كانت شغالة… وبرضه حصل حادث أمني!', 'bad');
        await wait(900); alive(t);
        Q('[data-q]').hidden = false; pop(Q('[data-q]'));
        btn.disabled = false; btn.textContent = '↻ تاني';
      });
    }
  }
];


/* ═══════════════ 1 · الحادث الأمني ═══════════════ */

const INCIDENT = [
  {
    title: 'الحادث الأمني بيضرب إيه بالظبط؟',
    text: 'فيه 3 حاجات لازم نحميها في المعلومات. دوس على كل هجمة من التلاتة وشوف أنهي ركن بيتكسر.',
    tags: [['الحادث الأمني · Security Incident']],
    tip: '<b>السرية:</b> محدش يشوف غير المسموح له · <b>السلامة:</b> البيانات صح ومحدش عدّلها · <b>التوافر:</b> الخدمة شغالة وقت ما نحتاجها.',
    trap: 'تعريف الكتاب: حدث يؤثر في السرية أو السلامة أو التوافر، <b>أو يهددها بجدية</b>، <b>أو يخالف سياسة أمنية</b>. يعني مش لازم يكون «اختراق» بس.',
    build(b, t) {
      b.innerHTML = sceneHTML([
        { n: 'hk', icon: '😈', name: 'مهاجم' },
        { n: 'db', icon: '🗄️', name: 'نظام المدرسة', extra: '<div class="ir-rec" data-rec>📝 درجة أحمد: ١٢</div><div class="status" data-st></div>' },
        { n: 'us', icon: '👥', name: 'الطلاب', role: 'بيستخدموا النظام' }
      ], [{}, {}]) + `
      <div class="ir-cia">
        <div class="ir-pill" data-p="c"><span class="pe">🔒</span><b>السرية</b><small>محدش يشوف غير المسموح له</small><span class="ps">سليمة ✓</span></div>
        <div class="ir-pill" data-p="i"><span class="pe">✅</span><b>السلامة</b><small>البيانات صح ومحدش عدّلها</small><span class="ps">سليمة ✓</span></div>
        <div class="ir-pill" data-p="a"><span class="pe">⚡</span><b>التوافر</b><small>الخدمة شغالة وقت ما نحتاجها</small><span class="ps">سليمة ✓</span></div>
      </div>
      <div class="btn-row"><button data-a="c">📤 تسرب معلومات</button><button data-a="i">✏️ تلاعب بالبيانات</button><button data-a="a">⛔ انقطاع خدمة</button></div>
      <div class="verdict" data-v>اختار هجمة 👆</div>
      <div class="bridge" data-br hidden>🎯 التلاتة دول = <b>الأمثلة النموذجية للحادث الأمني</b> في الكتاب<br>📤 تسرب ← السرية · ✏️ تلاعب ← السلامة · ⛔ انقطاع ← التوافر</div>`;
      const Q = s => b.querySelector(s), I = k => Q(`[data-n="${k}"]`), v = Q('[data-v]'), rec = Q('[data-rec]'), st = Q('[data-st]');
      const seen = new Set();
      let busy = false;
      const reset = () => {
        b.querySelectorAll('.ir-pill').forEach(p => { p.classList.remove('hit'); p.querySelector('.ps').textContent = 'سليمة ✓'; });
        tone(rec, '📝 درجة أحمد: ١٢', ''); tone(st, '', ''); tone(v, '', '');
      };
      const hit = (k, txt) => { const p = Q(`[data-p="${k}"]`); p.classList.add('hit'); p.querySelector('.ps').textContent = txt; };
      b.querySelectorAll('[data-a]').forEach(x => x.onclick = safe(async () => {
        if (busy) return; busy = true; b.querySelectorAll('[data-a]').forEach(y => y.disabled = true);
        reset(); const k = x.dataset.a;
        if (k === 'c') {
          await glide(t, b, I('db'), I('hk'), '📄 بيانات الطلاب السرية', 'plain', 1600);
          hit('c', 'اتكسرت ✗');
          tone(v, '📤 <b>تسرب معلومات:</b> بيانات سرية وصلت لحد مش مسموح له ← ضرب <b>السرية</b>', 'bad');
        } else if (k === 'i') {
          await glide(t, b, I('hk'), I('db'), '✏️ عدّل الدرجة', 'plain', 1500);
          tone(rec, '📝 درجة أحمد: ٢٠ 😈', 'bad'); shake(rec);
          hit('i', 'اتكسرت ✗');
          tone(v, '✏️ <b>تلاعب بالبيانات:</b> حد غيّر بيانات من غير تصريح ← ضرب <b>السلامة</b>', 'bad');
        } else {
          await glide(t, b, I('hk'), I('db'), '💥💥💥 هجوم على الخادم', 'plain', 1500);
          tone(st, '⛔ واقف', 'bad'); shake(I('db'));
          await glide(t, b, I('us'), I('db'), '🙋 عايز أدخل', 'pub', 1100);
          await glide(t, b, I('db'), I('us'), '⛔ مش متاح', 'plain', 900);
          hit('a', 'اتكسرت ✗');
          tone(v, '⛔ <b>انقطاع خدمة:</b> الطلاب مش قادرين يستخدموا النظام ← ضرب <b>التوافر</b>', 'bad');
        }
        seen.add(k);
        if (seen.size === 3) { const br = Q('[data-br]'); if (br.hidden) { br.hidden = false; pop(br); } }
        busy = false; b.querySelectorAll('[data-a]').forEach(y => y.disabled = false);
      }));
    }
  },
  {
    title: 'حادث أمني… ضرب أنهي ركن؟',
    text: 'كل كارت فيه حدث. حطه في الركن اللي ضربه، ولو مش حادث أمني أصلًا حطه في «مش حادث».',
    tags: [['أمثلة الحوادث الأمنية']],
    tip: 'برنامج الفدية بيقفل ملفاتك بالتشفير، فمحدش قادر يستخدمها ← بيضرب <b>التوافر</b>.',
    build: W.sorter({
      cats: {
        c: { e: '🔒', n: 'السرية', d: 'تسرب', color: 'var(--info)' },
        i: { e: '✅', n: 'السلامة', d: 'تلاعب', color: 'var(--bio)' },
        a: { e: '⚡', n: 'التوافر', d: 'انقطاع', color: 'var(--warm)' },
        n: { e: '🙅', n: 'مش حادث', d: 'حاجة عادية', color: 'var(--ok)' }
      },
      items: [
        { e: '📤', n: 'بيانات العملاء اتسرّبت لبرّه', c: 'c', why: 'معلومات سرية وصلت لجهة مش مسموح لها' },
        { e: '📨', n: 'ملف سري اتبعت لحد برّه الشركة من غير إذن', c: 'c', why: 'تسرب معلومات ← السرية' },
        { e: '✏️', n: 'حد غيّر درجات الطلاب من غير إذن', c: 'i', why: 'تعديل بيانات من غير تصريح ← السلامة' },
        { e: '💰', n: 'رصيد حساب في البنك اتعدّل من غير تصريح', c: 'i', why: 'تلاعب بالبيانات ← السلامة' },
        { e: '⛔', n: 'موقع البنك وقع بعد هجوم على الخادم', c: 'a', why: 'الخدمة بقت مش متاحة ← التوافر' },
        { e: '🔒', n: 'برنامج فدية شفّر الملفات ومحدش قادر يفتحها', c: 'a', why: 'الملفات مش متاحة للاستخدام ← التوافر' },
        { e: '🆕', n: 'تحديث للبرنامج بيضيف ميزات جديدة', c: 'n', why: 'تحديث عادي، مفيش ضرر ولا تهديد ← مش حادث أمني' }
      ]
    })
  },
  {
    label: 'سؤال على نمط الامتحان', title: 'أنهي واحد مش حادث أمني؟',
    text: 'سؤال الكتاب. اسأل نفسك على كل اختيار: ضرب السرية أو السلامة أو التوافر؟',
    tags: [['تدرّب 2 (1) · ص 48', 'warn']],
    build: W.mcq({
      badge: 'تدرّب 2 (1) · ص 48',
      q: 'من بين الخيارات التالية (أ - د)، اختر الخيار الذي لا يمثل مثالًا مناسبًا لحادث أمني.',
      opts: ['تم تشفير البيانات بسبب إصابة ببرنامج فدية.', 'تسريب معلومات العملاء إلى الخارج عبر وصول غير مصرح به.', 'تم إجراء تحديث للبرنامج لإضافة ميزات جديدة.', 'أصبحت خدمة ويب غير متاحة بسبب هجوم على الخادم.'],
      answer: 2,
      why: 'التحديث العادي مش بيضرب السرية ولا السلامة ولا التوافر، أما الباقي فحوادث أمنية'
    })
  }
];


/* ═══════════════ 2 · المراحل الست ═══════════════ */

const STAGES = [
  { e: '📋', n: 'التحضير', en: 'Preparation' },
  { e: '🔎', n: 'الاكتشاف', en: 'Detection' },
  { e: '🧱', n: 'الاحتواء', en: 'Containment' },
  { e: '🧹', n: 'الاستئصال', en: 'Eradication' },
  { e: '♻️', n: 'الاستعادة', en: 'Recovery' },
  { e: '📚', n: 'الدروس المستفادة والتحسين', en: 'Lessons Learned' }
];

const SIX = [
  {
    title: 'رتّب المراحل الست',
    text: 'المراحل اتلخبطت. دوس عليها بالترتيب، من قبل الحادث لحد ما نتعلم منه.',
    tags: [['الاستجابة للحوادث · Incident Response']],
    tip: 'احفظها حكاية: <b>نستعد</b> ← <b>نكتشف</b> ← <b>نحاصر</b> ← <b>نشيل</b> ← <b>نرجّع</b> ← <b>نتعلم</b>.',
    trap: '<b>التحضير</b> بيتعمل <b>مسبقًا قبل أي حادث</b>، مش بعد ما نكتشفه.',
    build: W.order({
      head: 'من قبل الحادث لبعده', first: 'دوس على أول مرحلة 👆', pool: 'المراحل (متلخبطة)',
      items: STAGES.map(s => `${s.e} ${s.n} · ${s.en}`)
    })
  },
  {
    title: 'مدرسة اتضربت ببرنامج فدية',
    text: 'سجلات الطلاب اتشفّرت، والموظفين مش قادرين يدخلوا. دوس «الخطوة الجاية» وشوف المدرسة عملت إيه في كل مرحلة.',
    tags: [['مثال من كتاب الوحدة']],
    trap: 'أسماء المراحل مختلفة في الكتاب: «الاستئصال» = «إزالة التهديد» = «الإزالة» · «الاستعادة» = «الاسترداد» · «الدروس المستفادة» = «الوقاية» في الشكل.',
    build: W.stepper({
      steps: [
        { e: '📋', t: 'التحضير', tech: 'قبل الحادث أصلًا', d: 'خطة مكتوبة، ونسخ احتياطية، وكل واحد عارف دوره' },
        { e: '🔎', t: 'الاكتشاف', tech: 'نتأكد', d: 'الملفات مش بتفتح ورسالة فدية ظهرت: هجوم فعلًا مش عطل' },
        { e: '🧱', t: 'الاحتواء', tech: 'نوقف الانتشار', d: 'نفصل الأجهزة المصابة عن الشبكة فورًا' },
        { e: '🧹', t: 'الاستئصال', tech: 'نشيل السبب', d: 'نحذف البرمجية الخبيثة ونقفل الثغرة اللي دخلت منها' },
        { e: '♻️', t: 'الاستعادة', tech: 'نرجّع الخدمة', d: 'نرجّع السجلات من نسخة احتياطية سليمة ونشغّل بأمان' },
        { e: '📚', t: 'الدروس المستفادة', tech: 'نتعلم ونحسّن', d: 'دخلت إزاي؟ تحديثات، وتدريب الموظفين، ومصادقة ثنائية' }
      ],
      eq: '<span>📋 نستعد</span> ← <span>🔎 نكتشف</span> ← <span>🧱 نحاصر</span> ← <span>🧹 نشيل</span> ← <span>♻️ نرجّع</span> ← <span class="res">📚 نتعلم</span>'
    })
  },
  {
    label: 'سؤال على نمط الامتحان', title: 'أدق وصف للتسلسل العام',
    text: 'سؤال الكتاب. خد بالك من جملة «مع مراعاة أن بعض الأنشطة قد تتداخل أو تتكرر».',
    tags: [['تمارين 3 (2) · ص 49', 'warn']],
    trap: 'الترتيب العام ثابت، بس مش خط مستقيم ممنوع ترجع فيه: لو لقيت بقايا للتهديد وإنت بتستعيد، <b>ارجع للاحتواء والاستئصال</b>.',
    build: W.mcq({
      badge: 'تمارين 3 (2) · ص 49',
      q: 'من بين الخيارات التالية (أ - د)، اختر الوصف الأدق للتسلسل العام في نموذج الاستجابة للحوادث، مع مراعاة أن بعض الأنشطة قد تتداخل أو تتكرر.',
      opts: ['الاكتشاف ← الاستئصال ← الاحتواء ← الاستعادة', 'التحضير ← الاكتشاف ← الاحتواء ← الاستئصال ← الاستعادة ← الدروس المستفادة والتحسين', 'الاكتشاف ← الاستعادة ← الاحتواء ← الدروس المستفادة والتحسين', 'الاحتواء ← الاكتشاف ← الاستئصال ← التحضير'],
      answer: 1,
      why: 'الست مراحل بالترتيب العام، والتداخل أو التكرار مش بيلغي الترتيب ده'
    })
  }
];


/* ═══════════════ 3 · احتواء ← استئصال ← استعادة ═══════════════ */

// شبكة 3×3، والجهاز اللي في النص هو المصاب. الجيران من غير أقطار.
const NB = i => [i - 3, i + 3, i % 3 ? i - 1 : -1, i % 3 < 2 ? i + 1 : -1].filter(j => j >= 0 && j < 9);

const CONTAIN = [
  {
    title: 'جهاز اتصاب… نشغّله تاني وخلاص؟',
    text: 'الجهاز اللي في النص عليه برمجية خبيثة. دوس «ابدأ» والاحتواء مطفي (بندوّر على السبب الأول)، وبعدين شغّل الاحتواء وجرّب تاني.',
    tags: [['الاحتواء · Containment']],
    tip: 'زي حريق قام في أوضة 🔥: أول حاجة <b>تقفل باب الأوضة</b> عشان النار متوصلش لباقي البيت. وبعدين تطفيها.',
    trap: '«نشيل البرمجية الأول وبعدين نمنع الانتشار» ✗ · <b>الاحتواء قبل الاستئصال</b>: لو قعدت تدوّر على السبب والبرمجية بتنتشر، هتلاقي أجهزة أكتر اتصابت.',
    build(b, t) {
      b.innerHTML = `
      <div class="ir-lab">${Array.from({ length: 9 }, (_, i) => pcHTML(i, i === 4 ? 'الجهاز المصاب' : 'جهاز ' + ar(i + 1))).join('')}</div>
      <div class="btn-row"><button data-sw></button><button class="primary" data-go>🦠 ابدأ</button></div>
      <div class="verdict" data-v></div>`;
      const Q = s => b.querySelector(s), I = i => Q(`[data-n="pc${i}"]`), P = i => Q(`[data-pc="${i}"]`), v = Q('[data-v]'), btn = Q('[data-go]');
      const reset = () => {
        for (let i = 0; i < 9; i++) { P(i).className = 'ir-pc safe'; I(i).textContent = '💻'; }
        P(4).className = 'ir-pc sick'; I(4).textContent = '🦠'; tone(v, '', '');
      };
      const sw = toggle(Q('[data-sw]'), on => 'الاحتواء: ' + (on ? 'شغال 🧱' : 'مطفي'), reset);
      reset();
      let busy = false;
      btn.onclick = safe(async () => {
        if (busy) return; busy = true; btn.disabled = Q('[data-sw]').disabled = true;
        reset();
        if (!sw.on) {
          const sick = new Set([4]);
          tone(v, '🔍 بندوّر على السبب… والبرمجية لسه متوصلة بالشبكة', 'meh');
          await wait(800); alive(t);
          while (sick.size < 9) {
            const nxt = [];
            sick.forEach(i => NB(i).forEach(j => { if (!sick.has(j) && !nxt.some(x => x[1] === j)) nxt.push([i, j]); }));
            await Promise.all(nxt.map(([i, j]) => glide(t, b, I(i), I(j), '🦠', 'plain', 1000)));
            nxt.forEach(([, j]) => { sick.add(j); P(j).className = 'ir-pc sick'; I(j).textContent = '🦠'; pop(P(j)); });
            tone(v, `🔍 لسه بندوّر على السبب… واتصاب ${ar(sick.size)} أجهزة من ${ar(9)}!`, 'bad');
            await wait(500); alive(t);
          }
          tone(v, '😱 وإحنا بندوّر على السبب، البرمجية وصلت للشبكة كلها! شغّل الاحتواء وجرّب تاني', 'bad');
        } else {
          P(4).classList.add('cut'); pop(P(4));
          tone(v, '🧱 أول حاجة: فصلنا الجهاز المصاب عن الشبكة', 'meh');
          await wait(900); alive(t);
          await Promise.all(NB(4).map(j => glide(t, b, I(4), I(j), '🦠', 'plain', 700)));
          shake(P(4));
          tone(v, '⛔ البرمجية حاولت تنتشر… بس الجهاز مفصول!', 'good');
          await wait(800); alive(t);
          tone(v, '🛡️ الضرر فضل في جهاز واحد بس، وده <b>الاحتواء</b>. بس خد بالك: البرمجية <b>لسه على الجهاز</b>… شيلها هو شغل <b>الاستئصال</b>', 'good');
          confetti(b);
        }
        busy = false; btn.disabled = Q('[data-sw]').disabled = false;
      });
    }
  },
  {
    title: 'إنت فريق الاستجابة 🚨: إيه الخطوة الجاية؟',
    text: 'المدرسة جهّزت خطتها (التحضير ✓)، وفجأة الملفات اتقفلت. اختار المرحلة الجاية كل مرة، ولو اخترت غلط هتشوف اللي هيحصل.',
    tags: [['تطبيق المراحل', 'warn']],
    trap: '«الفدية شفّرت الملفات… نعمل Restore فورًا» ✗ · لو التهديد لسه موجود هيشفّرها تاني. الترتيب: <b>احتواء ← استئصال ← استعادة</b>.',
    build(b, t) {
      const ORD = ['det', 'con', 'era', 'rec', 'les'];
      const NAME = { det: '🔎 الاكتشاف', con: '🧱 الاحتواء', era: '🧹 الاستئصال', rec: '♻️ الاستعادة', les: '📚 الدروس المستفادة' };
      b.innerHTML = `
      <div class="ir-track">${STAGES.map((s, i) => `<div class="ir-st${i === 0 ? ' done' : ''}" data-s="${i}"><span class="se">${s.e}</span>${s.n.replace(' والتحسين', '')}</div>`).join('')}</div>
      <div class="ir-ops">
        <div class="ir-lab">${Array.from({ length: 6 }, (_, i) => pcHTML(i, 'جهاز ' + ar(i + 1))).join('')}</div>
        <div class="ir-side">
          <div class="ir-files">${FILES.slice(0, 6).map((n, i) => fileHTML(i, n)).join('')}</div>
          <div class="ir-lamp" data-l>📂 الخدمة: <b data-tone="bad">واقفة</b></div>
        </div>
      </div>
      <div class="ir-stages">${shuffle(ORD).map(k => `<button data-k="${k}">${NAME[k]}</button>`).join('')}</div>
      <div class="verdict" data-v>🖥️ الموظفين بيقولوا: الملفات مش بتفتح! اختار أول مرحلة 👆</div>
      <div class="btn-row"><button data-re hidden>↻ من الأول</button></div>`;
      const Q = s => b.querySelector(s), I = i => Q(`[data-n="pc${i}"]`), P = i => Q(`[data-pc="${i}"]`), v = Q('[data-v]'), lamp = Q('[data-l]');
      let step, miss, sick, busy = false;
      const paintPC = i => { const s = sick.has(i); P(i).className = 'ir-pc ' + (s ? 'sick' : 'safe'); I(i).textContent = s ? '🦠' : '💻'; };
      const reset = () => {
        step = 0; miss = 0; sick = new Set([0]);
        for (let i = 0; i < 6; i++) paintPC(i);
        b.querySelectorAll('.ir-file').forEach(f => { f.className = 'ir-file lock'; f.querySelector('.fi').textContent = '🔒'; });
        b.querySelectorAll('.ir-st').forEach((s, i) => s.className = 'ir-st' + (i === 0 ? ' done' : i === 1 ? ' ir-now' : ''));
        b.querySelectorAll('[data-k]').forEach(x => { x.disabled = false; x.className = ''; });
        lamp.innerHTML = '📂 الخدمة: <b data-tone="bad">واقفة</b>';
        tone(v, '🖥️ الموظفين بيقولوا: الملفات مش بتفتح! اختار أول مرحلة 👆', ''); Q('[data-re]').hidden = true;
      };
      const advance = () => {
        const s = Q(`[data-s="${step + 1}"]`); s.className = 'ir-st done'; pop(s);
        Q(`[data-k="${ORD[step]}"]`).disabled = true; Q(`[data-k="${ORD[step]}"]`).className = 'ok';
        step++;
        const n = Q(`[data-s="${step + 1}"]`); if (n) n.classList.add('ir-now');
      };
      Q('[data-re]').onclick = () => { if (!busy) reset(); };
      reset();
      b.querySelectorAll('[data-k]').forEach(x => x.onclick = safe(async () => {
        if (busy) return; busy = true; const k = x.dataset.k, want = ORD[step];
        if (k === want) {
          if (k === 'det') {
            tone(v, '🔎 الفريق اتأكد: ده <b>هجوم فدية</b> فعلًا، مش عطل عادي ✓', 'good');
          } else if (k === 'con') {
            sick.forEach(i => P(i).classList.add('cut'));
            tone(v, `🧱 فصلنا ${sick.size === 1 ? 'الجهاز المصاب' : ar(sick.size) + ' أجهزة مصابة'} عن الشبكة: الانتشار وقف ✓`, 'good');
          } else if (k === 'era') {
            for (const i of sick) { P(i).className = 'ir-pc clean cut'; I(i).textContent = '🧹'; pop(P(i)); await wait(250); alive(t); }
            tone(v, '🧹 حذفنا البرمجية الخبيثة وقفلنا الثغرة اللي دخلت منها ✓', 'good');
          } else if (k === 'rec') {
            await lockFiles(t, b, 6, false);
            sick.forEach(i => { P(i).className = 'ir-pc safe'; I(i).textContent = '💻'; }); sick.clear();
            lamp.innerHTML = '📂 الخدمة: <b data-tone="good">شغالة بأمان</b>';
            tone(v, '♻️ رجّعنا الملفات من نسخة احتياطية سليمة، والخدمة رجعت تشتغل ✓', 'good');
          } else {
            lamp.innerHTML = '📂 الخدمة: <b data-tone="good">شغالة</b> · 📚 اتضاف: تحديثات + تدريب الموظفين + مصادقة ثنائية';
            pop(lamp);
          }
          advance();
          if (step === ORD.length) {
            tone(v, miss ? `🎉 خلّصت الاستجابة! غلطت ${ar(miss)} مرة… جرّب تاني من غير ولا غلطة 💪` : '🔥 استجابة مثالية: كل مرحلة في مكانها من أول مرة!', 'good');
            confetti(b); Q('[data-re]').hidden = false;
          }
        } else {
          miss++; shake(x);
          if (step === 0) tone(v, '🤔 لسه متأكدناش إن ده حادث أصلًا… ممكن يكون عطل عادي. ابدأ بالتأكد', 'bad');
          else if (k === 'era' && want === 'con') {
            const fresh = [1, 2, 3, 4, 5].filter(j => !sick.has(j)).slice(0, 2);
            await Promise.all(fresh.map(j => glide(t, b, I([...sick][0]), I(j), '🦠', 'plain', 900)));
            fresh.forEach(j => { sick.add(j); paintPC(j); pop(P(j)); });
            tone(v, `😱 وإنت بتدوّر على السبب، البرمجية انتشرت! بقوا ${ar(sick.size)} أجهزة مصابة. <b>وقف الانتشار الأول</b>`, 'bad');
          } else if (k === 'rec') {
            await lockFiles(t, b, 6, false);
            await wait(400); alive(t);
            tone(v, '♻️ رجّعت النسخة الاحتياطية… بس البرمجية لسه موجودة!', 'meh');
            await lockFiles(t, b, 6, true);
            tone(v, '😱 الفدية شفّرت الملفات <b>تاني</b>! لازم التهديد يتشال الأول (احتواء ← استئصال)، وبعدين نستعيد', 'bad');
          } else if (k === 'les') tone(v, '🤔 لسه بدري… المشكلة لسه موجودة والخدمة واقفة. الدروس المستفادة في الآخر', 'bad');
          else tone(v, '🤔 مش دي… فكّر: إيه اللي لازم يحصل الأول؟', 'bad');
        }
        busy = false;
      }));
    }
  },
  {
    label: 'سؤال على نمط الامتحان', title: 'املأ الفراغات',
    text: 'سؤال الكتاب: فقرة فيها 5 فراغات. اختار الكلمة الصح لكل فراغ.',
    tags: [['تمارين 2 · ص 49', 'warn']],
    build: W.match({
      badge: 'تمارين 2 · ص 49',
      q: 'اقرأ الفقرة واملأ الفراغات (أ) ← (هـ)',
      opts: { 'أ': 'الحادث الأمني', 'ب': 'الاحتواء', 'ج': 'الاستئصال', 'د': 'الاستعادة', 'هـ': 'الدروس المستفادة والتحسين' },
      rows: [
        ['يُسمى الحدث الذي يؤثر في سرية المعلومات أو سلامتها أو توافرها، أو يهددها بجدية، ( … )', 'أ', 'ده تعريف الحادث الأمني'],
        ['وفي نموذج الدرس، يُستخدم ( … ) للحد من انتشار الضرر', 'ب', 'نقفل باب الأوضة 🧱'],
        ['ثم تُنفذ ( … ) لإزالة التهديد ومسبباته', 'ج', 'نشيل السبب 🧹'],
        ['وتليها ( … ) لإعادة الأنظمة والخدمات', 'د', 'نرجّع الخدمة ♻️'],
        ['ثم تأتي ( … ) لتحليل ما حدث وتحسين الحماية', 'هـ', 'نتعلم ونحسّن 📚']
      ]
    })
  }
];


/* ═══════════════ 4 · تقييم المخاطر ═══════════════ */

const RISK = [
  {
    title: 'الخطر = التأثير × الاحتمالية',
    text: 'اختار تأثير الخطر واحتماليته، وشوف المصفوفة بتنوّر فين. جرّب: مرتفع × مرتفع، وبعدين منخفض × منخفض.',
    tags: [['تقييم المخاطر · Risk Assessment'], ['التأثير · Impact'], ['الاحتمالية · Likelihood']],
    tip: 'الخطر سؤالين: 💥 <b>لو حصل، هيوجع قد إيه؟</b> (التأثير) و🎲 <b>احتمال يحصل قد إيه؟</b> (الاحتمالية).',
    trap: '«الخطر = التأثير بس» أو «الاحتمالية بس» ✗ · الخطر = <b>التأثير × الاحتمالية</b>. والأرقام ١–٣ توضيح مننا، الكتاب بيقول «درجة» من غير أرقام.',
    build(b) {
      b.innerHTML = `
      <div class="ir-pickers">
        <div class="ir-pick" data-g="i"><h4>💥 التأثير: لو حصل، هيوجع قد إيه؟</h4>${AX.map((a, i) => `<button aria-pressed="false" data-x="${i}">${a}</button>`).join('')}</div>
        <div class="ir-pick" data-g="l"><h4>🎲 الاحتمالية: احتمال يحصل قد إيه؟</h4>${AX.map((a, i) => `<button aria-pressed="false" data-x="${i}">${a}</button>`).join('')}</div>
      </div>
      ${matrixHTML()}
      <div class="ir-score" data-s>اختار التأثير والاحتمالية 👆</div>
      <div class="ir-rule" data-ru></div>`;
      const Q = s => b.querySelector(s), mx = Q('.ir-mx'), sel = { i: null, l: null };
      const paint = () => {
        b.querySelectorAll('.ir-cell').forEach(c => c.classList.remove('on', 'ir-line'));
        if (sel.i === null && sel.l === null) return mx.classList.remove('dim');
        mx.classList.add('dim');
        b.querySelectorAll('.ir-cell').forEach(c => { if (+c.dataset.r === sel.i || +c.dataset.c === sel.l) c.classList.add('ir-line'); });
        if (sel.i === null || sel.l === null) { tone(Q('[data-s]'), sel.i === null ? 'واختار التأثير كمان 👆' : 'واختار الاحتمالية كمان 👆', ''); return; }
        const k = level(sel.i, sel.l), c = cell(b, sel.i, sel.l); c.classList.add('on'); pop(c);
        tone(Q('[data-s]'), `💥 ${ar(sel.i + 1)} × 🎲 ${ar(sel.l + 1)} = ${ar(score(sel.i, sel.l))} ← ${lvTag(k)}`, '');
        Q('[data-ru]').textContent = rule(sel.i, sel.l);
        if (k === 4) confetti(b);
      };
      b.querySelectorAll('.ir-pick').forEach(g => g.querySelectorAll('button').forEach(x => x.onclick = () => {
        sel[g.dataset.g] = +x.dataset.x;
        g.querySelectorAll('button').forEach(y => y.setAttribute('aria-pressed', y === x));
        paint();
      }));
    }
  },
  {
    title: 'قواعد الدمج: تعرف النتيجة من غير ما تحفظ المصفوفة',
    text: 'كل كارت فيه مستويين مضروبين في بعض. قول النتيجة بصوت عالي قبل ما تقلب الكارت، وفي الآخر هتطلع لك القواعد الأربعة.',
    tags: [['قواعد الدمج', 'warn']],
    tip: 'التفكير بالأرقام: منخفض = ١ · متوسط = ٢ · مرتفع = ٣. اضرب: <b>١</b> منخفض جدًا · <b>٢</b> منخفض · <b>٣ أو ٤</b> متوسط · <b>٦</b> مرتفع · <b>٩</b> مرتفع جدًا.',
    trap: 'الترتيب مش فارق في الدرجة: <b>تأثير مرتفع × احتمالية منخفضة</b> = <b>تأثير منخفض × احتمالية مرتفعة</b> = متوسط. ولما يتساووا، الترتيب بينهم بالسياق والضوابط المتاحة.',
    build: W.flips({
      small: true, all: true,
      cards: [[0, 0], [2, 2], [1, 1], [1, 2], [0, 1], [0, 2]].map(([i, l]) => ({
        front: `<small>💥 × 🎲</small><b style="font-size:20px">${AX[i]} × ${AX[l]}</b><small>= ؟ 🤔</small>`,
        back: `<span class="ans" style="color:${LVC[level(i, l)]}">${LV[level(i, l)]}</span><span class="conf">${rule(i, l)}</span><small>${ar(i + 1)} × ${ar(l + 1)} = ${ar(score(i, l))}</small>`
      })),
      reveal: {
        html: `<b>📏 القواعد الأربعة</b><div class="ir-rules">
          <div>⏫ <b>نفس الطرف مرتين ← يزيد درجة:</b> منخفض × منخفض = منخفض جدًا · مرتفع × مرتفع = مرتفع جدًا</div>
          <div>⚖️ <b>متوسط × متوسط ← يفضل متوسط</b></div>
          <div>➡️ <b>متوسط مع طرف ← النتيجة بتروح للطرف:</b> متوسط × مرتفع = مرتفع · متوسط × منخفض = منخفض</div>
          <div>↔️ <b>الطرفين مع بعض ← في النص بالظبط:</b> منخفض × مرتفع = متوسط</div></div>`,
        btn: 'اختبر نفسك ←', go: [4, 2]
      }
    })
  },
  {
    title: 'ابني المصفوفة بنفسك 🧩',
    text: 'المصفوفة فاضية. كل مرة هيظهر لك تأثير واحتمالية: اختار درجة الخطر، والخانة هتتملي. لو كمّلت التسعة صح، تبقى حافظ المصفوفة.',
    tags: [['تمرين قواعد الدمج', 'warn']],
    build(b) {
      const draw = () => {
        const list = shuffle([0, 1, 2].flatMap(i => [0, 1, 2].map(l => [i, l])));
        b.innerHTML = `
        <div class="ir-drill">
          <div>
            <div class="ir-pg" data-pg></div>
            <div class="ir-pair" data-p></div>
            <div class="ir-lvls">${LV.map((n, k) => `<button data-k="${k}" style="--lc:${LVC[k]}">${n}</button>`).join('')}</div>
            <div class="verdict" data-v></div>
            <div class="btn-row"><button data-re hidden>🔀 العب تاني</button></div>
          </div>
          ${matrixHTML({ hide: true })}
        </div>`;
        const Q = s => b.querySelector(s), v = Q('[data-v]');
        let n = 0, ok = 0, tried = false;
        const show = () => {
          Q('[data-pg]').textContent = `${ar(n + 1)} من ${ar(list.length)} · صح من أول مرة: ${ar(ok)}`;
          const [i, l] = list[n];
          Q('[data-p]').innerHTML = `<span>💥 تأثير ${AX[i]}</span>×<span>🎲 احتمالية ${AX[l]}</span>`; pop(Q('[data-p]'));
          tried = false; b.querySelectorAll('[data-k]').forEach(x => x.disabled = false);
        };
        b.querySelectorAll('[data-k]').forEach(x => x.onclick = () => {
          if (n === list.length) return;
          const [i, l] = list[n], k = level(i, l);
          if (+x.dataset.k === k) {
            if (!tried) ok++;
            const c = cell(b, i, l); c.classList.remove('hide'); pop(c);
            tone(v, '✅ ' + rule(i, l), 'good');
            n++;
            if (n === list.length) {
              Q('[data-pg]').textContent = `🏆 ${ar(ok)} من ${ar(list.length)} صح من أول مرة`;
              Q('[data-p]').innerHTML = ok === list.length ? '<span>🔥 المصفوفة كلها في دماغك!</span>' : '<span>🎉 المصفوفة اكتملت</span>';
              b.querySelectorAll('[data-k]').forEach(y => y.disabled = true);
              Q('[data-re]').hidden = false; Q('[data-re]').onclick = draw;
              confetti(b);
            } else setTimeout(() => { if (b.contains(x)) show(); }, 900);
          } else { tried = true; x.disabled = true; shake(x); tone(v, '🤔 لأ… افتكر: ' + rule(i, l).split('←')[0] + '← ؟', 'bad'); }
        });
        show();
      };
      draw();
    }
  },
  {
    label: 'سؤال على نمط الامتحان', title: 'أنسب وصف لتقييم المخاطر',
    text: 'سؤال الكتاب. افتكر: الفريق مش هيقدر يعالج كل حاجة في نفس الوقت.',
    tags: [['تدرّب 2 (2) · ص 48', 'warn']],
    trap: '«نعالج كل المخاطر في وقت واحد» ✗ · الفريق مش هيقدر، فبيبدأ <b>بالأعلى أولوية</b>.',
    build: W.mcq({
      badge: 'تدرّب 2 (2) · ص 48',
      q: 'من بين الخيارات التالية (أ - د)، اختر الخيار الذي يصف مفهوم تقييم المخاطر بأنسب طريقة.',
      opts: ['يكفي معالجة المخاطر ذات التأثير الكبير فقط.', 'يكفي معالجة المخاطر ذات الاحتمالية العالية فقط.', 'ينبغي معالجة المخاطر ذات التأثير العالي والاحتمالية العالية أولًا.', 'يجب معالجة جميع المخاطر في آن واحد.'],
      answer: 2,
      why: 'الخطر بيتحسب بالعاملين مع بعض، ونبدأ بالأعلى: تأثير عالي + احتمالية عالية'
    })
  }
];


/* ═══════════════ 5 · ترتيب الأولويات ═══════════════ */

const RISKS = [
  { e: '🔒', n: 'هجوم فدية على سجلات الطلاب', i: 2, l: 1 },
  { e: '💻', n: 'موظف بيسيب جهازه مفتوح', i: 0, l: 2 },
  { e: '🔥', n: 'حريق في غرفة الخوادم', i: 2, l: 0 },
  { e: '📤', n: 'تسرب بيانات الطلاب السرية', i: 2, l: 2 }
];

const PRIORITY = [
  {
    title: 'عندك 4 مخاطر… تبدأ بأنهي؟',
    text: 'كل خطر جاي ومعاه تأثيره واحتماليته. دوس على خانته في المصفوفة، ولما تحط الأربعة دوس «📋 رتّب الأولويات».',
    tags: [['ترتيب الأولويات']],
    tip: 'الفريق <b>مش هيقدر يعالج كل المخاطر في نفس الوقت</b>، فالتقييم بيقوله يبدأ بإيه عشان يقلل أكبر ضرر في أقل وقت.',
    trap: 'المصفوفة أداة مبسطة: الخطر المنخفض <b>مش معناه نتجاهله</b>، ولما خطرين يتساووا، الترتيب بينهم <b>بالسياق والضوابط المتاحة</b>.',
    build(b) {
      b.innerHTML = `
      <div class="ir-prio">
        <div>
          <div class="now" data-now></div>
          <div class="ir-rank" data-rk></div>
          <div class="btn-row"><button class="primary" data-go hidden>📋 رتّب الأولويات</button><button data-re hidden>↻ من الأول</button></div>
        </div>
        ${matrixHTML({ nums: false })}
      </div>
      <div class="verdict" data-v></div>`;
      const Q = s => b.querySelector(s), v = Q('[data-v]'), now = Q('[data-now]'), mx = Q('.ir-mx');
      let n, miss;
      const reset = () => {
        n = 0; miss = 0; mx.classList.add('pick');
        b.querySelectorAll('.ir-tok').forEach(x => x.innerHTML = '');
        Q('[data-rk]').innerHTML = ''; Q('[data-go]').hidden = true; Q('[data-re]').hidden = true; tone(v, '', '');
        show();
      };
      const show = () => {
        if (n === RISKS.length) {
          now.innerHTML = '<div class="fcard pop"><span class="fe">✅</span><span class="fn">حطّيت الأربعة</span></div>';
          mx.classList.remove('pick'); Q('[data-go]').hidden = false; return;
        }
        const r = RISKS[n];
        now.innerHTML = `<div class="fcard pop"><span class="fe">${r.e}</span><span class="fn">${r.n}</span><small>💥 التأثير: ${AX[r.i]} · 🎲 الاحتمالية: ${AX[r.l]}</small><small>مكانه فين في المصفوفة؟ 👉</small></div>`;
      };
      b.querySelectorAll('.ir-cell').forEach(c => c.onclick = () => {
        if (n === RISKS.length) return;
        const r = RISKS[n];
        if (+c.dataset.r === r.i && +c.dataset.c === r.l) {
          const s = document.createElement('span'); s.textContent = r.e; s.className = 'pop'; c.querySelector('.ir-tok').appendChild(s);
          tone(v, `✓ ${r.n} ← ${LV[level(r.i, r.l)]}`, 'good'); n++; show();
        } else { miss++; shake(c); shake(now); tone(v, '🤔 لأ… التأثير صفوف (💥 على الشمال)، والاحتمالية أعمدة (🎲 تحت)', 'bad'); }
      });
      Q('[data-go]').onclick = () => {
        const list = RISKS.map(r => ({ ...r, s: score(r.i, r.l) })).sort((a, z) => z.s - a.s);
        Q('[data-rk]').innerHTML = list.map((r, i) => {
          const tie = list.some((x, j) => j !== i && x.s === r.s), rank = list.findIndex(x => x.s === r.s) + 1, k = level(r.i, r.l);
          return `<div class="pop" style="--lc:${LVC[k]};animation-delay:${i * .25}s"><span class="rn">${ar(rank)}</span>${r.e} ${r.n} · ${LV[k]}${tie ? '<span class="tie">⚖️ متساويين</span>' : ''}</div>`;
        }).join('');
        Q('[data-go]').hidden = true; Q('[data-re]').hidden = false;
        tone(v, `🎯 نبدأ بـ<b>تسرب البيانات</b> (مرتفع جدًا)، وبعده <b>الفدية</b> (مرتفع). والجهاز المفتوح والحريق <b>متساويين</b> (متوسط): الترتيب بينهم بالسياق والضوابط المتاحة${miss ? '' : ' · 🔥 ومن غير ولا غلطة!'}`, 'good');
        confetti(b);
      };
      Q('[data-re]').onclick = reset;
      reset();
    }
  },
  {
    label: 'سؤال على نمط الامتحان', title: 'رتّب المخاطر (أ) ← (د)',
    text: 'سؤال الكتاب، وهو نفس اللعبة اللي لعبتها. اكتب الترتيب وفسّر، ودوس «صحّحلي».',
    tags: [['تمارين 3 (1) · ص 49', 'warn']],
    trap: 'لو درجتين اتساووا، <b>قول إنهم متساويين وفسّر</b>: الترتيب بالسياق والضوابط المتاحة. متخترعش ترتيب من عندك.',
    build: W.essay({
      badge: 'تمارين 3 (1) · ص 49',
      q: 'استخدم مصفوفة الدرس لتحديد أولوية المخاطر (أ - د). إذا تساوت درجتان أو لم تكفِ المعلومات للترتيب، فاذكر ذلك وفسّر إجابتك.<br>أ) تأثير كبير، احتمالية عالية · ب) تأثير صغير، احتمالية عالية · ج) تأثير كبير، احتمالية منخفضة · د) تأثير صغير، احتمالية منخفضة',
      hint: 'ابدأ بالأعلى، وخد بالك من الاتنين اللي في النص',
      ideas: [
        ['(أ) أولًا: مرتفع جدًا', /مرتفع جدا|اعلي|الاول|اولا/],
        ['(ب) و(ج) متساويين: متوسط', /متساو|تساو|نفس الدرجه|نفس المستوي|متوسط/],
        ['الترتيب بينهم بالسياق أو الضوابط', /سياق|ضوابط/],
        ['(د) في الآخر: منخفض جدًا', /منخفض جدا|اقل|الاخير|اخيرا/]
      ],
      model: [['الترتيب', '(أ) مرتفع جدًا أولًا · (ب) و(ج) متساويتان (متوسط)، وترتيبهما حسب السياق والضوابط المتاحة · (د) منخفض جدًا أخيرًا.']]
    })
  }
];


/* ═══════════════ تركات وأفكار ═══════════════ */

const TRICKS = [
  {
    title: 'لو السؤال بيقول… يبقى الإجابة',
    text: 'اقرا الوصف، وقول المصطلح بصوت عالي قبل ما تقلب الكارت 🃏.',
    tags: [['تركات الامتحان', 'warn']],
    build: W.flips({
      small: true, all: true,
      cards: [
        ['حدث يؤثر في السرية أو السلامة أو التوافر، أو يهددها بجدية', '🚨 الحادث الأمني', 'Security Incident'],
        ['إنشاء إجراءات وهياكل استجابة مسبقًا', '📋 التحضير', 'Preparation'],
        ['اكتشاف وتأكيد وقوع حادث', '🔎 الاكتشاف', 'Detection'],
        ['عزل الجزء المتأثر للحد من انتشار الضرر', '🧱 الاحتواء', 'Containment'],
        ['إزالة التهديد ومسبباته', '🧹 الاستئصال', '= إزالة التهديد = الإزالة'],
        ['إعادة الأنظمة لتشغيل آمن، وقد تشمل نسخة احتياطية سليمة', '♻️ الاستعادة', '= الاسترداد'],
        ['تحليل ما حدث وتحسين الضوابط لتقليل التكرار', '📚 الدروس المستفادة والتحسين', '= الوقاية في الشكل'],
        ['العاملان المستخدمان لتحديد حجم المخاطرة', '💥 التأثير و🎲 الاحتمالية', 'الخطر = التأثير × الاحتمالية']
      ].map(([q, a, d]) => ({
        front: `<small>لو السؤال بيقول</small><b>«${q}»</b><small>🤔 الإجابة؟</small>`,
        back: `<span class="ans" style="font-size:19px">${a}</span><span class="conf">${d}</span>`
      }))
    })
  },
  {
    title: 'صح ولا غلط؟ الفخاخ اللي بتتكرر',
    text: '10 جمل من فخاخ الكتاب والسبورة. قرر بسرعة: صح ولا غلط؟',
    tags: [['فخاخ الامتحان', 'warn']],
    build: W.trueFalse({
      items: [
        ['الحادث الأمني يعني اختراق بس', false, 'تسرب، أو تلاعب، أو انقطاع خدمة، أو تهديد جدي، أو مخالفة سياسة أمنية'],
        ['التحضير بيبدأ بعد اكتشاف الحادث', false, 'التحضير بيتعمل مسبقًا قبل أي حادث'],
        ['الاستئصال قبل الاحتواء', false, 'الاحتواء الأول: نوقف الانتشار، وبعدين نشيل السبب'],
        ['أول ما الفدية تشفّر الملفات نعمل Restore فورًا', false, 'الاستعادة بعد الاستئصال، وإلا التهديد يشفّرها تاني'],
        ['بعد الاستعادة الاستجابة خلصت', false, 'فيه مرحلة أخيرة: الدروس المستفادة والتحسين'],
        ['المراحل الست خط مستقيم ممنوع ترجع فيه', false, 'تسلسل عام، والأنشطة ممكن تتداخل أو نرجع لمرحلة قبلها'],
        ['الخطر = التأثير بس', false, 'الخطر = التأثير × الاحتمالية'],
        ['الفريق بيعالج كل المخاطر في نفس الوقت', false, 'مش هيقدر، فبيبدأ بالأعلى أولوية'],
        ['التهديد الجدي للتوافر حادث أمني حتى لو الخدمة لسه مقعتش', true, 'التعريف بيقول: يؤثر فيها أو يهددها بجدية'],
        ['المخاطر ذات التأثير المرتفع والاحتمالية المرتفعة من أعلى الأولويات', true, 'مرتفع × مرتفع = مرتفع جدًا']
      ]
    })
  },
  {
    label: 'سؤال تطبيق', title: 'متجر إلكتروني بيانات عملائه اتسرّبت 🛒',
    text: 'سؤال «طبّق ما تعلمته» من الكتاب: بيجمع المراحل وتقييم المخاطر في سؤال واحد. اكتب إجابتك ودوس «صحّحلي».',
    tags: [['طبّق ما تعلمته · ص 49', 'warn']],
    tip: 'المتجر <b>اكتشف</b> خلاص، يبقى المرحلتين الجايين: <b>الاحتواء</b> ثم <b>الاستئصال</b>.',
    build: W.essay({
      badge: 'طبّق ما تعلمته · ص 49',
      q: 'اكتشف متجر إلكتروني للتو أن بيانات العملاء قد تسرّبت. باستخدام مراحل الاستجابة الست وتقييم المخاطر، حدد المرحلتين التاليتين اللتين يجب على المتجر تنفيذهما وسبب ذلك، وحدد خطرًا واحدًا ينبغي إعطاؤه الأولوية بعد ذلك.',
      hint: 'مرحلتين + السبب + خطر واحد بأولوية + ليه',
      ideas: [
        ['الاحتواء: وقف التسريب أو عزل الجزء المتأثر', /احتوا|عزل|فصل|وقف/],
        ['بعده الاستئصال: إزالة التهديد وسد الثغرة', /استئصال|ازاله|ثغره|سد/],
        ['خطر بأولوية: تكرار الوصول غير المصرح به', /وصول|تكرار|تسرب|تسريب/],
        ['السبب: تأثيره واحتماليته مرتفعين', /تاثير|احتماليه/]
      ],
      model: [
        ['المرحلتين', 'الاحتواء لمنع استمرار التسريب، ثم إزالة التهديد (سد الثغرة المستغلة).'],
        ['الخطر بالأولوية', 'خطر تكرار الوصول غير المصرح به لبيانات العملاء، لأن تأثيره واحتماليته مرتفعان.']
      ]
    })
  },
  {
    title: 'الدرس كله في 4 معادلات',
    text: 'دوس على كل معادلة عشان تتبني قدامك حتة حتة. وتحتها أفكار تثبّت بيها الدرس.',
    tags: [['الملخص', 'good']],
    tip: 'نرجع للسؤال الرئيسي: لما الحادث يحصل <b>نمشي بالمراحل الست</b>، ونبدأ <b>بالخطر الأعلى</b> (التأثير × الاحتمالية).',
    build: W.equations({
      eqs: [
        { toks: [['🔒 السرية', 'box'], ['+'], ['✅ السلامة', 'box'], ['+'], ['⚡ التوافر', 'box'], ['='], ['🚨 اللي الحادث الأمني بيضربه', 'res']], cap: 'تسرب · تلاعب · انقطاع (أو تهديد جدي، أو مخالفة سياسة)' },
        { toks: [['📋 تحضير', 'box'], ['←'], ['🔎 اكتشاف', 'box'], ['←'], ['🧱 احتواء', 'box'], ['←'], ['🧹 استئصال', 'box'], ['←'], ['♻️ استعادة', 'box'], ['←'], ['📚 دروس', 'box'], ['='], ['🚨 الاستجابة', 'res']], cap: 'تسلسل عام، وممكن نرجع لمرحلة قبلها' },
        { toks: [['💥 التأثير', 'box'], ['×'], ['🎲 الاحتمالية', 'box'], ['='], ['🎯 درجة الخطر', 'res']], cap: 'ونبدأ بالأعلى' },
        { toks: [['2-1 أحمي', 'box'], ['+'], ['2-2 أصمم', 'box'], ['+'], ['2-3 أستجيب', 'box'], ['='], ['🔐 الأمن السيبراني', 'res']], cap: 'الوحدة التانية كلها' }
      ],
      hooks: [
        '🧱 الاحتواء = تقفل باب الأوضة اللي فيها الحريق',
        '🧹 الاستئصال = تطفي النار وتشيل سببها',
        '♻️ الاستعادة بعد الاستئصال… وإلا الفدية ترجع تشفّر',
        '⏫ نفس الطرف مرتين يزيد درجة · ⚖️ متوسط × متوسط = متوسط',
        '➡️ متوسط مع طرف = الطرف · ↔️ منخفض × مرتفع = متوسط',
        '⚠️ المصفوفة أداة مبسطة: المنخفض مش معناه نتجاهله'
      ]
    })
  }
];


window.LESSON = {
  eyebrow: 'تانية بكالوريا · الوحدة التانية · الأمن السيبراني · الدرس ⁦2-3⁩',
  title: 'الاستجابة للحوادث وإدارة المخاطر',
  chapters: [
    { icon: '🏫', eyebrow: 'البداية', name: 'رغم الحماية', steps: OPEN },
    { icon: '🚨', eyebrow: 'المحور 1', name: 'الحادث الأمني', steps: INCIDENT },
    { icon: '🔢', eyebrow: 'المحور 2', name: 'المراحل الست', steps: SIX },
    { icon: '🧯', eyebrow: 'المحور 3', name: 'الاحتواء أولًا', steps: CONTAIN },
    { icon: '🎲', eyebrow: 'المحور 4', name: 'المخاطر', steps: RISK },
    { icon: '📋', eyebrow: 'المحور 5', name: 'الأولويات', steps: PRIORITY },
    { icon: '🎯', eyebrow: 'قبل الامتحان', name: 'تركات وأفكار', steps: TRICKS }
  ]
};
