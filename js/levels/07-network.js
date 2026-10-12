/* 第 7 关：神经网络 & 权重 —— 调连线的粗细，让信号流向正确答案 */
(function () {
  const { h } = G;
  const NS = 'http://www.w3.org/2000/svg';
  const INPUTS = [
    { e: '🪽', name: '有翅膀', color: '#ff8cc6' },
    { e: '🌊', name: '会游泳', color: '#4dabf7' },
    { e: '🦵', name: '四条腿', color: '#fab005' }
  ];
  const OUTPUTS = [
    { e: '🐦', name: '鸟' },
    { e: '🐟', name: '鱼' },
    { e: '🐶', name: '走兽' }
  ];
  const ANIMALS = [
    { e: '🐦', name: '麻雀', x: [1, 0, 0], ans: 0 },
    { e: '🐠', name: '金鱼', x: [0, 1, 0], ans: 1 },
    { e: '🐕', name: '小狗', x: [0, 0, 1], ans: 2 },
    { e: '🦆', name: '鸭子', x: [1, 1, 0], ans: 0 },
    { e: '🦛', name: '河马', x: [0, 1, 1], ans: 2 }
  ];
  const IY = [70, 165, 260], OY = [70, 165, 260], IX = 92, OX = 508;

  function svgEl(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  G.registerLevel({
    id: 'network',
    icon: '🕸️',
    title: '信号水管网',
    skill: '把线索导向正确答案',
    minutes: 5,
    terms: ['nn', 'weight'],
    story: '波波的大脑里有一张<b>水管网</b>：左边是三条线索，右边是三个答案。信号顺着管子流过去，<b>哪个答案收到的信号最多</b>，波波就选哪个。<br>每根管子的粗细都能调。你来调一调，让 5 种动物都被认对！',
    hello: '点一根<b>连线</b>选中它，再拖下面的滑块调粗细。上面的动物按钮可以切换要测试的动物。',
    winLine: '5 种动物全认对了！信号流得刚刚好！',
    reveal: '<p>这张由“节点”和“连线”组成、让信号从输入流向输出的网，就是一个（迷你的）<b>「神经网络」</b>。</p><p>每根连线的粗细，叫<b>「权重」</b>——它就像音量旋钮，决定一条线索对某个答案的影响有多大。</p><p>鸭子和河马是难点：它们同时有两条线索，你得让<b>重要的线索更响</b>（比如“有翅膀→鸟”要比“会游泳→鱼”更粗）。真实的神经网络有几百万甚至上万亿根这样的“连线”，它们不是人手调的，而是用第 3 关的<b>梯度下降</b>自动调出来的！</p>',
    quiz: {
      q: '在刚才的网络里，如果把“有翅膀 → 鸟”这根线的权重调成 0，会发生什么？',
      options: ['有没有翅膀，都不再影响“鸟”这个答案', '整个网络立刻坏掉', '所有动物都会被认成鸟', '翅膀会变得更重要'],
      answer: 0,
      hint: '权重像音量旋钮，调到 0 就是……',
      explain: '权重为 0，就像把音量关掉：这条线索的信号传不到“鸟”那里了。'
    },

    mount(stage, api) {
      // 初始权重：故意有点乱
      const w = [[0.3, 0.5, 0.4], [0.4, 0.3, 0.5], [0.5, 0.4, 0.3]];
      let sel = null, cur = 0, touched = false;

      api.missions([
        '点一根连线，调一调它的粗细（权重）',
        '让 5 种动物<b>全部</b>被认对'
      ]);

      const svg = svgEl('svg', { viewBox: '-8 0 628 330', class: 'net-svg', role: 'img', 'aria-label': '神经网络连线图' });
      const gWires = svgEl('g', {}), gFlow = svgEl('g', {}), gHits = svgEl('g', {}), gNodes = svgEl('g', {});
      svg.append(gWires, gFlow, gHits, gNodes);

      const wires = [], flows = [];
      for (let i = 0; i < 3; i++) {
        wires[i] = []; flows[i] = [];
        for (let j = 0; j < 3; j++) {
          const d = `M${IX + 36} ${IY[i]} C ${300} ${IY[i]}, ${300} ${OY[j]}, ${OX - 36} ${OY[j]}`;
          wires[i][j] = svgEl('path', { d, fill: 'none', stroke: INPUTS[i].color, 'stroke-linecap': 'round' });
          flows[i][j] = svgEl('path', { d, fill: 'none', stroke: '#fff', 'stroke-linecap': 'round', class: 'flow' });
          const hit = svgEl('path', { d, fill: 'none', class: 'hit' });
          hit.addEventListener('click', () => select(i, j));
          gWires.append(wires[i][j]); gFlow.append(flows[i][j]); gHits.append(hit);
        }
      }
      // 节点
      const inNodes = INPUTS.map((inp, i) => {
        const g = svgEl('g', {});
        const c = svgEl('circle', { cx: IX, cy: IY[i], r: 34, fill: '#fff', stroke: '#3b3355', 'stroke-width': 4 });
        const t = svgEl('text', { x: IX, y: IY[i] + 2, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': 30 });
        t.textContent = inp.e;
        const l = svgEl('text', { x: IX - 44, y: IY[i] + 6, 'text-anchor': 'end', 'font-size': 16, fill: '#3b3355' });
        l.textContent = inp.name;
        g.append(c, t, l); gNodes.append(g);
        return c;
      });
      const outNodes = OUTPUTS.map((o, j) => {
        const g = svgEl('g', {});
        const c = svgEl('circle', { cx: OX, cy: OY[j], r: 34, fill: '#fff', stroke: '#3b3355', 'stroke-width': 4 });
        const t = svgEl('text', { x: OX, y: OY[j] + 2, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': 30 });
        t.textContent = o.e;
        const l = svgEl('text', { x: OX + 44, y: OY[j] - 6, 'font-size': 16, fill: '#3b3355' });
        l.textContent = o.name;
        const s = svgEl('text', { x: OX + 44, y: OY[j] + 16, 'font-size': 15, fill: '#6a6285' });
        const crown = svgEl('text', { x: OX, y: OY[j] - 40, 'text-anchor': 'middle', 'font-size': 24 });
        g.append(c, t, l, s, crown); gNodes.append(g);
        return { c, s, crown };
      });

      // 动物切换按钮
      const tabs = ANIMALS.map((a, k) => {
        const b = h('button', { class: 'animal-tab', onclick: () => { cur = k; api.sfx('pop'); render(); } });
        return b;
      });
      const sliderBox = h('div', { class: 'controls' });
      const wSlider = G.slider({
        label: '🎚️ 先点一根连线', min: 0, max: 1, step: 0.05, value: 0, format: (v) => Math.round(v * 100),
        onInput: (v) => {
          if (!sel) return;
          w[sel[0]][sel[1]] = v;
          if (!touched) { touched = true; api.check(0); }
          render();
        },
        onChange: () => evaluate()
      });
      wSlider.input.disabled = true;
      const selLabel = wSlider.el.querySelector('.slider-label');
      sliderBox.append(wSlider.el);

      stage.append(
        h('div', { class: 'animal-tabs' }, tabs),
        svg,
        sliderBox,
        h('p', { class: 'hint-line' }, '💡 管子越粗 = 权重越大 = 这条线索对这个答案越“响”'));

      function scores(x) {
        return [0, 1, 2].map((j) => x.reduce((s, xi, i) => s + xi * w[i][j], 0));
      }
      function predict(x) {
        const s = scores(x);
        const max = Math.max(...s);
        const winners = s.map((v, j) => (Math.abs(v - max) < 1e-6 ? j : -1)).filter((j) => j >= 0);
        return { s, pick: winners.length === 1 ? winners[0] : -1 };
      }

      function select(i, j) {
        sel = [i, j];
        api.sfx('click');
        wSlider.input.disabled = false;
        wSlider.set(w[i][j]);
        selLabel.firstChild.textContent = `🎚️ ${INPUTS[i].e}${INPUTS[i].name} → ${OUTPUTS[j].e}${OUTPUTS[j].name} 的粗细：`;
        render();
      }

      function render() {
        const a = ANIMALS[cur];
        const { s, pick } = predict(a.x);
        for (let i = 0; i < 3; i++) {
          inNodes[i].setAttribute('fill', a.x[i] ? INPUTS[i].color : '#f1f3f5');
          inNodes[i].setAttribute('opacity', a.x[i] ? 1 : 0.6);
          for (let j = 0; j < 3; j++) {
            const isSel = sel && sel[0] === i && sel[1] === j;
            wires[i][j].setAttribute('stroke-width', 2 + w[i][j] * 16);
            wires[i][j].setAttribute('opacity', a.x[i] ? 0.95 : 0.25);
            wires[i][j].setAttribute('stroke', isSel ? '#3b3355' : INPUTS[i].color);
            flows[i][j].setAttribute('stroke-width', Math.max(0, w[i][j] * 6));
            flows[i][j].style.display = a.x[i] && w[i][j] > 0.02 ? '' : 'none';
          }
        }
        const max = Math.max(...s, 0.001);
        outNodes.forEach((o, j) => {
          o.s.textContent = '信号 ' + Math.round(s[j] * 100);
          const lvl = s[j] / max;
          o.c.setAttribute('fill', j === pick ? '#ffd43b' : `rgba(116,192,252,${0.15 + 0.5 * lvl})`);
          o.c.setAttribute('stroke-width', j === pick ? 6 : 4);
          o.crown.textContent = j === pick ? '👑' : '';
        });
        tabs.forEach((b, k) => {
          const an = ANIMALS[k];
          const ok = predict(an.x).pick === an.ans;
          b.className = 'animal-tab' + (k === cur ? ' on' : '') + (ok ? ' ok' : '');
          b.textContent = `${an.e} ${an.name} ${ok ? '✅' : '❌'}`;
        });
      }

      function evaluate() {
        const results = ANIMALS.map((an) => predict(an.x).pick === an.ans);
        const n = results.filter(Boolean).length;
        if (n === ANIMALS.length) { api.check(1); api.win(); return; }
        const a = ANIMALS[cur];
        const p = predict(a.x);
        if (p.pick === -1) api.say(`${a.e}${a.name}：两个答案收到的信号<b>一样多</b>，我拿不准！让其中一根管子再粗一点？（${n}/5 正确）`, 'think');
        else if (p.pick !== a.ans) api.say(`${a.e}${a.name}：信号最多的是 ${OUTPUTS[p.pick].e}${OUTPUTS[p.pick].name}，不对呀……（${n}/5 正确）`, 'sad');
        else {
          const bad = ANIMALS.find((an) => predict(an.x).pick !== an.ans);
          api.say(`${a.e}${a.name} 认对了！不过 ${bad.e}${bad.name} 还错着，点它看看～（${n}/5 正确）`, 'happy');
        }
      }

      render();
    }
  });
})();
