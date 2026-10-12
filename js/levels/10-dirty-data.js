/* 第 10 关：数据偏差 & 垃圾进垃圾出 —— 找出被“污染”的训练数据 */
(function () {
  const { h } = G;
  const tr = G.t;
  // 水果名（也是照片上写的标签）
  const N = {
    apple: tr('苹果', 'Apple'), banana: tr('香蕉', 'Banana'), grape: tr('葡萄', 'Grape'), strawberry: tr('草莓', 'Strawberry'),
    melon: tr('西瓜', 'Watermelon'), lemon: tr('柠檬', 'Lemon'), sock: tr('袜子', 'Sock')
  };
  const TRUE_NAME = { '🍎': N.apple, '🍏': N.apple, '🍌': N.banana, '🍇': N.grape, '🍓': N.strawberry, '🍉': N.melon, '🍋': N.lemon, '🧦': N.sock };
  const d = (e, label) => ({ e, label, bad: TRUE_NAME[e] !== label });
  const UNSURE = tr('拿不准', 'Not sure');

  const START = [
    d('🍎', N.apple), d('🍌', N.banana), d('🍇', N.melon), d('🍓', N.strawberry),
    d('🍉', N.melon), d('🍎', N.apple), d('🍋', N.banana), d('🍇', N.grape),
    d('🧦', N.apple), d('🍌', N.banana), d('🍉', N.melon), d('🍇', N.melon),
    d('🍓', N.strawberry), d('🍎', N.apple), d('🍌', N.apple)
  ];
  const EXTRA = [d('🍏', N.apple), d('🍋', N.lemon), d('🍏', N.lemon), d('🍏', N.apple), d('🍋', N.lemon)];
  const TEST = ['🍎', '🍏', '🍌', '🍇', '🍓', '🍉', '🍋'];

  /** 机器人：看过同样的东西 → 按标签多数投票；没见过 → 不认识 */
  function predict(data, e) {
    const votes = {};
    data.filter((x) => x.e === e).forEach((x) => { votes[x.label] = (votes[x.label] || 0) + 1; });
    const ks = Object.keys(votes);
    if (!ks.length) return { ans: null, votes };
    ks.sort((a, b) => votes[b] - votes[a]);
    if (ks.length > 1 && votes[ks[0]] === votes[ks[1]]) return { ans: UNSURE, votes };
    return { ans: ks[0], votes };
  }

  G.registerLevel({
    id: 'dirty',
    icon: '🧹',
    title: tr('波波学坏了！', 'Bobo Learned It Wrong!'),
    skill: tr('把“脏数据”清理干净', 'cleaning up “dirty data”'),
    minutes: 4,
    terms: ['gigo', 'bias'],
    story: tr(
      '有人给波波准备了一筐水果照片当学习资料。可是波波学完以后，总是认错水果……<br>原来，这筐资料被<b>“污染”</b>了！请你当数据侦探：把<b>贴错标签的照片</b>扔掉，再从补充箱里挑选<b>波波缺少的资料</b>。',
      'Someone gave Bobo a basket of fruit photos to study. But after learning from them, Bobo keeps getting fruit wrong…<br>Turns out the basket is <b>“polluted”</b>! Be a data detective: throw out the <b>photos with wrong labels</b>, then pick <b>what Bobo is missing</b> from the extras box.'),
    hello: tr(
      '我学完了，但总觉得哪里怪怪的……先点<b>“训练 + 考试”</b>看看我学成了什么样？',
      'I finished studying, but something feels off… Press <b>“Train + test”</b> to see what I learned?'),
    winLine: tr('数据干净了，我也全答对了！原来学坏不是我的错，是资料的错～', 'The data is clean and I got everything right! It wasn’t my fault I learned it wrong — it was the data’s!'),
    reveal: tr(
      '<p>训练数据里有贴错的标签（🍇 被写成“西瓜”）、甚至混进了一只袜子 🧦——机器照单全收，学出来也是错的。这就叫<b>「垃圾进，垃圾出」</b>：数据质量决定了模型质量。</p><p>另外，波波一开始<b>只见过红苹果</b>，第一次见到青苹果就不认识了。训练数据不能代表真实世界的样子，模型的本领就是“偏”的——这叫<b>「数据偏差」</b>。</p><p>在现实中，数据偏差可能导致 AI 认不出某些人的脸、对某些人群不公平。所以，<b>收集干净、全面的数据</b>，往往比换一个更厉害的模型还重要！</p>',
      '<p>The training data had wrong labels (🍇 marked “Watermelon”) and even a sock 🧦 mixed in — the machine believed all of it, so what it learned was wrong too. That’s called <b>garbage in, garbage out</b>: the quality of the data decides the quality of the model.</p><p>Also, at first Bobo had <b>only ever seen red apples</b>, so it didn’t recognize a green apple. When training data doesn’t represent the real world, the model’s skills are “skewed” — that’s called <b>data bias</b>.</p><p>In real life, data bias can make AI fail to recognize some people’s faces or treat some groups unfairly. That’s why <b>collecting clean, well-rounded data</b> often matters more than switching to a fancier model!</p>'),
    quiz: {
      q: tr(
        '一个招聘 AI 是用某公司<b>过去 10 年</b>的录取记录训练的，而那些年录取的几乎都是男性。结果它总给女性求职者打低分。这主要是什么问题？',
        'A hiring AI was trained on a company’s hiring records from <b>the past 10 years</b>, when almost everyone hired was male. Now it keeps giving female applicants low scores. What’s the main problem?'),
      options: [
        tr('数据偏差：训练数据本身就不全面、不公平', 'Data bias: the training data itself was incomplete and unfair'),
        tr('学习率太大', 'The learning rate is too big'),
        tr('欠拟合：模型太简单', 'Underfitting: the model is too simple'),
        tr('Token 数量不够', 'Not enough tokens')
      ],
      answer: 0,
      hint: tr('问题出在“它学习的资料”上。', 'The problem is in “what it learned from”.'),
      explain: tr(
        '训练数据反映了过去的偏见，模型就学会了这种偏见。这是真实发生过的案例，也是 AI 公平性研究的重要课题。',
        'The training data reflected past bias, so the model learned that bias. This really happened, and it’s a key topic in AI fairness research.')
    },

    mount(stage, api) {
      const train = START.map((x) => ({ ...x, on: true }));
      const extra = EXTRA.map((x) => ({ ...x, on: false }));
      let busy = false;

      api.missions([
        tr('让波波“训练 + 考试”一次，看看它学成了什么样', 'Run “Train + test” once to see what Bobo learned'),
        tr('扔掉所有贴错标签的“脏数据”（点照片扔进垃圾桶）', 'Throw out all the wrongly labeled “dirty data” (tap a photo to trash it)'),
        tr('补上波波<b>没见过</b>的资料，让考试 7 题全对', 'Add what Bobo has <b>never seen</b> so it gets all 7 test questions right')
      ]);

      const trainGrid = h('div', { class: 'tile-grid small' });
      const extraGrid = h('div', { class: 'tile-grid small' });
      const testGrid = h('div', { class: 'tile-grid small' });
      const goBtn = h('button', { class: 'btn btn-big btn-yellow', onclick: run }, tr('🤖 训练 + 考试', '🤖 Train + test'));
      const countChip = h('span', { class: 'chip' }, '');
      const scoreChip = h('span', { class: 'chip' }, tr('还没考', 'Not tested yet'));

      stage.append(
        h('div', { class: 'panel' }, h('div', { class: 'section-title' }, tr('🧺 训练资料（点照片：扔掉 / 捡回来）', '🧺 Training data (tap a photo: trash / restore)'), countChip), trainGrid),
        h('div', { class: 'panel' }, h('div', { class: 'section-title' }, tr('📦 补充资料箱（点照片：加入训练资料）', '📦 Extras box (tap a photo: add to training data)')),
          h('p', { class: 'small muted', style: { margin: '0 0 8px' } }, tr('⚠️ 小心！补充箱里的资料也不一定都是对的。', '⚠️ Careful! Not everything in the extras box is correct either.')), extraGrid),
        h('div', { class: 'controls' }, goBtn),
        h('div', { class: 'panel' }, h('div', { class: 'section-title' }, tr('📝 考试：认出这些水果 ', '📝 Test: name these fruits '), scoreChip), testGrid));

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
        countChip.textContent = tr(`共 ${n} 张`, `${n} photos`);
      }

      function renderTestBlank() {
        testGrid.innerHTML = '';
        TEST.forEach((e) => testGrid.append(h('div', { class: 'pic-card' }, h('div', { class: 'pic' }, e), h('div', { class: 'robot-says' }, tr('？', '?')))));
      }

      async function run() {
        if (busy) return;
        busy = true; goBtn.disabled = true;
        const data = train.filter((x) => x.on).concat(extra.filter((x) => x.on));
        api.say(tr('学习中……我会<b>完全相信</b>资料上写的标签哦！', 'Studying… I’ll <b>completely trust</b> whatever the labels say!'), 'think');
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
            h('div', {}, h('b', {}, p.ans || tr('🤷 不认识', '🤷 No idea')))));
          api.sfx(ok ? 'step' : 'bad');
          await api.wait(260);
        }
        scoreChip.textContent = tr(`答对 ${right} / ${TEST.length}`, `Correct: ${right} / ${TEST.length}`);
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
          api.say(tr(
            `全答对了！可是资料里还藏着脏数据：${bad.e} 被写成了“${bad.label}”。也把它清理掉吧！`,
            `All correct! But there’s still dirty data hiding in there: ${bad.e} is labeled “${bad.label}”. Clean that up too!`), 'think');
          return;
        }
        const w = wrongs[0];
        const vs = Object.entries(w.p.votes).map(([k, v]) => tr(`${v} 张写着“${k}”`, `${v} labeled “${k}”`)).join(tr('，', ', '));
        if (!w.p.ans) {
          api.say(tr(
            `我从来<b>没见过</b> ${w.e}！我的资料里一张都没有……是不是该补充一点？`,
            `I’ve <b>never seen</b> ${w.e}! There isn’t a single one in my data… maybe add some?`), 'sad');
        } else {
          api.say(tr(
            `我把 ${w.e} 认成了“${w.p.ans}”，因为资料里 ${w.e} 有 ${vs}。我是照着资料学的呀！`,
            `I called ${w.e} “${w.p.ans}”, because in my data ${w.e} has ${vs}. I just learned what the data told me!`), 'sad');
        }
      }

      renderData();
      renderTestBlank();
    }
  });
})();
