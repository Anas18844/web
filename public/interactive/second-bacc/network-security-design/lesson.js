/* ============================================================
   lesson.js — الدرس 2-2 · تصميم أمان الشبكات (المحاضرة السادسة)
   المحتوى من السبورة ../deck/js/slides.js، وكتاب الوحدة
   ../../booklet/content-2-l02.html، وأسئلة الكتاب في ../bank/.
   المحرّك والتفاعلات الجاهزة (W.*) من templates/interactive/.
   المشاهد الخاصة بالدرس هنا: الشركة من غير حماية، ونفق الـVPN،
   واختراق الـDMZ، وبصلة الدفاع في العمق، وسور المحيط، وفاحص انعدام الثقة.
   ============================================================ */

const asset = (k, e, n) => `<div class="asset" data-a="${k}"><span class="ai" data-n="${k}">${e}</span>${n}</div>`;
// حركة عنصر من مكانه لمكان جديد في الصفحة (FLIP): بيتنقل في الـDOM ويتزحلق لمكانه
function moveTo(el, parent) {
  const a = el.getBoundingClientRect(); parent.appendChild(el); const z = el.getBoundingClientRect();
  el.animate([{ transform: `translate(${a.left - z.left}px,${a.top - z.top}px)` }, { transform: 'none' }],
    { duration: 500 * SLOW, easing: 'cubic-bezier(.3,1.3,.5,1)' });
}


/* ═══════════════ البداية ═══════════════ */

const OPEN = [
  {
    title: 'المحاضرة اللي فاتت في 30 ثانية',
    text: 'اقلب الكروت وافتكر: كل تقنية من المحاضرة الخامسة كانت بتعمل إيه؟ المحاضرة دي هتبني عليهم.',
    tags: [['مراجعة سريعة']],
    tip: 'المحاضرة اللي فاتت أمّنّا <b>الاتصال والحساب</b> · المحاضرة دي هنأمّن <b>الشبكة نفسها</b>.',
    build: W.flips({
      small: true, all: true,
      cards: [
        ['🔒', 'التشفير', 'يمنع قراءة المحتوى'],
        ['📜', 'الشهادة الرقمية', 'تتأكد إن السيرفر هو الأصلي'],
        ['✍️', 'التوقيع الرقمي', 'يكشف التلاعب ويدعم عدم التنصل'],
        ['📱', 'المصادقة الثنائية', 'تحميك لو كلمة السر اتسرّبت']
      ].map(([e, n, d]) => ({ front: `<div class="big">${e}</div><b>${n}</b><small>كانت بتعمل إيه؟</small>`, back: `<div class="big">${e}</div><span class="ans" style="font-size:18px">${d}</span>` })),
      reveal: { html: '✅ أمّنّا <b>الاتصال</b> و<b>الحساب</b>… طب لو إنت شركة عندها شبكة كاملة: أجهزة وسيرفرات وقاعدة بيانات؟', btn: 'يلا نشوف ←', go: [0, 1] }
    })
  },
  {
    title: 'شركة من غير أي حماية… الهاكر هياخد قد إيه؟',
    text: 'دي شبكة شركة فيها موقع، وبريد، وقاعدة بيانات العملاء، وأجهزة الموظفين، كلهم في مكان واحد ومفيش أي حماية. دوس «الهاكر يهاجم» وشوف بنفسك.',
    tags: [['سؤال المحاضرة', 'warn']],
    tip: 'زي البنك 🏦: مش بيحمي الفلوس بباب واحد. فيه أمن، وكاميرات، وباب حديد، وخزنة. ودي فكرة المحاضرة كلها.',
    build(b, t) {
      b.innerHTML = `
      <div class="net" style="grid-template-columns:.9fr .5fr 2.4fr">
        <div class="zone out"><span class="zl">🌍 الإنترنت</span>${asset('hk', '😈', 'الهاكر')}</div>
        <div class="wire"><div class="line plain"></div></div>
        <div class="zone inside" data-z><span class="zl">🏢 شبكة الشركة · مفيش أي حماية</span>${asset('web', '🖥️', 'خادم الويب')}${asset('mail', '📧', 'خادم البريد')}${asset('db', '🗄️', 'قاعدة البيانات')}${asset('pc', '💻', 'أجهزة الموظفين')}</div>
      </div>
      <div class="btn-row"><button class="primary" data-go>😈 الهاكر يهاجم</button></div>
      <div class="verdict" data-v></div>
      <div class="bigq" data-q hidden>❓ <b>سؤال المحاضرة (من الكتاب):</b> إزاي المؤسسة تصمم شبكتها بحيث… <b>حتى لو دفاع واحد اتخرق</b>، النظام يفضل محمي؟<small>الإجابة باختصار: متعتمدش على باب أمان واحد… اعمل كذا طبقة 🧅</small></div>`;
      const Q = s => b.querySelector(s), I = k => Q(`[data-n="${k}"]`), A = k => Q(`[data-a="${k}"]`);
      const btn = Q('[data-go]'), v = Q('[data-v]');
      btn.onclick = safe(async () => {
        btn.disabled = true; Q('[data-q]').hidden = true;
        ['web', 'mail', 'db', 'pc'].forEach(k => A(k).dataset.tone = ''); Q('[data-z]').classList.remove('hacked');
        tone(v, '', '');
        await glide(t, b, I('hk'), I('db'), '😈 هات بيانات العملاء', 'plain', 1500);
        A('db').dataset.tone = 'bad'; pop(A('db')); Q('[data-z]').classList.add('hacked');
        tone(v, '🗄️ سحب بيانات العملاء كلها…', 'bad');
        await glide(t, b, I('hk'), I('pc'), '🦠 فيروس', 'plain', 1200);
        A('pc').dataset.tone = 'bad';
        await glide(t, b, I('hk'), I('web'), '💥 اخترق', 'plain', 1100);
        A('web').dataset.tone = 'bad'; A('mail').dataset.tone = 'bad';
        tone(v, '😱 في ثواني وصل لكل حاجة… مفيش ولا باب واحد يوقفه!', 'bad');
        await wait(700); alive(t);
        Q('[data-q]').hidden = false; pop(Q('[data-q]'));
        btn.disabled = false; btn.textContent = '↻ تاني';
      });
    }
  }
];


/* ═══════════════ 1 · جدار الحماية ═══════════════ */

