/* 第 2 关：特征 —— 只能挑 2~3 条线索来区分猫和狗 */
(function () {
  const { h } = G;

  const COLORS = {
    orange: { fill: '#ffb366', dark: '#e8873a', name: '橘色毛' },
    gray: { fill: '#c9ced8', dark: '#8f97a6', name: '灰色毛' },
    white: { fill: '#ffffff', dark: '#d5d5dd', name: '白色毛' },
    black: { fill: '#6b6280', dark: '#3b3355', name: '黑色毛' }
  };
  const FEATURES = [
    { key: 'ear', name: '👂 耳朵形状', vals: { pointy: '尖耳朵', floppy: '垂耳朵' } },
    { key: 'snout', name: '👃 鼻子长短', vals: { short: '短鼻子', long: '长鼻子' } },
    { key: 'size', name: '📏 体型大小', vals: { small: '小个子', big: '大个子' } },
    { key: 'color', name: '🎨 毛的颜色', vals: { orange: '橘色毛', gray: '灰色毛', white: '白色毛', black: '黑色毛' } },
    { key: 'tail', name: '〰️ 尾巴长短', vals: { long: '长尾巴', short: '短尾巴' } }
  ];

  const mk = (ear, snout, size, color, tail, label) => ({ ear, snout, size, color, tail, label });
  // 设计：只有“耳朵 + 鼻子”一起看才完全分得开；毛色、尾巴是干扰项
  const TRAIN = [
    mk('pointy', 'short', 'small', 'orange', 'long', 'cat'),
    mk('floppy', 'long', 'big', 'orange', 'long', 'dog'),
    mk('pointy', 'short', 'small', 'gray', 'long', 'cat'),
    mk('pointy', 'long', 'big', 'gray', 'long', 'dog'),
    mk('pointy', 'short', 'small', 'white', 'short', 'cat'),
    mk('floppy', 'short', 'small', 'white', 'short', 'dog'),
    mk('pointy', 'short', 'big', 'black', 'long', 'cat'),
    mk('floppy', 'long', 'small', 'black', 'short', 'dog'),
    mk('pointy', 'short', 'small', 'black', 'long', 'cat'),
    mk('pointy', 'long', 'small', 'orange', 'long', 'dog'),
    mk('pointy', 'short', 'small', 'orange', 'short', 'cat'),
    mk('floppy', 'long', 'big', 'white', 'long', 'dog')
  ];
  const TEST = [
    mk('floppy', 'long', 'big', 'gray', 'short', 'dog'),
    mk('pointy', 'short', 'small', 'white', 'long', 'cat'),
    mk('pointy', 'long', 'big', 'white', 'long', 'dog'),
    mk('pointy', 'short', 'big', 'orange', 'long', 'cat'),
    mk('floppy', 'short', 'small', 'orange', 'long', 'dog'),
    mk('pointy', 'short', 'small', 'gray', 'short', 'cat'),
    mk('floppy', 'long', 'small', 'gray', 'long', 'dog'),
    mk('pointy', 'short', 'small', 'black', 'short', 'cat'),
    mk('pointy', 'long', 'small', 'black', 'short', 'dog'),
    mk('pointy', 'short', 'small', 'orange', 'long', 'cat')
  ];
  const LABEL = { cat: '🐱 猫', dog: '🐶 狗', unk: '🤔 拿不准' };

  /** 画一只侧面的小动物（朝左） */
  function critterSVG(a) {
    const ink = '#3b3355';
    const col = COLORS[a.color];
    const s = a.size === 'big' ? 1 : 0.74;
    const tail = a.tail === 'long'
      ? `<path d="M90 56 Q114 50 108 22" stroke="${ink}" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M90 56 Q114 50 108 22" stroke="${col.fill}" stroke-width="6" fill="none" stroke-linecap="round"/>`
      : `<path d="M90 56 Q98 52 100 45" stroke="${ink}" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M90 56 Q98 52 100 45" stroke="${col.fill}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    const leg = (x) => `<rect x="${x}" y="64" width="9" height="24" rx="4" fill="${col.fill}" stroke="${ink}" stroke-width="3"/>`;
    const ears = a.ear === 'pointy'
      ? `<path d="M25 33 L27 10 L40 28 Z" fill="${col.dark}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M38 28 L48 9 L50 32 Z" fill="${col.fill}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`
      : `<ellipse cx="47" cy="44" rx="7" ry="15" fill="${col.dark}" stroke="${ink}" stroke-width="3" transform="rotate(18 47 44)"/>`;
    const snout = a.snout === 'long'
      ? `<ellipse cx="17" cy="48" rx="15" ry="8.5" fill="${col.fill}" stroke="${ink}" stroke-width="3"/><circle cx="4" cy="45.5" r="4" fill="${ink}"/><path d="M10 53 Q16 56 22 53" stroke="${ink}" stroke-width="2" fill="none"/>`
      : `<circle cx="21" cy="45" r="3" fill="${ink}"/><path d="M19 50 Q22 53 26 50" stroke="${ink}" stroke-width="2" fill="none"/><path d="M14 44 L4 41 M14 47 L3 48" stroke="${ink}" stroke-width="1.5"/>`;
    return `<svg viewBox="-4 0 128 100" aria-hidden="true">
      <ellipse cx="60" cy="92" rx="44" ry="5" fill="#000" opacity=".08"/>
      <g transform="translate(60 92) scale(${s}) translate(-60 -92)">
        ${tail}${leg(44)}${leg(80)}
        <ellipse cx="66" cy="58" rx="30" ry="18" fill="${col.fill}" stroke="${ink}" stroke-width="3.5"/>
        ${leg(52)}${leg(88)}
        <circle cx="36" cy="42" r="17" fill="${col.fill}" stroke="${ink}" stroke-width="3.5"/>
        ${ears}${snout}
        <circle cx="31" cy="39" r="3.6" fill="${ink}"/><circle cx="32.2" cy="37.8" r="1.2" fill="#fff"/>
      </g></svg>`;
  }

  /** 机器人只看选中的线索：找最像的训练样本，按多数投票 */
  function classify(item, keys) {
    let best = Infinity, votes = { cat: 0, dog: 0 };
    for (const t of TRAIN) {
      const d = keys.reduce((n, k) => n + (t[k] !== item[k] ? 1 : 0), 0);
      if (d < best) { best = d; votes = { cat: 0, dog: 0 }; }
      if (d === best) votes[t.label]++;
    }
    if (votes.cat === votes.dog) return 'unk';
    return votes.cat > votes.dog ? 'cat' : 'dog';
  }

  G.registerLevel({
    id: 'features',
    icon: '🐱',
    title: '猫猫狗狗分不清',
    skill: '靠线索分辨猫和狗',
    minutes: 4,
    terms: ['feature'],
    story: '波波的“眼睛”很省电，一次<b>只能看 2～3 条线索</b>。<br>请你帮它挑选线索：耳朵？鼻子？毛色？……挑对了，它就能分清新来的猫和狗；挑错了，它就会犯迷糊。',
    hello: '下面是我的训练照片。我一次只能看 <b>2～3 条线索</b>，你帮我挑哪几条最有用？',
    winLine: '10 只全分对！原来看对线索这么重要！',
    reveal: '<p>你挑选的“耳朵形状”“鼻子长短”这些线索，在机器学习里叫<b>「特征」</b>。</p><p>机器并不真的“看见”猫和狗，它只看你给它的特征。<b>好特征</b>（耳朵 + 鼻子）让它一下子分清；<b>没用的特征</b>（毛色、尾巴）不但帮不上忙，还可能把它带偏。</p>',
    quiz: {
      q: '要让机器人判断一个西瓜甜不甜，下面哪条线索（特征）最没用？',
      options: ['敲起来的声音是否清脆', '瓜皮的纹路是否清晰', '西瓜摆在超市货架的第几排', '瓜蒂是否新鲜'],
      answer: 2,
      hint: '哪条线索跟西瓜本身一点关系都没有？就像第 2 关里的“毛色”。',
      explain: '摆在第几排和西瓜甜不甜毫无关系，是“无用特征”。好特征要和想预测的东西真正相关。'
    },

    mount(stage, api) {
      const chosen = new Set();
      api.missions([
        '挑选 2～3 条线索',
        '让波波把 10 只<b>新来的</b>小动物全部分对'
      ]);

      // 训练照片
      const trainGrid = h('div', { class: 'tile-grid' }, TRAIN.map((t) => h('div', { class: 'pic-card critter-card' },
        h('div', { html: critterSVG(t) }),
        h('span', { class: 'critter-tag tag-' + t.label }, t.label === 'cat' ? '猫' : '狗'))));

      // 线索选择
      const clueBtns = FEATURES.map((f) => {
        const b = h('button', { class: 'clue', 'aria-pressed': 'false' }, f.name);
        b.addEventListener('click', () => {
          if (chosen.has(f.key)) chosen.delete(f.key);
          else {
            if (chosen.size >= 3) { api.toast('最多只能选 3 条线索哦！先取消一条'); api.sfx('bad'); return; }
            chosen.add(f.key);
          }
          api.sfx('pop');
          b.classList.toggle('on', chosen.has(f.key));
          b.setAttribute('aria-pressed', chosen.has(f.key));
          refresh();
        });
        return b;
      });
      const goBtn = h('button', { class: 'btn btn-big btn-yellow', disabled: true, onclick: run }, '🤖 让波波去分类');
      const counter = h('span', { class: 'chip' }, '已选 0 / 3');

      const testGrid = h('div', { class: 'tile-grid' });
      const scoreChip = h('span', { class: 'chip' }, '还没开始');
      const testCards = TEST.map(() => {
        const c = h('div', { class: 'pic-card critter-card' }, h('div', { class: 'mystery' }, '?'), h('div', { class: 'robot-view' }, '等待中…'));
        testGrid.append(c);
        return c;
      });

      stage.append(
        h('div', { class: 'panel' }, h('div', { class: 'section-title' }, '📸 训练照片（已经告诉波波谁是猫、谁是狗）'), trainGrid),
        h('div', { class: 'panel' },
          h('div', { class: 'section-title' }, '🔦 挑线索：波波只看你选中的这几条 ', counter),
          h('div', { class: 'clue-list' }, clueBtns),
          h('div', { class: 'controls', style: { marginTop: '12px' } }, goBtn)),
        h('div', { class: 'panel' }, h('div', { class: 'section-title' }, '🏠 新来的 10 只小动物 ', scoreChip), testGrid)
      );

      function refresh() {
        counter.textContent = `已选 ${chosen.size} / 3`;
        goBtn.disabled = chosen.size < 2;
        if (chosen.size >= 2) api.check(0);
      }

      let running = false;
      async function run() {
        if (running) return;
        running = true;
        goBtn.disabled = true;
        const keys = [...chosen];
        let right = 0;
        api.say('我只看：' + keys.map((k) => FEATURES.find((f) => f.key === k).name).join('、') + '……', 'think');
        for (let i = 0; i < TEST.length; i++) {
          const t = TEST[i];
          const g = classify(t, keys);
          const ok = g === t.label;
          if (ok) right++;
          const c = testCards[i];
          c.className = 'pic-card critter-card ' + (ok ? 'right' : 'wrong');
          c.innerHTML = '';
          c.append(
            h('span', { class: 'verdict' }, ok ? '✅' : '❌'),
            h('div', { html: critterSVG(t) }),
            h('span', { class: 'critter-tag tag-' + g }, LABEL[g]),
            h('div', { class: 'robot-view' }, '我看到：' + keys.map((k) => FEATURES.find((f) => f.key === k).vals[t[k]]).join('、')));
          api.sfx(ok ? 'step' : 'bad');
          await api.wait(160);
        }
        scoreChip.textContent = `分对 ${right} / ${TEST.length}`;
        running = false;
        goBtn.disabled = chosen.size < 2;
        goBtn.textContent = '🤖 换了线索，再分一次';
        if (right === TEST.length) {
          api.check(1);
          api.win();
        } else if (keys.includes('color') || keys.includes('tail')) {
          api.say(`分对了 ${right}/10。嗯……${keys.includes('color') ? '毛色' : '尾巴'}好像跟是猫是狗没啥关系，反而把我搞糊涂了 😵`, 'sad');
        } else if (keys.length === 2 && keys.includes('size')) {
          api.say(`分对了 ${right}/10。小狗也有小个子的呀，光看体型不太靠谱……`, 'sad');
        } else {
          api.say(`分对了 ${right}/10。还差一点点！看看训练照片：猫和狗<b>哪里长得最不一样</b>？`, 'think');
        }
      }
    }
  });
})();
