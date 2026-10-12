/* 第 1 关：标签 & 监督学习 —— 给图片贴标签，机器人照着学 */
(function () {
  const { h } = G;

  const TRAIN = [
    { e: '🍎', name: '苹果', truth: 'fruit' },
    { e: '🐶', name: '小狗', truth: 'animal' },
    { e: '🍌', name: '香蕉', truth: 'fruit' },
    { e: '🐱', name: '小猫', truth: 'animal' },
    { e: '🍓', name: '草莓', truth: 'fruit' },
    { e: '🐰', name: '兔子', truth: 'animal' },
    { e: '🍊', name: '橘子', truth: 'fruit' },
    { e: '🐸', name: '青蛙', truth: 'animal' }
  ];
  // 考试题：每一张都和某张训练图片“长得像”（near = 训练图片下标）
  const TEST = [
    { e: '🍏', name: '青苹果', truth: 'fruit', near: 0 },
    { e: '🐕', name: '大狗', truth: 'animal', near: 1 },
    { e: '🍒', name: '樱桃', truth: 'fruit', near: 4 },
    { e: '🐈', name: '猫咪', truth: 'animal', near: 3 },
    { e: '🍋', name: '柠檬', truth: 'fruit', near: 6 },
    { e: '🐇', name: '白兔', truth: 'animal', near: 5 }
  ];
  const NAME = { fruit: '水果', animal: '动物' };

  G.registerLevel({
    id: 'labels',
    icon: '🍎',
    title: '水果还是动物？',
    skill: '分辨水果和动物',
    minutes: 3,
    terms: ['label', 'supervised'],
    story: '波波刚出厂，什么都不认识。<br>你来当老师：给每张图片贴上“水果”或“动物”的小纸条。波波会照着你贴的纸条学习，然后去参加一场<b>新图片</b>的考试！',
    hello: '训练师你好！我什么都不认识……请给每张图片贴上<b>水果 🍉</b> 或 <b>动物 🐾</b> 的纸条，我会照着学！',
    winLine: '全对啦！我从你贴的纸条里学会了分辨水果和动物！',
    reveal: '<p>你给每张图片贴的小纸条（“水果”/“动物”），就是这张图片的<b>「标签」</b>——也就是正确答案。</p><p>先给机器看大量“图片 + 标签”，让它自己总结规律，再去判断<b>从没见过</b>的新图片——这种学习方式叫<b>「监督学习」</b>。你就是那个“监督”它的老师。</p><p>如果你刚才故意贴错过纸条，你会发现：<b>老师教错，机器就学错</b>。</p>',
    quiz: {
      q: '你想让机器人学会区分“新鲜苹果”和“烂苹果”。按照这一关学到的方法，最需要先准备什么？',
      options: [
        '很多苹果照片，每张都写上“新鲜”或“烂了”',
        '一本《苹果百科全书》',
        '一台速度更快的电脑',
        '什么都不用准备，机器人天生就知道'
      ],
      answer: 0,
      hint: '回想一下：你刚才给波波看的，除了图片还有什么？',
      explain: '监督学习需要“题目 + 答案”：大量照片（题目）加上“新鲜/烂了”的<b>标签</b>（答案）。'
    },

    mount(stage, api) {
      const labels = TRAIN.map(() => null);
      let busy = false;
      let tries = 0;

      api.missions([
        '给 8 张图片都贴上标签（水果 / 动物）',
        '点“开始训练”，让波波学习',
        '波波在<b>没见过的新图片</b>考试中全部答对'
      ]);

      const trainGrid = h('div', { class: 'tile-grid' });
      const cards = TRAIN.map((it, i) => {
        const bF = h('button', { class: 'label-btn', onclick: () => setLabel(i, 'fruit') }, '🍉 水果');
        const bA = h('button', { class: 'label-btn', onclick: () => setLabel(i, 'animal') }, '🐾 动物');
        const card = h('div', { class: 'pic-card' }, h('div', { class: 'pic' }, it.e), h('div', { class: 'label-btns' }, bF, bA));
        card._btns = { bF, bA };
        trainGrid.append(card);
        return card;
      });

      const trainBtn = h('button', { class: 'btn btn-big btn-yellow', disabled: true, onclick: train }, '🤖 开始训练');
      const testGrid = h('div', { class: 'tile-grid' });
      const testBox = h('div', { class: 'panel hidden' }, h('div', { class: 'section-title' }, '📝 考试：这些图片波波从没见过'), testGrid);

      stage.append(
        h('div', { class: 'panel' }, h('div', { class: 'section-title' }, '📚 训练图片：给每一张贴纸条'), trainGrid),
        h('div', { class: 'controls' }, trainBtn),
        h('p', { class: 'hint-line' }, '💡 偷偷试试：故意贴错一张，看看波波会怎么样？'),
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
        if (all && api.check(0)) api.say('都贴好啦！点<b>“开始训练”</b>，我要开始认真学习了！', 'happy');
      }

      async function train() {
        if (busy) return;
        busy = true;
        trainBtn.disabled = true;
        tries++;
        api.say('我在认真看每张图片和它的纸条……', 'think');
        for (const c of cards) {
          c.classList.add('glow'); api.sfx('step');
          await api.wait(170);
          c.classList.remove('glow');
        }
        api.check(1);
        api.say('学完了！现在给我考几张<b>从没见过</b>的新图片～', 'happy');
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
            h('div', {}, '波波：', h('b', {}, NAME[guess])),
            h('div', { class: 'robot-says' }, `它很像 ${ref.e}，你说 ${ref.e} 是${NAME[guess]}`)));
          api.sfx(ok ? 'good' : 'bad');
          await api.wait(380);
        }
        busy = false;
        trainBtn.disabled = false;
        trainBtn.textContent = '🤖 重新训练';
        if (right === TEST.length) {
          api.check(2);
          api.win();
        } else {
          const w = wrongs[0];
          const ref = TRAIN[w.near];
          api.say(`考了 ${right}/${TEST.length}……我把 ${w.e} 认成了${NAME[labels[w.near]]}，因为你告诉我 ${ref.e} 是<b>${NAME[labels[w.near]]}</b>。<br>老师教错，我就学错啦！改一改纸条再训练我吧。`, 'sad');
        }
      }
    }
  });
})();