const FIREWALL = [
  {
    title: 'إنت جدار الحماية 🧱: مين يعدّي؟',
    text: 'الطلبات جاية من الإنترنت واحد ورا التاني، وإنت جدار الحماية. اقرا القواعد، وقرر كل طلب: يعدّي ولا يتمنع؟',
    tags: [['جدار الحماية · Firewall']],
    tip: 'زي أمن البوابة في المدرسة، ومعاه ورقة قواعد: «أولياء الأمور يدخلوا الاستقبال، محدش من برّه يدخل غرفة المدير».',
    build: W.gate({
      from: { icon: '🌍', name: 'الإنترنت' }, gate: { icon: '🧱', name: 'جدار الحماية' },
      dests: { web: { icon: '🖥️', name: 'خادم الويب' }, mail: { icon: '📧', name: 'خادم البريد' }, db: { icon: '🗄️', name: 'قاعدة البيانات' } },
      rules: ['✅ أي حد يفتح <b>الموقع</b> أو يبعت <b>بريد</b>', '⛔ محدش من برّه يكلّم <b>قاعدة البيانات</b> مباشرة'],
      done: '🔥 إنت جدار حماية محترف! سمحت للموقع والبريد، ومنعت أي طلب مباشر لقاعدة البيانات',
      items: [
        { tag: '🌐 الصفحة الرئيسية', t: 'زائر بيفتح الصفحة الرئيسية للموقع', dest: 'web', ok: true, why: 'الموقع مسموح لأي حد' },
        { tag: '🛒 المنتجات', t: 'عميل بيتفرج على المنتجات في الموقع', dest: 'web', ok: true, why: 'طلب للموقع، يبقى مسموح' },
        { tag: '📧 رسالة', t: 'شركة تانية بتبعت رسالة بريد للشركة', dest: 'mail', ok: true, why: 'البريد مسموح حسب القواعد' },
        { tag: '🗄️ جدول العملاء', t: 'حد من برّه بيطلب جدول العملاء من قاعدة البيانات مباشرة', dest: 'db', ok: false, why: 'ممنوع أي طلب مباشر من برّه لقاعدة البيانات' },
        { tag: '🔑 كل كلمات السر', t: 'طلب مباشر لقاعدة البيانات: «هات كل كلمات السر»', dest: 'db', ok: false, why: 'ده بالظبط اللي جدار الحماية موجود عشان يمنعه' },
        { tag: '✏️ تعديل الأسعار', t: 'حد من برّه عايز يعدّل الأسعار في قاعدة البيانات مباشرة', dest: 'db', ok: false, why: 'برضه طلب مباشر لقاعدة البيانات من برّه' }
      ]
    })
  },
  {
    title: 'جدار الحماية مكانه فين؟',
    text: 'ناس كتير فاكرة إن جدار الحماية بيتحط على باب الشبكة بس. اختار <b>كل</b> الأماكن الصح، ودوس «اتأكد».',
    tags: [['تعريف الكتاب']],
    tip: 'تعريف الكتاب: جدار الحماية نظام أو برنامج <b>يراقب</b> حركة مرور الشبكة، و<b>يسمح</b> بها أو <b>يمنعها</b> وفق قواعد أمنية.',
    trap: '«جدار الحماية مكانه عند حدود الشبكة بس» ✗ · ممكن يكون عند الحدود، أو بين أجزاء الشبكة، أو على جهاز مضيف.',
    build: W.multi({
      q: 'فين ممكن يتحط جدار الحماية؟ (اختار كل الإجابات الصح)',
      opts: [
        { t: '🚪 عند حدود الشبكة (بينها وبين الإنترنت)', ok: true },
        { t: '🧩 بين أجزاء الشبكة نفسها', ok: true },
        { t: '💻 على جهاز مضيف (كمبيوتر واحد)', ok: true },
        { t: '🦠 جوّه الملفات عشان يمسح الفيروسات', ok: false }
      ],
      why: 'التلاتة صح! جدار الحماية ممكن يبقى عند حدود الشبكة، أو بين أجزائها، أو على جهاز مضيف. أما مسح الفيروسات فده شغل برنامج مكافحة الفيروسات'
    })
  }
];


/* ═══════════════ 2 · VPN ═══════════════ */

