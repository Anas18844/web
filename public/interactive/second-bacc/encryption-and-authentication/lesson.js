/* ============================================================
   lesson.js — الدرس 2-1 · تقنيات التشفير والمصادقة (المحاضرة الخامسة)
   المحتوى من السبورة ../deck/js/slides.js وكتاب الوزارة ص 31 ← 37.
   المحرّك والتفاعلات الجاهزة (W.*) من templates/interactive/.
   المشاهد الخاصة بالدرس (المصافحة، وتسجيل الدخول، ومحطات HTTP، والهاكر و2FA،
   والتوقيع الرقمي، وفاحص 2FA) مكتوبة هنا بأدوات المحرّك.
   ============================================================ */

/* ═══════════════ المحور التمهيدي: العميل والسيرفر ═══════════════ */

const USERS = { ahmed: '1234', sara: 'sara22', omar: '0000' };
const HOPS = [
  { e: '📱', n: 'موبايلك' }, { e: '📶', n: 'واي فاي الكافيه' }, { e: '🏢', n: 'مزوّد الإنترنت' },
  { e: '🔁', n: 'البروكسي' }, { e: '🖥️', n: 'سيرفر المنصة' }
];

const INTRO = [
  {
    title: 'أي موقع أو تطبيق = طرفين بيكلموا بعض',
    text: 'التطبيق اللي على موبايلك ده <b>العميل</b>، يعني الواجهة اللي بتشوفها. أما البيانات الحقيقية فموجودة عند <b>السيرفر</b>، وجواه الباك وقاعدة البيانات. العميل بيبعت <b>طلب</b>، والسيرفر بيرد. دوس ↻ عشان تشوفها تاني.',
    tags: [['العميل · Client'], ['السيرفر · Server'], ['قاعدة البيانات · Database']],
    tip: 'زي المطعم 🍽️: إنت الزبون (العميل)، بتشوف المنيو (الواجهة) وتطلب. والمطبخ (الباك) بيحضّر من المخزن (قاعدة البيانات) ويرجّعلك الطبق.',
    async build(b, t) {
      b.innerHTML = sceneHTML([
        { n: 'c', icon: '📱', name: 'العميل', role: 'الواجهة · Frontend', extra: '<div class="note">اللي بتشوفه: نصوص وصور وزراير</div>' },
        { n: 's', icon: '🖥️', name: 'السيرفر', role: 'الباك · Backend', extra: '<div class="note">بيعالج الطلبات ويحمي البيانات</div>' },
        { n: 'd', icon: '🗄️', name: 'قاعدة البيانات', role: 'Database', extra: '<div class="note">مكان تخزين بيانات المستخدمين</div>' }
      ], [{ label: 'الإنترنت' }, { short: true }]) + '<div class="caption" data-cap></div>';
      const I = k => b.querySelector(`[data-n="${k}"]`), cap = b.querySelector('[data-cap]');
      const say = x => tone(cap, x, '');
      await wait(500); alive(t);
      say('١ · العميل بيبعت طلب للسيرفر');
      await glide(t, b, I('c'), I('s'), '📨 عايز صفحة الفيديو', '', 1800);
      say('٢ · السيرفر بيطلب البيانات من قاعدة البيانات');
      await glide(t, b, I('s'), I('d'), '🔍 هات بيانات الفيديو', 'pub', 1400);
      say('٣ · قاعدة البيانات بترجّع البيانات');
      await glide(t, b, I('d'), I('s'), '📦 البيانات', 'pub', 1400);
      say('٤ · السيرفر بيرد، والصفحة تظهر قدامك');
      await glide(t, b, I('s'), I('c'), '📄 الصفحة + 🎬', 'good', 1800);
      tone(cap, '✅ طلب ← رد · ودي فكرة أي موقع أو تطبيق', 'good');
    }
  },
  {
    title: 'جرّب بنفسك: سجّل دخول على المنصة',
    text: 'اكتب كلمة السر ودوس «دخول». اسمك وكلمة السر بيروحوا للسيرفر، والسيرفر بيدوّر عليهم في قاعدة البيانات: لو موجودين ومطابقين هتدخل، ولو لأ هتطلعلك رسالة خطأ.',
    tags: [['رحلة تسجيل الدخول']],
    tip: 'بص على الرسالة الحمرا اللي ماشية على الخط 👀 كلمة السر مكتوبة جواها زي ما هي! خلّي الملاحظة دي في دماغك للخطوة الجاية.',
    build(b, t) {
      b.innerHTML = sceneHTML([
        { n: 'c', icon: '📱', name: 'موبايلك', role: 'العميل' },
        { n: 's', icon: '🖥️', name: 'السيرفر', role: 'الباك', extra: '<div class="status" data-sv>مستني طلبات…</div>' },
        { n: 'd', icon: '🗄️', name: 'قاعدة البيانات', extra: `<div class="db">${Object.keys(USERS).map(u => `<div data-row="${u}">👤 ${u} · 🔑 ••••</div>`).join('')}</div>` }
      ], [{ label: 'الإنترنت', cls: 'plain' }, { short: true }]) + `
      <div class="phone">
        <div class="ph-top">🎓 منصة مستر أنس</div>
        <div class="ph-body">
          <label>اسم المستخدم <input data-u value="ahmed" dir="ltr" autocomplete="off" spellcheck="false"></label>
          <label>كلمة السر <input data-p dir="ltr" placeholder="اكتب كلمة السر" autocomplete="off" spellcheck="false"></label>
          <button class="primary" data-go>دخول</button>
          <div class="ph-msg" data-msg>جرّب كلمة سر غلط الأول… وبعدين جرّب <b dir="ltr">1234</b></div>
        </div>
      </div>`;
      const Q = s => b.querySelector(s), I = k => Q(`[data-n="${k}"]`);
      const btn = Q('[data-go]'), msg = Q('[data-msg]'), sv = Q('[data-sv]');
      let busy = false;
      const login = safe(async () => {
        if (busy) return;
        const u = Q('[data-u]').value.trim().toLowerCase(), p = Q('[data-p]').value.trim();
        if (!u || !p) { tone(msg, 'اكتب اسم المستخدم وكلمة السر الأول ✍️', 'bad'); shake(Q('.phone')); return; }
        busy = true; btn.disabled = true;
        b.querySelectorAll('[data-row]').forEach(r => r.dataset.tone = '');
        tone(msg, 'بيتبعت… 📨', 'meh'); tone(sv, 'مستني…', '');
        await glide(t, b, I('c'), I('s'), `👤 ${esc(u)} · 🔑 ${esc(p)}`, 'plain', 1800);
        tone(sv, '🔍 بيسأل قاعدة البيانات…', 'meh');
        await glide(t, b, I('s'), I('d'), `🔍 ${esc(u)}؟`, 'pub', 1200);
        const ok = USERS[u] === p, row = Object.keys(USERS).includes(u) ? Q(`[data-row="${u}"]`) : null;
        if (row) row.dataset.tone = ok ? 'good' : 'bad';
        await wait(600); alive(t);
        await glide(t, b, I('d'), I('s'), ok ? '✓ مطابق' : (row ? '✗ كلمة السر غلط' : '✗ مش موجود'), ok ? 'good' : 'plain', 1200);
        tone(sv, ok ? '✅ البيانات صح' : '❌ البيانات غلط', ok ? 'good' : 'bad');
        await glide(t, b, I('s'), I('c'), ok ? '✅ اتفضل ادخل' : '❌ مرفوض', ok ? 'good' : 'plain', 1500);
        tone(msg, ok ? `🎬 أهلاً يا <bdi>${esc(u)}</bdi>! فيديو المحاضرة جاهز ▶` : 'اسم المستخدم أو كلمة السر غلط ❌ جرّب تاني', ok ? 'good' : 'bad');
        if (!ok) shake(Q('.phone'));
        busy = false; btn.disabled = false;
      });
      btn.onclick = login;
      b.querySelectorAll('input').forEach(i => i.onkeydown = e => { if (e.key === 'Enter') login(); });
    }
  },
  {
    title: 'كلمة السر بتعدّي على مين في السكة؟',
    text: 'البيانات بتتبعت بـ <b>HTTP</b>، ودي الطريقة اللي الأجهزة بتبعت بيها البيانات للسيرفرات. بس HTTP اتعمل عشان البيانات <b>توصل</b>، مش عشان <b>تتحمي</b>، فكل محطة في السكة بتقرا كلمة السر زي ما هي. جرّب الزرارين وقارن.',
    tags: [['HTTP مكشوف', 'bad'], ['HTTPS مشفر', 'good']],
    tip: 'بروتوكول يعني «اتفاق على طريقة الكلام» بين الأجهزة. وحرف <b>S</b> في HTTP<b>S</b> معناه <b>Secure</b>، يعني آمن.',
    build(b, t) {
      b.innerHTML = `
      <div class="hops" data-hops>${HOPS.map((h, i) => `
        <div class="hop"><div class="icon" data-h="${i}">${h.e}</div><div class="name">${h.n}</div><div class="eye" data-e="${i}"></div></div>`).join('')}
      </div>
      <div class="btn-row"><button class="bad-btn" data-m="http">🔓 ابعت بـ HTTP</button><button class="good-btn" data-m="https">🔒 ابعت بـ HTTPS</button></div>
      <div class="verdict" data-v></div>`;
      const Q = s => b.querySelector(s), H = i => Q(`[data-h="${i}"]`), E = i => Q(`[data-e="${i}"]`);
      const hops = Q('[data-hops]'), v = Q('[data-v]'), btns = b.querySelectorAll('[data-m]');
      let busy = false;
      const send = safe(async secure => {
        if (busy) return; busy = true; btns.forEach(x => x.disabled = true);
        hops.className = 'hops ' + (secure ? 'secure' : 'plain');
        for (let i = 0; i < 5; i++) tone(E(i), '', '');
        tone(v, '', '');
        const g = gib(6);
        for (let i = 0; i < 4; i++) {
          await glide(t, b, H(i), H(i + 1), secure ? '🔒 ' + g : '🔑 1234', secure ? 'enc' : 'plain', 850);
          if (i < 3) tone(E(i + 1), secure ? `👁️ <span class="gib">${g}</span> 🤷` : '👁️ «1234» 😈', secure ? 'good' : 'bad');
        }
        tone(E(4), secure ? '🔓 فكّ التشفير: 1234 ✓' : '✓ وصلت: 1234', 'good');
        tone(v, secure
          ? '😎 كل المحطات شافت رموز ملهاش معنى… والسيرفر بس هو اللي فهمها'
          : '😱 3 محطات في السكة قرت كلمة السر بتاعتك! والهاكر ممكن يكون أي واحدة فيهم', secure ? 'good' : 'bad');
        busy = false; btns.forEach(x => x.disabled = false);
      });
      btns.forEach(x => x.onclick = () => send(x.dataset.m === 'https'));
      wait(600).then(() => { if (t === run) send(false); });
    }
  },
  {
    title: 'نفس المشكلة… بس النتيجة مختلفة خالص',
    text: 'اقلب الكارتين: لو الهاكر خد كلمة السر بتاعتك، هيعمل بيها إيه على المنصة؟ وهيعمل إيه على موقع البنك؟',
    tags: [['الأمن السيبراني · Cybersecurity', 'good']],
    tip: 'الأمن السيبراني هو علم حماية الأجهزة والشبكات والبيانات، وده اسم الوحدة دي كلها.',
    build: W.flips({
      cards: [
        { front: '<div class="big">🎓</div><b>على المنصة</b><span>الهاكر خد كلمة السر… هيعمل إيه؟</span><small>دوس واكتشف</small>',
          back: '<div class="big">😒</div><span>هيفتح حسابك ويتفرج على الفيديوهات</span><b>مزعج… بس مش كارثة</b>' },
        { front: '<div class="big">🏦</div><b>على موقع البنك</b><span>الهاكر خد كلمة السر… هيعمل إيه؟</span><small>دوس واكتشف</small>',
          back: '<div class="big">😱</div><span>كل مرة تفتح حسابك، كل حاجة بتبقى باينة قدامه</span><b style="color:var(--danger)">هياخد بياناتك… ويسحب فلوسك!</b>' }
      ],
      reveal: { html: '🛡️ هنا ظهر <b>الأمن السيبراني</b>: تقنيات قوية بتحمي البيانات وهي ماشية في السكة.<br>وأول تقنية هنشوفها: <b>HTTPS</b>', btn: 'يلا نشوف الحل ←', go: [1, 0] }
    })
  }
];


