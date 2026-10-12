/* 第 12 关：大语言模型、Token、温度 —— 下一个词猜猜猜 */
(function () {
  const { h } = G;
  const tr = G.t;

  // 中英文的句子和候选词各自独立（不是逐字翻译），概率也各自设定
  const ROUNDS = tr([
    { ctx: ['小猫', '最', '喜欢', '吃'], cands: [['鱼', 62], ['老鼠', 21], ['猫粮', 14], ['石头', 1]] },
    { ctx: ['生日', '快'], cands: [['乐', 95], ['递', 2], ['跑', 1.5], ['门', 0.5]] },
    { ctx: ['今天', '天气', '真'], cands: [['好', 68], ['热', 17], ['冷', 12], ['甜', 1]] },
    { ctx: ['我', '每天', '早上', '都', '刷'], cands: [['牙', 81], ['手机', 12], ['题', 5], ['墙', 0.5]] },
    { ctx: ['一', '二', '三', '四', '五', '，'], cands: [['上山', 74], ['六', 19], ['下雨', 3], ['吃饭', 1]] }
  ], [
    { ctx: ['The', 'cat', 'loves', 'to', 'eat'], cands: [['fish', 62], ['mice', 21], ['cat food', 14], ['rocks', 1]] },
    { ctx: ['Happy', 'birthday', 'to'], cands: [['you', 95], ['me', 2], ['the', 1.5], ['door', 0.5]] },
    { ctx: ['The', 'weather', 'is', 'so'], cands: [['nice', 68], ['hot', 17], ['cold', 12], ['sweet', 1]] },
    { ctx: ['Every', 'morning', 'I', 'brush', 'my'], cands: [['teeth', 81], ['hair', 12], ['dog', 5], ['wall', 0.5]] },
    { ctx: ['One', ',', 'two', ',', 'buckle', 'my'], cands: [['shoe', 74], ['belt', 19], ['hat', 3], ['soup', 1]] }
  ]);

  const STORY = tr([
    { pre: '从前有一只', opts: [['小猫', 40], ['小狗', 30], ['机器人', 20], ['恐龙', 8], ['冰箱', 2]] },
    { pre: '，它住在', opts: [['森林里', 40], ['城市里', 30], ['海边', 20], ['月亮上', 8], ['鞋子里', 2]] },
    { pre: '，每天都在', opts: [['睡觉', 36], ['唱歌', 30], ['找朋友', 25], ['写代码', 7], ['吃袜子', 2]] },
    { pre: '。最后，', opts: [['大家都很开心', 50], ['它交到了新朋友', 35], ['它变成了一朵云', 11], ['宇宙爆炸了', 4]] }
  ], [
    { pre: 'Once upon a time there was a', opts: [['kitten', 40], ['puppy', 30], ['robot', 20], ['dinosaur', 8], ['fridge', 2]] },
    { pre: 'that lived', opts: [['in the forest', 40], ['in the city', 30], ['by the sea', 20], ['on the moon', 8], ['in a shoe', 2]] },
    { pre: '. Every day it', opts: [['slept', 36], ['sang', 30], ['looked for friends', 25], ['wrote code', 7], ['ate socks', 2]] },
    { pre: '. In the end,', opts: [['everyone was happy', 50], ['it made a new friend', 35], ['it turned into a cloud', 11], ['the universe exploded', 4]] }
  ]);
  const STORY_END = tr('。', '.');

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
    title: tr('下一个词猜猜猜', 'Guess the Next Word'),
    skill: tr('像聊天 AI 一样“接话”', 'continuing a sentence like a chat AI'),
    minutes: 5,
    terms: ['llm', 'token', 'temperature'],
    story: tr(
      '波波读过了<b>好多好多</b>书和文章。现在它能玩一个游戏：给它半句话，它猜<b>下一个词</b>最可能是什么。<br>先来比一比：你能猜中波波心里排第一的词吗？然后，你还可以调节波波的<b>“大胆程度”</b>，让它写个小故事！',
      'Bobo has read <b>tons and tons</b> of books and articles. Now it can play a game: give it half a sentence, and it guesses the most likely <b>next word</b>.<br>First, a challenge: can you guess Bobo’s top pick? Then you can adjust Bobo’s <b>“boldness”</b> and have it write a little story!'),
    hello: tr(
      '看看这半句话，你觉得我会接哪个词？我把句子切成了一块一块的小积木来读哦～',
      'Look at this half sentence — which word do you think I’ll pick next? I read sentences by chopping them into little building blocks!'),
    winLine: tr('你已经知道聊天 AI 是怎么“说话”的啦！', 'Now you know how chat AIs “talk”!'),
    reveal: tr(
      '<p>你刚才看到的，就是<b>「大语言模型」</b>（比如各种聊天 AI）的核心秘密：它并不是“查”到答案，而是根据前文，<b>一个词一个词地预测下一个最可能出现的词</b>。读过的文字越多，猜得越准。</p><p>波波把句子切成的那些小积木（“小猫”“喜欢”“吃”），叫<b>「Token」（词元）</b>，是模型读写文字的最小单位。</p><p>那个“大胆程度”旋钮叫<b>「温度」</b>：温度低，总挑概率最高的词，稳妥但无聊；温度高，敢挑冷门的词，更有创意，也更容易胡说八道（比如“吃袜子”🧦）。</p>',
      '<p>What you just saw is the core secret of a <b>large language model</b> (like the chat AIs out there): it doesn’t “look up” answers — based on the text so far, it <b>predicts the most likely next word, one word at a time</b>. The more text it has read, the better its guesses.</p><p>The little building blocks Bobo chopped sentences into (“The”, “cat”, “loves”) are called <b>tokens</b> — the smallest units a model reads and writes.</p><p>The “boldness” dial is called <b>temperature</b>: at low temperature it always picks the most likely word — safe but boring; at high temperature it dares to pick rare words — more creative, but also more likely to talk nonsense (like “ate socks” 🧦).</p>'),
    quiz: {
      q: tr(
        '让大语言模型续写“床前明月光，”，它很可能写出“疑是地上霜”。最好的解释是？',
        'Ask a large language model to continue “Twinkle, twinkle, little…” and it will very likely write “star”. What’s the best explanation?'),
      options: [
        tr('训练时读过很多次这首诗，这些 token 接在后面的概率最高', 'It read this rhyme many times in training, so those tokens are the most likely to come next'),
        tr('它真的抬头看见了月亮', 'It actually looked up and saw a star'),
        tr('它每次都在网上实时搜索答案', 'It searches the internet live every time'),
        tr('它是随便乱写，碰巧对了', 'It wrote something random and got lucky')
      ],
      answer: 0,
      hint: tr('回想一下：波波是怎么决定下一个词的？', 'Think back: how did Bobo decide on the next word?'),
      explain: tr(
        '大语言模型根据训练时见过的海量文字，预测下一个 token 的概率。“疑是地上霜”在这句之后出现得太多了，概率极高。',
        'A large language model predicts the probability of the next token from the huge amount of text it saw in training. “star” follows that line so often that its probability is extremely high.')
    },

    mount(stage, api) {
      let round = 0, score = 0, hits = 0, lowDone = false, highDone = false;

      api.missions([
        tr('完成 5 轮“猜下一个词”', 'Finish 5 rounds of “guess the next word”'),
        tr('把<b>大胆程度</b>调到很低（≤ 0.3），让波波写一个故事', 'Turn <b>boldness</b> very low (≤ 0.3) and have Bobo write a story'),
        tr('把<b>大胆程度</b>调到很高（≥ 1.6），再写一个故事', 'Turn <b>boldness</b> very high (≥ 1.6) and write another story')
      ]);

      const part1 = h('div', { class: 'panel' });
      const part2 = h('div', { class: 'panel hidden' });
      stage.append(part1, part2);

      function tokenLine(tokens, blank, fresh) {
        return h('div', { class: 'token-line' },
          tokens.map((t) => h('span', { class: 'token' }, t)),
          blank && h('span', { class: 'token blank' }, tr('？', '?')),
          fresh && h('span', { class: 'token fresh' }, fresh));
      }

      function showRound() {
        const R = ROUNDS[round];
        part1.innerHTML = '';
        const choices = h('div', { class: 'choice-row' });
        const bars = h('div', { class: 'bars' });
        const lineBox = h('div', {}, tokenLine(R.ctx, true));
        part1.append(
          h('div', { class: 'section-title' }, tr(`🔮 第 ${round + 1} / ${ROUNDS.length} 轮：波波会接哪个词？　`, `🔮 Round ${round + 1} / ${ROUNDS.length}: which word will Bobo pick?  `), h('span', { class: 'chip' }, tr(`得分 ${Math.round(score)}`, `Score ${Math.round(score)}`))),
          lineBox,
          h('p', { class: 'hint-line', style: { margin: '8px 0' } }, tr(`这半句话被切成了 ${R.ctx.length} 块积木 🧩`, `This half sentence was chopped into ${R.ctx.length} blocks 🧩`)),
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
          bars.append(h('div', { class: 'small muted center' }, tr('其余所有词加起来：', 'All other words combined: ') + Math.max(0, 100 - R.cands.reduce((s, c) => s + c[1], 0)).toFixed(1).replace('.0', '') + '%'));
          if (word === top) {
            api.say(tr(
              `猜中了！我也觉得是“${top}”——在我读过的文字里，这后面最常跟着“${top}”（${R.cands[0][1]}%）。`,
              `You got it! I’d pick “${top}” too — in everything I’ve read, “${top}” comes next most often (${R.cands[0][1]}%).`), 'happy');
          } else {
            api.say(tr(
              `你选了“${word}”（${p}%）。也有可能！不过我会选“${top}”，因为它的<b>概率最高</b>（${R.cands[0][1]}%）。`,
              `You picked “${word}” (${p}%). That could happen! But I’d pick “${top}”, because it has the <b>highest probability</b> (${R.cands[0][1]}%).`), 'think');
          }
          const last = round === ROUNDS.length - 1;
          bars.append(h('div', { class: 'controls', style: { marginTop: '10px' } },
            h('button', { class: 'btn btn-yellow', onclick: () => { api.sfx('click'); if (last) finishPart1(); else { round++; showRound(); } } }, last ? tr('完成！去写故事 →', 'Done! On to story writing →') : tr('下一句 →', 'Next sentence →'))));
        }
      }

      function finishPart1() {
        api.check(0);
        part1.innerHTML = '';
        part1.append(h('div', { class: 'center' },
          h('div', { class: 'section-title' }, tr(`🔮 猜词结束：猜中波波的第一选择 ${hits} / ${ROUNDS.length} 次`, `🔮 Guessing done: you matched Bobo’s top pick ${hits} / ${ROUNDS.length} times`)),
          h('p', {}, hits >= 4
            ? tr('你和波波想得一模一样！因为你也读过很多中文呀 📚', 'You and Bobo think alike! That’s because you’ve read lots of English too 📚')
            : tr('有时候你会想到不一样的词——人比模型更有创意哦！', 'Sometimes you think of different words — people can be more creative than models!'))));
        part2.classList.remove('hidden');
        buildStory();
        api.say(tr(
          '现在换我来写故事！我每次都按概率“抽”一个词。拖动<b>大胆程度</b>，看看概率条怎么变～',
          'Now it’s my turn to write a story! Each time, I “draw” a word based on its probability. Drag the <b>boldness</b> and watch the probability bars change!'), 'happy');
      }

      function buildStory() {
        const slots = STORY.map((s) => {
          const rows = s.opts.map(([w]) => {
            const fill = h('div', { class: 'mini-fill' });
            const pct = h('span', {});
            return { fill, pct, el: h('div', { class: 'mini-bar' }, h('div', {}, h('div', {}, w), h('div', { class: 'mini-track' }, fill)), pct) };
          });
          return { rows, el: h('div', { class: 'story-slot' }, h('div', { class: 'small muted' }, tr('“', '“…') + s.pre.replace(/^[，。.,]\s*/, '') + tr('…” 后面接：', '…” is followed by:')), rows.map((r) => r.el)) };
        });
        const out = h('div', { class: 'story-out' }, tr('（还没写）', '(Nothing written yet)'));
        const temp = G.slider({ label: tr('🌡️ 大胆程度：', '🌡️ Boldness:'), min: 0.1, max: 2.5, step: 0.1, value: 1, format: (v) => v.toFixed(1) + (v <= 0.3 ? tr(' 🧊 超稳', ' 🧊 super safe') : v >= 1.6 ? tr(' 🔥 超大胆', ' 🔥 super bold') : ''), onInput: () => updBars() });
        const writeBtn = h('button', { class: 'btn btn-big btn-yellow', onclick: write }, tr('✍️ 写一个故事', '✍️ Write a story'));
        part2.append(
          h('div', { class: 'section-title' }, tr('✍️ 波波写故事', '✍️ Bobo writes a story')),
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
            h('span', { class: 'token' + (pc.rare ? ' fresh' : ''), title: tr('概率 ', 'Probability ') + Math.round(pc.p * 100) + '%' }, pc.w)
          ]), h('span', {}, STORY_END)));
          api.sfx('card');
          const weird = pieces.filter((pc) => pc.rare).length;
          if (T <= 0.3) {
            lowDone = true;
            api.check(1);
            api.say(tr(
              '温度很低时，我<b>每次都选概率最高的词</b>。多写几次试试——是不是每次都一模一样？稳妥，但有点无聊 😴',
              'At low temperature I <b>always pick the most likely word</b>. Write a few more — isn’t it exactly the same every time? Safe, but kind of boring 😴'), 'happy');
          } else if (T >= 1.6) {
            highDone = true;
            api.check(2);
            api.say(weird
              ? tr(`哈哈，我写出了 ${weird} 个很少见的词！大胆是大胆，可能有点<b>胡说八道</b>了 🤪`, `Haha, I wrote ${weird} rare word${weird > 1 ? 's' : ''}! Bold, sure — but maybe a bit of <b>nonsense</b> too 🤪`)
              : tr('这次运气好，没写出怪词。多写几次，看看会不会冒出“吃袜子”？', 'Lucky this time — no weird words. Write a few more and see if “ate socks” pops up!'), 'wow');
          } else {
            api.say(tr('中等大胆：大部分是常见的词，偶尔有点小惊喜。', 'Medium boldness: mostly common words, with the occasional little surprise.'), 'happy');
          }
          if (lowDone && highDone && api.checked(0)) api.after(1200, () => api.win());
        }
        updBars();
      }

      showRound();
    }
  });
})();