const VPN = [
  {
    title: 'قاعد في كافيه على واي فاي مجاني… وعايز تدخل شبكة الشركة',
    text: 'بياناتك هتمشي في شارع عام، وأي حد ماشي فيه ممكن يتلصص. ابعت الملف والـVPN مطفي، وبعدين شغّله وابعته تاني.',
    tags: [['الشبكة الافتراضية الخاصة · VPN']],
    tip: 'الإنترنت شارع عام، والـVPN بيحفر لك <b>نفق خاص مقفول</b> جوّه الشارع ده. و«افتراضية» لأن النفق مش كابل حقيقي، ده اتصال منطقي فوق الإنترنت.',
    trap: 'الـVPN بيستخدم <b>التشفير</b> اللي أخدناه في المحاضرة اللي فاتت، وعشان كده بيقلل مخاطر التنصت حتى على Wi-Fi عام.',
    build(b, t) {
      b.innerHTML = sceneHTML([
        { n: 'me', icon: '💻', name: 'إنت', role: 'في الكافيه' },
        { n: 'wifi', icon: '📶', name: 'واي فاي مجاني', role: 'شبكة عامة' },
        { n: 'net', icon: '🌍', name: 'الإنترنت' },
        { n: 'co', icon: '🏢', name: 'شبكة الشركة', extra: '<div class="status" data-co></div>' }
      ], [{}, {}, {}], 'vpn-scene') + `
      <div class="attacker snoop"><div class="icon">🕵️</div><div class="name">متلصص قاعد على نفس الواي فاي… شايف إيه؟</div><div class="sees" data-sn>—</div></div>
      <div class="btn-row"><button data-sw></button><button class="primary" data-go>📤 ابعت تقرير المبيعات</button></div>
      <div class="verdict" data-v></div>
      <div class="tunnel" data-tun><span class="tl">🔒 نفق الـVPN المشفّر</span></div>`;
      const Q = s => b.querySelector(s), I = k => Q(`[data-n="${k}"]`);
      const tun = Q('[data-tun]'), sn = Q('[data-sn]'), v = Q('[data-v]'), co = Q('[data-co]'), btn = Q('[data-go]');
      const place = () => {
        const r = b.getBoundingClientRect(), A = I('me').getBoundingClientRect(), B = I('co').getBoundingClientRect();
        const x1 = Math.min(A.left, B.left) - r.left - 10, x2 = Math.max(A.right, B.right) - r.left + 10;
        Object.assign(tun.style, { left: x1 + 'px', width: (x2 - x1) + 'px', top: (A.top + A.height / 2 - r.top - 28) + 'px' });
      };
      const sw = toggle(Q('[data-sw]'), on => 'الـVPN: ' + (on ? 'شغال 🚇' : 'مطفي'), on => {
        place(); tun.classList.toggle('on', on); tone(sn, '—', ''); tone(v, '', ''); tone(co, '', '');
      });
      let busy = false;
      btn.onclick = safe(async () => {
        if (busy) return; busy = true; btn.disabled = Q('[data-sw]').disabled = true;
        place(); tone(sn, '—', ''); tone(v, '', ''); tone(co, '', '');
        const on = sw.on, g = gib(6);
        const pk = on ? '🔒 ' + g : '📄 تقرير المبيعات السري', cls = on ? 'enc' : 'plain';
        await glide(t, b, I('me'), I('wifi'), pk, cls, 1000);
        tone(sn, on ? '👁️ نفق مقفول… مش شايف حاجة 🤷' : '👁️ «تقرير المبيعات السري» 😈 خدت نسخة!', on ? 'good' : 'bad');
        await glide(t, b, I('wifi'), I('net'), pk, cls, 1000);
        await glide(t, b, I('net'), I('co'), pk, cls, 1000);
        tone(co, on ? '🔓 فكّ التشفير ✓ وصل' : '✓ وصل… بعد ما اتسرق', on ? 'good' : 'meh');
        tone(v, on ? '😎 البيانات عدّت في نفق مشفّر: المتلصص شاف النفق، بس مفهمش حاجة'
          : '😱 التقرير عدّى مكشوف على الواي فاي العام، والمتلصص خد نسخة! شغّل الـVPN وجرّب تاني', on ? 'good' : 'bad');
        if (on) confetti(b);
        busy = false; btn.disabled = Q('[data-sw]').disabled = false;
      });
    }
  },
  {
    title: 'ده شغل الـVPN ولا لأ؟',
    text: 'الـVPN ليه استخدامات محددة. صنّف كل حاجة: من شغل الـVPN، ولا مش شغلته؟',
    tags: [['استخدامات الـVPN']],
    tip: 'استخدامات الـVPN في الكتاب اتنين: <b>العمل عن بُعد</b> (من البيت أو أثناء التنقل)، و<b>ربط فروع المؤسسة</b> ببعض.',
    trap: '«الـVPN بيحذف الفيروسات» ✗ · الـVPN بيحمي <b>الاتصال</b> وهو ماشي، أما مكافحة الفيروسات فدي طبقة الأجهزة الطرفية.',
    build: W.sorter({
      cats: {
        y: { e: '🚇', n: 'شغل الـVPN', d: 'بيحمي الاتصال', color: 'var(--warm)' },
        n: { e: '🙅', n: 'مش شغلته', d: 'ده شغل حاجة تانية', color: 'var(--danger)' }
      },
      items: [
        { e: '🏠', n: 'الشغل من البيت على شبكة الشركة', c: 'y', why: 'العمل عن بُعد: أول استخدام في الكتاب' },
        { e: '🏢', n: 'ربط فرع إسكندرية بفرع القاهرة', c: 'y', why: 'ربط فروع المؤسسة: تاني استخدام في الكتاب' },
        { e: '☕', n: 'تشفير الاتصال على واي فاي الكافيه', c: 'y', why: 'الـVPN بيشفّر الاتصال، فبيقلل التنصت على الشبكة العامة' },
        { e: '🦠', n: 'حذف الملفات المصابة بالفيروسات', c: 'n', why: 'ده شغل مكافحة الفيروسات، مش الـVPN' },
        { e: '🗄️', n: 'منع الطلبات المباشرة لقاعدة البيانات', c: 'n', why: 'ده شغل جدار الحماية حسب القواعد' },
        { e: '🔄', n: 'تحديث نظام التشغيل', c: 'n', why: 'ده من حماية الأجهزة الطرفية' }
      ]
    })
  },
  {
    label: 'سؤال على نمط الامتحان', title: 'أنهي اختيار مش استخدام مناسب للـVPN؟',
    text: 'سؤال الكتاب بالظبط. اقرا الاختيارات الأربعة كويس، وفيه واحد بس غلط.',
    tags: [['تدرّب 2 (1) · ص 42', 'warn']],
    build: W.mcq({
      badge: 'تدرّب 2 (1) · ص 42',
      q: 'من بين الخيارات التالية (أ - د)، اختر الخيار الذي لا يمثل استخدامًا مناسبًا للشبكة الافتراضية الخاصة.',
      opts: ['الاتصال بأمان من المنزل بشبكة المؤسسة', 'ربط المكاتب في مواقع مختلفة بأمان', 'الحذف التلقائي للملفات المصابة بالفيروسات', 'تشفير محتوى الاتصال على شبكة Wi-Fi العامة'],
      answer: 2,
      why: 'الـVPN بيشفّر الاتصال، ومش بيحذف فيروسات. ده شغل مكافحة الفيروسات'
    })
  }
];


/* ═══════════════ 3 · DMZ ═══════════════ */

