/* 第 6 关：训练集 & 测试集 —— 只会背答案的机器人，考试会翻车 */
(function () {
  const { h } = G;
  const tr = G.t;
  const PRACTICE = [1, 2, 3, 5, 6, 8];         // 练习册里刷过的题
  const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];  // 题库
  const q = (n) => tr(`${n} 只小鸡有几条腿？`, `How many legs do ${n} chick${n > 1 ? 's' : ''} have?`);
  const SEEN = tr('练过', 'Practiced');
  const NEW = tr('新题', 'New');
  const MEMO = tr('📒 背书仔', '📒 Memo');
  const THINK = tr('💡 思考仔', '💡 Thinker');

  // 背书仔：只记得练过的题；没见过的题，就照抄“最像”那道的答案
  function memorizer(n) {
    if (PRACTICE.includes(n)) return { ans: n * 2, why: tr('背过！', 'Memorized it!') };
    const near = PRACTICE.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
    return { ans: near * 2, why: tr(`没背过…跟 ${near} 只最像，就抄它的答案`, `Never saw this… ${near} looks closest, so I copied its answer`) };
  }
  // 思考仔：真的学会了规律
  const thinker = (n) => ({ ans: n * 2, why: tr(`每只 2 条腿：${n}×2`, `2 legs each: ${n}×2`) });

  G.registerLevel({
    id: 'exam',
    icon: '📝',
    title: tr('刷题与期末考', 'Practice vs. the Final Exam'),
    skill: tr('分辨“死记硬背”和“真学会”', 'telling “memorized” apart from “really learned”'),
    minutes: 4,
    terms: ['trainset', 'testset'],
    story: tr(
      '有两个小机器人都在学“数小鸡的腿”。它们刷了同一本练习册，<b>都考了满分</b>！<br>可是其中一个只会死记硬背……你是出卷老师，请设计一张<b>期末考卷</b>，揭穿它！',
      'Two little robots are learning to “count chicken legs”. They did the same practice workbook and <b>both got perfect scores</b>!<br>But one of them only memorized the answers… You’re the teacher: design a <b>final exam</b> that exposes it!'),
    hello: tr(
      '我们俩练习册都是满分哦！老师，用下面这张考卷考考我们吧～ 先点<b>“开始考试”</b>。',
      'We both aced the workbook! Teacher, test us with the exam below — press <b>“Start exam”</b> first.'),
    winLine: tr('考卷出得好！一下就看出谁是真学会了！', 'Great exam! It showed right away who really learned!'),
    reveal: tr(
      '<p>机器人用来“刷题”学习的数据，叫<b>「训练集」</b>（练习册）。</p><p>专门留出来、<b>训练时从来没给它看过</b>的数据，叫<b>「测试集」</b>（期末考卷）。</p><p>如果拿练过的题去考，死记硬背的机器人也能拿满分——那个分数根本说明不了问题。只有用<b>没见过的新题</b>，才能测出机器人是不是真的学会了。这就是为什么训练集和测试集一定要分开！</p>',
      '<p>The data a robot practices and learns from is called the <b>training set</b> (the workbook).</p><p>Data set aside and <b>never shown to it during training</b> is called the <b>test set</b> (the final exam).</p><p>If you test with questions it has already practiced, even a memorizing robot gets full marks — and that score proves nothing. Only <b>new, unseen questions</b> can show whether a robot really learned. That’s why the training set and test set must be kept separate!</p>'),
    quiz: {
      q: tr(
        '一位同学为了证明自己的模型很厉害，用<b>训练时用过的数据</b>来考它，结果得了满分。这个满分说明什么？',
        'To prove their model is great, a student tests it on <b>the same data it was trained on</b>, and it scores 100%. What does that perfect score tell you?'),
      options: [
        tr('说明不了真本事，应该用没见过的新数据来测', 'Not much — it should be tested on new, unseen data'),
        tr('说明模型一定很厉害', 'The model must be excellent'),
        tr('说明模型一定很差', 'The model must be terrible'),
        tr('应该把同样的题再多考几次', 'They should test it on the same questions a few more times')
      ],
      answer: 0,
      hint: tr('用练习册上的原题考“背书仔”，它也能满分。', 'Test Memo on questions straight from the workbook, and it scores 100% too.'),
      explain: tr(
        '用训练数据测试，相当于用练过的原题考试，死记硬背也能满分。必须用独立的测试集，才能看出真实水平（泛化能力）。',
        'Testing on training data is like an exam made of questions you already practiced — memorizing gets full marks. Only a separate test set shows real ability (generalization).')
    },

    mount(stage, api) {
      let exam = [1, 2, 3, 5];
      let running = false, examsRun = 0;

      api.missions([
        tr('用现在这张考卷，让两个机器人考一次', 'Give both robots the current exam once'),
        tr('修改考卷，让考试<b>分辨出</b>谁是真学会了（两人分数差一半以上）', 'Change the exam so it <b>reveals</b> who really learned (scores differ by 50+ points)')
      ]);

      const scoreA = h('div', { class: 'score-big' }, '—');
      const scoreB = h('div', { class: 'score-big' }, '—');
      const robotA = h('div', { class: 'panel robot-card' },
        h('div', { class: 'robot-mini', html: G.robotSVG('happy', '#ffa94d', 'book') }),
        h('div', {}, h('div', { class: 'section-title' }, MEMO), h('div', { class: 'small muted' }, tr('练习册：6/6 💯', 'Workbook: 6/6 💯')), scoreA));
      const robotB = h('div', { class: 'panel robot-card' },
        h('div', { class: 'robot-mini', html: G.robotSVG('happy', '#63e6be', 'bulb') }),
        h('div', {}, h('div', { class: 'section-title' }, THINK), h('div', { class: 'small muted' }, tr('练习册：6/6 💯', 'Workbook: 6/6 💯')), scoreB));

      const pool = h('div', { class: 'q-pool' });
      const paper = h('div', { class: 'exam-paper' });
      const examBtn = h('button', { class: 'btn btn-big btn-yellow', onclick: runExam }, tr('📝 开始考试', '📝 Start exam'));
      const results = h('div', {});

      stage.append(
        h('div', { class: 'exam-layout' }, robotA, robotB),
        h('div', { class: 'panel' },
          h('div', { class: 'section-title' }, tr('📚 题库（点一下：放进 / 拿出考卷）', '📚 Question bank (tap to add to / remove from the exam)')),
          h('p', { class: 'small muted', style: { margin: '0 0 8px' } }, tr('🟧 练过 = 练习册里出现过的题　🟩 新题 = 从没练过', '🟧 Practiced = appeared in the workbook · 🟩 New = never practiced')),
          pool,
          h('div', { class: 'section-title', style: { marginTop: '12px' } }, tr('📄 期末考卷（最多 4 题）', '📄 Final exam (up to 4 questions)')),
          paper),
        h('div', { class: 'controls' }, examBtn),
        results);

      function renderPool() {
        pool.innerHTML = '';
        ALL.forEach((n) => {
          const seen = PRACTICE.includes(n);
          pool.append(h('button', {
            class: `q-card ${exam.includes(n) ? 'in-exam' : ''} ${seen ? '' : 'new-q'}`,
            onclick: () => toggle(n)
          }, q(n), h('span', { class: 'seen' }, seen ? SEEN : NEW)));
        });
        paper.innerHTML = '';
        if (!exam.length) paper.append(h('span', { class: 'muted' }, tr('考卷是空的，从题库里挑题吧～', 'The exam is empty — pick some questions from the bank!')));
        exam.forEach((n, i) => paper.append(h('button', {
          class: `q-card ${PRACTICE.includes(n) ? '' : 'new-q'}`,
          onclick: () => toggle(n)
        }, tr(`第${i + 1}题：`, `Q${i + 1}: `) + q(n), h('span', { class: 'seen' }, PRACTICE.includes(n) ? SEEN : NEW))));
        examBtn.disabled = !exam.length || running;
      }

      function toggle(n) {
        if (running) return;
        if (exam.includes(n)) exam = exam.filter((x) => x !== n);
        else if (exam.length >= 4) { api.toast(tr('考卷满了！先点考卷上的一道题把它拿掉', 'The exam is full! Tap a question on it to remove one first')); api.sfx('bad'); return; }
        else exam.push(n);
        api.sfx('pop');
        renderPool();
      }

      async function runExam() {
        if (running || !exam.length) return;
        running = true; renderPool();
        examsRun++;
        api.say(tr('考试开始！嘘——', 'The exam begins! Shhh…'), 'think');
        const tbody = h('tbody');
        results.innerHTML = '';
        results.append(h('div', { class: 'panel' }, h('table', { class: 'result-table' },
          h('thead', {}, h('tr', {}, h('th', {}, tr('题目', 'Question')), h('th', {}, MEMO), h('th', {}, THINK))), tbody)));
        let a = 0, b = 0;
        for (const n of exam) {
          const ra = memorizer(n), rb = thinker(n);
          const okA = ra.ans === n * 2, okB = rb.ans === n * 2;
          if (okA) a++;
          if (okB) b++;
          tbody.append(h('tr', {},
            h('td', {}, q(n), h('br'), h('span', { class: 'small muted' }, tr('正确答案：', 'Correct answer: ') + n * 2)),
            h('td', {}, (okA ? '✅ ' : '❌ ') + ra.ans, h('br'), h('span', { class: 'small muted' }, ra.why)),
            h('td', {}, (okB ? '✅ ' : '❌ ') + rb.ans, h('br'), h('span', { class: 'small muted' }, rb.why))));
          api.sfx(okA ? 'step' : 'bad');
          await api.wait(450);
        }
        const pa = Math.round((a / exam.length) * 100), pb = Math.round((b / exam.length) * 100);
        scoreA.textContent = tr(`考试：${pa} 分`, `Exam: ${pa} pts`);
        scoreB.textContent = tr(`考试：${pb} 分`, `Exam: ${pb} pts`);
        robotA.querySelector('.robot-mini').innerHTML = G.robotSVG(pa >= 100 ? 'happy' : 'sad', '#ffa94d', 'book');
        robotB.querySelector('.robot-mini').innerHTML = G.robotSVG('happy', '#63e6be', 'bulb');
        running = false; renderPool();
        api.check(0);

        const newCount = exam.filter((n) => !PRACTICE.includes(n)).length;
        if (pb - pa >= 50) {
          api.check(1);
          api.win();
        } else if (newCount === 0) {
          api.say(tr(
            '两个都是满分……可是这些题都是<b>练习册里的原题</b>呀！背书仔真的学会了吗？试试换几道<b>🟩 新题</b>？',
            'Both got 100… but these are all <b>questions straight from the workbook</b>! Did Memo really learn anything? Try swapping in some <b>🟩 New</b> questions?'), 'think');
        } else {
          api.say(tr(
            `背书仔露出了一点马脚！不过考卷里只有 ${newCount} 道新题，还不够明显……再多换几道<b>新题</b>试试！`,
            `Memo slipped up a little! But there’s only ${newCount} new question${newCount > 1 ? 's' : ''} on the exam, so it’s not obvious yet… Swap in more <b>new</b> ones!`), 'think');
        }
      }

      renderPool();
    }
  });
})();
