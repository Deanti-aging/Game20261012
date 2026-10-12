/* 第 4 关：学习率 —— 步长太大会震荡，太小爬得慢 */
(function () {
  const { h } = G;
  const tr = G.t;
  const f = (x) => 0.5 * (x - 1) * (x - 1);
  const df = (x) => x - 1;
  const START = -3.5, MAX_STEPS = 20, NEAR = 0.3, FAST = 6;

  G.registerLevel({
    id: 'lr',
    icon: '🎢',
    title: tr('步子迈多大？', 'How Big a Step?'),
    skill: tr('找到“刚刚好”的步子', 'finding a step size that’s “just right”'),
    minutes: 4,
    terms: ['lr'],
    story: tr(
      '这一次波波学会了<b>自己</b>下山：每一步走多远 = <b>坡有多陡 × 步长旋钮</b>。<br>你只负责调“步长旋钮”。来做三个小实验：把它调得超大、调得超小，再找到刚刚好的那一档！',
      'This time Bobo rolls downhill <b>on its own</b>: how far each step goes = <b>how steep the slope is × the step-size dial</b>.<br>Your only job is the step-size dial. Run three little experiments: turn it way up, turn it way down, then find the setting that’s just right!'),
    hello: tr(
      '这次我自己滚！你来调<b>步长旋钮</b>。先大胆地把它调到<b>很大</b>，看看会发生什么？',
      'This time I roll by myself! You control the <b>step-size dial</b>. Be bold — crank it <b>way up</b> first and see what happens!'),
    winLine: tr('三个实验全做完！我现在知道步子该迈多大啦！', 'All three experiments done! Now I know how big my steps should be!'),
    reveal: tr(
      '<p>你调的那个“步长旋钮”，在机器学习里叫<b>「学习率」</b>。</p><p>每一步走多远 = 坡度 × 学习率。</p><ul><li>学习率<b>太大</b>：冲过谷底，在两边来回<b>震荡</b>，甚至越跳越高、飞出山谷（训练“爆炸”）。</li><li>学习率<b>太小</b>：方向是对的，但像蜗牛一样慢，可能永远到不了。</li><li><b>刚刚好</b>：又快又稳地到达谷底。</li></ul><p>真实的工程师训练模型时，也常常要像你这样反复试学习率！</p>',
      '<p>The step-size dial you were turning is called the <b>learning rate</b> in machine learning.</p><p>How far each step goes = slope × learning rate.</p><ul><li>Learning rate <b>too big</b>: you overshoot the bottom and <b>oscillate</b> back and forth — or even bounce higher and higher until you fly out of the valley (training “explodes”).</li><li>Learning rate <b>too small</b>: the direction is right, but it’s as slow as a snail and may never get there.</li><li><b>Just right</b>: you reach the bottom quickly and smoothly.</li></ul><p>Real engineers training models often have to try learning rates over and over, just like you did!</p>'),
    quiz: {
      q: tr(
        '小明训练模型时，发现损失一会儿变大、一会儿变小，像荡秋千一样停不下来，甚至越来越大。最可能的原因是？',
        'While training a model, Sam notices the loss keeps going up and down like a swing that won’t stop — and it’s even getting bigger. What’s the most likely cause?'),
      options: [
        tr('学习率太大了', 'The learning rate is too big'),
        tr('学习率太小了', 'The learning rate is too small'),
        tr('训练数据太多了', 'There’s too much training data'),
        tr('电脑的屏幕太小了', 'The computer screen is too small')
      ],
      answer: 0,
      hint: tr('回想一下你把旋钮调到最大时，小球的样子。', 'Think about what the ball did when you turned the dial all the way up.'),
      explain: tr(
        '学习率太大，每一步都冲过了谷底，所以损失来回震荡，严重时会越来越大（发散）。把学习率调小一些通常就能解决。',
        'With too big a learning rate, every step overshoots the bottom, so the loss swings back and forth — and in bad cases keeps growing (diverges). Lowering the learning rate usually fixes it.')
    },

    mount(stage, api) {
      const cv = G.makeCanvas(640, 440);
      const scene = G.valley(cv, { f, xmin: -4.5, xmax: 6.5, ymax: 16, xbest: 1, bottom: 290 });
      let path = [START], prevPath = null, shownX = START, running = false;

      api.missions([
        tr('把步长调得<b>很大</b>，让小球来回乱晃（冲过谷底 3 次以上）', 'Set the step size <b>very big</b> so the ball bounces around (overshoots the bottom 3+ times)'),
        tr('把步长调得<b>很小</b>，看小球爬 10 步后还离谷底很远', 'Set the step size <b>very small</b> and watch the ball still be far from the bottom after 10 steps'),
        tr(`找到刚刚好的步长：${FAST} 步以内到达谷底`, `Find a just-right step size: reach the bottom within ${FAST} steps`)
      ]);

      const lr = G.slider({ label: tr('🎛️ 步长旋钮：', '🎛️ Step-size dial:'), min: 0.05, max: 2.3, step: 0.05, value: 0.3, format: (v) => v.toFixed(2) });
      const goBtn = h('button', { class: 'btn btn-big btn-yellow', onclick: run }, tr('▶ 让小球自己滚', '▶ Let the ball roll'));
      const info = h('div', {});
      stage.append(cv.el, info, h('div', { class: 'controls' }, lr.el, goBtn));

      function render() {
        scene.draw(shownX, (ctx, px, py) => {
          // 当前路线
          ctx.strokeStyle = 'rgba(232,89,12,.7)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
          ctx.beginPath();
          path.forEach((x, i) => {
            const X = px(G.clamp(x, -5, 7)), Y = Math.max(10, py(f(x))) - 4;
            i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
          });
          ctx.stroke(); ctx.setLineDash([]);
        });
        drawChart();
      }

      // 下方折线图：每一步的误差
      function drawChart() {
        const ctx = cv.ctx, x0 = 50, y0 = 332, W = 560, H = 86;
        ctx.fillStyle = '#fffdf7'; ctx.fillRect(0, 321, 640, 119);
        ctx.fillStyle = '#3b3355'; ctx.fillRect(0, 320, 640, 3);
        ctx.strokeStyle = '#3b3355'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + H); ctx.lineTo(x0 + W, y0 + H); ctx.stroke();
        ctx.fillStyle = '#3b3355'; ctx.font = '13px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(tr('误差', 'Error'), 8, y0 + 12);
        ctx.textAlign = 'right'; ctx.fillText(tr('第几步 →', 'Step →'), x0 + W, y0 + H + 16);
        const Lmax = f(START) * 1.15;
        const pt = (i, x) => [x0 + (i / MAX_STEPS) * W, y0 + H - Math.min(1, f(x) / Lmax) * H];
        const line = (p, color, width) => {
          ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
          p.forEach((x, i) => { const [a, b] = pt(i, x); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); });
          ctx.stroke();
          ctx.fillStyle = color;
          p.forEach((x, i) => { const [a, b] = pt(i, x); ctx.beginPath(); ctx.arc(a, b, width + 1, 0, Math.PI * 2); ctx.fill(); });
        };
        if (prevPath) line(prevPath, 'rgba(150,150,170,.5)', 2);
        line(path, '#e64980', 3);
        // 目标线
        const gy = y0 + H - (f(1 + NEAR) / Lmax) * H;
        ctx.strokeStyle = '#2b8a3e'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x0 + W, gy); ctx.stroke(); ctx.setLineDash([]);
      }

      function showInfo(steps, x, note) {
        info.innerHTML = '';
        info.append(h('div', { class: 'stat-row' },
          h('div', { class: 'stat' }, tr('👣 步数', '👣 Steps'), h('b', {}, steps)),
          h('div', { class: 'stat ' + (Math.abs(x - 1) < NEAR ? 'good' : '') }, tr('📉 误差', '📉 Error'), h('b', {}, Math.abs(x) > 50 ? tr('爆表!', 'Off the chart!') : f(x).toFixed(2))),
          note && h('div', { class: 'stat' }, tr('📝 结果', '📝 Result'), h('b', { style: { fontSize: '1.1rem' } }, note))));
      }

      async function run() {
        if (running) return;
        running = true; goBtn.disabled = true; lr.input.disabled = true;
        const eta = lr.value;
        prevPath = path.length > 1 ? path : prevPath;
        let x = START, flips = 0, reachedAt = -1, flew = false;
        path = [x]; shownX = x;
        api.say(tr(`出发！步长 = ${eta.toFixed(2)}`, `Off we go! Step size = ${eta.toFixed(2)}`), 'think');
        for (let i = 1; i <= MAX_STEPS; i++) {
          const nx = x - eta * df(x);
          if ((x - 1) * (nx - 1) < 0) flips++;
          // 动画
          const from = x;
          for (let k = 1; k <= 8; k++) { shownX = G.lerp(from, nx, k / 8); render(); await api.wait(22); }
          x = nx; path.push(x); shownX = x; render();
          api.sfx('step');
          showInfo(i, x);
          if (reachedAt < 0 && Math.abs(x - 1) < NEAR) reachedAt = i;
          if (x < -4.6 || x > 6.6) { flew = true; break; }
          if (Math.abs(x - 1) < 0.02) break;
          await api.wait(110);
        }
        const steps = path.length - 1;
        // 判定
        let note;
        if (flew) {
          note = tr('飞出山谷！', 'Flew out!');
          api.say(tr('哇啊啊！步子太大，<b>越跳越高，飞出山谷了</b>！💥', 'Waaah! The steps were so big I <b>bounced higher and higher and flew out of the valley</b>! 💥'), 'wow');
        } else if (flips >= 3 && (reachedAt < 0 || reachedAt > FAST)) {
          note = tr('来回乱晃', 'Bouncing around');
          api.say(tr(`冲过谷底 ${flips} 次！像荡秋千一样<b>左右乱晃</b>，就是停不下来～`, `Overshot the bottom ${flips} times! <b>Swinging back and forth</b> like a playground swing — I just can’t stop!`), 'wow');
        } else if (reachedAt > 0 && reachedAt <= FAST) {
          note = tr(`${reachedAt} 步到达`, `Arrived in ${reachedAt} steps`);
          api.say(tr(`只用 <b>${reachedAt} 步</b>就到了谷底附近，又快又稳！`, `Reached the bottom in just <b>${reachedAt} steps</b> — fast and steady!`), 'happy');
        } else if (reachedAt < 0 && flips === 0) {
          note = tr('太慢了', 'Too slow');
          api.say(tr(`走了 ${steps} 步还没到……步子太小，像蜗牛一样 🐌`, `${steps} steps and still not there… my steps are too small, like a snail 🐌`), 'sad');
        } else {
          note = tr(`${reachedAt} 步到达`, `Arrived in ${reachedAt} steps`);
          api.say(tr(`用了 ${reachedAt} 步才到。能更快吗？试试别的步长～`, `Took ${reachedAt} steps to get there. Can we go faster? Try another step size!`), 'think');
        }
        showInfo(steps, x, note);

        if (flew || (flips >= 3 && (reachedAt < 0 || reachedAt > FAST))) api.check(0);
        if (flips === 0 && path.length > 10 && Math.abs(path[10] - 1) > 1) api.check(1);
        if (reachedAt > 0 && reachedAt <= FAST) api.check(2);

        running = false; goBtn.disabled = false; lr.input.disabled = false;
        goBtn.textContent = tr('▶ 再滚一次', '▶ Roll again');
        if (api.allChecked()) api.win();
        else api.after(1800, nextHint);
      }

      function nextHint() {
        if (running || api.won) return;
        if (!api.checked(0)) api.say(tr('下一个实验：把旋钮调到<b>很大</b>（比如 1.8 以上），看看会怎样？', 'Next experiment: turn the dial <b>way up</b> (say, above 1.8) and see what happens!'), 'happy');
        else if (!api.checked(1)) api.say(tr('下一个实验：把旋钮调到<b>很小</b>（比如 0.1），再滚一次！', 'Next experiment: turn the dial <b>way down</b> (say, 0.1) and roll again!'), 'happy');
        else if (!api.checked(2)) api.say(tr(`最后：找一个<b>刚刚好</b>的步长，${FAST} 步以内到谷底！`, `Last one: find a <b>just-right</b> step size that reaches the bottom within ${FAST} steps!`), 'happy');
      }

      showInfo(0, START);
      render();
    }
  });
})();