/* ═══════════════ المحور الأول: مصافحة TLS ═══════════════ */

const STAGE = `
  <section class="stage" id="stage" data-wire="neutral">
    <div class="node" id="client">
      <div class="icon">💻</div><div class="name">المتصفح</div><div class="addr">https://mybank.com</div>
      <div class="pocket" id="pc"></div><ul class="checks" id="checks"></ul>
      <div class="bench" id="cbench"></div><div class="bubble" id="cb"></div>
    </div>
    <div class="wire"><div class="line" id="line"></div><div class="wire-label" id="wireLabel">الإنترنت</div></div>
    <div class="node" id="server">
      <div class="icon">🖥️</div><div class="name">سيرفر البنك</div><div class="addr">mybank.com</div>
      <div class="pocket" id="ps"></div><div class="bench" id="sbench"></div><div class="bubble" id="sb"></div>
    </div>
    <div class="attacker">
      <div class="icon">🕵️</div><div class="name">مهاجم على نفس شبكة الواي فاي… شايف إيه؟</div>
      <div class="sees" id="sees">—</div>
    </div>
  </section>`;

const CHIPS = {
  suites: '📋 طرق التشفير اللي أعرفها',
  cert: '📜 الشهادة الرقمية',
  pub: '🔓 المفتاح العام = قفل مفتوح',
  priv: '🗝️ المفتاح الخاص = مفتاح القفل',
  secret: '🎲 السر العشوائي',
  session: '🔑 مفتاح الجلسة'
};

function addChip(el, k, anim = true) {
  const d = document.createElement('span');
  d.className = 'chip chip-' + k + (anim ? ' pop' : '');
  d.textContent = CHIPS[k];
  el.appendChild(d);
}
function setState(s) {
  s.c.forEach(k => addChip($('pc'), k, false));
  s.s.forEach(k => addChip($('ps'), k, false));
  $('stage').dataset.wire = s.wire;
  $('wireLabel').textContent = { plain: 'HTTP: مكشوف', neutral: 'الإنترنت', secure: '🔒 قناة مشفرة' }[s.wire];
  $('cbench').innerHTML = s.cbench || ''; $('sbench').innerHTML = s.sbench || '';
}
// طاولة الشغل تحت كل طرف: بتعرض اللي بيحصل جوه الجهاز (قفل، فتح، حساب)
const item = (html, note) => `<span class="item">${html}${note ? ` <small>${note}</small>` : ''}</span>`;
function bench(id, html) { const b = $(id); b.innerHTML = html; pop(b); }
const BOX = item('📦🔒', 'جواه السر');
function sees(html, cls) { const s = $('sees'); s.className = 'sees ' + cls; s.innerHTML = html; }
function bubble(id, text) { $(id).textContent = text; $(id).className = 'bubble show'; }

// رسالة بين المتصفح والسيرفر على مستوى الخط
async function fly(t, from, html, cls, dur = 1800, onMid) {
  dur *= SLOW;
  const st = $('stage'), r = st.getBoundingClientRect();
  const A = $(from === 'c' ? 'client' : 'server').querySelector('.icon').getBoundingClientRect();
  const B = $(from === 'c' ? 'server' : 'client').querySelector('.icon').getBoundingClientRect();
  const L = $('line').getBoundingClientRect();
  const p = document.createElement('div');
  p.className = 'packet ' + (cls || ''); p.innerHTML = html; st.appendChild(p);
  const w = p.offsetWidth, h = p.offsetHeight;
  const y = L.top + L.height / 2 - r.top - h / 2;
  const x0 = A.left + A.width / 2 - r.left - w / 2, x1 = B.left + B.width / 2 - r.left - w / 2;
  const clamp = x => Math.max(4, Math.min(r.width - w - 4, x));
  const at = f => `translate(${clamp(x0 + (x1 - x0) * f)}px, ${y}px)`;
  const a = p.animate([
    { transform: at(0) + ' scale(.5)', opacity: 0 },
    { transform: at(.15), opacity: 1, offset: .15 },
    { transform: at(.85), opacity: 1, offset: .85 },
    { transform: at(1) + ' scale(.5)', opacity: 0 }
  ], { duration: dur, easing: 'linear', fill: 'forwards' });
  if (onMid) wait(dur / 2).then(() => { if (t === run) onMid(); });
  await a.finished; p.remove(); alive(t);
}

