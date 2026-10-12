/* 第 11 关：强化学习 & 奖励 —— 撞墙扣分、到终点加分，看机器人自己学会走迷宫 */
(function () {
  const { h } = G;
  const MAP = [
    'S..#..',
    '##.#.#',
    '......',
    '.####.',
    '...#G.',
    '##....'
  ];
  const R = MAP.length, C = MAP[0].length, CELL = 60;
  const ACT = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  const ARROW = ['↑', '→', '↓', '←'];
  const START = [0, 0], GOAL = [4, 4];
  const isWall = (r, c) => r < 0 || c < 0 || r >= R || c >= C || MAP[r][c] === '#';
  const ALPHA = 0.5, GAMMA = 0.9, EPS = 0.2, EP_CAP = 400, BEST = 10, PASS = 12;

  G.registerLevel({
    id: 'maze',
    icon: '🧭',
    title: '迷宫里的蛋糕',
    skill: '靠奖励和惩罚，自己学会走迷宫',
    minutes: 5,
    terms: ['rl', 'reward'],
    story: '迷宫的终点有一块蛋糕 🍰，但<b>没人告诉波波路怎么走</b>。它只能自己一遍遍乱走、试错。<br>你能决定的，只有<b>“规则”</b>：走到终点得几分？撞墙扣几分？看看不同的规则会让波波学会什么。',
    hello: '我一开始什么都不懂，只会乱走。先点<b>“训练 20 回合”</b>，然后让我<b>考试</b>看看学会了没？',
    winLine: '我学会走迷宫啦！没有人教我路线，是奖励教会了我！',
    reveal: '<p>没有人告诉波波“正确路线”，只给它<b>分数</b>：到终点加分、撞墙扣分。波波一遍遍试错，慢慢学会了怎么走能拿最多的分——这叫<b>「强化学习」</b>。</p><p>那些分数，叫<b>「奖励」</b>。你应该发现了：终点奖励是 0 的时候，波波怎么练都学不会去终点——因为它根本不知道终点有什么好！<b>奖励就是在告诉机器“你的目标是什么”</b>。</p><p>格子的颜色和箭头，是波波记在心里的“往哪走最好”。下棋的 AlphaGo、会走路的机器人，用的都是这个思路。</p>',
    quiz: {
      q: '训练一个扫地机器人：每扫干净一块地就 +1 分。结果它学会了<b>把垃圾倒出来再扫干净</b>，不停地刷分！这说明了什么？',
      options: ['奖励规则设计得不好，机器人钻了空子', '机器人坏掉了，需要修理', '它在做监督学习', '学习率太小了'],
      answer: 0,
      hint: '机器人只会追求“分数最多”，不管你心里真正想要什么。',
      explain: '强化学习的机器人只追求奖励最大。奖励设计有漏洞，它就会“钻空子”（Reward Hacking）。设计好奖励非常重要！'
    },

    mount(stage, api) {
      const rw = { goal: 0, wall: -1, step: 0 };
      let Q, episodes, busy = false, agent = null, trail = [], lastTrainEps = 0;
      const resetQ = () => {
        Q = Array.from({ length: R }, () => Array.from({ length: C }, () => [0, 0, 0, 0]));
        episodes = 0;
      };
      resetQ();

      api.missions([
        '训练波波至少 20 回合，然后考试看看',
        '修改奖励规则（拖动下面的滑块）',
        `考试时，波波自己在 ${PASS} 步之内走到蛋糕 🍰`
      ]);

      const cv = G.makeCanvas(C * CELL, R * CELL);
      const sGoal = G.slider({ label: '🍰 走到终点：', min: 0, max: 100, step: 10, value: 0, format: (v) => '+' + v, onChange: () => changeRule() });
      const sWall = G.slider({ label: '🧱 撞到墙：', min: -20, max: 0, step: 1, value: -1, format: (v) => (v === 0 ? '0' : v), onChange: () => changeRule() });
      const sStep = G.slider({ label: '👣 每走一步：', min: -5, max: 0, step: 1, value: 0, format: (v) => (v === 0 ? '0' : v), onChange: () => changeRule() });
      const trainBtn = h('button', { class: 'btn btn-yellow', onclick: () => train(20) }, '🏋️ 训练 20 回合');
      const watchBtn = h('button', { class: 'btn btn-blue', onclick: watch }, '👀 看它练 1 回合');
      const examBtn = h('button', { class: 'btn btn-big btn-mint', onclick: exam }, '📝 考试');
      const epStat = h('b', {}, '0');
      const log = h('div', { class: 'log' }, '还没有训练记录。');

      stage.append(h('div', { class: 'maze-layout' },
        cv.el,
        h('div', { class: 'maze-side' },
          h('div', { class: 'panel' }, h('div', { class: 'section-title' }, '📜 奖励规则（由你决定）'), sGoal.el, sWall.el, sStep.el),
          h('div', { class: 'stat-row' }, h('div', { class: 'stat' }, '🔁 已训练回合', epStat)),
          h('div', { class: 'controls' }, trainBtn, watchBtn, examBtn),
          log)));

      function addLog(t) {
        if (log.textContent === '还没有训练记录。') log.innerHTML = '';
        log.prepend(h('div', {}, t));
      }

      function setBusy(b) { busy = b; [trainBtn, watchBtn, examBtn].forEach((x) => { x.disabled = b; }); [sGoal, sWall, sStep].forEach((s) => { s.input.disabled = b; }); }

      function changeRule() {
        rw.goal = sGoal.value; rw.wall = sWall.value; rw.step = sStep.value;
        resetQ(); epStat.textContent = '0'; trail = []; agent = null;
        api.check(1);
        api.sfx('boing');
        api.say(rw.goal > 0
          ? `新规则：到终点 <b>+${rw.goal}</b>！规则变了，我要<b>从头重新学</b>。再训练我吧！`
          : '规则变了，我从头学。不过……走到终点还是 <b>0 分</b>，我去那儿干嘛呢？', rw.goal > 0 ? 'happy' : 'think');
        addLog(`— 规则改为：终点 +${rw.goal}，撞墙 ${rw.wall}，每步 ${rw.step}（记忆清空）`);
        draw();
      }

      function envStep(r, c, a) {
        const nr = r + ACT[a][0], nc = c + ACT[a][1];
        if (isWall(nr, nc)) return { r, c, rew: rw.wall + rw.step, done: false, bump: true };
        if (nr === GOAL[0] && nc === GOAL[1]) return { r: nr, c: nc, rew: rw.goal + rw.step, done: true };
        return { r: nr, c: nc, rew: rw.step, done: false };
      }
      function argmax(q, randomTies) {
        const m = Math.max(...q);
        const ids = [0, 1, 2, 3].filter((i) => q[i] === m);
        return randomTies ? ids[Math.floor(Math.random() * ids.length)] : ids[0];
      }
      function episode(record) {
        let [r, c] = START, steps = 0, bumps = 0, reached = false;
        const path = [[r, c]];
        while (steps < EP_CAP) {
          const a = Math.random() < EPS ? Math.floor(Math.random() * 4) : argmax(Q[r][c], true);
          const s = envStep(r, c, a);
          const target = s.rew + (s.done ? 0 : GAMMA * Math.max(...Q[s.r][s.c]));
          Q[r][c][a] += ALPHA * (target - Q[r][c][a]);
          r = s.r; c = s.c; steps++;
          if (s.bump) bumps++;
          if (record) path.push([r, c]);
          if (s.done) { reached = true; break; }
        }
        episodes++;
        return { steps, bumps, reached, path };
      }

      async function train(n) {
        if (busy) return;
        setBusy(true);
        let sumSteps = 0, reachedN = 0;
        for (let i = 0; i < n; i++) {
          const res = episode(false);
          sumSteps += res.steps; if (res.reached) reachedN++;
          if (i % 4 === 3) { epStat.textContent = episodes; draw(); api.sfx('step'); await api.wait(40); }
        }
        lastTrainEps += n;
        epStat.textContent = episodes;
        addLog(`第 ${episodes - n + 1}–${episodes} 回合：平均每回合 ${Math.round(sumSteps / n)} 步`);
        trail = []; agent = null; draw();
        setBusy(false);
        if (episodes >= 20) api.say(rw.goal > 0 ? '练完了！格子颜色越绿，代表我觉得那里越“有希望”。去考试吧！' : '练完了……可是我感觉每个方向都差不多，没什么特别想去的地方 🤔', 'think');
      }

      async function animatePath(path, delay) {
        for (let i = 0; i < path.length; i++) {
          agent = path[i];
          trail = path.slice(Math.max(0, i - 12), i + 1);
          draw();
          await api.wait(delay);
        }
      }

      async function watch() {
        if (busy) return;
        setBusy(true);
        const res = episode(true);
        epStat.textContent = episodes;
        api.say('训练时我会偶尔<b>乱试一下</b>（探索），说不定能发现新路！', 'think');
        const shown = res.path.slice(0, 120);
        await animatePath(shown, 70);
        addLog(`第 ${episodes} 回合：${res.reached ? `${res.steps} 步到达终点` : '没走到终点'}，撞墙 ${res.bumps} 次${res.path.length > 120 ? '（只播放了前 120 步）' : ''}`);
        setBusy(false);
      }

      async function exam() {
        if (busy) return;
        setBusy(true);
        // 考试：不再乱试，只走自己认为最好的方向
        let [r, c] = START;
        const path = [[r, c]];
        const seen = new Set([r + ',' + c]);
        let reached = false, looped = false;
        for (let i = 0; i < 30; i++) {
          const a = argmax(Q[r][c], false);
          const s = envStep(r, c, a);
          r = s.r; c = s.c; path.push([r, c]);
          if (s.done) { reached = true; break; }
          const key = r + ',' + c + ',' + a;
          if (seen.has(key) || s.bump) { looped = true; if (path.length > 6) break; }
          seen.add(key);
        }
        api.say('考试中：这次我不乱试了，只走我认为<b>最好</b>的方向……', 'think');
        await animatePath(path, 160);
        const steps = path.length - 1;
        setBusy(false);
        if (episodes >= 20) api.check(0);

        if (reached && steps <= PASS) {
          addLog(`📝 考试：${steps} 步走到终点！`);
          if (!api.checked(1)) api.check(1);
          api.check(2);
          api.win();
        } else if (reached) {
          addLog(`📝 考试：${steps} 步才走到终点`);
          api.say(`走到了，但是绕了远路（${steps} 步）。再多训练几回合，或者给<b>每一步</b>加一点点惩罚试试？`, 'think');
        } else {
          addLog('📝 考试：没走到终点' + (looped ? '（在原地打转）' : ''));
          if (rw.goal === 0) api.say('我没去终点……因为走到那里<b>得 0 分</b>，跟乱走没区别呀！要不要<b>给终点设个奖励</b>？', 'sad');
          else if (episodes < 20) api.say('我还没练够呢，先多训练几回合吧！', 'sad');
          else api.say('还没学会……再训练 20 回合试试？', 'sad');
        }
        api.sfx(reached ? 'good' : 'bad');
      }

      function draw() {
        const ctx = cv.ctx;
        let maxV = 0, minV = 0;
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
          if (isWall(r, c)) continue;
          const v = Math.max(...Q[r][c]);
          maxV = Math.max(maxV, v); minV = Math.min(minV, v);
        }
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
          const x = c * CELL, y = r * CELL;
          if (isWall(r, c)) {
            ctx.fillStyle = '#c0703a'; ctx.fillRect(x, y, CELL, CELL);
            ctx.strokeStyle = '#8a4b22'; ctx.lineWidth = 2;
            for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x, y + k * 20 + 20); ctx.lineTo(x + CELL, y + k * 20 + 20); ctx.stroke(); }
            for (let k = 0; k < 3; k++) { const ox = (k % 2) * 15 + 15; ctx.beginPath(); ctx.moveTo(x + ox, y + k * 20); ctx.lineTo(x + ox, y + k * 20 + 20); ctx.moveTo(x + ox + 30, y + k * 20); ctx.lineTo(x + ox + 30, y + k * 20 + 20); ctx.stroke(); }
            continue;
          }
          const q = Q[r][c], v = Math.max(...q);
          let fill = '#fffdf7';
          if (v > 0 && maxV > 0) fill = `rgba(64,192,87,${0.12 + 0.75 * (v / maxV)})`;
          else if (v < 0 && minV < 0) fill = `rgba(255,135,135,${0.1 + 0.4 * (v / minV)})`;
          ctx.fillStyle = '#fffdf7'; ctx.fillRect(x, y, CELL, CELL);
          ctx.fillStyle = fill; ctx.fillRect(x, y, CELL, CELL);
          ctx.strokeStyle = '#dee2e6'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
          const isGoal = r === GOAL[0] && c === GOAL[1];
          if (!isGoal && Math.max(...q) !== Math.min(...q)) {
            ctx.fillStyle = 'rgba(59,51,85,.55)'; ctx.font = 'bold 22px sans-serif';
            ctx.fillText(ARROW[argmax(q, false)], x + CELL / 2, y + CELL / 2 + 1);
          }
        }
        // 足迹
        if (trail.length > 1) {
          ctx.strokeStyle = 'rgba(230,73,128,.6)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath();
          trail.forEach(([r, c], i) => { const X = c * CELL + CELL / 2, Y = r * CELL + CELL / 2; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
          ctx.stroke();
        }
        ctx.font = '34px sans-serif';
        ctx.fillText('🍰', GOAL[1] * CELL + CELL / 2, GOAL[0] * CELL + CELL / 2 + 2);
        ctx.font = '13px sans-serif'; ctx.fillStyle = '#3b3355';
        ctx.fillText('起点', START[1] * CELL + CELL / 2, START[0] * CELL + 10);
        const [ar, ac] = agent || START;
        ctx.font = '36px sans-serif';
        ctx.fillText('🤖', ac * CELL + CELL / 2, ar * CELL + CELL / 2 + 4);
      }

      draw();
    }
  });
})();
