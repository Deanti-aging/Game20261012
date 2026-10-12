/* ===================================================================
 *  训练你的小机器人 —— 游戏引擎
 *  屏幕切换 / 存档 / 音效 / 机器人 / 关卡流程 / 术语卡 / 小测验 / 打赏
 * =================================================================== */
(function () {
  'use strict';

  const G = (window.G = {});
  G.levels = [];
  G.cards = {};
  G.cardOrder = [];
  G.registerLevel = (lv) => G.levels.push(lv);
  G.registerCards = (list) => list.forEach((c) => { G.cards[c.id] = c; G.cardOrder.push(c.id); });

  /* ---------------- DOM 小工具 ---------------- */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const c of kids.flat(Infinity)) {
      if (c == null || c === false) continue;
      el.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return el;
  }
  G.h = h;

  /** 可复现的随机数 */
  G.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  G.shuffle = function (arr, rnd = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  G.clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  G.lerp = (a, b, t) => a + (b - a) * t;

  /** 高清 Canvas：逻辑坐标 w×h，自动适配屏幕宽度 */
  G.makeCanvas = function (w, hgt, cls) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const c = h('canvas', { class: 'game-canvas ' + (cls || '') });
    c.width = Math.round(w * dpr);
    c.height = Math.round(hgt * dpr);
    c.style.maxWidth = w + 'px';
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    const pos = (e) => {
      const r = c.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * w) / r.width, y: ((e.clientY - r.top) * hgt) / r.height };
    };
    return { el: c, ctx, w, h: hgt, pos };
  };

  G.roundRect = function (ctx, x, y, w, hh, r) {
    r = Math.min(r, w / 2, hh / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + hh, r);
    ctx.arcTo(x + w, y + hh, x, y + hh, r);
    ctx.arcTo(x, y + hh, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  /** 滑块组件 */
  G.slider = function ({ label, min, max, step, value, format, onInput, onChange, color }) {
    const out = h('b', { class: 'slider-val' });
    const input = h('input', { type: 'range', min, max, step, value });
    const fmt = format || ((v) => v);
    const upd = () => { out.textContent = fmt(+input.value); };
    input.addEventListener('input', () => { upd(); onInput && onInput(+input.value); });
    input.addEventListener('change', () => { onChange && onChange(+input.value); });
    upd();
    const el = h('label', { class: 'slider ' + (color ? 'slider-' + color : '') }, h('span', { class: 'slider-label' }, label, ' ', out), input);
    return {
      el, input,
      get value() { return +input.value; },
      set(v) { input.value = v; upd(); }
    };
  };

  /* ---------------- 存档 ---------------- */
  const SAVE_KEY = 'ml-robot-trainer-save-v1';
  const state = { done: {}, quiz: {}, cards: {}, seenCards: {}, muted: false, name: '' };
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch (e) { /* 隐私模式等情况下忽略 */ }
  function save() {
    try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  G.state = state;
  G.save = save;

  /* ---------------- 音效（WebAudio 合成，无需素材） ---------------- */
  let actx = null;
  function tone(freq, dur, type, when, vol) {
    const t = actx.currentTime + (when || 0);
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t);
    o.stop(t + dur + 0.03);
  }
  G.sfx = function (name) {
    if (state.muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      switch (name) {
        case 'click': tone(660, 0.07, 'triangle', 0, 0.1); break;
        case 'pop': tone(900, 0.06, 'sine', 0, 0.1); break;
        case 'step': tone(420, 0.05, 'square', 0, 0.035); break;
        case 'good': tone(660, 0.12, 'triangle'); tone(990, 0.2, 'triangle', 0.09); break;
        case 'bad': tone(240, 0.18, 'sawtooth', 0, 0.06); tone(170, 0.25, 'sawtooth', 0.11, 0.06); break;
        case 'win': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.28, 'triangle', i * 0.11, 0.11)); break;
        case 'card': [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.22, 'sine', i * 0.07, 0.1)); break;
        case 'boing': tone(300, 0.15, 'sine', 0, 0.12); tone(520, 0.15, 'sine', 0.06, 0.08); break;
      }
    } catch (e) { /* 浏览器不支持就安静 */ }
  };

  /* ---------------- 机器人形象 ---------------- */
  G.robotSVG = function (mood, body, accessory) {
    mood = mood || 'happy';
    body = body || '#74c0fc';
    const ink = '#3b3355';
    const mouths = {
      happy: `<path d="M40 66 Q50 76 60 66" stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
      wow: `<ellipse cx="50" cy="68" rx="6" ry="7" fill="${ink}"/><ellipse cx="50" cy="71" rx="3.5" ry="3" fill="#ff8787"/>`,
      sad: `<path d="M40 72 Q50 63 60 72" stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
      think: `<path d="M42 69 Q48 66 58 68" stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    };
    const eyes = {
      happy: `<circle cx="39" cy="50" r="6.5" fill="${ink}"/><circle cx="61" cy="50" r="6.5" fill="${ink}"/><circle cx="41" cy="47.5" r="2.2" fill="#fff"/><circle cx="63" cy="47.5" r="2.2" fill="#fff"/>`,
      wow: `<circle cx="39" cy="49" r="8" fill="#fff" stroke="${ink}" stroke-width="3"/><circle cx="61" cy="49" r="8" fill="#fff" stroke="${ink}" stroke-width="3"/><circle cx="39" cy="49" r="4" fill="${ink}"/><circle cx="61" cy="49" r="4" fill="${ink}"/>`,
      sad: `<circle cx="39" cy="52" r="5.5" fill="${ink}"/><circle cx="61" cy="52" r="5.5" fill="${ink}"/><path d="M31 42 L45 46 M69 42 L55 46" stroke="${ink}" stroke-width="3" stroke-linecap="round"/><path d="M33 58 q-2 6 1 8" stroke="#4dabf7" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      think: `<circle cx="41" cy="47" r="6" fill="${ink}"/><circle cx="63" cy="47" r="6" fill="${ink}"/><circle cx="43" cy="45" r="2" fill="#fff"/><circle cx="65" cy="45" r="2" fill="#fff"/><path d="M54 39 L68 37" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`
    };
    const acc = accessory === 'book'
      ? `<rect x="66" y="88" width="24" height="18" rx="3" fill="#ff8787" stroke="${ink}" stroke-width="3"/><path d="M78 88 V106" stroke="${ink}" stroke-width="2"/>`
      : accessory === 'bulb'
        ? `<circle cx="84" cy="14" r="9" fill="#ffe066" stroke="${ink}" stroke-width="3"/><rect x="80" y="22" width="8" height="5" fill="${ink}"/>`
        : '';
    return `<svg viewBox="0 0 100 112" class="robot-svg mood-${mood}" aria-hidden="true">
      <line x1="50" y1="9" x2="50" y2="22" stroke="${ink}" stroke-width="4"/>
      <circle class="antenna" cx="50" cy="8" r="6.5" fill="#ff8787" stroke="${ink}" stroke-width="3"/>
      <rect x="4" y="42" width="12" height="20" rx="5" fill="#ffd43b" stroke="${ink}" stroke-width="3"/>
      <rect x="84" y="42" width="12" height="20" rx="5" fill="#ffd43b" stroke="${ink}" stroke-width="3"/>
      <rect x="28" y="84" width="44" height="24" rx="9" fill="${body}" stroke="${ink}" stroke-width="3.5"/>
      <circle cx="50" cy="96" r="4.5" fill="#ffd43b" stroke="${ink}" stroke-width="2.5"/>
      <rect x="13" y="21" width="74" height="64" rx="22" fill="${body}" stroke="${ink}" stroke-width="4"/>
      <rect x="22" y="32" width="56" height="44" rx="15" fill="#f1f9ff" stroke="${ink}" stroke-width="3"/>
      <circle cx="30" cy="62" r="4.5" fill="#ff8cc6" opacity=".55"/><circle cx="70" cy="62" r="4.5" fill="#ff8cc6" opacity=".55"/>
      ${eyes[mood] || eyes.happy}${mouths[mood] || mouths.happy}${acc}
    </svg>`;
  };

  /* ---------------- 特效 / 提示 ---------------- */
  G.confetti = function (n) {
    const colors = ['#ff8787', '#ffd43b', '#63e6be', '#74c0fc', '#b197fc', '#ff8cc6', '#ffa94d'];
    const layer = h('div', { class: 'confetti-layer' });
    document.body.append(layer);
    for (let i = 0; i < (n || 70); i++) {
      const p = h('i', { class: 'confetti' });
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.5 + 's';
      p.style.animationDuration = 1.6 + Math.random() * 1.4 + 's';
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      if (i % 3 === 0) p.style.borderRadius = '50%';
      layer.append(p);
    }
    setTimeout(() => layer.remove(), 3400);
  };

  G.toast = function (text) {
    const t = h('div', { class: 'toast' }, text);
    document.body.append(t);
    setTimeout(() => t.classList.add('out'), 1900);
    setTimeout(() => t.remove(), 2400);
  };

  /** 弹窗 */
  function modal(content, opts) {
    opts = opts || {};
    const root = document.getElementById('modal-root');
    const box = h('div', { class: 'modal' + (opts.wide ? ' wide' : '') + (opts.cls ? ' ' + opts.cls : ''), role: 'dialog', 'aria-modal': 'true' });
    const back = h('div', { class: 'modal-back' }, box);
    function close() {
      back.classList.add('closing');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => back.remove(), 160);
      opts.onClose && opts.onClose();
    }
    function onKey(e) { if (e.key === 'Escape' && opts.closable !== false) close(); }
    if (opts.closable !== false) {
      box.append(h('button', { class: 'modal-x', 'aria-label': '关闭', onclick: () => { G.sfx('click'); close(); } }, '✕'));
      back.addEventListener('click', (e) => { if (e.target === back) close(); });
      document.addEventListener('keydown', onKey);
    }
    const body = h('div', { class: 'modal-body' });
    box.append(body);
    const set = (c) => { body.innerHTML = ''; body.append(c); box.scrollTop = 0; };
    set(content);
    root.append(back);
    return { close, set, box };
  }
  G.modal = modal;

  /* ---------------- 屏幕管理 ---------------- */
  let leaveFns = [];
  function setScreen(el) {
    leaveFns.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
    leaveFns = [];
    document.getElementById('modal-root').innerHTML = '';
    const app = document.getElementById('app');
    app.innerHTML = '';
    app.append(el);
    window.scrollTo(0, 0);
  }

  function muteBtn() {
    const b = h('button', { class: 'btn btn-icon btn-white', title: '声音开关', 'aria-label': '声音开关' });
    const upd = () => { b.textContent = state.muted ? '🔇' : '🔊'; };
    b.addEventListener('click', () => { state.muted = !state.muted; save(); upd(); G.sfx('click'); });
    upd();
    return b;
  }

  const doneCount = () => G.levels.filter((l) => state.done[l.id]).length;
  const cardCount = () => G.cardOrder.filter((id) => state.cards[id]).length;
  const allDone = () => G.levels.length > 0 && doneCount() === G.levels.length;

  /* ---------------- 标题页 ---------------- */
  function showTitle() {
    const started = doneCount() > 0;
    setScreen(h('div', { class: 'screen title-screen' },
      h('div', { class: 'title-top' }, muteBtn()),
      h('div', { class: 'title-robot bob', html: G.robotSVG('happy') }),
      h('h1', { class: 'game-title' },
        h('span', { class: 't-small' }, '训练你的'),
        h('span', { class: 't-big' }, '小机器人')),
      h('p', { class: 'subtitle' }, '机器学习大冒险 · 先动手玩，再揭晓名字'),
      h('div', { class: 'title-buttons' },
        h('button', { class: 'btn btn-big btn-yellow', onclick: () => { G.sfx('click'); showMap(); } }, started ? '继续冒险 ▶' : '开始冒险 ▶'),
        h('div', { class: 'row-buttons' },
          h('button', { class: 'btn btn-pink', onclick: () => { G.sfx('click'); showCollection(); } }, `📖 术语图鉴 ${cardCount()}/${G.cardOrder.length}`),
          allDone() && h('button', { class: 'btn btn-purple', onclick: () => { G.sfx('click'); showCertificate(); } }, '🎓 毕业证书'),
          h('button', { class: 'btn btn-mint', onclick: () => { G.sfx('click'); showDonate(); } }, '🧋 支持作者'),
          h('button', { class: 'btn btn-white', onclick: () => { G.sfx('click'); showAbout(); } }, 'ℹ️ 关于'))),
      h('ul', { class: 'title-points' },
        h('li', {}, '🤖 12 个关卡，每关 3–5 分钟'),
        h('li', {}, '🃏 收集 ' + G.cardOrder.length + ' 张术语卡'),
        h('li', {}, '🧮 不需要任何数学基础'))
    ));
  }

  /* ---------------- 关卡地图 ---------------- */
  const tileColors = ['yellow', 'pink', 'mint', 'blue', 'purple', 'orange'];
  function showMap() {
    const grid = h('div', { class: 'map-grid' });
    G.levels.forEach((lv, i) => {
      const done = !!state.done[lv.id];
      const unlocked = i === 0 || state.done[G.levels[i - 1].id] || done;
      const tile = h('button', {
        class: `map-tile tile-${tileColors[i % tileColors.length]} ${done ? 'done' : ''} ${unlocked ? '' : 'locked'}`,
        onclick: () => {
          G.sfx('click');
          if (!unlocked) {
            const m = modal(h('div', { class: 'center' },
              h('div', { class: 'big-emoji' }, '🔒'),
              h('h2', {}, '建议先完成前面的关卡'),
              h('p', {}, '每一关都会用到前面学过的本领。不过，如果你已经懂了，也可以直接挑战！'),
              h('div', { class: 'btn-row' },
                h('button', { class: 'btn btn-white', onclick: () => m.close() }, '好，我按顺序来'),
                h('button', { class: 'btn btn-yellow', onclick: () => { m.close(); startLevel(lv); } }, '我就要挑战它'))));
            return;
          }
          startLevel(lv);
        }
      },
        h('span', { class: 'tile-num' }, i + 1),
        h('span', { class: 'tile-icon' }, unlocked ? lv.icon : '🔒'),
        h('span', { class: 'tile-title' }, lv.title),
        h('span', { class: 'tile-status' },
          done ? h('span', {}, '✅ 已学会', state.quiz[lv.id] ? ' · 🧠' : '') : unlocked ? h('span', {}, '⏱ ' + (lv.minutes || 4) + ' 分钟') : '未解锁'),
        done && h('span', { class: 'tile-terms' }, lv.terms.map((id) => G.cards[id].name).join(' · '))
      );
      grid.append(tile);
    });
    setScreen(h('div', { class: 'screen map-screen' },
      h('div', { class: 'topbar' },
        h('button', { class: 'btn btn-small btn-white', onclick: () => { G.sfx('click'); showTitle(); } }, '← 首页'),
        h('div', { class: 'map-progress' },
          h('span', { class: 'chip' }, `⭐ ${doneCount()}/${G.levels.length} 关`),
          h('span', { class: 'chip' }, `🃏 ${cardCount()}/${G.cardOrder.length} 卡`)),
        h('div', { class: 'topbar-right' },
          muteBtn(),
          h('button', { class: 'btn btn-small btn-pink', onclick: () => { G.sfx('click'); showCollection(); } }, '📖 图鉴'))),
      h('div', { class: 'map-head' },
        h('div', { class: 'map-robot', html: G.robotSVG(allDone() ? 'wow' : 'happy') }),
        h('div', { class: 'bubble static' }, allDone()
          ? '训练师，你已经把我教会了全部 12 项本领！去领毕业证书吧 🎓'
          : '训练师你好！我是小机器人「波波」。每一关教我一项新本领吧～ 先玩，玩完再告诉你它叫什么名字。')),
      grid,
      h('div', { class: 'map-foot' },
        allDone() && h('button', { class: 'btn btn-purple', onclick: showCertificate }, '🎓 领取毕业证书'),
        h('button', { class: 'btn btn-mint', onclick: showDonate }, '🧋 喜欢这个游戏？支持作者'))
    ));
  }

  /* ---------------- 关卡 ---------------- */
  function startLevel(lv) {
    const idx = G.levels.indexOf(lv);
    const cleanups = [];
    let won = false;
    let missions = [];
    const robotEl = h('div', { class: 'robot-mini' });
    const bubble = h('div', { class: 'bubble' });
    const missionList = h('ol', { class: 'missions' });
    const stage = h('div', { class: 'stage' });
    const winbar = h('div', { class: 'winbar' });

    setScreen(h('div', { class: 'screen level-screen' },
      h('div', { class: 'topbar' },
        h('button', { class: 'btn btn-small btn-white', onclick: () => { G.sfx('click'); showMap(); } }, '← 地图'),
        h('div', { class: 'level-title' }, h('span', { class: 'lv-num' }, `第 ${idx + 1} 关`), h('span', {}, `${lv.icon} ${lv.title}`)),
        h('div', { class: 'topbar-right' },
          muteBtn(),
          h('button', { class: 'btn btn-icon btn-white', title: '重新开始本关', 'aria-label': '重新开始本关', onclick: () => { G.sfx('click'); startLevel(lv); } }, '↺'),
          h('button', { class: 'btn btn-icon btn-pink', title: '术语图鉴', 'aria-label': '术语图鉴', onclick: () => { G.sfx('click'); showCollection(); } }, '📖'))),
      h('div', { class: 'robot-row' }, robotEl, bubble),
      h('div', { class: 'mission-box' }, h('div', { class: 'mission-head' }, '🎯 任务'), missionList),
      stage,
      winbar
    ));
    leaveFns.push(() => cleanups.forEach((f) => { try { f(); } catch (e) { console.error(e); } }));

    function renderMissions() {
      missionList.innerHTML = '';
      missions.forEach((m) => missionList.append(h('li', { class: m.done ? 'done' : '' }, h('span', { class: 'tick' }, m.done ? '✔' : ''), h('span', { html: m.t }))));
    }

    const api = {
      say(text, mood) {
        robotEl.innerHTML = G.robotSVG(mood || 'happy');
        bubble.innerHTML = text;
        bubble.classList.remove('pop');
        void bubble.offsetWidth;
        bubble.classList.add('pop');
      },
      missions(list) { missions = list.map((t) => ({ t, done: false })); renderMissions(); },
      check(i) {
        if (!missions[i] || missions[i].done) return false;
        missions[i].done = true;
        renderMissions();
        G.sfx('good');
        return true;
      },
      checked: (i) => !!(missions[i] && missions[i].done),
      allChecked: () => missions.length > 0 && missions.every((m) => m.done),
      win() {
        if (won) return;
        won = true;
        state.done[lv.id] = true;
        save();
        G.sfx('win');
        G.confetti();
        api.say(lv.winLine || '我学会啦！谢谢你，训练师！', 'wow');
        winbar.innerHTML = '';
        winbar.append(h('div', { class: 'winbar-inner' },
          h('span', { class: 'win-text' }, '🎉 任务完成！'),
          h('button', { class: 'btn btn-yellow btn-big pulse', onclick: () => showReveal(lv) }, '揭晓：你刚才做的事叫什么？✨')));
        winbar.classList.add('show');
      },
      get won() { return won; },
      raf(fn) {
        let alive = true, id = 0;
        const loop = (t) => { if (!alive) return; fn(t); id = requestAnimationFrame(loop); };
        id = requestAnimationFrame(loop);
        const stop = () => { alive = false; cancelAnimationFrame(id); };
        cleanups.push(stop);
        return stop;
      },
      after(ms, fn) { const id = setTimeout(fn, ms); cleanups.push(() => clearTimeout(id)); return id; },
      every(ms, fn) { const id = setInterval(fn, ms); const stop = () => clearInterval(id); cleanups.push(stop); return stop; },
      wait(ms) { return new Promise((res) => api.after(ms, res)); },
      onCleanup(fn) { cleanups.push(fn); },
      sfx: G.sfx,
      toast: G.toast
    };

    api.say(lv.hello || lv.story, 'happy');
    try {
      const ret = lv.mount(stage, api);
      if (typeof ret === 'function') cleanups.push(ret);
    } catch (e) {
      console.error(e);
      stage.append(h('p', {}, '这一关加载出错了：' + e.message));
    }

    // 开场卡片
    const intro = modal(h('div', { class: 'intro' },
      h('div', { class: 'intro-num' }, `第 ${idx + 1} 关`),
      h('div', { class: 'big-emoji' }, lv.icon),
      h('h2', {}, lv.title),
      h('p', { class: 'intro-story', html: lv.story }),
      h('p', { class: 'intro-skill' }, '🎯 教会波波：', h('b', {}, lv.skill)),
      h('button', { class: 'btn btn-big btn-yellow', onclick: () => { G.sfx('click'); intro.close(); } }, '开始训练！')
    ), { cls: 'intro-modal' });
  }

  /* ---------------- 揭晓 + 术语卡 + 小测验 ---------------- */
  function showReveal(lv) {
    G.sfx('card');
    const newOnes = lv.terms.filter((id) => !state.cards[id]);
    lv.terms.forEach((id) => { state.cards[id] = true; });
    save();

    const termChips = h('div', { class: 'reveal-terms' },
      lv.terms.map((id, i) => h('span', { class: 'reveal-term', style: { animationDelay: 0.25 + i * 0.35 + 's' } }, G.cards[id].name)));
    const cards = h('div', { class: 'reveal-cards' }, lv.terms.map((id) => {
      const c = cardEl(G.cards[id], { mini: true, isNew: newOnes.includes(id) });
      c.addEventListener('click', () => showCardDetail(id));
      return c;
    }));

    const m = modal(h('div', { class: 'reveal' },
      h('p', { class: 'reveal-pre' }, '你刚才做的事情，叫——'),
      termChips,
      h('div', { class: 'reveal-text', html: lv.reveal }),
      h('p', { class: 'reveal-got' }, newOnes.length ? `🃏 解锁了 ${newOnes.length} 张术语卡！（点卡片看详细）` : '🃏 本关的术语卡（点卡片看详细）'),
      cards,
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn btn-big btn-mint', onclick: () => { G.sfx('click'); m.set(quizView(lv, m)); } }, '小测验：真的懂了吗？ →'))
    ), { wide: true, closable: false });
  }

  function quizView(lv, m) {
    const q = lv.quiz;
    let solved = false;
    let tries = 0;
    const fb = h('div', { class: 'quiz-fb' });
    const after = h('div', { class: 'btn-row' });
    const order = G.shuffle(q.options.map((_, i) => i));
    const opts = order.map((i, k) => {
      const b = h('button', { class: 'quiz-opt' }, h('b', {}, 'ABCD'[k] + '. '), q.options[i]);
      b.addEventListener('click', () => {
        if (solved) return;
        if (i === q.answer) {
          solved = true;
          b.classList.add('right');
          G.sfx('good');
          if (tries === 0) { state.quiz[lv.id] = true; save(); }
          fb.className = 'quiz-fb right';
          fb.innerHTML = `<b>${tries === 0 ? '🧠 一次答对！太棒了！' : '✅ 答对啦！'}</b><br>${q.explain}`;
          showAfter();
        } else {
          tries++;
          b.classList.add('wrong');
          b.disabled = true;
          G.sfx('bad');
          fb.className = 'quiz-fb wrong';
          fb.innerHTML = `<b>还不对哦，再想想～</b>${q.hint ? '<br>💡 提示：' + q.hint : ''}`;
        }
      });
      return b;
    });

    function showAfter() {
      const idx = G.levels.indexOf(lv);
      const next = G.levels[idx + 1];
      after.innerHTML = '';
      after.append(
        h('button', { class: 'btn btn-white', onclick: () => { G.sfx('click'); m.close(); showMap(); } }, '🗺️ 回地图'),
        next
          ? h('button', { class: 'btn btn-big btn-yellow', onclick: () => { G.sfx('click'); m.close(); startLevel(next); } }, '下一关 ▶')
          : h('button', { class: 'btn btn-big btn-purple', onclick: () => { G.sfx('click'); m.close(); showCertificate(); } }, '🎓 领取毕业证书'));
      if (allDone() && next) after.append(h('button', { class: 'btn btn-purple', onclick: () => { m.close(); showCertificate(); } }, '🎓 证书'));
    }

    return h('div', { class: 'quiz' },
      h('div', { class: 'quiz-tag' }, '🧪 小测验 · 换个新场景'),
      h('h2', { class: 'quiz-q' }, q.q),
      h('div', { class: 'quiz-opts' }, opts),
      fb, after);
  }

  /* ---------------- 术语卡 ---------------- */
  function cardEl(c, opts) {
    opts = opts || {};
    return h('div', { class: `term-card c-${c.color || 'blue'} ${opts.mini ? 'mini' : ''}`, tabindex: opts.mini ? '0' : null },
      opts.isNew && h('span', { class: 'new-badge' }, 'NEW'),
      h('div', { class: 'tc-head' },
        h('span', { class: 'tc-emoji' }, c.emoji),
        h('div', {}, h('div', { class: 'tc-name' }, c.name), h('div', { class: 'tc-en' }, c.en))),
      h('div', { class: 'tc-body' },
        h('p', { class: 'tc-plain' }, h('b', {}, '人话：'), c.plain),
        !opts.mini && h('p', { class: 'tc-meta' }, h('b', {}, '比喻：'), c.metaphor)));
  }

  function levelOfCard(id) { return G.levels.findIndex((l) => l.terms.includes(id)); }

  function showCardDetail(id) {
    const c = G.cards[id];
    state.seenCards[id] = true; save();
    const li = levelOfCard(id);
    G.modal(h('div', { class: 'card-detail' },
      cardEl(c),
      h('details', { class: 'deep' },
        h('summary', {}, '🔍 想深入了解（含公式，可跳过）'),
        h('div', { class: 'deep-body', html: c.deep })),
      li >= 0 && h('p', { class: 'muted small' }, `来自 第 ${li + 1} 关「${G.levels[li].title}」`)
    ));
  }

  function showCollection() {
    const grid = h('div', { class: 'collection-grid' });
    G.cardOrder.forEach((id) => {
      const c = G.cards[id];
      if (state.cards[id]) {
        const el = cardEl(c, { mini: true, isNew: !state.seenCards[id] });
        el.addEventListener('click', () => { showCardDetail(id); el.querySelector('.new-badge') && el.querySelector('.new-badge').remove(); });
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') showCardDetail(id); });
        grid.append(el);
      } else {
        const li = levelOfCard(id);
        grid.append(h('div', { class: 'term-card mini locked' },
          h('div', { class: 'locked-q' }, '?'),
          h('div', { class: 'locked-hint' }, li >= 0 ? `通过第 ${li + 1} 关解锁` : '未解锁')));
      }
    });
    G.modal(h('div', { class: 'collection' },
      h('h2', {}, '📖 术语图鉴'),
      h('p', { class: 'muted' }, `已收集 ${cardCount()} / ${G.cardOrder.length} 张 · 点卡片查看“人话解释 + 生活比喻 + 深入了解”`),
      grid), { wide: true });
  }

  /* ---------------- 打赏 / 关于 / 证书 ---------------- */
  function showDonate() {
    const cfg = window.GAME_CONFIG || {};
    G.modal(h('div', { class: 'donate center' },
      h('div', { class: 'donate-robot', html: G.robotSVG('wow', '#63e6be') }),
      h('h2', {}, '请波波喝杯奶茶？🧋'),
      h('p', {}, '这个游戏完全免费。如果它帮你（或你的孩子、学生）弄懂了机器学习，欢迎随意打赏，支持作者继续做更多好玩的学习游戏！'),
      h('div', { class: 'donate-buttons' },
        h('a', { class: 'btn btn-big btn-blue donate-btn', href: cfg.paypalUrl, target: '_blank', rel: 'noopener noreferrer', onclick: () => G.sfx('good') },
          h('span', { class: 'd-ico' }, '💳'), h('span', {}, h('b', {}, 'PayPal'), h('small', {}, '海外 / 信用卡'))),
        h('a', { class: 'btn btn-big btn-purple donate-btn', href: cfg.afdianUrl, target: '_blank', rel: 'noopener noreferrer', onclick: () => G.sfx('good') },
          h('span', { class: 'd-ico' }, '⚡'), h('span', {}, h('b', {}, '爱发电'), h('small', {}, '微信 / 支付宝')))),
      h('p', { class: 'muted small' }, '也可以在 itch.io 页面上给游戏评分、留言，或分享给需要的朋友 💛')
    ));
  }

  function showAbout() {
    const cfg = window.GAME_CONFIG || {};
    G.modal(h('div', { class: 'about' },
      h('h2', {}, 'ℹ️ 关于这个游戏'),
      h('p', {}, '《训练你的小机器人》用 12 个小关卡，带你亲手体验机器学习里最常见的概念。'),
      h('p', {}, h('b', {}, '玩法秘诀：'), '每一关都先让你动手做一件事，做完才揭晓“你刚才做的事情叫什么”。术语只是给你已经体验过的东西起个名字，不用死记硬背。'),
      h('ul', {},
        h('li', {}, '每关 3–5 分钟，只学一个概念'),
        h('li', {}, '通关解锁术语卡，随时在图鉴里回看'),
        h('li', {}, '公式都藏在“想深入了解”折叠区，可以跳过'),
        h('li', {}, '大胆把参数调坏！看看“坏掉”是什么样子，往往学得最快')),
      h('p', { class: 'muted small' }, `作者：${cfg.author || ''} · 版本 ${cfg.version || ''} · 进度保存在本机浏览器中`),
      h('div', { class: 'btn-row' },
        h('button', {
          class: 'btn btn-small btn-white', onclick: () => {
            if (window.confirm('确定要清空所有进度和术语卡吗？')) {
              ['done', 'quiz', 'cards', 'seenCards'].forEach((k) => { state[k] = {}; });
              save(); showTitle();
            }
          }
        }, '🗑️ 清空进度'))
    ));
  }

  function showCertificate() {
    const nameInput = h('input', { class: 'cert-name-input', maxlength: '16', placeholder: '写下你的名字', value: state.name || '' });
    const nameOut = h('span', { class: 'cert-name' }, state.name || '训练师');
    nameInput.addEventListener('input', () => { state.name = nameInput.value.trim(); save(); nameOut.textContent = state.name || '训练师'; });
    const d = new Date();
    G.confetti(90);
    G.sfx('win');
    G.modal(h('div', { class: 'cert-wrap' },
      h('div', { class: 'certificate' },
        h('div', { class: 'cert-ribbon' }, '🎓'),
        h('div', { class: 'cert-title' }, '机器学习小小训练师'),
        h('div', { class: 'cert-sub' }, '毕 业 证 书'),
        h('p', {}, '兹证明 ', nameOut, ' 成功训练小机器人波波，'),
        h('p', {}, `掌握了 ${cardCount()} 个机器学习核心术语：`),
        h('div', { class: 'cert-terms' }, G.cardOrder.filter((id) => state.cards[id]).map((id) => h('span', {}, G.cards[id].name))),
        h('div', { class: 'cert-foot' },
          h('span', {}, `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`),
          h('span', { class: 'cert-seal', html: G.robotSVG('wow') }))),
      h('label', { class: 'cert-label' }, '✏️ 证书上的名字：', nameInput),
      h('p', { class: 'muted small center' }, '可以截图保存，分享给朋友 📸'),
      h('div', { class: 'btn-row' }, h('button', { class: 'btn btn-mint', onclick: showDonate }, '🧋 支持作者'))
    ), { wide: true });
  }

  G.showTitle = showTitle;
  G.showMap = showMap;
  G.startLevel = startLevel;
  G.showCollection = showCollection;
  G.showDonate = showDonate;

  G.boot = function () {
    // 开发用：URL 加 ?level=3 直接进入某关
    const m = /[?&]level=(\d+)/.exec(location.search);
    if (m && G.levels[+m[1] - 1]) startLevel(G.levels[+m[1] - 1]);
    else showTitle();
  };
})();
