/* 第 12 关：大语言模型、Token、温度 —— 下一个词猜猜猜 */
(function () {
  const { h } = G;

  const ROUNDS = [
    { ctx: ['小猫', '最', '喜欢', '吃'], cands: [['鱼', 62], ['老鼠', 21], ['猫粮', 14], ['石头', 1]] },
    { ctx: ['生日', '快'], cands: [['乐', 95], ['递', 2], ['跑', 1.5], ['门', 0.5]] },
    { ctx: ['今天', '天气', '真'], cands: [['好', 68], ['热', 17], ['冷', 12], ['甜', 1]] },
    { ctx: ['我', '每天', '早上', '都', '刷'], cands: [['牙', 81], ['手机', 12], ['题', 5], ['墙', 0.5]] },
    { ctx: ['一', '二', '三', '四', '五', '，'], cands: [['上山', 74], ['六', 19], ['下雨', 3], ['吃饭', 1]] }
  ];

  const STORY = [
    { pre: '从前有一只', opts: [['小猫', 40], ['小狗', 30], ['机器人', 20], ['恐龙', 8], ['冰箱', 2]] },
    { pre: '，它住在', opts: [['森林里', 40], ['城市里', 30], ['海边', 20], ['月亮上', 8], ['鞋子里', 2]] },
    { pre: '，每天都在', opts: [['睡觉', 36], ['唱歌', 30], ['找朋友', 25], ['写代码', 7], ['吃袜子', 2]] },
    { pre: '。最后，', opts: [['大家都很开心', 50], ['它交到了新朋友', 35], ['它变成了一朵云', 11], ['宇宙爆炸了', 4]] }
  ];

  function temper(opts, T) {
    const ws = opts.map(([, p]) => Math.pow(p, 1 / T));
    const s = ws.reduce((a, b) => a + b, 0);
    return ws.map((w) => w / s);
  }
  function sample(ps) {
    let r = Math.random();
    for (let i = 0; i < ps.length; i++) { r -= ps[i]; if (r <= 0) return i; }
    return ps.length - 1;
  }

  G.registerLevel({
    id: 'llm',
    icon: '💬',
    title: '下一个词猜猜猜',
    skill: '像聊天 AI 一样“接话”',
    minutes: 5,
    terms: ['llm', 'token', 'temperature'],
    story: '波波读过了<b>好多好多</b>书和文章。现在它能玩一个游戏：给它半句话，它猜<b>下一个词</b>最可能是什么。<br>先来比一比：你能猜中波波心里排第一的词吗？然后，你还可以调节波波的<b>“大胆程度”</b>，让它写个小故事！',
    hello: '看看这半句话，你觉得我会接哪个词？我把句子切成了一块一块的小积木来读哦～',
    winLine: '你已经知道聊天 AI 是怎么“说话”的啦！',
    reveal: '<p>你刚才看到的，就是<b>「大语言模型」</b>（比如各种聊天 AI）的核心秘密：它并不是“查”到答案，而是根据前文，<b>一个词一个词地预测下一个最可能出现的词</b>。读过的文字越多，猜得越准。</p><p>波波把句子切成的那些小积木（“小猫”“喜欢”“吃”），叫<b>「Token」（词元）</b>，是模型读写文字的最小单位。</p><p>那个“大胆程度”旋钮叫<b>「温度」</b>：温度低，总挑概率最高的词，稳妥但无聊；温度高，敢挑冷门的词，更有创意，也更容易胡说八道（比如“吃袜子”🧦）。</p>',
    quiz: {
      q: '让大语言模型续写“床前明月光，”，它很可能写出“疑是地上霜”。最好的解释是？',
      options: ['训练时读过很多次这首诗，这些 token 接在后面的概率最高', '它真的抬头看见了月亮', '它每次都在网上实时搜索答案', '它是随便乱写，碰巧对了'],
      answer: 0,
      hint: '回想一下：波波是怎么决定下一个词的？',
      explain: '大语言模型根据训练时见过的海量文字，预测下一个 token 的概率。“疑是地上霜”在这句之后出现得太多了，概率极高。'
    },

    mount(stage, api) {
      let round = 0, score = 0, hits = 0, lowDone = false, highDone = false;

      api.missions([
        '完成 5 轮“猜下一个词”',
        '把<b>大胆程度</b>调到很低（≤ 0.3），让波波写一个故事',
        '把<b>大胆程度</b>调到很高（≥ 1.6），再写一个故事'
      ]);

      const part1 = h('div', { class: 'panel' });
      const part2 = h('div', { class: 'panel hidden' });
      stage.append(part1, part2);

      function tokenLine(tokens, blank, fresh) {
        return h('div', { class: 'token-line' },
          tokens.map((t) => h('span', { class: 'token' }, t)),
          blank && h('span', { class: 'token blank' }, '？'),
          fresh && h('span', { class: 'token fresh' }, fresh));
      }

      function showRound() {
        const R = ROUNDS[round];
        part1.innerHTML = '';
        const choices = h('div', { class: 'choice-row' });
        const bars = h('div', { class: 'bars' });
        const lineBox = h('div', {}, tokenLine(R.ctx, true));
        part1.append(
          h('div', { class: 'section-title' }, `🔮 第 ${round + 1} / ${ROUNDS.length} 轮：波波会接哪个词？　`, h('span', { class: 'chip' }, `得分 ${Math.round(score)}`)),
          lineBox,
          h('p', { class: 'hint-line', style: { margin: '8px 0' } }, `这半句话被切成了 ${R.ctx.length} 块积木 🧩`),
          choices, bars);
        G.shuffle(R.cands).forEach(([word]) => {
          choices.append(h('button', { class: 'btn btn-white', onclick: () => pick(word) }, word));
        });

        function pick(word) {
          [...choices.children].forEach((b) => { b.disabled = true; });
          const top = R.cands[0][0];
          const p = R.cands.find(([w]) => w === word)[1];
          score += p;
          if (word === top) hits++;
          api.sfx(word === top ? 'good' : 'pop');
          lineBox.innerHTML = '';
          lineBox.append(tokenLine(R.ctx, false, top));
          bars.innerHTML = '';
          R.cands.forEach(([w, pr], i) => {
            const fill = h('div', { class: 'bar-fill' });
            bars.append(h('div', { class: 'bar-row' + (w === word ? ' pick' : '') + (i === 0 ? ' top' : '') },
              h('span', { class: 'bl' }, w), h('div', { class: 'bar-track' }, fill), h('span', {}, pr + '%')));
            requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = Math.max(1, pr) + '%'; }));
          });
          bars.append(h('div', { class: 'small muted center' }, '其余所有词加起来：' + Math.max(0, 100 - R.cands.reduce((s, c) => s + c[1], 0)).toFixed(1).replace('.0', '') + '%'));
          if (word === top) api.say(`猜中了！我也觉得是“${top}”——在我读过的文字里，这后面最常跟着“${top}”（${R.cands[0][1]}%）。`, 'happy');
          else api.say(`你选了“${word}”（${p}%）。也有可能！不过我会选“${top}”，因为它的<b>概率最高</b>（${R.cands[0][1]}%）。`, 'think');
          const last = round === ROUNDS.length - 1;
          bars.append(h('div', { class: 'controls', style: { marginTop: '10px' } },
            h('button', { class: 'btn btn-yellow', onclick: () => { api.sfx('click'); if (last) finishPart1(); else { round++; showRound(); } } }, last ? '完成！去写故事 →' : '下一句 →')));
        }
      }

      function finishPart1() {
        api.check(0);
        part1.innerHTML = '';
        part1.append(h('div', { class: 'center' },
          h('div', { class: 'section-title' }, `🔮 猜词结束：猜中波波的第一选择 ${hits} / ${ROUNDS.length} 次`),
          h('p', {}, hits >= 4 ? '你和波波想得一模一样！因为你也读过很多中文呀 📚' : '有时候你会想到不一样的词——人比模型更有创意哦！')));
        part2.classList.remove('hidden');
        buildStory();
        api.say('现在换我来写故事！我每次都按概率“抽”一个词。拖动<b>大胆程度</b>，看看概率条怎么变～', 'happy');
      }

      function buildStory() {
        const slots = STORY.map((s) => {
          const rows = s.opts.map(([w]) => {
            const fill = h('div', { class: 'mini-fill' });
            const pct = h('span', {});
            return { fill, pct, el: h('div', { class: 'mini-bar' }, h('div', {}, h('div', {}, w), h('div', { class: 'mini-track' }, fill)), pct) };
          });
          return { rows, el: h('div', { class: 'story-slot' }, h('div', { class: 'small muted' }, '“' + s.pre.replace(/^[，。]/, '') + '…” 后面接：'), rows.map((r) => r.el)) };
        });
        const out = h('div', { class: 'story-out' }, '（还没写）');
        const temp = G.slider({ label: '🌡️ 大胆程度：', min: 0.1, max: 2.5, step: 0.1, value: 1, format: (v) => v.toFixed(1) + (v <= 0.3 ? ' 🧊 超稳' : v >= 1.6 ? ' 🔥 超大胆' : ''), onInput: () => updBars() });
        const writeBtn = h('button', { class: 'btn btn-big btn-yellow', onclick: write }, '✍️ 写一个故事');
        part2.append(
          h('div', { class: 'section-title' }, '✍️ 波波写故事'),
          h('div', { class: 'controls' }, temp.el, writeBtn),
          out,
          h('div', { class: 'story-slots', style: { marginTop: '12px' } }, slots.map((s) => s.el)));

        function updBars() {
          STORY.forEach((s, i) => {
            const ps = temper(s.opts, temp.value);
            slots[i].rows.forEach((r, k) => { r.fill.style.width = (ps[k] * 100).toFixed(1) + '%'; r.pct.textContent = Math.round(ps[k] * 100) + '%'; });
          });
        }

        function write() {
          const T = temp.value;
          const pieces = STORY.map((s) => {
            const ps = temper(s.opts, T);
            const k = sample(ps);
            return { pre: s.pre, w: s.opts[k][0], p: ps[k], rare: k >= s.opts.length - 2 };
          });
          out.innerHTML = '';
          out.append(h('div', { class: 'token-line' }, pieces.map((pc) => [
            h('span', {}, pc.pre),
            h('span', { class: 'token' + (pc.rare ? ' fresh' : ''), title: '概率 ' + Math.round(pc.p * 100) + '%' }, pc.w)
          ]), h('span', {}, '。')));
          api.sfx('card');
          const weird = pieces.filter((pc) => pc.rare).length;
          if (T <= 0.3) {
            lowDone = true;
            api.check(1);
            api.say('温度很低时，我<b>每次都选概率最高的词</b>。多写几次试试——是不是每次都一模一样？稳妥，但有点无聊 😴', 'happy');
          } else if (T >= 1.6) {
            highDone = true;
            api.check(2);
            api.say(weird ? `哈哈，我写出了 ${weird} 个很少见的词！大胆是大胆，可能有点<b>胡说八道</b>了 🤪` : '这次运气好，没写出怪词。多写几次，看看会不会冒出“吃袜子”？', 'wow');
          } else {
            api.say('中等大胆：大部分是常见的词，偶尔有点小惊喜。', 'happy');
          }
          if (lowDone && highDone && api.checked(0)) api.after(1200, () => api.win());
        }
        updBars();
      }

      showRound();
    }
  });
})();