const SK = ['cert', 'pub', 'priv'];
const TLS = [
  {
    dot: '٠', label: 'قبل المصافحة', title: 'الأول: من غير TLS (HTTP عادي)',
    text: 'لو الموقع شغّال HTTP بس، البيانات بتمشي على الشبكة نص عادي. أي حد في السكة، زي مهاجم على نفس الواي فاي، يقدر يقراها زي ما هي.',
    tags: [['مفيش حماية', 'bad']],
    tip: 'ده نفس اللي شفته في المحور التمهيدي 👀 الخط الأحمر المتقطّع معناه إن الاتصال مكشوف.',
    state: { c: [], s: [], wire: 'plain' },
    async play(t) {
      await fly(t, 'c', 'كلمة السر: 1234', 'plain', 2000, () => sees('كلمة السر: 1234 😈', 'bad'));
      bubble('sb', 'وصلت: كلمة السر 1234');
    }
  },
  {
    dot: '١', title: 'المتصفح يبدأ: «أهلاً» (Client Hello)',
    text: 'عشان كده بنستخدم HTTPS = HTTP + TLS. أول ما تفتح الموقع، المتصفح بيبعت للسيرفر «أهلاً» ومعاها طرق التشفير اللي يعرفها. الرسالة دي مش سر، فعادي إن المهاجم يشوفها.',
    tags: [['بداية المصافحة']],
    tip: '<b>HTTPS = HTTP + TLS</b> · و<b>TLS</b> (أمان طبقة النقل) هو النسخة المطوّرة من <b>SSL</b> القديم.',
    state: { c: ['suites'], s: SK, wire: 'neutral' },
    async play(t) {
      await fly(t, 'c', '👋 أهلاً + 📋 طرق التشفير', '', 1900, () => sees('«أهلاً» وطرق تشفير… عادي، مفيش سر', 'meh'));
    }
  },
  {
    dot: '٢', title: 'السيرفر يرد: «أهلاً، هنستخدم الطريقة دي»',
    text: 'السيرفر بيختار طريقة تشفير من اللي المتصفح يعرفها، وبيرد بـ«أهلاً». لاحظ إن السيرفر عنده من الأول حاجتين: قفل مفتوح 🔓 (المفتاح العام)، والمفتاح بتاعه 🗝️ (المفتاح الخاص).',
    tags: [['اتفاق على طريقة التشفير']],
    state: { c: ['suites'], s: SK, wire: 'neutral' },
    async play(t) {
      await fly(t, 's', '👋 أهلاً + ✅ هنستخدم الطريقة دي', '', 1900, () => sees('اتفقوا على طريقة… برضه مش سر', 'meh'));
    }
  },
  {
    dot: '٣', title: 'السيرفر يبعت الشهادة ومعاها القفل المفتوح 🔓',
    text: 'السيرفر بيبعت شهادته الرقمية، وجواها المفتاح العام. تخيّل المفتاح العام كأنه قفل مفتوح: أي حد ياخده ويقفل بيه، بس محدش يقدر يفتحه غير صاحب المفتاح الخاص 🗝️. والمفتاح الخاص عمره ما بيخرج من السيرفر.',
    tags: [['التشفير بالمفتاح العام'], ['المفتاح الخاص مش بيتبعت', 'warn']],
    trap: 'المفتاح الخاص 🗝️ عمره ما بيخرج من السيرفر. اللي بيتبعت هو المفتاح العام بس، وبيكون جوه الشهادة.',
    state: { c: ['suites'], s: SK, wire: 'neutral' },
    async play(t) {
      await fly(t, 's', '📜 الشهادة + 🔓 القفل المفتوح', 'pub', 2200, () => sees('شاف القفل المفتوح… بس ده عام، مش هيفيده', 'meh'));
      addChip($('pc'), 'cert'); addChip($('pc'), 'pub');
    }
  },
  {
    dot: '٤', title: 'المتصفح يتحقق من الشهادة',
    text: 'قبل ما يستخدم القفل، المتصفح لازم يتأكد إنه قفل السيرفر الحقيقي مش قفل واحد نصّاب. فبيتأكد إن الشهادة سليمة وبتاعة الموقع اللي إنت طالبه. لو أي شرط فشل، هيوقفك برسالة «الاتصال غير آمن».',
    tags: [['التحقق من الهوية']],
    tip: 'الشهادة الرقمية زي البطاقة الشخصية بتاعة الموقع 📜: بتثبت إنه هو نفسه، مش حد منتحل اسمه.',
    trap: 'الشهادة الرقمية = التحقق من <b>هوية الخادم واسم النطاق</b>. متلخبطهاش مع التوقيع الرقمي.',
    state: { c: ['cert', 'pub'], s: SK, wire: 'neutral' },
    async play(t) {
      const items = ['صادرة من جهة موثوقة', 'لسه صالحة ومش منتهية', 'اسم الموقع = mybank.com'];
      for (const it of items) {
        const li = document.createElement('li'); li.innerHTML = '<b>✓</b> ' + it;
        $('checks').appendChild(li);
        await wait(80); alive(t); li.classList.add('show');
        await wait(1100); alive(t);
      }
      bubble('cb', 'القفل ده بتاع البنك فعلًا ✓');
    }
  },
  {
    dot: '٥', title: 'المتصفح يعمل سر عشوائي 🎲',
    text: 'دلوقتي المتصفح بيعمل رقم سري عشوائي جديد عنده. الرقم ده هو اللي هيتعمل منه مفتاح الجلسة بعدين، فلازم يوصل للسيرفر من غير ما حد غيره يشوفه.',
    tags: [['لسه مفيش حاجة اتبعتت']],
    state: { c: ['cert', 'pub'], s: SK, wire: 'neutral' },
    async play(t) {
      bench('cbench', item('🎲', 'بيتعمل…'));
      await wait(1300); alive(t);
      bench('cbench', item('🎲 7f3a…', 'سر جديد'));
      addChip($('pc'), 'secret');
    }
  },
  {
    dot: '٦', title: 'المتصفح يقفل السر بقفل السيرفر 🔒',
    text: 'المتصفح بيحط السر في صندوق، ويقفله بالقفل المفتوح اللي جاله من السيرفر (المفتاح العام). من اللحظة دي، حتى المتصفح نفسه مش هيقدر يفتح الصندوق تاني. المفتاح الوحيد اللي يفتحه هو المفتاح الخاص، وده عند السيرفر بس.',
    tags: [['التشفير بالمفتاح العام'], ['اللي يقفل ≠ اللي يفتح', 'warn']],
    tip: 'القفل المفتوح 🔓 أي حد يقدر يقفل بيه… بس محدش يفتحه غير صاحب المفتاح 🗝️.',
    state: { c: ['cert', 'pub', 'secret'], s: SK, wire: 'neutral' },
    async play(t) {
      bench('cbench', item('🎲', 'السر'));
      await wait(1100); alive(t);
      bench('cbench', item('🎲') + ' ➜ ' + item('📦', 'صندوق'));
      await wait(1300); alive(t);
      bench('cbench', item('📦') + ' + ' + item('🔓', 'القفل العام'));
      await wait(1300); alive(t);
      bench('cbench', BOX);
      bubble('cb', 'اتقفل ✓');
    }
  },
  {
    dot: '٧', title: 'الصندوق المقفول يتبعت على الشبكة 📦🔒',
    text: 'المتصفح بيبعت الصندوق المقفول للسيرفر. المهاجم ممكن يشوف الصندوق، ومعاه كمان نسخة من القفل لأنه عام، بس ده مش هيفيده: القفل بيقفل بس، والفتح محتاج المفتاح الخاص اللي مش معاه.',
    tags: [['التشفير بالمفتاح العام'], ['المهاجم مش معاه المفتاح الخاص', 'good']],
    state: { c: ['cert', 'pub', 'secret'], s: SK, wire: 'neutral', cbench: BOX },
    async play(t) {
      await fly(t, 'c', '📦🔒 صندوق مقفول', 'pub', 2200, () => sees('صندوق مقفول 🔒… ومعيش مفتاحه 😤', 'good'));
      bench('sbench', BOX);
    }
  },
  {
    dot: '٨', title: 'السيرفر يفتح الصندوق بالمفتاح الخاص 🗝️',
    text: 'السيرفر هو الوحيد اللي معاه المفتاح الخاص، فبيفتح بيه الصندوق وياخد السر. دلوقتي الطرفين معاهم نفس السر، والسر عدّى على الشبكة وهو مقفول طول الوقت.',
    tags: [['التشفير بالمفتاح العام'], ['الفتح بالمفتاح الخاص بس', 'warn']],
    state: { c: ['cert', 'pub', 'secret'], s: SK, wire: 'neutral', sbench: BOX },
    async play(t) {
      await wait(900); alive(t);
      bench('sbench', BOX + ' + ' + item('🗝️', 'المفتاح الخاص'));
      await wait(1400); alive(t);
      bench('sbench', item('📦🔓', 'اتفتح'));
      await wait(1200); alive(t);
      bench('sbench', item('🎲 7f3a…', 'نفس السر'));
      addChip($('ps'), 'secret');
      bubble('sb', 'وصلني السر ✓');
    }
  },
  {
    dot: '٩', title: 'كل طرف يشتق مفتاح الجلسة عنده 🔑',
    text: 'كل طرف بيحسب مفتاح الجلسة من السر عنده على جهازه، فبيطلع نفس المفتاح عند الاتنين. ⚠️ مفتاح الجلسة نفسه عمره ما اتبعت على الشبكة. اللي اتبعت هو السر، وكان جوه صندوق مقفول.',
    tags: [['اشتقاق مفاتيح الجلسة'], ['مفتاح الجلسة مش بيتبعت', 'warn']],
    trap: 'سؤال بيتكرر كتير: مفتاح الجلسة <b>مش بيتبعت</b> على الشبكة خالص، حتى لو مشفر. كل طرف بيشتقّه عنده.',
    state: { c: ['cert', 'pub', 'secret'], s: SK.concat('secret'), wire: 'neutral' },
    async play(t) {
      bench('cbench', item('🎲')); bench('sbench', item('🎲'));
      await wait(1000); alive(t);
      bench('cbench', item('🎲') + ' ➜ ⚙️'); bench('sbench', item('🎲') + ' ➜ ⚙️');
      await wait(1300); alive(t);
      bench('cbench', item('🔑', 'مفتاح الجلسة')); bench('sbench', item('🔑', 'مفتاح الجلسة'));
      addChip($('pc'), 'session'); addChip($('ps'), 'session');
      sees('ولا حاجة جديدة عدّت على الشبكة 🤷', 'good');
    }
  },
  {
    dot: '١٠', title: 'اختبار أخير: «خلصنا؟» بمفتاح الجلسة',
    text: 'كل طرف بيبعت رسالة «خلصنا» مشفرة بمفتاح الجلسة. لو الطرف التاني قدر يفكّها، يبقى المفتاحين متطابقين فعلًا، والمصافحة خلصت والقناة بقت آمنة.',
    tags: [['نهاية المصافحة', 'good']],
    state: { c: ['cert', 'session'], s: SK.concat('session'), wire: 'neutral' },
    async play(t) {
      const g1 = gib();
      await fly(t, 'c', '🔒 ' + g1, 'enc', 1900, () => sees('<span class="gib">' + g1 + '</span> ؟؟', 'good'));
      bubble('sb', 'فكّيتها: «خلصنا» ✓');
      const g2 = gib();
      await fly(t, 's', '🔒 ' + g2, 'enc', 1900, () => sees('<span class="gib">' + g2 + '</span> ؟؟', 'good'));
      bubble('cb', 'فكّيتها: «خلصنا» ✓');
      await wait(500); alive(t);
      $('stage').dataset.wire = 'secure'; $('wireLabel').textContent = '🔒 قناة مشفرة';
    }
  },
  {
    dot: '١١', title: 'تبادل البيانات بأمان',
    text: 'خلصت المصافحة. البيانات دلوقتي بتتشفر بمفتاح الجلسة بالتشفير المتماثل، لأنه سريع وكفء مع البيانات الكتير. أما التشفير بالمفتاح العام فبطيء، فاستخدمناه في المصافحة بس عشان نوصّل السر. والمهاجم مش بيشوف غير كلام ملخبط مالوش معنى.',
    tags: [['التشفير المتماثل', 'good'], ['السرية', 'good'], ['السلامة', 'good'], ['التحقق من الهوية', 'good']],
    tip: 'تشبيه المترجم: في الأول بتستعينوا بمترجم موثوق 🐢 (المفتاح العام)، وبعد ما تتعرفوا بيبقى ليكم لغة سرية ⚡ (مفتاح الجلسة).',
    trap: 'ليه منشفّرش كل حاجة بالمفتاح العام؟ لأنه <b>بطيء</b>. والإجابة لازم يبقى فيها كلمتين: <b>الأمان والكفاءة</b>.',
    state: { c: ['cert', 'session'], s: SK.concat('session'), wire: 'secure' },
    async play(t) {
      bubble('cb', 'هبعت: كلمة السر 1234');
      await wait(700); alive(t);
      const g1 = gib();
      await fly(t, 'c', '🔒 ' + g1, 'enc', 2000, () => sees('<span class="gib">' + g1 + '</span> ؟؟ 😵', 'good'));
      bubble('sb', 'فكّ التشفير: كلمة السر 1234 ✓');
      await wait(600); alive(t);
      const g2 = gib();
      await fly(t, 's', '🔒 ' + g2, 'enc', 2000, () => sees('<span class="gib">' + g2 + '</span> ؟؟ 😵', 'good'));
      bubble('cb', 'فكّ التشفير: تم تسجيل الدخول ✓');
    }
  },
  {
    dot: '🧩', label: 'تمرين', title: 'رتّب خطوات المصافحة 🧩',
    text: 'الخطوات اتلخبطت! دوس على الخطوات بالترتيب الصح، من أول «أهلاً» لحد تبادل البيانات.',
    tags: [['تمرين', 'warn']],
    tip: 'لو اتلخبطت، افتكر الحكاية: اتعرّفوا ← اتأكدوا من بعض ← اتفقوا على سر ← اتكلموا بلغة سرية.',
    build: W.order({
      first: 'دوس على أول خطوة في المصافحة 👆',
      items: [
        '👋 المتصفح يقول «أهلاً» ويبعت طرق التشفير اللي يعرفها',
        '✅ السيرفر يرد ويختار طريقة تشفير',
        '📜 السيرفر يبعت الشهادة الرقمية ومعاها القفل المفتوح 🔓',
        '🔍 المتصفح يتحقق من الشهادة',
        '📦🔒 المتصفح يبعت سر عشوائي مقفول بقفل السيرفر',
        '🔑 كل طرف يشتق مفتاح الجلسة عنده',
        '💬 تبادل البيانات بالتشفير المتماثل'
      ]
    })
  },
  {
    dot: '📝', label: 'سؤال على نمط الامتحان', title: 'سؤال على نمط الامتحان · ص 35',
    text: 'فكّر واكتب إجابتك بأسلوبك، ودوس «صحّحلي» عشان تعرف غطّيت أنهي أفكار. وبعدين قارن إجابتك بالإجابة النموذجية.',
    tags: [['6 درجات', 'warn']],
    trap: 'لازم تذكر الكلمتين: <b>الأمان</b> (المفتاح العام) و<b>الكفاءة</b> (التشفير المتماثل).',
    build: W.essay({
      badge: 'ص 35 · 6 درجات',
      q: 'اشرح لماذا يستخدم TLS آليات المفتاح العام للمصادقة والاتفاق الآمن على مفاتيح الجلسة، ثم يستخدم التشفير المتماثل لحماية بيانات الجلسة.',
      hint: 'استعن بـ: الأمان والكفاءة',
      ideas: [
        ['ذكرت <b>الأمان</b>', /امان|امن|حمايه|يحمي/],
        ['المفتاح العام بيعمل <b>مصادقة</b> على الخادم (الشهادة)', /مصادق|تحقق|شهاده|هويه/],
        ['الاتفاق الآمن على <b>مفاتيح الجلسة</b>', /جلسه/],
        ['المفتاح العام <b>بطيء</b>', /بطي/],
        ['ذكرت <b>الكفاءة</b> والسرعة (التشفير المتماثل)', /كفاء|سريع|سرعه|اسرع/]
      ],
      model: [
        ['الأمان', 'آليات المفتاح العام والشهادة بتسمح بالمصادقة على الخادم، والاتفاق الآمن على مفاتيح الجلسة، من غير ما المفتاح نفسه يتبعت على الشبكة.'],
        ['الكفاءة', 'تبادل كل البيانات بالتشفير بالمفتاح العام هيكون بطيء، فبعد إنشاء مفاتيح الجلسة بيُستخدم التشفير المتماثل عشان يحمي بيانات الجلسة بسرعة وكفاءة.'],
        ['الخلاصة', 'المفتاح العام للبداية الآمنة 🐢، والتشفير المتماثل للكلام السريع بعدها ⚡.']
      ]
    })
  }
];
// خطوات المصافحة بترسم المسرح جوه اللوحة، وتحط الحالة، وتشغّل الحركة
TLS.forEach(s => { if (s.state) s.build = async (b, t) => { b.innerHTML = STAGE; setState(s.state); sees('—', ''); await s.play(t); }; });


