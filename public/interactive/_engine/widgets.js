/* ============================================================
   widgets.js — التفاعلات الجاهزة للصفحة التفاعلية
   كل دالة هنا بتاخد بيانات بس، وبترجع build جاهزة للخطوة:
     { title: '…', text: '…', build: W.match({ … }) }
   الجدول اللي بيقول تختار أنهي تفاعل لأنهي مفهوم في README.md.
   ============================================================ */

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

const W = {

  /* كروت تتقلب: الطالب يسترجع قبل ما يشوف.
     cards: [{ front, back }] (HTML) · all: زرار «اقلب الكل» ·
     reveal: { html, btn?, go?: [محور، خطوة] } بيظهر لما الكروت كلها تتقلب */
  flips({ cards, all = false, small = false, reveal }) {
    return b => {
      b.innerHTML = `<div class="flips${small ? ' small' : ''}">${cards.map(c => flipHTML(c.front, c.back)).join('')}</div>` +
        (all ? '<div class="btn-row"><button data-all>🃏 اقلب الكل</button></div>' : '') +
        (reveal ? `<div class="bridge" data-br hidden>${reveal.html}${reveal.btn ? `<br><button class="primary" data-go>${reveal.btn}</button>` : ''}</div>` : '');
      const fl = () => [...b.querySelectorAll('.flip')];
      const br = b.querySelector('[data-br]');
      const check = () => { if (br && br.hidden && fl().every(f => f.classList.contains('on'))) { br.hidden = false; pop(br); } };
      wireFlips(b, check);
      if (all) b.querySelector('[data-all]').onclick = () => { const on = fl().every(f => f.classList.contains('on')); fl().forEach(f => f.classList.toggle('on', !on)); check(); };
      if (reveal && reveal.go) b.querySelector('[data-go]').onclick = () => go(...reveal.go);
    };
  },

  /* سؤال مطابقة: كل صف ليه إجابة واحدة صح، والتصحيح فوري.
     opts: { 'أ': 'نص', … } · rows: [[السؤال، المفتاح الصح، ليه]] */
  match({ badge, q, opts, rows }) {
    return b => {
      const keys = Object.keys(opts);
      b.innerHTML = `
      <div class="quiz">
        <span class="badge">${badge}</span>
        <h3>${q}</h3>
        <div class="qrows">${rows.map((r, i) => `
          <div class="qrow" data-i="${i}"><div class="qt">${r[0]}</div>
            <div class="qopts">${keys.map(k => `<button data-k="${k}"><b>${k}</b>${opts[k]}</button>`).join('')}</div>
            <div class="qwhy"></div></div>`).join('')}</div>
        <div class="qfoot"><span data-score></span><button data-all>👀 اظهر كل الإجابات</button></div>
      </div>`;
      let done = 0, miss = 0;
      const score = b.querySelector('[data-score]');
      const upd = () => {
        score.innerHTML = done === rows.length
          ? (miss ? `✅ خلصت · غلطت ${ar(miss)} مرة، راجع الصفوف دي تاني` : '🔥 كله صح من أول مرة!')
          : `جاوبت ${ar(done)} من ${ar(rows.length)}`;
      };
      const solve = (row, r) => {
        row.classList.add('done');
        row.querySelectorAll('button').forEach(x => { x.disabled = true; if (x.dataset.k === r[1]) { x.classList.add('right'); x.disabled = false; } });
        row.querySelector('.qwhy').textContent = '✓ ' + r[2];
      };
      b.querySelectorAll('.qrow').forEach(row => {
        const r = rows[+row.dataset.i];
        row.querySelectorAll('button').forEach(btn => btn.onclick = () => {
          if (row.classList.contains('done')) return;
          if (btn.dataset.k === r[1]) {
            solve(row, r); done++; upd();
            if (done === rows.length && !miss) confetti(b);
          } else { btn.classList.add('wrong'); btn.disabled = true; shake(row); miss++; }
        });
      });
      b.querySelector('[data-all]').onclick = () => {
        b.querySelectorAll('.qrow').forEach(row => { if (!row.classList.contains('done')) { solve(row, rows[+row.dataset.i]); done++; miss++; } });
        upd();
      };
      upd();
    };
  },

  /* اختيار من متعدد: سؤال واحد، والطالب يفضل يجرّب لحد ما يوصل للصح.
     opts: [نص…] · answer: رقم الصح من 0 · why: الشرح بعد الإجابة */
  mcq({ badge, q, opts, answer, why }) {
    return b => {
      b.innerHTML = `
      <div class="quiz mcq">
        <span class="badge">${badge}</span>
        <h3>${q}</h3>
        <div class="mopts">${opts.map((o, i) => `<button data-i="${i}"><b>${LETTERS[i]}</b>${o}</button>`).join('')}</div>
        <div class="verdict" data-v></div>
        <div class="btn-row"><button data-show>👀 اظهر الإجابة</button></div>
      </div>`;
      const v = b.querySelector('[data-v]'), btns = b.querySelectorAll('.mopts button');
      let miss = 0;
      const win = () => {
        btns.forEach(x => { x.disabled = +x.dataset.i !== answer; });
        btns[answer].classList.add('right');
        tone(v, `✅ الإجابة <b>${LETTERS[answer]}</b> · ${why}`, 'good');
        b.querySelector('[data-show]').hidden = true;
      };
      btns.forEach(x => x.onclick = () => {
        if (+x.dataset.i === answer) { win(); if (!miss) confetti(b); }
        else { miss++; x.classList.add('wrong'); x.disabled = true; shake(x); tone(v, '🤔 لأ… اقرا الاختيارات تاني وفكّر', 'bad'); }
      });
      b.querySelector('[data-show]').onclick = win;
    };
  },

  /* اختيار أكتر من إجابة صح، وبعدين «اتأكد».
     opts: [{ t, ok }] · why: الشرح */
  multi({ badge, q, opts, why, html = '' }) {
    return b => {
      b.innerHTML = `
      <div class="quiz">
        ${badge ? `<span class="badge">${badge}</span>` : ''}
        <h3>${q}</h3>${html}
        <div class="mopts">${opts.map((o, i) => `<button aria-pressed="false" data-i="${i}">${o.t}</button>`).join('')}</div>
        <div class="btn-row"><button class="primary" data-chk>✔ اتأكد</button></div>
        <div class="verdict" data-v></div>
      </div>`;
      const btns = [...b.querySelectorAll('.mopts button')], v = b.querySelector('[data-v]');
      btns.forEach(x => x.onclick = () => { if (b.dataset.done) return; x.setAttribute('aria-pressed', x.getAttribute('aria-pressed') !== 'true'); });
      b.querySelector('[data-chk]').onclick = () => {
        const ok = btns.every(x => (x.getAttribute('aria-pressed') === 'true') === opts[+x.dataset.i].ok);
        if (!btns.some(x => x.getAttribute('aria-pressed') === 'true')) return tone(v, 'اختار إجابة الأول 👆', 'meh');
        if (ok) {
          b.dataset.done = 1;
          btns.forEach(x => { x.disabled = true; if (opts[+x.dataset.i].ok) x.classList.add('right'); });
          tone(v, '✅ ' + why, 'good'); confetti(b);
        } else { shake(b.querySelector('.mopts')); tone(v, '🤔 لسه… فيه اختيار ناقص أو زيادة. جرّب تاني', 'bad'); }
      };
    };
  },

  /* تصنيف: كارت يظهر، والطالب يختار فئته.
     cats: { key: { e, n, d, color } } · items: [{ e, n, c, why }] */
  sorter({ cats, items }) {
    return b => {
      const draw = () => {
        const order = shuffle(items);
        b.innerHTML = `
        <div class="sorter">
          <div class="bar"><i data-bar style="width:0"></i></div><div class="pg" data-pg></div>
          <div class="now" data-now></div>
          <div class="buckets" style="grid-template-columns:repeat(${Object.keys(cats).length},1fr)">${Object.entries(cats).map(([k, c]) => `
            <button class="bucket" style="--c:${c.color || 'var(--info)'}" data-c="${k}"><span class="be">${c.e}</span><span class="bn">${c.n}</span>${c.d ? `<span class="bd">${c.d}</span>` : ''}<span class="bin" data-bin="${k}"></span></button>`).join('')}</div>
          <div class="verdict" data-v></div>
        </div>`;
        const Q = s => b.querySelector(s), v = Q('[data-v]'), now = Q('[data-now]');
        let i = 0, miss = 0;
        const show = () => {
          Q('[data-bar]').style.width = (i / order.length * 100) + '%';
          Q('[data-pg]').textContent = `${ar(i)} من ${ar(order.length)}`;
          if (i === order.length) {
            now.innerHTML = `<div class="fcard pop"><span class="fe">🏆</span><span class="fn">${miss ? `خلصت! غلطت ${ar(miss)} مرة` : 'كله صح من أول مرة!'}</span><button data-re style="margin-top:6px">🔀 العب تاني</button></div>`;
            Q('[data-re]').onclick = draw;
            b.querySelectorAll('.bucket').forEach(x => x.disabled = true);
            confetti(b); return;
          }
          const f = order[i];
          now.innerHTML = `<div class="fcard pop"><span class="fe">${f.e}</span><span class="fn">${f.n}</span><small>مكانه فين؟ 👇</small></div>`;
        };
        b.querySelectorAll('.bucket').forEach(bk => bk.onclick = () => {
          const f = order[i]; if (!f) return;
          if (bk.dataset.c === f.c) {
            const s = document.createElement('span'); s.textContent = f.e + ' ' + f.n; s.className = 'pop';
            Q(`[data-bin="${f.c}"]`).appendChild(s);
            tone(v, '✓ صح! ' + f.why, 'good'); i++; show();
          } else { miss++; shake(now); shake(bk); tone(v, '🤔 لأ… ' + f.why, 'bad'); }
        });
        show();
      };
      draw();
    };
  },

  /* ترتيب: خطوات متلخبطة، والطالب يدوس عليها بالترتيب الصح.
     items: [نص…] بالترتيب الصح */
  order({ items, first = 'دوس على أول خطوة 👆', head = 'الترتيب الصح', pool = 'الخطوات (متلخبطة)' }) {
    return b => {
      const draw = () => {
        b.innerHTML = `
        <div class="order">
          <div class="slots"><h4>${head}</h4>${items.map((_, i) => `<div class="slot" data-s="${i}"><span class="n">${ar(i + 1)}</span><span class="tx"></span></div>`).join('')}</div>
          <div class="pool"><h4>${pool}</h4>${shuffle(items.map((x, i) => [x, i])).map(([x, i]) => `<button data-i="${i}">${x}</button>`).join('')}</div>
        </div>
        <div class="verdict" data-v>${first}</div>
        <div class="btn-row"><button data-re>🔀 خلّطها تاني</button></div>`;
        let nx = 0, miss = 0;
        const v = b.querySelector('[data-v]');
        b.querySelectorAll('.pool button').forEach(btn => btn.onclick = () => {
          if (+btn.dataset.i === nx) {
            const s = b.querySelector(`[data-s="${nx}"]`);
            s.classList.add('fill'); s.querySelector('.tx').textContent = items[nx]; pop(s);
            btn.remove(); nx++;
            if (nx === items.length) {
              tone(v, miss ? `🎉 رتّبتها! غلطت ${ar(miss)} مرة… جرّب تاني من غير ولا غلطة 💪` : '🔥 رتّبتها كلها صح من أول مرة!', 'good');
              confetti(b);
            } else tone(v, '✓ صح! وبعدها إيه؟', 'good');
          } else { miss++; shake(btn); tone(v, 'مش دي 🙃 فكّر: إيه اللي لازم ييجي قبلها؟', 'bad'); }
        });
        b.querySelector('[data-re]').onclick = draw;
      };
      draw();
    };
  },

  /* صح ولا غلط: جملة جملة، وفي الآخر النتيجة.
     items: [[الجملة، true|false، ليه]] */
  trueFalse({ items }) {
    return b => {
      const draw = () => {
        const list = shuffle(items);
        let i = 0, score = 0;
        b.innerHTML = `
        <div class="tf">
          <div class="pg" data-pg></div>
          <div class="stmt" data-s></div>
          <div class="btn-row" data-ab><button class="good-btn" data-x="1">✓ صح</button><button class="bad-btn" data-x="0">✗ غلط</button></div>
          <div class="why" data-w></div>
          <div class="btn-row"><button class="primary" data-n hidden></button></div>
        </div>`;
        const Q = s => b.querySelector(s), st = Q('[data-s]'), nx = Q('[data-n]'), ab = Q('[data-ab]');
        const show = () => {
          if (i === list.length) {
            st.className = 'stmt good'; st.innerHTML = `🏆 جبت ${ar(score)} من ${ar(list.length)}`;
            tone(Q('[data-w]'), score === list.length ? '🔥 ولا فخ وقعت فيه!' : 'راجع الفخاخ اللي وقعت فيها والعب تاني 💪', score === list.length ? 'good' : 'meh');
            ab.hidden = true; nx.hidden = false; nx.textContent = '🔀 العب تاني'; nx.onclick = draw;
            if (score >= list.length * .8) confetti(b);
            return;
          }
          Q('[data-pg]').textContent = `${ar(i + 1)} / ${ar(list.length)} · النتيجة: ${ar(score)}`;
          st.className = 'stmt'; st.textContent = '«' + list[i][0] + '»'; pop(st);
          tone(Q('[data-w]'), '', ''); ab.hidden = false; nx.hidden = true;
          b.querySelectorAll('[data-x]').forEach(x => x.disabled = false);
        };
        b.querySelectorAll('[data-x]').forEach(x => x.onclick = () => {
          const [, ans, why] = list[i], ok = (x.dataset.x === '1') === ans;
          if (ok) score++;
          st.className = 'stmt ' + (ok ? 'good' : 'bad'); if (!ok) shake(st);
          tone(Q('[data-w]'), (ok ? '✅ ' : '❌ ') + `الجملة <b>${ans ? 'صح' : 'غلط'}</b> · ${why}`, ok ? 'good' : 'bad');
          b.querySelectorAll('[data-x]').forEach(y => y.disabled = true);
          nx.hidden = false; nx.textContent = i === list.length - 1 ? 'النتيجة 🏆' : 'الجملة الجاية ←';
          nx.onclick = () => { i++; show(); };
        });
        show();
      };
      draw();
    };
  },

  /* سؤال مقالي: الطالب يكتب، والمساعد يدوّر على الأفكار الأساسية، وبعدين الإجابة النموذجية.
     ideas: [[وصف الفكرة، regex على النص بعد norm()]] · model: [[عنوان، نص]] */
  essay({ badge, q, hint, ideas, model }) {
    return b => {
      b.innerHTML = `
      <div class="exam">
        <div class="q"><span class="badge">${badge}</span><p>${q}</p>${hint ? `<small>${hint}</small>` : ''}</div>
        <textarea data-a placeholder="اكتب إجابتك هنا بأسلوبك…"></textarea>
        <div class="btn-row"><button data-chk>🧐 صحّحلي</button><button class="primary" data-show>👀 اظهر الإجابة النموذجية</button></div>
        <ul class="ideas" data-ideas></ul>
        <div class="verdict" data-v></div>
        <div class="model" data-model hidden>${model.map(([m, x]) => `<div><mark>${m}</mark> ${x}</div>`).join('')}</div>
      </div>`;
      const Q = s => b.querySelector(s);
      Q('[data-chk]').onclick = () => {
        const a = norm(Q('[data-a]').value);
        if (a.trim().length < 10) { tone(Q('[data-v]'), 'اكتب إجابتك الأول ✍️', 'bad'); shake(Q('[data-a]')); return; }
        const hits = ideas.map(([, re]) => re.test(a)), n = hits.filter(Boolean).length;
        Q('[data-ideas]').innerHTML = ideas.map(([l], i) => `<li class="${hits[i] ? 'y' : 'n'}">${hits[i] ? '✅' : '⬜'} ${l}</li>`).join('');
        tone(Q('[data-v]'), n === ideas.length ? '🔥 غطّيت كل الأفكار! قارن صياغتك بالإجابة النموذجية'
          : `غطّيت ${ar(n)} من ${ar(ideas.length)} أفكار · المساعد ده بيدوّر على الأفكار بس، مش تصحيح نهائي`, n === ideas.length ? 'good' : 'meh');
        if (n === ideas.length) confetti(b);
      };
      Q('[data-show]').onclick = () => { Q('[data-model]').hidden = false; pop(Q('[data-model]')); };
    };
  },

  /* معادلات بتتبني حتة حتة بالضغط، وتحتها أفكار للحفظ.
     eqs: [{ toks: [[نص، 'box'|'res'|'']], cap }] · hooks: [نص…] */
  equations({ eqs, hooks = [], hooksTitle = '💡 أفكار تثبّت بيها الدرس' }) {
    return b => {
      b.innerHTML = `
      <div class="eqs">${eqs.map((q, i) => `
        <div class="eqrow" data-q="${i}" tabindex="0" role="button">
          <div class="toks">${q.toks.map(([x, c]) => `<span class="${c || ''}">${x}</span>`).join('')}</div>
          <div class="hint">👆 دوس عشان تبنيها</div><small hidden>${q.cap}</small>
        </div>`).join('')}</div>
      ${hooks.length ? `<div class="hooks"><h4>${hooksTitle}</h4>${hooks.map(x => `<div>${x}</div>`).join('')}</div>` : ''}`;
      let built = 0;
      b.querySelectorAll('.eqrow').forEach(r => {
        const build = async () => {
          if (r.dataset.done) return; r.dataset.done = 1;
          r.querySelector('.hint').hidden = true;
          for (const s of r.querySelectorAll('.toks span')) { s.classList.add('show'); await wait(320); }
          const c = r.querySelector('small'); c.hidden = false; pop(c);
          if (++built === eqs.length) confetti(b);
        };
        r.onclick = build; r.onkeydown = e => { if (e.key === 'Enter') build(); };
      });
    };
  },

  /* خطوات بتنور واحدة واحدة («الخطوة الجاية»)، وفي الآخر معادلة.
     steps: [{ e, t, tech, d }] · eq: HTML */
  stepper({ steps, eq }) {
    return b => {
      b.innerHTML = `
      <div class="stepper" style="--n:${steps.length}">${steps.map((s, i) => `<div class="sstep" data-i="${i}"><span class="se">${s.e}</span><span class="st">${ar(i + 1)} · ${s.t}</span><span class="tech">${s.tech}</span><span class="sd">${s.d}</span></div>`).join('')}</div>
      ${eq ? `<div class="bigeq" data-eq hidden>${eq}</div>` : ''}
      <div class="btn-row"><button class="primary" data-go>▶ الخطوة الجاية</button></div>`;
      const Q = s => b.querySelector(s), btn = Q('[data-go]'), eqEl = Q('[data-eq]');
      let i = 0;
      btn.onclick = () => {
        if (i === steps.length) { b.querySelectorAll('.sstep').forEach(s => s.classList.remove('on')); if (eqEl) eqEl.hidden = true; i = 0; btn.textContent = '▶ الخطوة الجاية'; return; }
        Q(`[data-i="${i}"]`).classList.add('on'); i++;
        if (i === steps.length) { if (eqEl) { eqEl.hidden = false; pop(eqEl); } btn.textContent = '↻ من الأول'; }
      };
    };
  },

  /* لعبة الدروع: الطالب يشغّل دروع، وكل هجمة ليها درع مخصوص بيصدّها.
     shields: [{ k, e, n }] · threats: [{ k (الدرع اللي يصدّها), e, n, d, win, block }] · done: رسالة الفوز */
  shields({ shields, threats, done = '🛡️ صدّيت كل الهجمات!' }) {
    return (b, t) => {
      b.innerHTML = `
      <div class="shields" style="grid-template-columns:repeat(${shields.length},1fr)">${shields.map(s => `<button class="shield" aria-pressed="false" data-s="${s.k}"><span class="se">${s.e}</span>${s.n}</button>`).join('')}</div>
      <div class="threats">${threats.map((th, i) => `
        <div class="threat" data-t="${i}"><div class="th-top"><span class="te">${th.e}</span><div><b>${th.n}</b><small>${th.d}</small></div></div><div class="th-res"></div></div>`).join('')}</div>
      <div class="btn-row"><button class="primary" data-go>🚀 ابدأ الهجوم</button></div>
      <div class="verdict" data-v>شغّل الدروع اللي شايفها صح، وبعدين ابدأ الهجوم 👆</div>`;
      const Q = s => b.querySelector(s), v = Q('[data-v]'), btn = Q('[data-go]');
      const on = {};
      const clear = () => b.querySelectorAll('.threat').forEach(c => { c.className = 'threat'; tone(c.querySelector('.th-res'), '⏳ مستني الهجوم', ''); });
      clear();
      let busy = false;
      b.querySelectorAll('.shield').forEach(s => s.onclick = () => {
        if (busy) return;
        on[s.dataset.s] = !on[s.dataset.s]; s.setAttribute('aria-pressed', !!on[s.dataset.s]);
        clear(); tone(v, '', '');
      });
      btn.onclick = safe(async () => {
        if (busy) return; busy = true; btn.disabled = true;
        clear(); tone(v, '', '');
        let saved = 0;
        for (const [i, th] of threats.entries()) {
          const c = Q(`[data-t="${i}"]`), res = c.querySelector('.th-res');
          c.className = 'threat hit'; tone(res, '⚡ بيهاجم…', 'meh');
          await wait(900); alive(t);
          const ok = !!on[th.k]; if (ok) saved++;
          const s = shields.find(x => x.k === th.k);
          c.className = 'threat ' + (ok ? 'safe' : 'pwn');
          tone(res, ok ? `🛡️ ${s.e} ${s.n} صدّها: ${th.block}` : `💥 نجحت: ${th.win}`, ok ? 'good' : 'bad');
          await wait(450); alive(t);
        }
        if (saved === threats.length) { tone(v, done, 'good'); confetti(b); }
        else tone(v, `صدّيت ${ar(saved)} من ${ar(threats.length)} · شغّل الدرع المناسب للهجمات اللي نجحت وجرّب تاني`, saved ? 'meh' : 'bad');
        busy = false; btn.disabled = false;
      });
    };
  },

  /* البوابة: طلبات بتيجي واحد ورا التاني، والطالب هو اللي يقرر يعدّي ولا يتمنع حسب القواعد.
     from/gate: { icon, name } · dests: { key: { icon, name } } · rules: [HTML]
     items: [{ tag (يظهر على الرسالة)، t (الوصف)، dest، ok، why }] */
  gate({ from, gate, dests, rules, items, allow = '✅ يعدّي', block = '⛔ يتمنع', done = '🔥 طبّقت القواعد صح على كل الطلبات!' }) {
    return (b, t) => {
      const draw = () => {
        const list = shuffle(items);
        b.innerHTML = `
        <div class="rules"><b>📋 القواعد:</b> ${rules.map(r => `<span>${r}</span>`).join('')}</div>
        <div class="scene gate-scene" style="grid-template-columns:1fr 1fr 1fr 1fr 1.1fr">
          <div class="node"><div class="icon" data-n="from">${from.icon}</div><div class="name">${from.name}</div></div>
          <div class="wire"><div class="line"></div></div>
          <div class="node"><div class="icon gate-icon" data-n="gate">${gate.icon}</div><div class="name">${gate.name}</div></div>
          <div class="wire"><div class="line"></div></div>
          <div class="node dests">${Object.entries(dests).map(([k, d]) => `<div class="dest" data-d="${k}"><span class="di" data-n="d-${k}">${d.icon}</span><span>${d.name}</span></div>`).join('')}</div>
        </div>
        <div class="req" data-req></div>
        <div class="btn-row" data-ab hidden><button class="good-btn" data-x="1">${allow}</button><button class="bad-btn" data-x="0">${block}</button></div>
        <div class="verdict" data-v></div>
        <div class="btn-row"><button class="primary" data-next hidden></button></div>`;
        const Q = s => b.querySelector(s), I = k => Q(`[data-n="${k}"]`);
        const req = Q('[data-req]'), ab = Q('[data-ab]'), v = Q('[data-v]'), nx = Q('[data-next]');
        let i = 0, score = 0;
        const show = safe(async () => {
          ab.hidden = true; nx.hidden = true; tone(v, '', '');
          b.querySelectorAll('.dest').forEach(d => d.dataset.tone = '');
          if (i === list.length) {
            tone(req, `🏆 ${ar(score)} من ${ar(list.length)}`, score === list.length ? 'good' : 'meh');
            tone(v, score === list.length ? done : 'فيه طلبات اتعاملت معاها غلط… راجع القواعد والعب تاني 💪', score === list.length ? 'good' : 'meh');
            if (score === list.length) confetti(b);
            nx.hidden = false; nx.textContent = '🔀 العب تاني'; nx.onclick = draw;
            return;
          }
          const it = list[i];
          tone(req, `<small>طلب ${ar(i + 1)} من ${ar(list.length)}</small>📨 ${it.t}`, '');
          await glide(t, b, I('from'), I('gate'), it.tag, it.ok ? 'pub' : 'plain', 1200);
          Q(`[data-d="${it.dest}"]`).dataset.tone = 'meh';
          ab.hidden = false;
        });
        b.querySelectorAll('[data-x]').forEach(x => x.onclick = safe(async () => {
          const it = list[i], pass = x.dataset.x === '1', ok = pass === it.ok;
          ab.hidden = true; if (ok) score++;
          if (pass) await glide(t, b, I('gate'), I('d-' + it.dest), it.tag, it.ok ? 'pub' : 'plain', 1000);
          else { shake(I('gate')); await glide(t, b, I('gate'), I('from'), '⛔ ' + it.tag, 'plain', 900); }
          Q(`[data-d="${it.dest}"]`).dataset.tone = pass ? (it.ok ? 'good' : 'bad') : '';
          tone(v, ok ? `✅ صح! ${it.why}` : (pass ? `😱 عدّيت هجوم! ${it.why}` : `😕 منعت طلب سليم! ${it.why}`), ok ? 'good' : 'bad');
          if (!ok) shake(req);
          nx.hidden = false; nx.textContent = i === list.length - 1 ? 'النتيجة 🏆' : 'الطلب اللي بعده ←';
          nx.onclick = () => { i++; show(); };
        }));
        show();
      };
      draw();
    };
  },

  /* موقف وقرار: مشهد (HTML) وتحته اختيارات، وكل اختيار ليه رد.
     opts: [{ t, ok, fb }] · reveal: selector لعناصر بتتعلّم (class hl) بعد أي اختيار */
  choice({ html, opts, reveal }) {
    return b => {
      b.innerHTML = `${html}
      <div class="btn-row">${opts.map((o, i) => `<button data-i="${i}">${o.t}</button>`).join('')}</div>
      <div class="verdict" data-v></div>`;
      b.querySelectorAll('[data-i]').forEach(x => x.onclick = () => {
        const o = opts[+x.dataset.i];
        if (reveal) b.querySelectorAll(reveal).forEach(e => e.classList.add('hl'));
        tone(b.querySelector('[data-v]'), o.fb, o.ok ? 'good' : 'bad');
        if (o.ok) confetti(b); else shake(b.firstElementChild);
      });
    };
  }
};
