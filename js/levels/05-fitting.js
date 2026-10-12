/* 第 5 关：过拟合 & 欠拟合 —— 调曲线的弯曲度 */
(function () {
  const { h } = G;
  const truth = (x) => 0.95 * Math.sin(2.6 * x) + 0.25 * x;

  // 固定随机种子，保证每次数据一样
  function makeData() {
    const r = G.rng(20261012);
    const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += r(); return (u - 3) / Math.sqrt(0.5); };
    const train = [], test = [];
    for (let i = 0; i < 12; i++) {
      const x = -0.95 + (1.9 * i) / 11 + (r() - 0.5) * 0.05;
      train.push({ x, y: truth(x) + gauss() * 0.24 });
    }
    for (let i = 0; i < 14; i++) {
      const x = -0.9 + (1.8 * i) / 13 + 0.03;
      test.push({ x, y: truth(x) + gauss() * 0.24 });
    }
    return { train, test };
  }

  // 切比雪夫基：数值更稳定
  function basis(x, d) {
    const T = [1, x];
    for (let k = 2; k <= d; k++) T.push(2 * x * T[k - 1] - T[k - 2]);
    return T.slice(0, d + 1);
  }
  function fit(pts, d) {
    const n = d + 1;
    const A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
    for (const p of pts) {
      const b = basis(p.x, d);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) A[i][j] += b[i] * b[j];
        A[i][n] += b[i] * p.y;
      }
    }
    for (let i = 0; i < n; i++) A[i][i] += 1e-10;
    // 高斯消元（部分主元）
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
      [A[c], A[piv]] = [A[piv], A[c]];
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const k = A[r][c] / A[c][c];
        for (let j = c; j <= n; j++) A[r][j] -= k * A[c][j];
      }
    }
    const coef = A.map((row, i) => row[n] / row[i]);
    return (x) => basis(x, d).reduce((s, b, i) => s + b * coef[i], 0);
  }
  const mse = (model, pts) => pts.reduce((s, p) => s + (model(p.x) - p.y) ** 2, 0) / pts.length;

  G.registerLevel({
    id: 'fitting',
    icon: '〰️',
    title: '弯弯曲线描点点',
    skill: '找到规律，而不是死记',
    minutes: 4,
    terms: ['underfit', 'overfit'],
    story: '波波要画一条线，穿过橙色的<b>练习数据点</b>，好用来预测以后的新数据。<br>你可以调节这条线的<b>弯曲度</b>。紫色的 ☆ 是波波<b>没见过的新数据</b>——一条好线，应该也离它们很近。',
    hello: '拖动<b>弯曲度</b>滑块，看看线会怎么变。先试试<b>最直</b>的，再试试<b>最弯</b>的！',
    winLine: '这条线既抓住了规律，又没有死记噪声，刚刚好！',
    reveal: '<p>线太直的时候，它<b>连练习数据的规律都没抓住</b>，练习误差和新题误差都很大——这叫<b>「欠拟合」</b>。</p><p>线太弯的时候，它<b>拼命穿过每一个练习点</b>，连数据里随机的“抖动”（噪声）都背了下来。练习误差几乎为 0，可一碰到新数据就错得离谱——这叫<b>「过拟合」</b>。</p><p>好模型要在两者之间：抓住规律，忽略噪声。<b>判断标准是“新数据”上的表现</b>，而不是练习数据。</p>',
    quiz: {
      q: '一个天气预测模型，在过去 10 年的历史数据上准确率 100%，可是预测明天的天气却总是错得离谱。这最可能是？',
      options: ['过拟合：把历史数据（连同巧合）背下来了', '欠拟合：模型太简单了', '刚刚好：模型很完美', '学习率太小'],
      answer: 0,
      hint: '“练习”表现完美，“新题”一塌糊涂……像不像那条最弯的线？',
      explain: '在训练数据上完美、在新数据上很差，是过拟合的典型症状。'
    },

    mount(stage, api) {
      const { train, test } = makeData();
      const models = [], trainErr = [], testErr = [];
      for (let d = 0; d <= 11; d++) {
        models[d] = fit(train, d);
        trainErr[d] = mse(models[d], train);
        testErr[d] = mse(models[d], test);
      }
      const bestTest = Math.min(...testErr);
      const isGood = (d) => testErr[d] <= bestTest * 1.2;

      api.missions([
        '把线调得<b>最直</b>（弯曲度 0 或 1），看看会怎样',
        '把线调得<b>最弯</b>（弯曲度 10 以上），看看会怎样',
        '找到让<b>新数据误差</b>最小的弯曲度，点“就选它了！”'
      ]);

      const cv = G.makeCanvas(640, 360);
      const W = 640, H = 360, YR = 2.2;
      const px = (x) => 30 + ((x + 1.05) / 2.1) * (W - 60);
      const py = (y) => H / 2 - (y / YR) * (H / 2 - 18);

      const slider = G.slider({
        label: '〰️ 弯曲度：', min: 0, max: 11, step: 1, value: 2,
        format: (v) => v + (v === 0 ? '（一条平线）' : v === 1 ? '（直线）' : v >= 9 ? '（超级弯）' : ''),
        onInput: (v) => update(v)
      });
      const pickBtn = h('button', { class: 'btn btn-big btn-yellow', onclick: pick }, '👍 就选它了！');
      const barTrain = bar('#ffa94d'), barTest = bar('#b197fc');
      const verdict = h('div', { class: 'stat', style: { minWidth: '220px' } }, '');

      function bar(color) {
        const fill = h('div', { class: 'bar-fill', style: { background: color } });
        const val = h('span', {}, '');
        return { fill, val, el: h('div', { class: 'bar-track' }, fill) };
      }

      stage.append(cv.el,
        h('div', { class: 'panel' },
          h('div', { class: 'bars' },
            h('div', { class: 'bar-row' }, h('span', { class: 'bl' }, '🟠 练习误差'), barTrain.el, barTrain.val),
            h('div', { class: 'bar-row' }, h('span', { class: 'bl' }, '☆ 新数据误差'), barTest.el, barTest.val))),
        h('div', { class: 'stat-row' }, verdict),
        h('div', { class: 'controls' }, slider.el, pickBtn));

      function draw(d) {
        const ctx = cv.ctx;
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
        // 网格
        ctx.strokeStyle = '#e7f5ff'; ctx.lineWidth = 1;
        for (let gx = 0; gx < W; gx += 32) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
        for (let gy = 0; gy < H; gy += 32) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
        // 拟合曲线
        const m = models[d];
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
        ctx.strokeStyle = '#1c7ed6'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
        ctx.beginPath();
        let first = true;
        for (let sx = 20; sx <= W - 20; sx += 2) {
          const x = -1.05 + ((sx - 30) / (W - 60)) * 2.1;
          const y = G.clamp(m(x), -20, 20);
          first ? ctx.moveTo(sx, py(y)) : ctx.lineTo(sx, py(y));
          first = false;
        }
        ctx.stroke();
        ctx.restore();
        // 新数据（星星）
        test.forEach((p) => star(ctx, px(p.x), py(p.y), 9, '#b197fc'));
        // 练习数据
        train.forEach((p) => {
          ctx.fillStyle = '#ffa94d'; ctx.strokeStyle = '#3b3355'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(px(p.x), py(p.y), 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        });
        // 图例
        ctx.font = '14px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#3b3355';
        ctx.fillText('🟠 练习数据（波波看得到）   ☆ 新数据（波波看不到）', 14, H - 12);
      }
      function star(ctx, x, y, r, color) {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
          ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fillStyle = '#fff'; ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
      }

      const fmtErr = (e) => (e > 9.99 ? '超大!' : e.toFixed(2));
      const scale = (e) => Math.min(100, (e / 1.2) * 100) + '%';

      let lastMood = '';
      function update(d, initial) {
        draw(d);
        barTrain.fill.style.width = scale(trainErr[d]); barTrain.val.textContent = fmtErr(trainErr[d]);
        barTest.fill.style.width = scale(testErr[d]); barTest.val.textContent = fmtErr(testErr[d]);
        let text, mood;
        if (d <= 1) {
          text = '😕 太直了，抓不住规律'; mood = 'under';
          if (!initial && api.check(0)) api.say('线太直了！它连橙色点的弯弯规律都没抓住，<b>两个误差都很大</b>。', 'sad');
        } else if (d >= 9) {
          text = '🤪 太弯了，连噪声都背下来了'; mood = 'over';
          if (!initial && d >= 10 && api.check(1)) api.say('哇，线穿过了几乎每一个橙色点，练习误差几乎是 0！可是……看看紫色星星，<b>新数据误差</b>爆表了！', 'wow');
        } else if (isGood(d)) {
          text = '😊 看起来刚刚好'; mood = 'good';
        } else {
          text = '🤔 还可以更好'; mood = 'mid';
        }
        verdict.textContent = text;
        verdict.className = 'stat ' + (mood === 'good' ? 'good' : mood === 'mid' ? '' : 'bad');
        if (mood !== lastMood) api.sfx('pop');
        lastMood = mood;
      }

      function pick() {
        const d = slider.value;
        if (!api.checked(0) || !api.checked(1)) {
          api.say('先完成前两个实验：把线调到<b>最直</b>和<b>最弯</b>看一看，再来挑选！', 'think');
          api.sfx('bad');
          return;
        }
        if (isGood(d)) {
          api.check(2);
          api.win();
        } else if (trainErr[d] < 0.03) {
          api.sfx('bad');
          api.say('练习误差是很小，可是新数据误差很大呀——这条线在<b>死记</b>练习题。', 'sad');
        } else {
          api.sfx('bad');
          api.say('紫色星星的误差还能更小，再找找～ 盯住<b>“新数据误差”</b>那根紫色的条！', 'think');
        }
      }

      update(2, true);
    }
  });
})();