const DMZ = [
  {
    title: 'الموقع جنب قاعدة البيانات… ولا في أوضة لوحده؟',
    text: 'المهاجم هيخترق خادم الويب، لأنه مفتوح لأي حد على الإنترنت. جرّب الهجوم والـDMZ مش موجودة، وبعدين شغّلها وجرّب تاني: هيوصل لقاعدة البيانات؟',
    tags: [['المنطقة المعزولة · DMZ']],
    tip: 'الـDMZ زي <b>أوضة الضيوف</b>: الضيف لازم يدخلها، فبنحطها لوحدها وبابها منفصل عن باقي البيت. ولو ضيف عمل مشكلة، المشكلة بتفضل في أوضة الضيوف.',
    trap: 'قاعدة البيانات والبيانات السرية <b>مش</b> في الـDMZ. مكانها الشبكة الداخلية، ورا جدار حماية تاني.',
    build(b, t) {
      b.innerHTML = '<div data-st></div><div class="btn-row"><button data-sw></button><button class="primary" data-go>😈 ابدأ الهجوم</button></div><div class="verdict" data-v></div>';
      const Q = s => b.querySelector(s), I = k => Q(`[data-n="${k}"]`), A = k => Q(`[data-a="${k}"]`);
      const st = Q('[data-st]'), v = Q('[data-v]'), btn = Q('[data-go]');
      const draw = dmz => {
        const out = `<div class="zone out"><span class="zl">🌍 الإنترنت</span>${asset('hk', '😈', 'المهاجم')}</div>`;
        const fw = n => `<div class="fw" data-fw="${n}"><span class="ai" data-n="fw${n}">🧱</span>جدار حماية</div>`;
        st.innerHTML = dmz
          ? `<div class="net" style="grid-template-columns:.9fr auto 1.3fr auto 1.3fr">${out}${fw(1)}
              <div class="zone dmz" data-z="pub"><span class="zl">🏠 الـDMZ · أوضة الضيوف</span>${asset('web', '🖥️', 'خادم الويب')}${asset('mail', '📧', 'خادم البريد')}</div>${fw(2)}
              <div class="zone inside" data-z="in"><span class="zl">🔐 الشبكة الداخلية</span>${asset('db', '🗄️', 'قاعدة البيانات')}${asset('pc', '💻', 'أجهزة الموظفين')}</div></div>`
          : `<div class="net" style="grid-template-columns:.9fr auto 2.4fr">${out}${fw(1)}
              <div class="zone inside" data-z="in"><span class="zl">🏢 الشبكة الداخلية · كله مع بعض</span>${asset('web', '🖥️', 'خادم الويب')}${asset('mail', '📧', 'خادم البريد')}${asset('db', '🗄️', 'قاعدة البيانات')}${asset('pc', '💻', 'أجهزة الموظفين')}</div></div>`;
        tone(v, '', '');
      };
      const sw = toggle(Q('[data-sw]'), on => 'المنطقة المعزولة (DMZ): ' + (on ? 'موجودة 🏠' : 'مفيش'), draw);
      draw(false);
      let busy = false;
      btn.onclick = safe(async () => {
        if (busy) return; busy = true; btn.disabled = Q('[data-sw]').disabled = true;
        const dmz = sw.on; draw(dmz);
        await glide(t, b, I('hk'), I('web'), '😈 هجوم على الموقع', 'plain', 1500);
        A('web').dataset.tone = 'bad';
        Q(dmz ? '[data-z="pub"]' : '[data-z="in"]').classList.add('hacked');
        tone(v, '💥 خادم الويب اتخترق! (ده وارد، لأنه مفتوح لأي حد على الإنترنت)', 'meh');
        await wait(1200); alive(t);
        if (!dmz) {
          await glide(t, b, I('web'), I('db'), '😈 ندخل على قاعدة البيانات', 'plain', 1400);
          A('db').dataset.tone = 'bad';
          await glide(t, b, I('web'), I('pc'), '🦠', 'plain', 900);
          A('pc').dataset.tone = 'bad';
          tone(v, '😱 خادم الويب كان جنب قاعدة البيانات… فالمهاجم اتنقل منه للشبكة الداخلية كلها! شغّل الـDMZ وجرّب تاني', 'bad');
        } else {
          await glide(t, b, I('web'), I('fw2'), '😈 ندخل على قاعدة البيانات', 'plain', 1200);
          shake(Q('[data-fw="2"]'));
          await glide(t, b, I('fw2'), I('web'), '⛔ ممنوع', 'plain', 900);
          Q('[data-z="in"]').classList.add('safe'); A('db').dataset.tone = 'good'; A('pc').dataset.tone = 'good';
          tone(v, '🛡️ الهجوم فضل محبوس في الـDMZ، والشبكة الداخلية لسه محمية! وده بالظبط سبب وجود الـDMZ', 'good');
          confetti(b);
        }
        busy = false; btn.disabled = Q('[data-sw]').disabled = false;
      });
    }
  },
  {
    title: 'رتّب الشبكة: مين يروح الـDMZ؟',
    text: 'كل جهاز ليه مكان. اللي لازم الناس على الإنترنت توصله يروح الـDMZ، والباقي يفضل جوّه في الشبكة الداخلية.',
    tags: [['الشكل 2.2.1 في الكتاب']],
    tip: 'السؤال اللي يحسمها: <b>الناس على الإنترنت لازم توصله؟</b> لو آه يبقى DMZ، ولو لأ يبقى الشبكة الداخلية.',
    trap: '«الـDMZ فيها كل الخوادم وقاعدة البيانات» ✗ · فيها الخوادم المواجهة للجمهور بس (الويب والبريد).',
    build: W.sorter({
      cats: {
        dmz: { e: '🏠', n: 'الـDMZ', d: 'أوضة الضيوف', color: 'var(--warm)' },
        in: { e: '🔐', n: 'الشبكة الداخلية', d: 'جوّه البيت', color: 'var(--info)' }
      },
      items: [
        { e: '🖥️', n: 'خادم الويب', c: 'dmz', why: 'الموقع لازم أي حد على الإنترنت يفتحه' },
        { e: '📧', n: 'خادم البريد', c: 'dmz', why: 'البريد بيستقبل رسايل من برّه' },
        { e: '🗄️', n: 'قاعدة بيانات العملاء', c: 'in', why: 'بيانات سرية، مكانها جوّه ورا جدار حماية تاني' },
        { e: '📁', n: 'البيانات السرية', c: 'in', why: 'السرّي عمره ما يتحط في أوضة الضيوف' },
        { e: '💻', n: 'أجهزة الموظفين', c: 'in', why: 'الكمبيوتر الشخصي في الشبكة الداخلية، زي شكل الكتاب' }
      ]
    })
  },
  {
    label: 'سؤال على نمط الامتحان', title: 'ليه بنستخدم الـDMZ أصلًا؟',
    text: 'سؤال الكتاب. افتكر الهجوم اللي جربته من شوية.',
    tags: [['تمارين 3 (1) · ص 43', 'warn']],
    trap: '«الـDMZ بتتعمل عشان تسرّع الاتصال» ✗ · بتتعمل عشان تحمي الشبكة الداخلية لو خادم عام اتخترق.',
    build: W.mcq({
      badge: 'تمارين 3 (1) · ص 43',
      q: 'من بين الخيارات التالية (أ - د)، اختر السبب الأنسب لاستخدام منطقة معزولة (DMZ).',
      opts: ['لتحسين سرعة الاتصال.', 'لتعريض جميع الخوادم للخارج.', 'لمنع الضرر عن الشبكة الداخلية حتى لو تعرض خادم مواجه للجمهور للهجوم.', 'للكشف عن الفيروسات وإزالتها تلقائيًا.'],
      answer: 2,
      why: 'الـDMZ بتعزل الخوادم العامة، فلو واحد منهم اتخترق، الشبكة الداخلية بتفضل محمية'
    })
  }
];


/* ═══════════════ 4 · الدفاع في العمق ═══════════════ */

const LAYERS = [
  { e: '🧱', n: 'جدار الحماية', d: 'مدخل الشبكة', c: '#ff9f43' },
  { e: '🚇', n: 'VPN', d: 'مسار الاتصال', c: '#5ab4ff' },
  { e: '🏠', n: 'DMZ', d: 'وضع الخوادم', c: '#c792ff' },
  { e: '🛡️', n: 'مكافحة الفيروسات', d: 'الأجهزة الطرفية', c: '#3ddc97' }
];

