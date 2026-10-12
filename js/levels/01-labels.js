/* 第 1 关：标签 & 监督学习 —— 给图片贴标签，机器人照着学 */
(function () {
  const { h } = G;
  const tr = G.t;

  const TRAIN = [
    { e: '🍎', truth: 'fruit' },
    { e: '🐶', truth: 'animal' },
    { e: '🍌', truth: 'fruit' },
    { e: '🐱', truth: 'animal' },
    { e: '🍓', truth: 'fruit' },
    { e: '🐰', truth: 'animal' },
    { e: '🍊', truth: 'fruit' },
    { e: '🐸', truth: 'animal' }
  ];
  // 考试题：每一张都和某张训练图片“长得像”（near = 训练图片下标）
  const TEST = [
    { e: '🍏', truth: 'fruit', near: 0 },
    { e: '🐕', truth: 'animal', near: 1 },
    { e: '🍒', truth: 'fruit', near: 4 },
    { e: '🐈', truth: 'animal', near: 3 },
    { e: '🍋', truth: 'fruit', near: 6 },
    { e: '🐇', truth: 'animal', near: 5 }
  ];
  const NAME = { fruit: tr('水果', 'fruit'), animal: tr('动物', 'animal') };
  const article = (lab) => tr('', lab === 'animal' ? 'an ' : 'a ');

  G.registerLevel({
    id: 'labels',
    icon: '🍎',
    title: tr('水果还是动物？', 'Fruit or Animal?'),
    skill: tr('分辨水果和动物', 'telling fruit from animals'),
    minutes: 3,
    terms: ['label', 'supervised'],
    story: tr(
      '波波刚出厂，什么都不认识。<br>你来当老师：给每张图片贴上“水果”或“动物”的小纸条。波波会照着你贴的纸条学习，然后去参加一场<b>新图片</b>的考试！',
      'Bobo is brand new and doesn’t recognize anything yet.<br>You’re the teacher: stick a “fruit” or “animal” note on every picture. Bobo will learn from your notes, then take a test on <b>new pictures</b>!'),
    hello: tr(
      '训练师你好！我什么都不认识……请给每张图片贴上<b>水果 🍉</b> 或 <b>动物 🐾</b> 的纸条，我会照着学！',
      'Hi, Trainer! I don’t know anything yet… Please stick a <b>fruit 🍉</b> or <b>animal 🐾</b> note on each picture and I’ll learn from them!'),
    winLine: tr('全对啦！我从你贴的纸条里学会了分辨水果和动物！', 'All correct! Your notes taught me to tell fruit from animals!'),
    reveal: tr(
      '<p>你给每张图片贴的小纸条（“水果”/“动物”），就是这张图片的<b>「标签」</b>——也就是正确答案。</p><p>先给机器看大量“图片 + 标签”，让它自己总结规律，再去判断<b>从没见过</b>的新图片——这种学习方式叫<b>「监督学习」</b>。你就是那个“监督”它的老师。</p><p>如果你刚才故意贴错过纸条，你会发现：<b>老师教错，机器就学错</b>。</p>',
      '<p>The little note you stuck on each picture (“fruit” / “animal”) is that picture’s <b>label</b> — the correct answer.</p><p>Showing a machine lots of “picture + label” pairs so it can work out the pattern, then asking it about pictures it has <b>never seen</b> — that way of learning is called <b>supervised learning</b>. You were the teacher “supervising” it.</p><p>If you tried sticking on a wrong note, you saw it: <b>when the teacher gets it wrong, the machine learns it wrong</b>.</p>'),
    quiz: {
      q: tr(
        '你想让机器人学会区分“新鲜苹果”和“烂苹果”。按照这一关学到的方法，最需要先准备什么？',
        'You want a robot to tell “fresh apples” from “rotten apples”. Using what you learned in this level, what do you need to prepare first?'),
      options: [
        tr('很多苹果照片，每张都写上“新鲜”或“烂了”', 'Lots of apple photos, each marked “fresh” or “rotten”'),
        tr('一本《苹果百科全书》', 'An apple encyclopedia'),
        tr('一台速度更快的电脑', 'A faster computer'),
        tr('什么都不用准备，机器人天生就知道', 'Nothing — robots just know these things')
      ],
      answer: 0,
      hint: tr('回想一下：你刚才给波波看的，除了图片还有什么？', 'Think back: besides the pictures, what else did you give Bobo?'),
      explain: tr(
        '监督学习需要“题目 + 答案”：大量照片（题目）加上“新鲜/烂了”的<b>标签</b>（答案）。',
        'Supervised learning needs “questions + answers”: lots of photos (the questions) plus “fresh/rotten” <b>labels</b> (the answers).')
    },

    mount(stage, api) {
      const labels = TRAIN.map(() => null);
      let busy = false;
      let tries = 0;

      api.missions([
        tr('给 8 张图片都贴上标签（水果 / 动物）', 'Label all 8 pictures (fruit / animal)'),
        tr('点“开始训练”，让波波学习', 'Press “Start training” so Bobo can learn'),
        tr('波波在<b>没见过的新图片</b>考试中全部答对', 'Bobo gets every answer right on a test of <b>pictures it has never seen</b>')
      ]);

      const trainGrid = h('div', { class: 'tile-grid' });
      const cards = TRAIN.map((it, i) => {
        const bF = h('button', { class: 'label-btn', onclick: () => setLabel(i, 'fruit') }, tr('🍉 水果', '🍉 Fruit'));
        const bA = h('button', { class: 'label-btn', onclick: () => setLabel(i, 'animal') }, tr('🐾 动物', '🐾 Animal'));
        const card = h('div', { class: 'pic-card' }, h('div', { class: 'pic' }, it.e), h('div', { class: 'label-btns' }, bF, bA));
        card._btns = { bF, bA };
        trainGrid.append(card);
        return card;
      });

      const trainBtn = h('button', { class: 'btn btn-big btn-yellow', disabled: true, onclick: train }, tr('🤖 开始训练', '🤖 Start training'));
      const testGrid = h('div', { class: 'tile-grid' });
      const testBox = h('div', { class: 'panel hidden' }, h('div', { class: 'section-title' }, tr('📝 考试：这些图片波波从没见过', '📝 Test: Bobo has never seen these pictures')), testGrid);

      stage.append(
        h('div', { class: 'panel' }, h('div', { class: 'section-title' }, tr('📚 训练图片：给每一张贴纸条', '📚 Training pictures: put a note on each one')), trainGrid),
        h('div', { class: 'controls' }, trainBtn),
        h('p', { class: 'hint-line' }, tr('💡 偷偷试试：故意贴错一张，看看波波会怎么样？', '💡 Sneaky experiment: label one wrong on purpose and see what Bobo does!')),
        testBox
      );

      function setLabel(i, lab) {
        if (busy) return;
        api.sfx('pop');
        labels[i] = lab;
        const { bF, bA } = cards[i]._btns;
        bF.classList.toggle('sel-fruit', lab === 'fruit');
        bA.classList.toggle('sel-animal', lab === 'animal');
        const all = labels.every(Boolean);
        trainBtn.disabled = !all;
        if (all && api.check(0)) api.say(tr('都贴好啦！点<b>“开始训练”</b>，我要开始认真学习了！', 'All labeled! Press <b>“Start training”</b> and I’ll get studying!'), 'happy');
      }

      async function train() {
        if (busy) return;
        busy = true;
        trainBtn.disabled = true;
        tries++;
        api.say(tr('我在认真看每张图片和它的纸条……', 'I’m carefully studying each picture and its note…'), 'think');
        for (const c of cards) {
          c.classList.add('glow'); api.sfx('step');
          await api.wait(170);
          c.classList.remove('glow');
        }
        api.check(1);
        api.say(tr('学完了！现在给我考几张<b>从没见过</b>的新图片～', 'Done studying! Now test me on some pictures I’ve <b>never seen</b>!'), 'happy');
        await api.wait(500);

        testBox.classList.remove('hidden');
        testGrid.innerHTML = '';
        let right = 0;
        const wrongs = [];
        for (const t of TEST) {
          const guess = labels[t.near];
          const ok = guess === t.truth;
          if (ok) right++; else wrongs.push(t);
          const ref = TRAIN[t.near];
          testGrid.append(h('div', { class: 'pic-card ' + (ok ? 'right' : 'wrong') },
            h('span', { class: 'verdict' }, ok ? '✅' : '❌'),
            h('div', { class: 'pic' }, t.e),
            h('div', {}, tr('波波：', 'Bobo: '), h('b', {}, NAME[guess])),
            h('div', { class: 'robot-says' }, tr(
              `它很像 ${ref.e}，你说 ${ref.e} 是${NAME[guess]}`,
              `It looks like ${ref.e}, and you said ${ref.e} is ${article(guess)}${NAME[guess]}`))));
          api.sfx(ok ? 'good' : 'bad');
          await api.wait(380);
        }
        busy = false;
        trainBtn.disabled = false;
        trainBtn.textContent = tr('🤖 重新训练', '🤖 Train again');
        if (right === TEST.length) {
          api.check(2);
          api.win();
        } else {
          const w = wrongs[0];
          const ref = TRAIN[w.near];
          const wl = labels[w.near];
          api.say(tr(
            `考了 ${right}/${TEST.length}……我把 ${w.e} 认成了${NAME[wl]}，因为你告诉我 ${ref.e} 是<b>${NAME[wl]}</b>。<br>老师教错，我就学错啦！改一改纸条再训练我吧。`,
            `I scored ${right}/${TEST.length}… I thought ${w.e} was ${article(wl)}${NAME[wl]}, because you told me ${ref.e} is <b>${article(wl)}${NAME[wl]}</b>.<br>If the teacher gets it wrong, I learn it wrong! Fix the notes and train me again.`), 'sad');
        }
      }
    }
  });
})();