/* ═══════════════ المحور الثاني: المصادقة ═══════════════ */

const CATS = {
  k: { e: '🧠', n: 'المعرفة', d: 'حاجة تعرفها', color: 'var(--info)' },
  h: { e: '✋', n: 'الحيازة', d: 'حاجة معاك', color: 'var(--accent)' },
  b: { e: '🧬', n: 'السمات الحيوية', d: 'حاجة فيك', color: 'var(--bio)' }
};
const FACTORS = [
  { k: 'pw', e: '🔑', n: 'كلمة المرور', c: 'k', why: 'كلمة السر حاجة في دماغك 🧠' },
  { k: 'q', e: '❓', n: 'السؤال السري', c: 'k', why: 'إجابة السؤال السري حاجة بتعرفها 🧠' },
  { k: 'pin', e: '🔢', n: 'رقم PIN', c: 'k', why: 'رقم PIN بتحفظه في دماغك 🧠' },
  { k: 'otp', e: '📩', n: 'كلمة مرور لمرة واحدة (OTP)', c: 'h', why: 'OTP إنت بتكتبه آه… بس هو بيثبت إن الموبايل معاك ✋' },
  { k: 'sms', e: '💬', n: 'كود عبر SMS', c: 'h', why: 'الكود بيوصل على موبايلك، يعني بيثبت إن الموبايل معاك ✋' },
  { k: 'app', e: '📲', n: 'تطبيق المصادقة', c: 'h', why: 'التطبيق على موبايلك، يعني حاجة معاك ✋' },
  { k: 'card', e: '💳', n: 'البطاقة الذكية (IC)', c: 'h', why: 'البطاقة حاجة في إيدك ✋' },
  { k: 'finger', e: '👆', n: 'بصمة الإصبع', c: 'b', why: 'البصمة حاجة في جسمك 🧬' },
  { k: 'face', e: '🧑', n: 'التعرف على الوجه', c: 'b', why: 'وشّك حاجة فيك 🧬' }
];
const F = Object.fromEntries(FACTORS.map(f => [f.k, f]));
const SERVICES = [
  { e: '🏦', n: 'الخدمات المصرفية عبر الإنترنت', f: [['🔑 كلمة المرور', 'k'], ['📩 كلمة مرور لمرة واحدة', 'h']] },
  { e: '💬', n: 'وسائل التواصل الاجتماعي', f: [['🔑 كلمة المرور', 'k'], ['💬 مصادقة عبر SMS', 'h']] },
  { e: '🏢', n: 'الدخول إلى مبنى مؤمَّن', f: [['💳 بطاقة دخول', 'h'], ['👆 بصمة إصبع', 'b']] },
  { e: '🛒', n: 'التسوق الإلكتروني', f: [['🔑 كلمة المرور', 'k'], ['💳 التحقق من بطاقة الائتمان', 'h']] }
];

