/* 第 8 关：聚类 & K 均值 —— 拖动队长，让散落的点自动归队 */
(function () {
  const { h } = G;
  const W = 640, H = 400;
  const CAP_COLORS = [
    { fill: '#ff8787', light: '#ffc9c9', name: '红队' },
    { fill: '#4dabf7', light: '#a5d8ff', name: '蓝队' },
    { fill: '#fcc419', light: '#ffec99', name: '黄队' }
  ];
  const CRITTERS = ['🐣', '🐥', '🐤'];

  function makePoints() {
    const r = G.rng(8);
    const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += r(); return (u - 3) / Math.sqrt(0.5); };
    const centers = [[120, 110], [520, 110], [320, 320]];
    const pts = [];
    centers.forEach(([cx, cy]) => {
      for (let i = 0; i < 16; i++) {
        pts.push({ x: G.clamp(cx + gauss() * 34, 20, W - 20), y: G.clamp(cy + gauss() * 30, 20, H - 20), team: -1 });
      }
    });
    return { pts, centers };
  }

  const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  function assign(pts, caps) {
    pts.forEach((p) => {
      let best = 0, bd = Infinity;
      caps.forEach((c, k) => { const d = dist2(p, c); if (d < bd) { bd = d; best = k; } });
      p.team = best;
    });
  }
  function centroids(pts, caps) {
    return caps.map((c, k) => {
      const mine = pts.filter((p) => p.team === k);
      if (!mine.length) return { x: c.x, y: c.y };
      return { x: mine.reduce((s, p) => s + p.x, 0) / mine.length, y: mine.reduce((s, p) => s + p.y, 0) / mine.length };
    });
  }
  const spread = (pts, caps) => pts.reduce((s, p) => s + Math.sqrt(dist2(p, caps[p.team])), 0) / pts.length;

  G.registerLevel({
    id: 'kmeans',
    icon: '🚩',
    title: '小鸡找队长',
    skill: '自己把相似的东西分成几堆',
    minutes: 4,
    terms: ['cluster', 'kmeans'],
    story: '操场上散落着 48 只小鸡，<b>没人告诉波波它们该怎么分组</b>。<br>波波想到一个办法：派出 3 个<b>队长</b> 🚩。每只小鸡跑向离自己最近的队长；队长再走到自己队伍的正中间……重复几次，会发生什么呢？',
    hello: '先<b>拖动</b>三个队长摆个位置，再按<b>“队长走到队伍中间”</b>。小鸡会自动跟最近的队长！',
    winLine: '三支队伍整整齐齐！没人告诉我答案，我自己分好啦！',
    reveal: '<p>不给任何答案（没有标签），让机器自己把相似、靠近的东西分成几堆——这叫<b>「聚类」</b>。</p><p>你刚才用的方法叫<b>「K 均值」（K-means）</b>，K 就是队长的个数（这里 K = 3）。它只反复做两件事：</p><ol><li>每个点跟<b>最近的</b>队长；</li><li>每个队长走到<b>自己队伍的平均位置</b>（正中间）。</li></ol><p>如果一开始把两个队长放在同一堆里，它们可能会<b>卡住</b>，分出奇怪的队伍——这叫“局部最优”，所以起点也很重要！</p>',
    quiz: {
      q: '一家奶茶店有 1000 位顾客的消费记录，但<b>没有人告诉你</b>顾客分为哪几类。你想自动把顾客分成几群，做不同的优惠活动。最适合用哪种方法？',
      options: ['聚类（比如 K 均值）', '监督学习：先给每位顾客贴好标签', '梯度下降找谷底', '让机器人走迷宫'],
      answer: 0,
      hint: '关键词：“没有人告诉你分为哪几类”。',
      explain: '没有标签、想让数据自己“抱团”，正是聚类（无监督学习）的用武之地。'
    },

    mount(stage, api) {
      const { pts, centers } = makePoints();
      // 最优参考：从真实中心出发跑 K 均值
      let ref = centers.map(([x, y]) => ({ x, y }));
      for (let i = 0; i < 20; i++) { assign(pts, ref); ref = centroids(pts, ref); }
      assign(pts, ref);
      const best = spread(pts, ref);

      // 起点故意挤在同一群小鸡里：直接按按钮会“卡住”，让玩家体验局部最优
      const START_CAPS = [{ x: 90, y: 110 }, { x: 150, y: 110 }, { x: 420, y: 215 }];
      let caps = START_CAPS.map((c) => ({ ...c }));
      let dragging = -1, moved = false, animating = false, steps = 0;
      assign(pts, caps);

      api.missions([
        '拖动队长 🚩，给它们换个位置',
        '按“队长走到队伍中间”，看看会怎样',
        '分出三支整齐的队伍（队长站稳不动，而且队伍很紧凑）'
      ]);

      const cv = G.makeCanvas(W, H);
      const stepBtn = h('button', { class: 'btn btn-big btn-yellow', onclick: () => doStep(true) }, '📣 队长走到队伍中间');
      const autoBtn = h('button', { class: 'btn btn-blue', onclick: autoRun }, '🔁 一直走到站稳');
      const resetBtn = h('button', { class: 'btn btn-white', onclick: reset }, '↺ 队长回到起点');
      const spreadStat = h('b', {}, ''), stepStat = h('b', {}, '0');
      stage.append(cv.el,
        h('div', { class: 'stat-row' },
          h('div', { class: 'stat' }, '📏 队伍松散度（越小越紧凑）', spreadStat),
          h('div', { class: 'stat' }, '📣 队长移动次数', stepStat)),
        h('div', { class: 'controls' }, stepBtn, autoBtn, resetBtn));

      function draw() {
        const ctx = cv.ctx;
        ctx.fillStyle = '#ebfbee'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#d3f9d8'; ctx.lineWidth = 2;
        for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 40, H); ctx.stroke(); }
        // 小鸡 → 队长 的细线
        pts.forEach((p) => {
          const c = caps[p.team];
          ctx.strokeStyle = CAP_COLORS[p.team].light; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(c.x, c.y); ctx.stroke();
        });
        // 小鸡
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        pts.forEach((p) => {
          ctx.fillStyle = CAP_COLORS[p.team].fill; ctx.strokeStyle = '#3b3355'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.font = '13px sans-serif';
          ctx.fillText(CRITTERS[p.team], p.x, p.y + 1);
        });
        // 队长
        caps.forEach((c, k) => {
          ctx.fillStyle = '#3b3355';
          ctx.fillRect(c.x - 2, c.y - 34, 4, 34);
          ctx.fillStyle = CAP_COLORS[k].fill; ctx.strokeStyle = '#3b3355'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(c.x + 2, c.y - 34); ctx.lineTo(c.x + 28, c.y - 25); ctx.lineTo(c.x + 2, c.y - 16); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.arc(c.x, c.y, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
          ctx.fillText('★', c.x, c.y + 1);
        });
      }

      function stats() {
        spreadStat.textContent = spread(pts, caps).toFixed(1);
        stepStat.textContent = steps;
      }

      // 拖动
      cv.el.addEventListener('pointerdown', (e) => {
        if (animating) return;
        const p = cv.pos(e);
        let bi = -1, bd = 34 * 34;
        caps.forEach((c, k) => {
          const d = Math.min(dist2(p, c), dist2(p, { x: c.x + 12, y: c.y - 25 }));
          if (d < bd) { bd = d; bi = k; }
        });
        if (bi >= 0) { dragging = bi; try { cv.el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } api.sfx('pop'); }
      });
      cv.el.addEventListener('pointermove', (e) => {
        if (dragging < 0) return;
        const p = cv.pos(e);
        caps[dragging] = { x: G.clamp(p.x, 14, W - 14), y: G.clamp(p.y, 36, H - 14) };
        moved = true;
        assign(pts, caps); stats(); draw();
      });
      const endDrag = () => {
        if (dragging >= 0 && moved && api.check(0)) api.say('看到了吗？每只小鸡都跑向了<b>离自己最近</b>的队长。现在按<b>“队长走到队伍中间”</b>！', 'happy');
        dragging = -1; moved = false;
      };
      cv.el.addEventListener('pointerup', endDrag);
      cv.el.addEventListener('pointercancel', endDrag);
      cv.el.style.cursor = 'grab';

      function setBusy(b) { animating = b; stepBtn.disabled = autoBtn.disabled = resetBtn.disabled = b; }

      async function doStep(talk) {
        if (animating) return 0;
        setBusy(true);
        const from = caps.map((c) => ({ ...c }));
        const to = centroids(pts, caps);
        const move = Math.max(...to.map((t, k) => Math.sqrt(dist2(t, from[k]))));
        api.sfx('step');
        for (let i = 1; i <= 14; i++) {
          const k = 1 - Math.pow(1 - i / 14, 3);
          caps = from.map((f, j) => ({ x: G.lerp(f.x, to[j].x, k), y: G.lerp(f.y, to[j].y, k) }));
          draw();
          await api.wait(24);
        }
        caps = to;
        assign(pts, caps);
        steps++;
        stats(); draw();
        api.check(1);
        setBusy(false);
        if (talk) judge(move);
        return move;
      }

      async function autoRun() {
        if (animating) return;
        for (let i = 0; i < 25; i++) {
          const m = await doStep(false);
          if (m < 0.5) break;
          await api.wait(120);
        }
        judge(0);
      }

      function judge(move) {
        if (move >= 0.5) {
          api.say('队长们走到了自己队伍的中间，小鸡们又重新挑了一次队长……再按几次试试？', 'think');
          return;
        }
        const sp = spread(pts, caps);
        if (sp <= best * 1.05) {
          api.check(0);
          api.check(2);
          api.win();
        } else {
          const counts = [0, 1, 2].map((k) => pts.filter((p) => p.team === k).length);
          const empty = counts.some((c) => c === 0);
          api.say(empty
            ? '咦，有个队长<b>一只小鸡都没有</b>，卡住啦！把它拖到别的鸡群附近，再试一次。'
            : '队长们<b>站稳不动了</b>，可是队伍分得有点怪（看看松散度！）。可能有两个队长挤在同一群里了——把队长拖开，再试试！', 'sad');
          api.sfx('bad');
        }
      }

      function reset() {
        if (animating) return;
        api.sfx('boing');
        caps = START_CAPS.map((c) => ({ ...c }));
        steps = 0;
        assign(pts, caps); stats(); draw();
      }

      stats(); draw();
    }
  });
})();
