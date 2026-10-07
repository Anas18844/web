/* ============================================================
   engine.js — محرّك الصفحة التفاعلية للدرس
   الدرس بيعرّف window.LESSON في lesson.js:
     { eyebrow, title, chapters: [ { icon, eyebrow, name, count?, steps: [step] } ] }
   والخطوة:
     { title, text, tags?: [[اسم, 'good'|'bad'|'warn'|'']], tip?, trap?,
       label?, dot?, build(board, t) }
   build بترسم جوه اللوحة. أي حركة بتعدّي t لـ glide أو بتعمل alive(t) بعد wait،
   عشان الحركة تقف لوحدها لو الخطوة اتغيرت.
   التفاعلات الجاهزة في widgets.js (W.*)، والتفاصيل في README.md.
   ============================================================ */

const $ = id => document.getElementById(id);
const wait = ms => new Promise(r => setTimeout(r, ms));
let run = 0, ch = 0, cur = 0;
const alive = t => { if (t !== run) throw 'stop'; };
const ar = n => Number(n).toLocaleString('ar-EG');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
const shake = el => restart(el, 'shake');
const pop = el => restart(el, 'pop');
// أي حدث بيشغّل حركة: 'stop' معناها إن الخطوة اتغيرت، فنسكت عليها
const safe = fn => (...a) => { Promise.resolve().then(() => fn(...a)).catch(e => { if (e !== 'stop') console.error(e); }); };
function tone(el, html, cls) { el.innerHTML = html; el.dataset.tone = cls || ''; if (html) pop(el); }
const gib = (n = 10) => Array.from({ length: n }, () => '#$%&*@!?xQ7kZ9p'[Math.random() * 15 | 0]).join('');
// تطبيع النص العربي قبل المقارنة: من غير تشكيل، والألف والتاء المربوطة والياء على شكل واحد
const norm = s => s.replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');

function confetti(box) {
  const em = ['🎉', '✨', '⭐', '🔒', '💪', '🛡️'];
  for (let i = 0; i < 30; i++) {
    const s = document.createElement('span');
    s.className = 'cf'; s.textContent = em[i % em.length];
    s.style.left = Math.random() * 96 + '%';
    s.style.animationDelay = Math.random() * .6 + 's';
    s.style.fontSize = 16 + Math.random() * 18 + 'px';
    box.appendChild(s); setTimeout(() => s.remove(), 3000);
  }
}

/* ── السرعة ──
   بطء حركة الرسايل في الصفحة كلها: كل ما الرقم يكبر، الرسالة تمشي أبطأ.
   زرار السرعة تحت بيلف على الاختيارات دي، والمتصفح بيفتكر آخر اختيار. */
const SPEEDS = [[4.5, '🐌 بطيء جدًا'], [3.2, '🐢 بطيء'], [2.2, '🐇 أسرع']];
let sp = 1;
try { const s = localStorage.getItem('interactive-speed'); if (s !== null && SPEEDS[+s]) sp = +s; } catch (e) {}
let SLOW = SPEEDS[sp][0];

// رسالة بتطير من عنصر لعنصر جوه صندوق (خط مستقيم بين المركزين).
// onMid(packet) بتشتغل في نص المشوار (مثلًا الهاكر يعدّل الرسالة).
async function glide(t, box, A, B, html, cls = '', dur = 1500, onMid) {
  dur *= SLOW;
  const r = box.getBoundingClientRect(), a = A.getBoundingClientRect(), b = B.getBoundingClientRect();
  const p = document.createElement('div');
  p.className = 'packet ' + cls; p.innerHTML = html; box.appendChild(p);
  const w = p.offsetWidth, hh = p.offsetHeight;
  const cx = e => e.left + e.width / 2 - r.left - w / 2, cy = e => e.top + e.height / 2 - r.top - hh / 2;
  const ax = cx(a), ay = cy(a), bx = cx(b), by = cy(b);
  const clamp = x => Math.max(4, Math.min(r.width - w - 4, x));
  const at = f => `translate(${clamp(ax + (bx - ax) * f)}px, ${ay + (by - ay) * f}px)`;
  const an = p.animate([
    { transform: at(0) + ' scale(.5)', opacity: 0 },
    { transform: at(.12), opacity: 1, offset: .12 },
    { transform: at(.88), opacity: 1, offset: .88 },
    { transform: at(1) + ' scale(.5)', opacity: 0 }
  ], { duration: dur, easing: 'linear', fill: 'forwards' });
  if (onMid) wait(dur / 2).then(() => { if (t === run) onMid(p); });
  await an.finished; p.remove(); alive(t);
}

// مشهد أطراف في صف: [عقدة، سلك، عقدة، سلك، عقدة…]. كل عقدة أيقونتها عليها data-n،
// فالحركة بتتعمل بـ glide(t, b, I('c'), I('s'), …).
function sceneHTML(nodes, wires = [], cls = '') {
  let html = '', cols = [];
  nodes.forEach((nd, i) => {
    html += `<div class="node"><div class="icon" data-n="${nd.n}">${nd.icon}</div><div class="name">${nd.name}</div>${nd.role ? `<div class="role">${nd.role}</div>` : ''}${nd.extra || ''}</div>`;
    cols.push('1fr');
    if (i < nodes.length - 1) {
      const w = wires[i] || {};
      html += `<div class="wire"><div class="line ${w.cls || ''}"></div>${w.label ? `<div class="wire-label">${w.label}</div>` : ''}</div>`;
      cols.push(w.short ? '.6fr' : '1fr');
    }
  });
  return `<div class="scene ${cls}" style="grid-template-columns:${cols.join(' ')}">${html}</div>`;
}

