/* 第 10 关：数据偏差 & 垃圾进垃圾出 —— 找出被“污染”的训练数据 */
(function () {
  const { h } = G;
  const TRUE_NAME = { '🍎': '苹果', '🍏': '苹果', '🍌': '香蕉', '🍇': '葡萄', '🍓': '草莓', '🍉': '西瓜', '🍋': '柠檬', '🧦': '袜子' };
  const d = (e, label) => ({ e, label, bad: TRUE_NAME[e] !== label });

  const START = [
    d('🍎', '苹果'), d('🍌', '香蕉'), d('🍇', '西瓜'), d('🍓', '草莓'),
    d('🍉', '西瓜'), d('🍎', '苹果'), d('🍋', '香蕉'), d('🍇', '葡萄'),
    d('🧦', '苹果'), d('🍌', '香蕉'), d('🍉', '西瓜'), d('🍇', '西瓜'),
    d('🍓', '草莓'), d('🍎', '苹果'), d('🍌', '苹果')
  ];
  const EXTRA = [d('🍏', '苹果'), d('🍋', '柠檬'), d('🍏', '柠檬'), d('🍏', '苹果'), d('🍋', '柠檬')];
  const TEST = ['🍎', '🍏', '🍌', '🍇', '🍓', '🍉', '🍋'];

  /** 机器人：看过同样的东西 → 按标签多数投票；没见过 → 不认识 */
  function predict(data, e) {
    const votes = {};
    data.filter((x) => x.e === e).forEach((x) => { votes[x.label] = (votes[x.label] || 0) + 1; });
    const ks = Object.keys(votes);
    if (!ks.length) return { ans: null, votes };
    ks.sort((a, b) => votes[b] - votes[a]);
    if (ks.length > 1 && votes[ks[0]] === votes[ks[1]]) return { ans: '拿不准', votes };
    return { ans: ks[0], votes };
  }

  G.registerLevel({
    id: 'dirty',
    icon: '🧹',
    title: '波波学坏了！',
    skill: '把“脏数据”清理干净',
    minutes: 4,
    terms: ['gigo', 'bias'],
    story: '有人给波波准备了一筐水果照片当学习资料。可是波波学完以后，总是认错水果……<br>原来，这筐资料被<b>“污染”</b>了！请你当数据侦探：把<b>贴错标签的照片</b>扔掉，再从补充箱里挑选<b>波波缺少的资料</b>。',
    hello: '我学完了，但总觉得哪里怪怪的……先点<b>“训练 + 考试”</b>看看我学成了什么样？',
    winLine: '数据干净了，我也全答对了！原来学坏不是我的错，是资料的错～',
    reveal: '<p>训练数据里有贴错的标签（🍇 被写成“西瓜”）、甚至混进了一只袜子 🧦——机器照单全收，学出来也是错的。这就叫<b>「垃圾进，垃圾出」</b>：数据质量决定了模型质量。</p><p>另外，波波一开始<b>只见过红苹果</b>，第一次见到青苹果就不认识了。训练数据不能代表真实世界的样子，模型的本领就是“偏”的——这叫<b>「数据偏差」</b>。</p><p>在现实中，数据偏差可能导致 AI 认不出某些人的脸、对某些人群不公平。所以，<b>收集干净、全面的数据</b>，往往比换一个更厉害的模型还重要！</p>',
    quiz: {
      q: '一个招聘 AI 是用某公司<b>过去 10 年</b>的录取记录训练的，而那些年录取的几乎都是男性。结果它总给女性求职者打低分。这主要是什么问题？',
      options: ['数据偏差：训练数据本身就不全面、不公平', '学习率太大', '欠拟合：模型太简单', 'Token 数量不够'],
      answer: 0,
      hint: '问题出在“它学习的资料”上。',
      explain: '训练数据反映了过去的偏见，模型就学会了这种偏见。这是真实发生过的案例，也是 AI 公平性研究的重要课题。'
    },

    mount(stage, api) {
      const train = START.map((x) => ({ ...x, on: true }));
      const extra = EXTRA.map((x) => ({ ...x, on: false }));
      let busy = false;

      api.missions([
        '让波波“训练 + 考试”一次，看看它学成了什么样',
        '扔掉所有贴错标签的“脏数据”（点照片扔进垃圾桶）',
        '补上波波<b>没见过</b>的资料，让考试 7 题全对'
      ]);

      const trainGrid = h('div', { class: 'tile-grid small' });
      const extraGrid = h('div', { class: 'tile-grid small' });
      const testGrid = h('div', { class: 'tile-grid small' });
      const goBtn = h('button', { class: 'btn btn-big btn-yellow', onclick: run }, '🤖 训练 + 考试');
      const countChip = h('span', { class: 'chip' }, '');
      const scoreChip = h('span', { class: 'chip' }, '还没考');

      stage.append(
        h('div', { class: 'panel' }, h('div', { class: 'section-title' }, '🧺 训练资料（点照片：扔掉 / 捡回来）', countChip), trainGrid),
        h('div', { class: 'panel' }, h('div', { class: 'section-title' }, '📦 补充资料箱（点照片：加入训练资料）'),
          h('p', { class: 'small muted', style: { margin: '0 0 8px' } }, '⚠️ 小心！补充箱里的资料也不一定都是对的。'), extraGrid),
        h('div', { class: 'controls' }, goBtn),
        h('div', { class: 'panel' }, h('div', { class: 'section-title' }, '📝 考试：认出这些水果 ', scoreChip), testGrid));

      function cardFor(x, isExtra) {
        const el = h('div', {
          class: 'pic-card data-card ' + (isExtra ? (x.on ? 'added' : '') : (x.on ? '' : 'trashed')),
          role: 'button', tabindex: '0', 'aria-pressed': String(x.on)
        }, h('div', { class: 'pic' }, x.e), h('span', { class: 'lbl' }, x.label));
        const toggle = () => { if (busy) return; x.on = !x.on; api.sfx(x.on ? 'pop' : 'boing'); renderData(); };
        el.addEventListener('click', toggle);
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
        return el;
      }

      function renderData() {
        trainGrid.innerHTML = '';
        train.forEach((x) => trainGrid.append(cardFor(x, false)));
        extraGrid.innerHTML = '';
        extra.forEach((x) => extraGrid.append(cardFor(x, true)));
        const n = train.filter((x) => x.on).length + extra.filter((x) => x.on).length;
        countChip.textContent = `共 ${n} 张`;
      }

      function renderTestBlank() {
        testGrid.innerHTML = '';
        TEST.forEach((e) => testGrid.append(h('div', { class: 'pic-card' }, h('div', { class: 'pic' }, e), h('div', { class: 'robot-says' }, '？'))));
      }

      async function run() {
        if (busy) return;
        busy = true; goBtn.disabled = true;
        const data = train.filter((x) => x.on).concat(extra.filter((x) => x.on));
        api.say('学习中……我会<b>完全相信</b>资料上写的标签哦！', 'think');
        await api.wait(600);
        testGrid.innerHTML = '';
        let right = 0;
        const wrongs = [];
        for (const e of TEST) {
          const p = predict(data, e);
          const ok = p.ans === TRUE_NAME[e];
          if (ok) right++; else wrongs.push({ e, p });
          testGrid.append(h('div', { class: 'pic-card ' + (ok ? 'right' : 'wrong') },
            h('span', { class: 'verdict' }, ok ? '✅' : '❌'),
            h('div', { class: 'pic' }, e),
            h('div', {}, h('b', {}, p.ans || '🤷 不认识'))));
          api.sfx(ok ? 'step' : 'bad');
          await api.wait(260);
        }
        scoreChip.textContent = `答对 ${right} / ${TEST.length}`;
        api.check(0);
        const dirtyLeft = data.filter((x) => x.bad).length;
        if (dirtyLeft === 0) api.check(1);
        busy = false; goBtn.disabled = false;

        if (right === TEST.length && dirtyLeft === 0) {
          api.check(2);
          api.win();
          return;
        }
        if (right === TEST.length) {
          const bad = data.find((x) => x.bad);
          api.say(`全答对了！可是资料里还藏着脏数据：${bad.e} 被写成了“${bad.label}”。也把它清理掉吧！`, 'think');
          return;
        }
        const w = wrongs[0];
        const vs = Object.entries(w.p.votes).map(([k, v]) => `${v} 张写着“${k}”`).join('，');
        if (!w.p.ans) api.say(`我从来<b>没见过</b> ${w.e}！我的资料里一张都没有……是不是该补充一点？`, 'sad');
        else api.say(`我把 ${w.e} 认成了“${w.p.ans}”，因为资料里 ${w.e} 有 ${vs}。我是照着资料学的呀！`, 'sad');
      }

      renderData();
      renderTestBlank();
    }
  });
})();