const DEPTH = [
  {
    title: 'البصلة 🧅: كل ما الطبقات تزيد…',
    text: 'شغّل الطبقات اللي عايزها، ودوس «😈 هجمة». كل هجمة بتكسر طبقة واحدة بس. جرّب بطبقة واحدة، وبعدين بالأربعة: الهاكر محتاج كام هجمة عشان يوصل للبيانات؟',
    tags: [['الدفاع في العمق · Defense in Depth']],
    tip: 'زي البنك 🏦: أمن على البوابة، وكاميرات، وباب حديد، وخزنة. الحرامي لو عدّى طبقة، بيلاقي اللي بعدها. <b>كل طبقة بتشتري وقت وبتقلل الضرر.</b>',
    trap: '«الدفاع في العمق = جدار حماية أقوى» ✗ · ده <b>طبقات متعددة</b> من ضوابط مختلفة، فلو طبقة فشلت، الباقي بيقلل الخطر.',
    build(b, t) {
      b.innerHTML = `
      <div class="onion-wrap">
        <div class="layers">${LAYERS.map((L, i) => `<button class="shield" aria-pressed="true" data-l="${i}" style="--c:${L.c}"><span class="se">${L.e}</span><span>${L.n}<small>${L.d}</small></span></button>`).join('')}</div>
        <div>
          <div class="onion" data-on>
            ${LAYERS.map((L, i) => `<div class="ring" data-r="${i}" style="--c:${L.c};width:${100 - i * 18}%;height:${100 - i * 18}%"><span class="rl">${L.e} ${L.n}</span></div>`).join('')}
            <div class="core" data-core><span class="ci">💎</span>البيانات</div>
            <div class="hk" data-hk>😈</div>
          </div>
          <div class="hits" data-h></div>
        </div>
      </div>
      <div class="btn-row"><button class="primary" data-go>😈 هجمة</button><button data-re>↻ من الأول</button></div>
      <div class="verdict" data-v>جرّب الأول بطبقة واحدة بس، وبعدين بالأربعة 👆</div>`;
      const Q = s => b.querySelector(s), on = Q('[data-on]'), hk = Q('[data-hk]'), v = Q('[data-v]'), btn = Q('[data-go]');
      const active = LAYERS.map(() => true);
      let broken, hits, r, busy = false, over;
      // مكان الهاكر: على قطر البصلة من فوق ناحية اليمين، و f نسبة من نص القطر
      const at = f => { const s = on.offsetWidth / 2, a = Math.PI / 4; return `translate(${s + f * s * Math.cos(a) - 22}px,${s - f * s * Math.sin(a) - 22}px)`; };
      const move = async (f, ms) => {
        const an = hk.animate([{ transform: at(r) }, { transform: at(f) }], { duration: ms * SLOW / 2, easing: 'ease-in-out', fill: 'forwards' });
        await an.finished; r = f; hk.style.transform = at(f); an.cancel(); alive(t);
      };
      const reset = () => {
        broken = LAYERS.map(() => false); hits = 0; r = 1.15; over = false;
        hk.style.transform = at(r);
        b.querySelectorAll('.ring').forEach((x, i) => { x.className = 'ring' + (active[i] ? '' : ' off'); });
        Q('[data-core]').className = 'core';
        Q('[data-h]').textContent = `الطبقات الشغالة: ${ar(active.filter(Boolean).length)} · الهجمات: ٠`;
        tone(v, '', ''); btn.disabled = false;
      };
      b.querySelectorAll('[data-l]').forEach(x => x.onclick = () => {
        if (busy) return;
        const i = +x.dataset.l; active[i] = !active[i]; x.setAttribute('aria-pressed', active[i]); reset();
      });
      Q('[data-re]').onclick = () => { if (!busy) reset(); };
      requestAnimationFrame(reset);
      btn.onclick = safe(async () => {
        if (busy || over) return; busy = true; btn.disabled = true;
        hits++;
        const n = active.filter(Boolean).length;
        Q('[data-h]').textContent = `الطبقات الشغالة: ${ar(n)} · الهجمات: ${ar(hits)}`;
        b.querySelectorAll('.ring').forEach(x => x.classList.remove('held'));
        const left = LAYERS.map((_, i) => i).filter(i => active[i] && !broken[i]);
        if (!left.length) {
          await move(.12, 1300);
          Q('[data-core]').className = 'core lost'; shake(Q('[data-core]'));
          tone(v, n ? `😱 وصل للبيانات… بس بعد ${ar(hits)} هجمات! كل طبقة كسبتنا وقت 🕐` : '😱 من غير ولا طبقة… وصل للبيانات من أول هجمة!', 'bad');
          over = true; busy = false; return;
        }
        const i = left[0], R = (100 - i * 18) / 100;
        await move(R + .07, 900);
        const ring = Q(`[data-r="${i}"]`); ring.classList.add('broken'); broken[i] = true;
        await move(R - .08, 600);
        if (left.length > 1) {
          Q(`[data-r="${left[1]}"]`).classList.add('held');
          tone(v, `💥 طبقة «${LAYERS[i].n}» وقعت… بس لسه فيه ${ar(left.length - 1)} طبقة شغالة، والبيانات في أمان 🛡️`, 'good');
        } else tone(v, `💥 طبقة «${LAYERS[i].n}» وقعت… ومفيش طبقة تانية! الهجمة الجاية هتوصل للبيانات 😱`, 'bad');
        busy = false; btn.disabled = false;
      });
    }
  },
  {
    title: 'رتّب الطبقات من برّه لجوّه',
    text: 'الطبقات الأربعة اتلخبطت. دوس عليها بالترتيب، من أول طبقة الهاكر بيقابلها لحد آخر طبقة جنب البيانات.',
    tags: [['جدول الكتاب', 'warn']],
    tip: 'افتكرها رحلة الهاكر: يخبط على <b>الباب</b> (جدار الحماية)، ويتلصص على <b>السكة</b> (VPN)، ويهاجم <b>السيرفرات</b> (DMZ)، ويحاول يدخل <b>الأجهزة</b> (مكافحة الفيروسات).',
    trap: 'ترتيب الطبقات بيتسأل: ① جدار الحماية ← ② VPN ← ③ DMZ ← ④ الأجهزة الطرفية.',
    build: W.order({
      head: 'من برّه لجوّه', first: 'دوس على أول طبقة من برّه 👆',
      items: ['🧱 مدخل الشبكة: جدار الحماية', '🚇 مسار الاتصال: VPN', '🏠 وضع الخوادم: DMZ', '🛡️ الأجهزة الطرفية: مكافحة الفيروسات + تحديث النظام']
    })
  },
  {
    label: 'سؤال على نمط الامتحان', title: 'كل إجراء أمني… في أنهي طبقة؟',
    text: 'سؤال الكتاب: لكل إجراء، اختار الطبقة اللي ينتمي ليها.',
    tags: [['تدرّب 2 (2) · ص 42', 'warn']],
    build: W.match({
      badge: 'تدرّب 2 (2) · ص 42',
      q: 'لكل إجراء أمني، بيّن أي طبقة من طبقات الدفاع المتعدد ينتمي إليها',
      opts: { 'أ': 'مدخل الشبكة', 'ب': 'مسار الاتصال', 'ج': 'وضع الخوادم', 'د': 'الأجهزة الطرفية' },
      rows: [
        ['منع الاتصال غير المصرح به باستخدام جدار الحماية', 'أ', 'جدار الحماية على مدخل الشبكة'],
        ['تشفير الاتصال باستخدام الشبكة الافتراضية الخاصة', 'ب', 'الـVPN بيحمي مسار الاتصال'],
        ['تثبيت برنامج مكافحة الفيروسات', 'د', 'مكافحة الفيروسات على كل جهاز، يعني الأجهزة الطرفية'],
        ['فصل الخوادم المواجهة للجمهور عن الشبكة الداخلية باستخدام المنطقة المعزولة (DMZ)', 'ج', 'الـDMZ بتحدد مكان الخوادم']
      ]
    })
  }
];


