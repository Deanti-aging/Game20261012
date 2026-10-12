/* 第 3 关：损失 & 梯度下降 —— 亲手把小球一步步挪到谷底 */
(function () {
  const { h } = G;

  /** 山谷场景（第 3、4 关共用） */
  G.valley = function (cv, opts) {
    const { ctx, w } = cv;
    const f = opts.f, X0 = opts.xmin, X1 = opts.xmax, YMAX = opts.ymax;
    const top = 26, bottom = opts.bottom || 300;
    const px = (x) => 34 + ((x - X0) / (X1 - X0)) * (w - 68);
    const py = (L) => bottom - (L / YMAX) * (bottom - top);

    function draw(ballX, extra) {
      // 天空
      const sky = ctx.createLinearGradient(0, 0, 0, bottom);
      sky.addColorStop(0, '#bfe6ff'); sky.addColorStop(1, '#f1fbff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, cv.h);
      ctx.fillStyle = '#ffe066';
      ctx.beginPath(); ctx.arc(w - 60, 52, 22, 0, Math.PI * 2); ctx.fill();
      // 山谷
      ctx.beginPath();
      ctx.moveTo(0, cv.h);
      for (let sx = 0; sx <= w; sx += 4) {
        const x = X0 + ((sx - 34) / (w - 68)) * (X1 - X0);
        ctx.lineTo(sx, Math.max(top - 40, py(f(x))));
      }
      ctx.lineTo(w, cv.h); ctx.closePath();
      const grass = ctx.createLinearGradient(0, top, 0, cv.h);
      grass.addColorStop(0, '#8ce99a'); grass.addColorStop(1, '#40c057');
      ctx.fillStyle = grass; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = '#3b3355'; ctx.stroke();
      // 谷底小旗（插在谷底上方）
      const mx = px(opts.xbest), my = py(f(opts.xbest));
      ctx.strokeStyle = '#3b3355'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx, my - 46); ctx.stroke();
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath(); ctx.moveTo(mx, my - 46); ctx.lineTo(mx + 26, my - 38); ctx.lineTo(mx, my - 30); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText('谷底 = 误差最小', mx, my + 16);
      if (extra) extra(ctx, px, py);
      if (ballX != null && ballX >= X0 - 0.6 && ballX <= X1 + 0.6) drawBall(ballX);
    }

    function drawBall(x) {
      const L = f(x);
      const bx = px(x), by = Math.max(14, py(L)) - 15;
      ctx.save();
      ctx.fillStyle = '#ff8cc6'; ctx.strokeStyle = '#3b3355'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(bx, by, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3b3355';
      ctx.beginPath(); ctx.arc(bx - 5, by - 3, 2.6, 0, Math.PI * 2); ctx.arc(bx + 5, by - 3, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(bx, by + 2, 5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }

    return { draw, px, py };
  };

  const f = (x) => 0.5 * (x - 1) * (x - 1);
  const df = (x) => x - 1;
  const START = -3.5, MAX_MOVES = 12, GOAL = 0.1;

  G.registerLevel({
    id: 'descent',
    icon: '⛰️',
    title: '小球下山谷',
    skill: '一步步把“误差”降到最低',
    minutes: 4,
    terms: ['loss', 'gd'],
    story: '波波的答案总是错一点点。这个“错多少”被画成了一座山谷：<b>小球越高，错得越多</b>；滚到谷底，就最准啦。<br>你可以设定每一步走多远，然后往左或往右挪动小球。',
    hello: '帮我把小球挪到<b>谷底的小旗</b>那里！看小球下面的<b>箭头</b>，它会告诉你哪边是下坡。',
    winLine: '到谷底啦！我的误差变得超级小！',
    reveal: '<p>小球的高度，代表机器答案“错了多少”，这个分数叫<b>「损失」</b>（也常叫误差）。</p><p>你刚才每一步都在做同一件事：<b>看脚下哪边是下坡（箭头），就往那边走一步</b>，一直走到最低点。这个方法叫<b>「梯度下降」</b>，是几乎所有机器学习模型（包括大语言模型）训练时都在用的核心方法！</p><p>“梯度”就是你看到的那个箭头：它告诉你坡往哪边、有多陡。</p>',
    quiz: {
      q: '机器人在练习投篮：每投一次，就看球偏左还是偏右，然后朝<b>相反方向</b>稍微修正一点点。这最像哪种方法？',
      options: ['梯度下降：根据误差的方向，一小步一小步修正', '随机乱投，碰运气', '把上次进球的动作背下来', '给篮球贴标签'],
      answer: 0,
      hint: '“看偏差的方向 → 往减少偏差的方向走一小步 → 重复”',
      explain: '偏左就往右修正一点、偏右就往左修正一点，反复进行——这正是梯度下降的思路：沿着让损失变小的方向，一步步调整。'
    },

    mount(stage, api) {
      const cv = G.makeCanvas(640, 340);
      const scene = G.valley(cv, { f, xmin: -4, xmax: 6, ymax: 13, xbest: 1, bottom: 300 });
      let x = START, shownX = START, moves = 0, anim = null, done = false;
      const trail = [START];

      api.missions([
        `让小球到达谷底（误差小于 ${GOAL}）`,
        `只用 ${MAX_MOVES} 步以内`
      ]);

      const step = G.slider({ label: '👟 每一步走多远：', min: 0.1, max: 3, step: 0.1, value: 0.5, format: (v) => v.toFixed(1) });
      const left = h('button', { class: 'btn btn-big btn-blue', onclick: () => move(-1) }, '◀ 往左走');
      const right = h('button', { class: 'btn btn-big btn-blue', onclick: () => move(1) }, '往右走 ▶');
      const reset = h('button', { class: 'btn btn-white', onclick: resetAll }, '↺ 放回山顶');
      const lossStat = h('b', {}, '');
      const moveStat = h('b', {}, '');
      const lossBox = h('div', { class: 'stat' }, '📉 误差（高度）', lossStat);
      const moveBox = h('div', { class: 'stat' }, '👣 已走步数', moveStat);

      stage.append(cv.el,
        h('div', { class: 'stat-row' }, lossBox, moveBox),
        h('div', { class: 'controls' }, step.el),
        h('div', { class: 'controls' }, left, right, reset),
        h('p', { class: 'hint-line' }, '⌨️ 也可以用键盘 ← → 移动'));

      const onKey = (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
      };
      document.addEventListener('keydown', onKey);
      api.onCleanup(() => document.removeEventListener('keydown', onKey));

      function stats() {
        const L = f(x);
        lossStat.textContent = L.toFixed(2);
        moveStat.textContent = `${moves} / ${MAX_MOVES}`;
        lossBox.className = 'stat ' + (L < GOAL ? 'good' : '');
        moveBox.className = 'stat ' + (moves > MAX_MOVES ? 'bad' : '');
      }

      function render() {
        scene.draw(shownX, (ctx, px, py) => {
          // 足迹
          ctx.fillStyle = 'rgba(59,51,85,.35)';
          trail.forEach((t) => { ctx.beginPath(); ctx.arc(px(t), py(f(t)) - 2, 4, 0, Math.PI * 2); ctx.fill(); });
          // 坡度箭头（梯度的反方向 = 下坡）
          if (anim) return;
          const g = df(shownX);
          if (Math.abs(g) < 0.05) return;
          const dir = g > 0 ? -1 : 1;
          const len = 18 + Math.min(70, Math.abs(g) * 14);
          const bx = px(shownX), by = Math.min(330, py(f(shownX)) + 26);
          ctx.strokeStyle = '#e8590c'; ctx.fillStyle = '#e8590c'; ctx.lineWidth = 6; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + dir * len, by); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(bx + dir * (len + 12), by); ctx.lineTo(bx + dir * len, by - 9); ctx.lineTo(bx + dir * len, by + 9); ctx.fill();
          ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
          ctx.fillStyle = '#3b3355';
          ctx.fillText(Math.abs(g) > 2 ? '下坡（很陡）' : '下坡', bx + dir * len * 0.5, by + 20);
        });
      }

      async function move(dir) {
        if (anim || done) return;
        const from = x;
        const before = f(x);
        x = G.clamp(x + dir * step.value, -4, 6);
        moves++;
        trail.push(x);
        api.sfx('step');
        anim = true;
        stats();
        for (let i = 1; i <= 10; i++) {
          shownX = G.lerp(from, x, 1 - Math.pow(1 - i / 10, 3));
          render();
          await api.wait(24);
        }
        anim = null; shownX = x; render();
        afterMove(from, before);
      }

      function afterMove(from, before) {
        const L = f(x);
        if (L < GOAL) {
          api.check(0);
          if (moves <= MAX_MOVES) {
            api.check(1);
            done = true;
            api.win();
          } else {
            api.say(`到谷底了！不过用了 ${moves} 步，超过了 ${MAX_MOVES} 步。点“放回山顶”，试试把步子迈大一点？`, 'think');
          }
          return;
        }
        if ((from - 1) * (x - 1) < 0) api.say('哎呀，<b>冲过头了</b>！跑到对面山坡上去了。步子是不是太大了？', 'wow');
        else if (L > before) api.say('这是<b>上坡</b>！误差变大了。看看箭头，往下坡的方向走～', 'sad');
        else if (step.value <= 0.3 && moves >= 3) api.say('方向对了，可是一步一点点……这样要走好久呀 🐢', 'think');
        else api.say(`误差从 ${before.toFixed(2)} 降到了 ${L.toFixed(2)}，继续往下坡走！`, 'happy');
        if (moves >= MAX_MOVES && !api.checked(1)) api.say(`已经走了 ${moves} 步啦……可以继续走到谷底，也可以点“放回山顶”重来，挑战 ${MAX_MOVES} 步以内。`, 'think');
      }

      function resetAll() {
        if (anim) return;
        api.sfx('boing');
        x = shownX = START; moves = 0; done = false;
        trail.length = 0; trail.push(START);
        stats(); render();
        api.say('小球回到山顶啦。先调好“每一步走多远”，再出发！', 'happy');
      }

      stats(); render();
    }
  });
})();