const AUTH = [
  {
    title: 'الهاكر معاه كلمة السر… هيعرف يدخل؟',
    text: 'HTTPS حمى كلمة السر وهي ماشية. بس لو اتسرّبت من مكان تاني؟ دوس «الهاكر يحاول يدخل» والمصادقة الثنائية مطفية، وبعدين شغّلها وجرّب تاني.',
    tags: [['المصادقة · Authentication']],
    tip: 'المصادقة = إنك تثبت إنك إنت فعلًا، قبل ما النظام يدّيك حق الدخول.',
    build(b, t) {
      b.innerHTML = sceneHTML([
        { n: 'h', icon: '🕵️', name: 'الهاكر', extra: '<div class="mini" data-hs></div>' },
        { n: 's', icon: '🖥️', name: 'سيرفر المنصة', extra: '<div class="status" data-sv></div>' },
        { n: 'o', icon: '📱', name: 'موبايل أحمد', role: 'صاحب الحساب', extra: '<div class="mini" data-os></div>' }
      ], [{}, {}]) + `
      <div class="btn-row"><button data-sw></button><button class="primary" data-go>😈 الهاكر يحاول يدخل</button></div>
      <div class="verdict" data-v></div>`;
      const Q = s => b.querySelector(s), I = k => Q(`[data-n="${k}"]`);
      const hs = Q('[data-hs]'), os = Q('[data-os]'), sv = Q('[data-sv]'), v = Q('[data-v]'), btn = Q('[data-go]');
      let busy = false;
      const reset = () => {
        tone(hs, '👤 ahmed<br>🔑 1234 <small>(مسروقة)</small>', '');
        tone(os, '📵 مفيش إشعارات', '');
        tone(sv, sw && sw.on ? '🔒 HTTPS + 📱 2FA' : '🔒 HTTPS بس', '');
        tone(v, '', '');
      };
      const sw = toggle(Q('[data-sw]'), on => 'المصادقة الثنائية: ' + (on ? 'شغالة ✓' : 'مطفية'), reset);
      reset();
      btn.onclick = safe(async () => {
        if (busy) return; busy = true; btn.disabled = Q('[data-sw]').disabled = true;
        reset(); tone(sv, '🔍 بيتحقق…', 'meh');
        await glide(t, b, I('h'), I('s'), '🔑 ahmed · 1234', 'plain', 1600);
        if (!sw.on) {
          tone(sv, 'كلمة السر صح ✓', 'good');
          await wait(500); alive(t);
          await glide(t, b, I('s'), I('h'), '✅ اتفضل', 'good', 1400);
          tone(hs, '😈 دخلت الحساب!', 'bad');
          tone(v, '😱 الهاكر دخل بكلمة السر لوحدها! يعني كلمة السر لوحدها مش كفاية… شغّل المصادقة الثنائية وجرّب تاني', 'bad');
        } else {
          tone(sv, 'كلمة السر صح ✓<br>فاضل الكود…', 'meh');
          const code = String(Math.random() * 900000 + 100000 | 0);
          await glide(t, b, I('s'), I('o'), '📩 ' + code, 'pub', 1500);
          tone(os, `📩 كود الدخول: <b dir="ltr">${code}</b><br>🚨 حد بيحاول يدخل حسابك!`, 'warn');
          await glide(t, b, I('s'), I('h'), '🔢 اكتب الكود', 'pub', 1400);
          tone(hs, '🤔 الكود؟؟<br>مش معايا الموبايل 😤', 'meh');
          await wait(1000); alive(t);
          await glide(t, b, I('h'), I('s'), '🔢 000000؟', 'plain', 1300);
          tone(sv, '❌ كود غلط · الدخول اترفض', 'bad');
          tone(hs, '😤 اتقفلت في وشّي!', 'bad');
          tone(v, '🛡️ الحساب في أمان: الهاكر معاه حاجة <b>بيعرفها</b> (كلمة السر)، بس مش معاه حاجة <b>في إيد</b> صاحب الحساب (الموبايل)', 'good');
          confetti(b);
        }
        busy = false; btn.disabled = Q('[data-sw]').disabled = false;
      });
    }
  },
  {
    title: 'صنّف العوامل: كل عامل من أنهي فئة؟',
    text: 'فيه 3 فئات تثبت بيها إنك إنت: حاجة <b>تعرفها</b>، وحاجة <b>معاك</b>، وحاجة <b>فيك</b>. دوس على الفئة الصح لكل عامل يظهرلك.',
    tags: [['المعرفة'], ['الحيازة', 'warn'], ['السمات الحيوية']],
    tip: '🧠 في دماغك = معرفة · ✋ في إيدك = حيازة · 🧬 في جسمك = سمات حيوية',
    trap: 'OTP وSMS إنت بتكتبهم آه… بس هما بيثبتوا إن الموبايل <b>معاك</b>، يعني <b>حيازة</b> مش معرفة.',
    build: W.sorter({ cats: CATS, items: FACTORS })
  },
  {
    title: 'هل ده مصادقة ثنائية؟ 🤔',
    text: 'اختار عاملين أو تلاتة، والصفحة هتقولك ده 2FA ولا لأ. القاعدة: <b>2FA</b> = عاملين مستقلين من <b>فئتين مختلفتين</b>، و<b>MFA</b> = عاملين أو أكثر من فئات مختلفة.',
    tags: [['المصادقة الثنائية (2FA)'], ['متعددة العوامل (MFA)']],
    trap: 'فخ بيتكرر كل سنة: كلمة مرور + سؤال سري (أو كلمتين مرور) <b>مش</b> 2FA، لأن الاتنين «معرفة». ده اسمه مصادقة متعددة الخطوات بنفس العامل.',
    build(b) {
      b.innerHTML = `
      <div class="pick">${FACTORS.map(f => `<button class="fchip" aria-pressed="false" data-k="${f.k}">${f.e} ${f.n}</button>`).join('')}</div>
      <div class="presets"><span>جرّب:</span>
        <button data-pre="pw,q">🔑 + ❓</button><button data-pre="pw,otp">🔑 + 📩</button>
        <button data-pre="card,finger">💳 + 👆</button><button data-pre="pw,card,face">🔑 + 💳 + 🧑</button></div>
      <div class="eq" data-eq></div>
      <div class="verdict big" data-v>اختار عاملين أو تلاتة 👆</div>`;
      const Q = s => b.querySelector(s), v = Q('[data-v]');
      let sel = [];
      const upd = () => {
        b.querySelectorAll('.fchip').forEach(c => c.setAttribute('aria-pressed', sel.includes(c.dataset.k)));
        Q('[data-eq]').innerHTML = sel.map(k => { const f = F[k], c = CATS[f.c]; return `<span class="tok cat-${f.c} pop">${f.e} ${f.n}<small>${c.e} ${c.n}</small></span>`; }).join('<b class="plus">+</b>');
        const cats = [...new Set(sel.map(k => F[k].c))];
        if (sel.length < 2) return tone(v, sel.length ? 'اختار عامل كمان 👆' : 'اختار عاملين أو تلاتة 👆', '');
        if (cats.length === 1) return tone(v, `❌ مش مصادقة ثنائية! كلهم من فئة «${CATS[cats[0]].n}»<br><small>ده اسمه مصادقة متعددة الخطوات بنفس العامل</small>`, 'bad');
        if (sel.length === 2) return tone(v, '✅ مصادقة ثنائية (2FA): عاملين مستقلين من فئتين مختلفتين', 'good');
        if (cats.length === 2) return tone(v, '✅ متعددة العوامل (MFA): فيها فئتين مختلفتين على الأقل', 'good');
        tone(v, '✅💪 متعددة العوامل (MFA): 3 عوامل من 3 فئات مختلفة!', 'good');
      };
      b.querySelectorAll('.fchip').forEach(c => c.onclick = () => {
        const k = c.dataset.k;
        if (sel.includes(k)) sel = sel.filter(x => x !== k);
        else if (sel.length === 3) { shake(c); return tone(v, 'الحد الأقصى هنا 3 عوامل · شيل واحد الأول', 'meh'); }
        else sel.push(k);
        upd();
      });
      b.querySelectorAll('[data-pre]').forEach(p => p.onclick = () => { sel = p.dataset.pre.split(','); upd(); });
    }
  },
  {
    title: 'المصادقة الثنائية في الخدمات',
    text: 'اقلب كل كارت وشوف الخدمة بتستخدم أنهي عاملين، وكل عامل من أنهي فئة. ده جدول الكتاب في ص 33–34.',
    tags: [['جدول الكتاب']],
    tip: 'خد بالك: المبنى المؤمَّن مفيهوش كلمة سر خالص! بطاقة (حيازة) + بصمة (سمات حيوية) = برضه 2FA.',
    build: W.flips({
      small: true, all: true,
      cards: SERVICES.map(s => ({
        front: `<div class="big">${s.e}</div><b>${s.n}</b><small>دوس: بتستخدم إيه؟</small>`,
        back: `<div class="chips2">${s.f.map(([n, c]) => `<span class="cat-${c}">${n}<small>${CATS[c].e} ${CATS[c].n}</small></span>`).join('')}</div><b style="color:var(--ok)">= 2FA ✓</b>`
      }))
    })
  },
  {
    label: 'سؤال على نمط الامتحان', title: 'لكل خدمة، بيّن أي مجموعة من عوامل المصادقة تُستخدم',
    text: 'اختار مجموعة العوامل الصح لكل خدمة. ولو غلطت، فكّر في كل عامل لوحده: بتعرفه؟ ولا معاك؟ ولا فيك؟',
    tags: [['تدرّب 2 · ص 35', 'warn']],
    build: W.match({
      badge: 'سؤال على نمط الامتحان · ص 35',
      q: 'لكل خدمة، بيّن أي مجموعة من عوامل المصادقة تُستخدم',
      opts: { 'أ': 'المعرفة + الحيازة', 'ب': 'المعرفة + السمات الحيوية', 'ج': 'السمات الحيوية + الحيازة' },
      rows: [
        ['كلمة مرور + كلمة مرور لمرة واحدة', 'أ', 'كلمة المرور معرفة 🧠، وOTP حيازة ✋'],
        ['كلمة مرور + مصادقة ببصمة الإصبع', 'ب', 'كلمة المرور معرفة 🧠، والبصمة سمات حيوية 🧬'],
        ['كلمة مرور + مصادقة عبر SMS', 'أ', 'كلمة المرور معرفة 🧠، وكود SMS بيوصل لموبايلك يعني حيازة ✋'],
        ['التعرف على الوجه + بطاقة IC', 'ج', 'الوجه سمات حيوية 🧬، والبطاقة حيازة ✋']
      ]
    })
  }
];