/* ═══════════════ 5 · انعدام الثقة ═══════════════ */

const PEOPLE = [
  { e: '👩‍💼', n: 'سارة · محاسبة', loc: 'in', d: 'بتطلب فواتير العملاء من مكتبها', chk: [1, 1, 1], legit: true },
  { e: '👨‍💻', n: 'أحمد · مبرمج', loc: 'out', d: 'شغال من البيت وعايز يدخل على النظام', chk: [1, 1, 1], legit: true },
  { e: '🖥️', n: 'جهاز من أجهزة الشركة', loc: 'in', d: 'عليه برنامج خبيث بيسحب كل البيانات الساعة 3 الفجر', chk: [1, 0, 0], legit: false },
  { e: '🕵️', n: 'متسلل جوّه الشبكة', loc: 'in', d: 'معاه كلمة سر موظف مسروقة', chk: [0, 0, 0], legit: false }
];
const CHECKS = ['🪪 الهوية', '🔑 الصلاحيات', '📍 السياق'];

const ZERO = [
  {
    title: 'السور 🧱… لسه بيحمي؟',
    text: 'زمان كل الشغل كان جوّه السور، فكان كفاية نحرس السور. دوس على الزرارين وشوف الشغل النهارده بقى فين.',
    tags: [['المحيط الأمني · Security Perimeter']],
    tip: 'المحيط الأمني = الحدود التقليدية اللي بتفترض إن «الداخل آمن». والسحابة والعمل عن بُعد خلّوا الحدود دي مش واضحة.',
    trap: '«حماية المحيط الأمني كفاية» ✗ · التصاميم اللي بتحمي المحيط بس بقت غير كافية.',
    build(b) {
      b.innerHTML = `
      <div class="perim">
        <div class="castle" data-c><span class="cl">🧱 المحيط الأمني (السور)</span><div class="inner" data-in>${asset('emp', '👨‍💼', 'الموظفين')}${asset('files', '📁', 'الملفات')}${asset('srv', '🖥️', 'السيرفرات')}</div></div>
        <div class="outside"><span class="cl">🌍 برّه السور</span><div class="inner" data-out></div></div>
      </div>
      <div class="btn-row"><button data-m="files">☁️ الملفات اتنقلت للسحابة</button><button data-m="emp">🏠 الموظفين بقوا يشتغلوا من البيت</button></div>
      <div class="verdict" data-v>زمان: كل الشغل جوّه السور 🧱… فكان كفاية نحرس السور</div>
      <div class="bridge" data-br hidden>🤔 نص الشغل بقى <b>برّه السور</b>! الحدود بين «جوّه» و«برّه» بقت مش واضحة… فحراسة السور لوحدها مبقتش كفاية.<br>الحل: <b>نهج انعدام الثقة</b><br><button class="primary" data-go>يلا نشوفه ←</button></div>`;
      const Q = s => b.querySelector(s), moved = new Set();
      const NEW = { files: ['☁️', 'الملفات على السحابة'], emp: ['🏠', 'الموظفين من البيت'] };
      b.querySelectorAll('[data-m]').forEach(x => x.onclick = () => {
        const k = x.dataset.m; if (moved.has(k)) return; moved.add(k); x.disabled = true;
        const el = Q(`[data-a="${k}"]`);
        moveTo(el, Q('[data-out]'));
        el.innerHTML = `<span class="ai">${NEW[k][0]}</span>${NEW[k][1]}`;
        tone(Q('[data-v]'), k === 'files' ? '☁️ الملفات بقت على السحابة… برّه السور!' : '🏠 الموظفين بقوا شغالين من بيوتهم… برّه السور!', 'meh');
        if (moved.size === 2) { Q('[data-c]').classList.add('weak'); const br = Q('[data-br]'); br.hidden = false; pop(br); }
      });
      Q('[data-go]').onclick = () => go(ch, cur + 1);
    }
  },
  {
    title: 'انعدام الثقة: كارت على كل باب 🔍',
    text: 'أربع طلبات عايزة توصل لقاعدة بيانات العملاء. شغّلهم مرة بالأمان التقليدي (جوّه = موثوق)، ومرة بنهج انعدام الثقة، وقارن.',
    tags: [['نهج انعدام الثقة · Zero Trust']],
    tip: 'زي مبنى فيه <b>كارت دخول على كل باب</b>، مش على البوابة بس. كل أوضة بتسألك: إنت مين؟ مسموحلك تدخل هنا؟ وليه دلوقتي؟',
    trap: '«انعدام الثقة = منثقش في اللي برّه بس» ✗ · حتى اللي <b>جوّه</b> الشبكة، أو جهاز <b>ملك المؤسسة</b>، بيتحقق منه عند كل وصول.',
    build(b, t) {
      b.innerHTML = `
      <div class="modes"><button aria-pressed="true" data-md="old">🧱 الأمان التقليدي</button><button aria-pressed="false" data-md="zt">🔍 انعدام الثقة</button></div>
      <div class="zt-db"><span>🗄️</span>قاعدة بيانات العملاء</div>
      <div class="people">${PEOPLE.map((p, i) => `
        <div class="person" data-p="${i}"><span class="pe">${p.e}</span><span class="pn">${p.n}</span>
          <span class="loc ${p.loc}">${p.loc === 'in' ? '🏢 جوّه الشبكة' : '🏠 برّه الشبكة'}</span><span class="pd">${p.d}</span>
          <div class="chk"></div><div class="res"></div></div>`).join('')}</div>
      <div class="btn-row"><button class="primary" data-go>▶ شغّل الطلبات</button></div>
      <div class="verdict" data-v>اختار الطريقة، ودوس «شغّل الطلبات» 👆</div>`;
      const Q = s => b.querySelector(s), v = Q('[data-v]'), btn = Q('[data-go]');
      let mode = 'old', busy = false;
      const clear = () => b.querySelectorAll('.person').forEach(c => { c.className = 'person'; c.querySelector('.chk').innerHTML = ''; tone(c.querySelector('.res'), '', ''); });
      b.querySelectorAll('[data-md]').forEach(x => x.onclick = () => {
        if (busy) return; mode = x.dataset.md;
        b.querySelectorAll('[data-md]').forEach(y => y.setAttribute('aria-pressed', y === x)); clear(); tone(v, '', '');
      });
      const chip = (c, txt, ok) => { const s = document.createElement('span'); s.className = (ok ? 'y' : 'n') + ' pop'; s.textContent = txt + (ok ? ' ✓' : ' ✗'); c.querySelector('.chk').appendChild(s); };
      btn.onclick = safe(async () => {
        if (busy) return; busy = true; btn.disabled = true; clear(); tone(v, '', '');
        let bad = 0, meh = 0;
        for (const [i, p] of PEOPLE.entries()) {
          const c = Q(`[data-p="${i}"]`); c.classList.add('scan');
          let pass;
          if (mode === 'old') {
            await wait(500 * SLOW / 2); alive(t);
            pass = p.loc === 'in'; chip(c, '📍 جوّه السور؟', pass);
          } else {
            pass = true;
            for (const [j, ok] of p.chk.entries()) {
              await wait(450 * SLOW / 2); alive(t);
              chip(c, CHECKS[j], ok); if (!ok) { pass = false; break; }
            }
          }
          await wait(300); alive(t);
          c.classList.remove('scan');
          const cls = pass === p.legit ? 'good' : pass ? 'bad' : 'meh';
          if (cls === 'bad') bad++; if (cls === 'meh') meh++;
          c.classList.add(cls);
          tone(c.querySelector('.res'), pass ? (p.legit ? '✅ دخل' : '😱 دخل من غير ما حد يوقفه!') : (p.legit ? '😕 اتمنع وهو موظف سليم!' : '⛔ اتمنع'), cls);
        }
        if (mode === 'old') tone(v, `😱 الأمان التقليدي: ${ar(bad)} مشبوهين دخلوا عشان «جوّه»، وموظف سليم اتمنع عشان «برّه»! جرّب انعدام الثقة`, 'bad');
        else { tone(v, '✅ انعدام الثقة: كل طلب اتفحص… السليم دخل من أي مكان، والمشبوه اتمنع حتى لو جوّه', 'good'); if (!bad && !meh) confetti(b); }
        busy = false; btn.disabled = false;
      });
    }
  },
  {
    label: 'سؤال على نمط الامتحان', title: 'أنسب وصف لنهج انعدام الثقة',
    text: 'سؤال الكتاب. افتكر فاحص الكروت اللي جربته.',
    tags: [['تمارين 3 (2) · ص 43', 'warn']],
    build: W.mcq({
      badge: 'تمارين 3 (2) · ص 43',
      q: 'من بين الخيارات التالية (أ - د)، اختر الخيار الذي يصف مفهوم نهج انعدام الثقة بأنسب طريقة.',
      opts: ['الوصول من داخل شبكة المؤسسة آمن، لذا فإن التحقق غير ضروري.', 'جدار الحماية وحده كافٍ لحماية الشبكة.', 'لا تُمنح الثقة تلقائيًا بناءً على موقع المستخدم أو الجهاز، ويُتحقق من كل طلب وصول وفق الهوية والصلاحيات والسياق.', 'يحتاج فقط الوصول من الخارج إلى المراقبة.'],
      answer: 2,
      why: 'انعدام الثقة: مفيش ثقة تلقائية حتى لو جوّه، وكل وصول بيتفحص بالهوية والصلاحيات والسياق'
    })
  }
];