// زرار تشغيل وإطفاء: <button class="switch" data-…></button>
function toggle(btn, label, onChange, on = false) {
  btn.className = 'switch'; btn.setAttribute('role', 'switch');
  const paint = () => { btn.setAttribute('aria-checked', on); btn.innerHTML = `<span class="knob"></span><span>${label(on)}</span>`; };
  btn.onclick = () => { if (btn.disabled) return; on = !on; paint(); onChange(on); };
  paint();
  return { get on() { return on; } };
}

const flipHTML = (front, back, cls = '') =>
  `<div class="flip ${cls}" tabindex="0" role="button"><div class="in"><div class="f">${front}</div><div class="bk">${back}</div></div></div>`;
function wireFlips(b, onFlip) {
  b.querySelectorAll('.flip').forEach(f => {
    const turn = () => { f.classList.toggle('on'); if (onFlip) onFlip(f); };
    f.onclick = turn;
    f.onkeydown = e => { if (e.key === 'Enter') turn(); };
  });
}


/* ═══════════════ المحرّك ═══════════════ */

let CH = [];

function stepLabel(c, s, i) {
  if (s.label) return s.label;
  if (c.count) return `الخطوة ${s.dot} من ${ar(c.count)}`;
  return `الخطوة ${ar(i + 1)} من ${ar(c.steps.length)}`;
}

function render() {
  const c = CH[ch], s = c.steps[cur];
  $('tabs').innerHTML = CH.map((x, i) =>
    `<button class="tab${i === ch ? ' on' : ''}" data-c="${i}"><span class="ti">${x.icon}</span><span><span class="tn">${x.eyebrow}</span>${x.name}</span></button>`).join('');
  $('num').textContent = `${c.eyebrow} · ${stepLabel(c, s, cur)}`;
  $('title').textContent = s.title;
  $('text').innerHTML = s.text;
  $('meta').innerHTML = (s.tags || []).map(([n, k]) => `<span class="tag ${k || ''}">${n}</span>`).join('');
  $('callouts').innerHTML =
    (s.tip ? `<div class="co tip"><span class="k">💡 فكرة</span>${s.tip}</div>` : '') +
    (s.trap ? `<div class="co trap"><span class="k">🎯 تركة امتحان</span>${s.trap}</div>` : '');
  $('dots').innerHTML = c.steps.map((x, i) =>
    `<button class="dot${i === cur ? ' on' : i < cur ? ' done' : ''}" data-i="${i}" title="${esc(x.title)}">${x.dot || ar(i + 1)}</button>`).join('');
  const lastStep = cur === c.steps.length - 1, lastCh = ch === CH.length - 1;
  $('prev').disabled = ch === 0 && cur === 0;
  $('next').disabled = lastStep && lastCh;
  $('next').textContent = lastStep && !lastCh ? 'المحور الجاي ←' : 'التالي ←';
}

function go(c, i) {
  ch = Math.max(0, Math.min(CH.length - 1, c));
  cur = Math.max(0, Math.min(CH[ch].steps.length - 1, i));
  const t = ++run, s = CH[ch].steps[cur];
  document.querySelectorAll('.packet').forEach(p => p.remove());
  render();
  const b = $('board'); b.innerHTML = ''; b.className = 'board';
  Promise.resolve().then(() => s.build(b, t)).catch(e => { if (e !== 'stop') console.error(e); });
  try { history.replaceState(null, '', `#${ch}-${cur}`); } catch (e) {}
}
const next = () => cur < CH[ch].steps.length - 1 ? go(ch, cur + 1) : ch < CH.length - 1 && go(ch + 1, 0);
const prev = () => cur > 0 ? go(ch, cur - 1) : ch > 0 && go(ch - 1, CH[ch - 1].steps.length - 1);

function start(lesson) {
  CH = lesson.chapters;
  document.title = lesson.title + ' · تفاعلي';
  $('lessonEyebrow').innerHTML = lesson.eyebrow;
  $('lessonTitle').textContent = lesson.title;
  $('tabs').onclick = e => { const x = e.target.closest('.tab'); if (x) go(+x.dataset.c, 0); };
  $('dots').onclick = e => { const x = e.target.closest('.dot'); if (x) go(ch, +x.dataset.i); };
  $('next').onclick = next;
  $('prev').onclick = prev;
  $('replay').onclick = () => go(ch, cur);
  const showSpeed = () => { $('speed').textContent = SPEEDS[sp][1]; };
  $('speed').onclick = () => {
    sp = (sp + 1) % SPEEDS.length; SLOW = SPEEDS[sp][0]; showSpeed();
    try { localStorage.setItem('interactive-speed', sp); } catch (e) {}
  };
  showSpeed();
  document.addEventListener('keydown', e => {
    const tg = e.target;
    if (tg.matches('input, textarea')) return;
    if (e.key === 'ArrowLeft') next();
    if (e.key === 'ArrowRight') prev();
    if (e.key === ' ' && !tg.closest('button, [role=button]')) { e.preventDefault(); next(); }
  });
  const fromHash = () => { const m = location.hash.match(/^#(\d+)-(\d+)$/); m ? go(+m[1], +m[2]) : go(0, 0); };
  window.addEventListener('hashchange', fromHash);
  fromHash();
}

window.addEventListener('load', () => start(window.LESSON));