/* ═══════════════ المحور الثالث: تركيبات الأمان ═══════════════ */

const COMBO = [
  {
    title: 'التوقيع الرقمي: مين اللي بعت؟ وحد عدّل؟',
    text: 'جالك إشعار من إدارة المنصة إن الامتحان اتأجل. التشفير بيمنع القراءة، بس مبيقولكش مين اللي بعت. جرّب الأزرار الأربعة وشوف التوقيع الرقمي بيعمل إيه.',
    tags: [['التوقيع الرقمي · Digital Signature'], ['عدم التنصل · Non-repudiation']],
    tip: 'التوقيع الرقمي زي إمضتك على ورقة ✍️: بيثبت إنك إنت اللي بعت، ولو حد غيّر حرف واحد هيبان، ومتقدرش تقول «مش أنا».',
    trap: 'التوقيع ≠ الشهادة: <b>الشهادة</b> بتثبت هوية الخادم واسم النطاق، و<b>التوقيع</b> بيكتشف التلاعب وانتحال الشخصية، وبيدعم عدم التنصل.',
    build(b, t) {
      b.innerHTML = `
      <div class="scene trio">
        <div class="node"><div class="icon" data-n="a">🏫</div><div class="name">إدارة المنصة</div><div class="mini" data-as></div></div>
        <div class="wire"><div class="line"></div><div class="wire-label">الإنترنت</div></div>
        <div class="node"><div class="icon" data-n="r">📱</div><div class="name">موبايلك</div><div class="mini" data-rs></div></div>
        <div class="attacker"><div class="icon" data-n="x">🕵️</div><div class="name">هاكر في السكة</div><div class="sees" data-xs>—</div></div>
      </div>
      <div class="btn-row">
        <button data-a="send">📨 ابعت الرسالة الأصلية</button>
        <button data-a="tamper">✏️ الهاكر يعدّل في السكة</button>
        <button data-a="fake">🎭 الهاكر ينتحل الإدارة</button>
        <button data-a="deny">🙊 الإدارة تنكر</button>
      </div>
      <div class="verdict" data-v>جرّب الأول «ابعت الرسالة الأصلية» 👆</div>`;
      const Q = s => b.querySelector(s), I = k => Q(`[data-n="${k}"]`);
      const as = Q('[data-as]'), rs = Q('[data-rs]'), xs = Q('[data-xs]'), v = Q('[data-v]'), btns = b.querySelectorAll('[data-a]');
      const MSG = '📢 امتحان الشهر اتأجل ليوم <b>الخميس</b>', SIG = '<br><span class="sig">✍️ توقيع الإدارة</span>';
      const reset = () => { tone(as, MSG + SIG, ''); tone(rs, '📭 مستني رسايل', ''); tone(xs, '—', ''); };
      reset();
      const verify = async (msg, ok, why) => {
        tone(rs, msg + '<br><span class="sig">🔍 بيتحقق من التوقيع…</span>', 'meh');
        await wait(1300); alive(t);
        tone(rs, msg + `<br><span class="sig">${ok ? '✅ التوقيع سليم' : '❌ التوقيع مش مطابق'}</span>`, ok ? 'good' : 'bad');
        tone(v, (ok ? '✅ ' : '🚨 ') + why, ok ? 'good' : 'bad');
      };
      const ACT = {
        async send() {
          await glide(t, b, I('a'), I('r'), '📢 …الخميس ✍️', 'pub', 1900, () => tone(xs, 'شاف الرسالة… ومعملش حاجة', 'meh'));
          await verify(MSG, true, 'التوقيع سليم: الرسالة من الإدارة فعلًا، ومحدش عدّل فيها');
        },
        async tamper() {
          await glide(t, b, I('a'), I('r'), '📢 …الخميس ✍️', 'pub', 2200, p => {
            p.innerHTML = '📢 …السبت ✍️'; p.className = 'packet plain';
            tone(xs, '✏️ غيّرت «الخميس» ← «السبت» 😈', 'bad');
          });
          await verify('📢 امتحان الشهر اتأجل ليوم <b>السبت</b>', false, 'التوقيع مش مطابق للرسالة، يعني حد عدّل فيها في السكة! متصدّقهاش');
        },
        async fake() {
          tone(xs, '🎭 هبعت باسم الإدارة 😈', 'bad');
          await glide(t, b, I('x'), I('r'), '📢 الامتحان اتلغى 🎉 ✍️؟', 'plain', 1900);
          await verify('📢 الامتحان <b>اتلغى</b> 🎉', false, 'التوقيع مش بتاع الإدارة، يعني ده انتحال شخصية! متصدّقهاش');
        },
        async deny() {
          tone(rs, MSG + SIG, 'good');
          tone(as, MSG + SIG + '<br>🙊 <b>«إحنا مبعتناش حاجة!»</b>', 'warn');
          await wait(1300); alive(t);
          tone(v, '⚖️ مينفعش تنكر: الرسالة عليها توقيع الإدارة، والتوقيع ده اتعمل بالمفتاح الخاص بتاعها 🗝️ اللي محدش معاه غيرها. وده اسمه <b>عدم التنصل</b>', 'good');
        }
      };
      let busy = false;
      btns.forEach(x => x.onclick = safe(async () => {
        if (busy) return; busy = true; btns.forEach(y => y.disabled = true);
        reset(); tone(v, '', '');
        await ACT[x.dataset.a]();
        busy = false; btns.forEach(y => y.disabled = false);
      }));
    }
  },
  {
    title: 'لعبة الدروع 🛡️: صدّ الـ 4 هجمات',
    text: 'شغّل الدروع اللي تختارها ودوس «ابدأ الهجوم». كل هجمة ليها درع مخصوص بيصدّها. هتعرف تصد الأربعة؟',
    tags: [['أمان متعدد الطبقات', 'good']],
    tip: '🔒 التشفير = محدش يقرا · ✍️ التوقيع = محدش يعدّل أو ينتحل · 📜 الشهادة = الموقع هو الأصلي · 📱 2FA = كلمة السر لوحدها مش كفاية',
    build: W.shields({
      done: '🛡️ صدّيت الأربعة! ده <b>الأمان متعدد الطبقات</b>: كل تقنية بتصد تهديد مختلف',
      shields: [
        { k: 'enc', e: '🔒', n: 'التشفير' }, { k: 'sig', e: '✍️', n: 'التوقيع الرقمي' },
        { k: 'cert', e: '📜', n: 'الشهادة الرقمية' }, { k: 'tfa', e: '📱', n: 'المصادقة الثنائية' }
      ],
      threats: [
        { k: 'enc', e: '👂', n: 'التنصت', d: 'طرف ثالث بيعترض محتوى الاتصال', win: 'قرا كلمة السر: 1234 😈', block: 'شاف رموز ملهاش معنى 🤷' },
        { k: 'sig', e: '✏️', n: 'التلاعب', d: 'حد بيعدّل البيانات أثناء الاتصال', win: 'غيّر التحويل من 100 لـ 10,000 جنيه 😈', block: 'التوقيع مش مطابق ← الرسالة اترفضت' },
        { k: 'cert', e: '🎭', n: 'السيرفر المزيف', d: 'بيوجّهك لموقع مزيف بدل موقع البنك', win: 'كتبت بياناتك في الموقع المزيف 😈', block: 'الشهادة مش بتاعة الموقع ← المتصفح وقّفك ⚠️' },
        { k: 'tfa', e: '🔑', n: 'كلمة سر مسرّبة', d: 'حد معاه كلمة سرك وعايز يدخل', win: 'دخل حسابك عادي 😈', block: 'الكود راح لموبايلك ← الدخول اترفض' }
      ]
    })
  },
  {
    title: 'مثال الكتاب: شراء منتج أونلاين 🛒',
    text: 'في عملية شراء واحدة، التقنيات الأربعة بتشتغل مع بعض. دوس «الخطوة الجاية» وشوف كل تقنية بتظهر فين.',
    tags: [['مثال الكتاب']],
    tip: 'الفكرة الرئيسة: الأمان مش بييجي من تقنية واحدة، ده بييجي من <b>الجمع</b> بين التشفير والشهادات والتوقيعات والمصادقة.',
    build: W.stepper({
      steps: [
        { e: '🌐', t: 'تدخل الموقع', tech: '🔒 التشفير (HTTPS)', d: 'محدش في السكة يقرا اللي بينك وبين الموقع' },
        { e: '📜', t: 'المتصفح يتحقق', tech: '📜 الشهادة الرقمية', d: 'السيرفر ده هو الأصلي، واسم النطاق صح' },
        { e: '👤', t: 'تسجّل الدخول', tech: '📱 المصادقة الثنائية', d: 'كلمة السر + كود على موبايلك' },
        { e: '🧾', t: 'تبعت الطلب', tech: '🔒 TLS + ✍️ التوقيع', d: 'السرية والسلامة، والتوقيع الرقمي لما النظام يطلبه' }
      ],
      eq: '<span>🔒 التشفير</span> + <span>📜 الشهادة</span> + <span>✍️ التوقيع</span> + <span>📱 2FA</span> = <span class="res">🛡️ أمان متعدد الطبقات</span>'
    })
  },
  {
    title: 'فيه قفل 🔒… يبقى الموقع أمان؟',
    text: 'بص على الموقع ده كويس، وقرر: تثق فيه ولا لأ؟',
    tags: [['خد بالك', 'warn']],
    trap: 'القفل معناه إن <b>الاتصال</b> آمن، مش إن <b>محتوى الموقع</b> موثوق. والجمع بين التقنيات بيقلل المخاطر، بس مفيش حماية مطلقة.',
    build: W.choice({
      reveal: '[data-dom]',
      html: `
      <div class="browser">
        <div class="bar"><span class="dots3"><i></i><i></i><i></i></span><div class="addr">🔒 https://<b data-dom>mybank-gift.com</b>/prize</div></div>
        <div class="page"><div class="gift">🎁</div><h3>مبروك! كسبت 1000 جنيه 🎉</h3><p>اكتب رقم الكارت وكلمة السر عشان نحوّلك الفلوس</p><div class="fake-in">Card: ▢▢▢▢ ▢▢▢▢ ▢▢▢▢</div></div>
      </div>`,
      opts: [
        { t: '✓ أيوه، فيه قفل يبقى أمان', ok: false,
          fb: '😬 وقعت في الفخ! القفل 🔒 معناه إن الاتصال <b>مشفر</b>… بس مع موقع النصّاب نفسه. الشهادة بتثبت إنك بتكلم <b dir="ltr">mybank-gift.com</b> فعلًا، بس محدش ضمنلك إن صاحبه أمين. وبص على الاسم: ده مش <b dir="ltr">mybank.com</b> 👀' },
        { t: '✗ لأ، القفل مش كفاية', ok: true,
          fb: '🔥 صح! القفل معناه إن <b>الاتصال</b> آمن، مش إن <b>المحتوى</b> موثوق. الشهادة بتثبت إنك بتكلم <b dir="ltr">mybank-gift.com</b> فعلًا، بس محدش ضمنلك إن صاحبه أمين. وبص على الاسم: ده مش <b dir="ltr">mybank.com</b> 👀' }
      ]
    })
  },
  {
    label: 'سؤال على نمط الامتحان', title: 'لكل تهديد، بيّن التقنية المستخدمة أساسًا لمعالجته',
    text: 'اختار التقنية اللي بتعالج كل تهديد أساسًا. افتكر لعبة الدروع 😉',
    tags: [['تدرّب 3 · ص 37', 'warn']],
    build: W.match({
      badge: 'سؤال على نمط الامتحان · ص 37',
      q: 'لكل تهديد، بيّن التقنية المستخدمة أساسًا لمعالجته',
      opts: { 'أ': 'التشفير', 'ب': 'التوقيع الرقمي', 'ج': 'الشهادة الرقمية', 'د': 'المصادقة الثنائية (2FA)' },
      rows: [
        ['تسرّبت كلمة مرور وحدث تسجيل دخول غير مصرح به', 'د', 'العامل التاني بيمنع الدخول بكلمة السر لوحدها'],
        ['تم تعديل البيانات أثناء الاتصال', 'ب', 'التوقيع الرقمي بيكتشف التلاعب'],
        ['تم توجيه مستخدم إلى موقع إلكتروني مزيف', 'ج', 'الشهادة بتثبت هوية الخادم واسم النطاق'],
        ['تم اعتراض محتوى الاتصال من قِبل طرف ثالث', 'أ', 'التشفير بيمنع قراءة المحتوى']
      ]
    })
  }
];