/* ═══════════════ تركات وأفكار ═══════════════ */

const TRICKS = [
  {
    title: 'كل مفهوم بيجاوب على سؤال',
    text: 'اقرا السؤال، وقول المفهوم بصوت عالي قبل ما تقلب الكارت 🃏. ولو السؤال طالب الاختصار، اكتبه بالإنجليزي.',
    tags: [['تركات الامتحان', 'warn']],
    build: W.flips({
      small: true, all: true,
      cards: [
        ['بيجاوب على', 'مين يعدّي؟', '🧱 جدار الحماية', 'يسمح أو يمنع حسب قواعد'],
        ['بيجاوب على', 'أحمي الاتصال إزاي على شبكة عامة؟', '🚇 VPN', 'نفق مشفّر'],
        ['بيجاوب على', 'أعزل السيرفرات المعرّضة للإنترنت إزاي؟', '🏠 DMZ', 'منطقة منفصلة للخوادم العامة'],
        ['بيجاوب على', 'لو طبقة فشلت؟', '🧅 الدفاع في العمق', 'طبقات متعددة'],
        ['بيجاوب على', 'أثق في حد لمجرد إنه جوّه؟', '🔍 انعدام الثقة', 'لا ثقة تلقائية · تحقق من كل وصول'],
        ['لو السؤال بيقول', 'اتصال منطقي خاص يحمي البيانات عبر شبكة عامة (اختصار)', 'VPN', 'تدرّب 1 (2)'],
        ['لو السؤال بيقول', 'منطقة الخوادم المعرّضة للخارج (اختصار من 3 حروف)', 'DMZ', 'تدرّب 1 (3)'],
        ['لو السؤال بيقول', 'مصطلح تكديس عدة إجراءات أمنية', 'الدفاع في العمق', 'تدرّب 1 (4)']
      ].map(([k, q, a, d]) => ({
        front: `<small>${k}</small><b>«${q}»</b><small>🤔 الإجابة؟</small>`,
        back: `<span class="ans">${a}</span><span class="conf">${d}</span>`
      }))
    })
  },
  {
    title: 'صح ولا غلط؟ الفخاخ اللي بتتكرر',
    text: '10 جمل من فخاخ الكتاب وكتاب التقييمات. قرر بسرعة: صح ولا غلط؟',
    tags: [['فخاخ الامتحان', 'warn']],
    build: W.trueFalse({
      items: [
        ['جدار الحماية مكانه عند حدود الشبكة بس', false, 'ممكن عند الحدود، أو بين أجزاء الشبكة، أو على جهاز مضيف'],
        ['الـVPN بيحذف الفيروسات من الملفات', false, 'الـVPN بيشفّر الاتصال، ومكافحة الفيروسات دي طبقة الأجهزة الطرفية'],
        ['الـDMZ فيها كل الخوادم وقاعدة البيانات', false, 'فيها الخوادم المواجهة للجمهور بس (الويب والبريد)'],
        ['الـDMZ بتتعمل عشان تسرّع الاتصال', false, 'بتتعمل عشان تحمي الشبكة الداخلية لو خادم عام اتخترق'],
        ['الدفاع في العمق = جدار حماية أقوى', false, 'ده طبقات متعددة من ضوابط مختلفة'],
        ['انعدام الثقة يعني منثقش في اللي برّه الشبكة بس', false, 'حتى اللي جوّه الشبكة، أو جهاز المؤسسة، بيتحقق منه'],
        ['حماية المحيط الأمني كفاية', false, 'السحابة والعمل عن بُعد خلّوا الحدود مش واضحة'],
        ['التصميم الكويس بيمنع الاختراق 100%', false, 'بيقلل احتماله ويحد من أثره… ومفيش حماية مطلقة'],
        ['الـVPN بيقلل مخاطر التنصت حتى على Wi-Fi عام', true, 'لأنه بيشفّر محتوى الاتصال'],
        ['لو طبقة حماية فشلت، الطبقات التانية بتقلل الخطر', true, 'ده تعريف الدفاع في العمق بالظبط']
      ]
    })
  },
  {
    label: 'سؤال تطبيق', title: 'صمّم شبكة الشركة 🏗️',
    text: 'شركة عندها موقع عام، وموظفين بيشتغلوا من البيت، وقاعدة بيانات عملاء. اختار الطبقة الأنسب لكل أصل.',
    tags: [['سؤال تطبيق على نمط الامتحان', 'warn']],
    tip: 'ولا طبقة فيهم تكفي لوحدها… وده بالظبط معنى الدفاع في العمق.',
    build: W.match({
      badge: 'سؤال تطبيق · على نمط الامتحان',
      q: 'لكل أصل وتهديده، اختار الطبقة الأنسب',
      opts: { 'أ': 'DMZ ورا جدار حماية', 'ب': 'VPN يشفّر الاتصال', 'ج': 'جدار الحماية + انعدام الثقة', 'د': 'مكافحة الفيروسات + تحديث النظام' },
      rows: [
        ['🌐 الموقع العام · ممكن يتخترق، والمهاجم يوصل منه للداخل', 'أ', 'نعزل الموقع في الـDMZ عشان الاختراق ميوصلش للداخل'],
        ['🏠 الموظفين عن بُعد · التنصت على اتصالهم من شبكة عامة', 'ب', 'الـVPN بيشفّر مسار الاتصال'],
        ['🗄️ بيانات العملاء · وصول غير مصرح به', 'ج', 'جدار الحماية يمنع الوصول الخارجي المباشر، وانعدام الثقة يتحقق من كل وصول'],
        ['💻 أجهزة الموظفين · برامج خبيثة', 'د', 'حماية الأجهزة الطرفية']
      ]
    })
  },
  {
    label: 'سؤال على نمط الامتحان', title: 'املأ الفراغات',
    text: 'سؤال الكتاب: فقرة فيها 4 فراغات. اختار الكلمة الصح لكل فراغ.',
    tags: [['تمارين 2 · ص 43', 'warn']],
    build: W.match({
      badge: 'تمارين 2 · ص 43',
      q: '«لحماية شبكة مؤسسة، تُستخدم طبقات متعددة…» املأ الفراغات',
      opts: { 'أ': 'جدار الحماية', 'ب': 'المنطقة المعزولة (DMZ)', 'ج': 'الشبكة الافتراضية الخاصة (VPN)', 'د': 'الدفاع في العمق' },
      rows: [
        ['يراقب ( … ) حركة الشبكة ويسمح بها أو يمنعها وفق قواعد', 'أ', 'ده تعريف جدار الحماية'],
        ['وتوضع الخوادم العامة في ( … ) منفصلة عن الشبكة الداخلية', 'ب', 'أوضة الضيوف'],
        ['ويُحمى الاتصال البعيد عبر ( … )', 'ج', 'النفق المشفّر'],
        ['ويسمى استخدام طبقات متعددة من الضوابط الأمنية ( … )', 'د', 'البصلة 🧅']
      ]
    })
  },
  {
    title: 'الدرس كله في 3 معادلات',
    text: 'دوس على كل معادلة عشان تتبني قدامك حتة حتة. وتحتها أفكار تثبّت بيها الدرس.',
    tags: [['الملخص', 'good']],
    tip: 'نرجع لسؤال المحاضرة: الشبكة بتفضل محمية حتى لو دفاع واحد اتخرق، لأننا <b>كدّسنا طبقات</b>، و<b>بنتحقق من كل وصول</b>.',
    build: W.equations({
      eqs: [
        { toks: [['🧅 طبقات متعددة', 'box'], ['+'], ['🔍 تحقق من كل وصول', 'box'], ['='], ['🛡️ خرق واحد مش بيكشف كل حاجة', 'res']], cap: 'الفكرة الرئيسة للدرس' },
        { toks: [['🧱 جدار الحماية', 'box'], ['+'], ['🚇 VPN', 'box'], ['+'], ['🏠 DMZ', 'box'], ['+'], ['🛡️ الأجهزة الطرفية', 'box'], ['='], ['🧅 الدفاع في العمق', 'res']], cap: 'الطبقات الأربعة من برّه لجوّه' },
        { toks: [['المحاضرة 5: نأمّن الاتصال', 'box'], ['+'], ['المحاضرة 6: نأمّن الشبكة', 'box'], ['='], ['🔐 الأمن السيبراني', 'res']], cap: 'الوحدة التانية لحد دلوقتي' }
      ],
      hooks: [
        '🧱 جدار الحماية = أمن البوابة ومعاه ورقة قواعد',
        '🚇 VPN = نفق مقفول جوّه شارع عام',
        '🏠 DMZ = أوضة الضيوف ببابها المنفصل',
        '🧅 الدفاع في العمق = البنك: أمن وكاميرات وباب حديد وخزنة',
        '🔍 انعدام الثقة = كارت على كل باب، مش على البوابة بس',
        '⚠️ مفيش تصميم بيمنع الاختراق 100%… بيقلل احتماله ويحد من أثره'
      ]
    })
  }
];


window.LESSON = {
  eyebrow: 'تانية بكالوريا · الوحدة التانية · الأمن السيبراني · الدرس ⁦2-2⁩',
  title: 'تصميم أمان الشبكات',
  chapters: [
    { icon: '🏢', eyebrow: 'البداية', name: 'شبكة الشركة', steps: OPEN },
    { icon: '🧱', eyebrow: 'المحور 1', name: 'جدار الحماية', steps: FIREWALL },
    { icon: '🚇', eyebrow: 'المحور 2', name: 'VPN', steps: VPN },
    { icon: '🏠', eyebrow: 'المحور 3', name: 'DMZ', steps: DMZ },
    { icon: '🧅', eyebrow: 'المحور 4', name: 'الدفاع في العمق', steps: DEPTH },
    { icon: '🔍', eyebrow: 'المحور 5', name: 'انعدام الثقة', steps: ZERO },
    { icon: '🎯', eyebrow: 'قبل الامتحان', name: 'تركات وأفكار', steps: TRICKS }
  ]
};