/* ═══════════════ تركات وأفكار ═══════════════ */

const TRICKS = [
  {
    title: 'السؤال بيقول كده… يبقى الإجابة دي',
    text: 'اقرا الوصف، وقول الإجابة بصوت عالي قبل ما تقلب الكارت 🃏. دي أكتر أوصاف بتتكرر في الكتاب وفي كتاب التقييمات.',
    tags: [['تركات الامتحان', 'warn']],
    build: W.flips({
      small: true, all: true,
      cards: [
        ['HTTP منقول عبر اتصال TLS مؤمَّن', 'HTTPS', 'FTP · DNS · SMTP'],
        ['خطوات إنشاء الاتصال الآمن واشتقاق مفاتيح الجلسة', 'مصافحة TLS', 'التوقيع الرقمي · التشفير المتماثل'],
        ['حماية بيانات الجلسة بسرعة بعد المصافحة', 'التشفير المتماثل', 'المفتاح العام: بطيء لو اتبادلت بيه كل البيانات'],
        ['زوج مفاتيح مرتبطة: عام وخاص', 'التشفير بالمفتاح العام', 'التشفير المتماثل: مفتاح واحد عند الطرفين'],
        ['التحقق من هوية الخادم واسم النطاق', 'الشهادة الرقمية', 'التوقيع الرقمي'],
        ['يكتشف التلاعب ويدعم عدم التنصل', 'التوقيع الرقمي', 'الشهادة الرقمية · مصافحة TLS'],
        ['عاملان مستقلان من فئتين مختلفتين', 'المصادقة الثنائية (2FA)', 'MFA: عاملين «أو أكثر»'],
        ['المرسل لا يستطيع إنكار أنه أرسل الرسالة', 'عدم التنصل', 'السرية · السلامة']
      ].map(([q, a, c]) => ({
        front: `<small>لو السؤال بيقول</small><b>«${q}»</b><small>🤔 الإجابة؟</small>`,
        back: `<span class="ans">${a}</span><span class="conf">⚠️ متتلخبطش مع: ${c}</span>`
      }))
    })
  },
  {
    title: 'صح ولا غلط؟ الفخاخ اللي بتتكرر كل سنة',
    text: '10 جمل، وكل واحدة فيها فخ ممكن يقع فيه أي حد. قرر بسرعة: صح ولا غلط؟',
    tags: [['فخاخ الامتحان', 'warn']],
    build: W.trueFalse({
      items: [
        ['كلمة مرور + سؤال سري = مصادقة ثنائية', false, 'الاتنين «معرفة»، والمصادقة الثنائية لازم يبقى فيها فئتين مختلفتين'],
        ['كلمة المرور لمرة واحدة (OTP) من فئة «المعرفة» عشان إنت بتكتبها', false, 'OTP «حيازة»، زي SMS وتطبيق المصادقة والبطاقة الذكية'],
        ['بصمة الوجه من «السمات الحيوية»، والسؤال السري من «المعرفة»', true, 'بالظبط: حاجة فيك، وحاجة بتعرفها'],
        ['2FA وMFA حاجة واحدة بالظبط', false, '2FA عاملين بالظبط، وMFA عاملين «أو أكثر» من فئات مختلفة'],
        ['فئات MFA هي المفتاح العام والمفتاح الخاص وكلمة المرور', false, 'فئات MFA هي المعرفة والحيازة والسمات الحيوية'],
        ['مفتاح الجلسة بيتبعت على الشبكة بعد ما يتشفر', false, 'مفتاح الجلسة مش بيتبعت خالص، كل طرف بيشتقّه عنده'],
        ['بعد المصافحة، البيانات بتتشفر بالتشفير المتماثل عشان أسرع', true, 'التشفير المتماثل سريع وكفء، والمفتاح العام بطيء'],
        ['المفتاح الخاص بيتبعت للمتصفح جوه الشهادة الرقمية', false, 'اللي جوه الشهادة هو المفتاح العام، والمفتاح الخاص عمره ما بيخرج من السيرفر'],
        ['القفل 🔒 جنب اسم الموقع معناه إن محتوى الموقع موثوق', false, 'القفل معناه إن الاتصال آمن بس، مش إن صاحب الموقع أمين'],
        ['HTTPS + 2FA = حماية مطلقة', false, 'الجمع بين التقنيات بيقلل المخاطر بس، ومفيش حماية مطلقة']
      ]
    })
  },
  {
    title: 'الدرس كله في 3 معادلات',
    text: 'دوس على كل معادلة عشان تتبني قدامك حتة حتة. لو حفظت المعادلات دي وفهمتها، يبقى الدرس بقى في جيبك.',
    tags: [['الملخص', 'good']],
    tip: 'نرجع لسؤال البداية: كلمة السر بتاعتك راحت فين؟ اتبعتت متشفرة جوه HTTPS، ولو اتسرقت من مكان تاني، المصادقة الثنائية بتحميك.',
    build: W.equations({
      eqs: [
        { toks: [['HTTP', 'box'], ['+'], ['TLS', 'box'], ['='], ['HTTPS 🔒', 'res']], cap: 'التلاتة اللي بيتسألوا: السرية · السلامة · التحقق من هوية الخادم' },
        { toks: [['🔑 حاجة تعرفها', 'box'], ['+'], ['📩 حاجة معاك', 'box'], ['='], ['2FA ✓', 'res']], cap: 'فئتين مختلفتين = 2FA · نفس الفئة مرتين ≠ 2FA' },
        { toks: [['🔒 التشفير', 'box'], ['+'], ['📜 الشهادة', 'box'], ['+'], ['✍️ التوقيع', 'box'], ['+'], ['📱 2FA', 'box'], ['='], ['🛡️ أمان متعدد الطبقات', 'res']], cap: 'مفيش تقنية لوحدها بتكفي' }
      ],
      hooks: [
        '🔓 القفل المفتوح (المفتاح العام) أي حد يقفل بيه… والمفتاح 🗝️ (الخاص) عند السيرفر بس',
        '🐢 المترجم في الأول (المفتاح العام) ← ⚡ لغة سرية بعدها (مفتاح الجلسة)',
        '🔑 مفتاح الجلسة عمره ما بيتبعت: كل طرف بيحسبه عنده',
        '🧠 في دماغك · ✋ في إيدك · 🧬 في جسمك',
        '🔒 التشفير = محدش يقرا · ✍️ التوقيع = محدش يعدّل ولا ينكر · 📜 الشهادة = الموقع هو الأصلي',
        '🔒 القفل = اتصال آمن… مش موقع أمين'
      ]
    })
  }
];


window.LESSON = {
  eyebrow: 'تانية بكالوريا · الوحدة التانية · الأمن السيبراني · الدرس ⁦2-1⁩',
  title: 'تقنيات التشفير والمصادقة',
  chapters: [
    { icon: '🌐', eyebrow: 'المحور التمهيدي', name: 'العميل والسيرفر', steps: INTRO },
    { icon: '🤝', eyebrow: 'المحور الأول', name: 'مصافحة TLS', steps: TLS, count: 11 },
    { icon: '🔐', eyebrow: 'المحور الثاني', name: 'المصادقة', steps: AUTH },
    { icon: '🛡️', eyebrow: 'المحور الثالث', name: 'تركيبات الأمان', steps: COMBO },
    { icon: '🎯', eyebrow: 'قبل الامتحان', name: 'تركات وأفكار', steps: TRICKS }
  ]
};
