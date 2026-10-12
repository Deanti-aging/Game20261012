/* 第 9 关：准确率、精确率、召回率 —— 垃圾邮件过滤器的取舍 */
(function () {
  const { h } = G;
  // score = 机器人给出的“可疑度”；spam = 真实身份
  const MAILS = [
    { s: 95, spam: true, t: '恭喜您中奖 100 万元！！！点击领取' },
    { s: 88, spam: true, t: '免费领取最新手机，仅限今天' },
    { s: 80, spam: true, t: '您的账户异常，请立即输入密码' },
    { s: 76, spam: false, t: '班主任：恭喜你抽中了班级小礼物 🎁' },
    { s: 72, spam: true, t: '低价代办各种证件，速联系' },
    { s: 66, spam: true, t: '神奇减肥药，7 天瘦 20 斤' },
    { s: 62, spam: true, t: '限时秒杀！全场 1 折！！' },
    { s: 52, spam: false, t: '商店：您的会员积分即将过期' },
    { s: 48, spam: false, t: '银行：您本月的账单已出' },
    { s: 42, spam: true, t: '朋友推荐你一个躺着赚钱的项目' },
    { s: 35, spam: false, t: '快递：您的包裹已到驿站' },
    { s: 28, spam: true, t: '你好，好久不见，帮我个小忙？' },
    { s: 20, spam: false, t: '好友：周六来我家开生日派对 🎉' },
    { s: 15, spam: false, t: '公司：会议改到下午 3 点' },
    { s: 10, spam: false, t: '老师：明天春游记得带水' },
    { s: 5, spam: false, t: '妈妈：今晚吃饺子 🥟' }
  ];
  const TOTAL_SPAM = MAILS.filter((m) => m.spam).length;

  G.registerLevel({
    id: 'spam',
    icon: '📮',
    title: '垃圾邮件守门员',
    skill: '拦垃圾邮件，又不误伤好邮件',
    minutes: 5,
    terms: ['accuracy', 'precision', 'recall'],
    story: '波波当上了邮箱守门员！它给每封邮件打了一个“可疑度”分数。<br>你来调<b>“拦截严格度”</b>：越严格，拦下的邮件越多。可是……拦太严会<b>误杀好邮件</b>，拦太松会<b>漏掉垃圾邮件</b>。来体验一下吧！',
    hello: '拖动<b>拦截严格度</b>，看看邮件怎么在收件箱和垃圾箱之间跑来跑去。😊 是好邮件，👾 是垃圾邮件。',
    winLine: '三个实验都完成！原来“拦得准”和“抓得全”很难同时做到！',
    reveal: '<p>你看到的三个数字，各有名字：</p><ul><li>✅ 16 封里判对了多少：<b>「准确率」</b></li><li>🎯 拦下来的邮件里，真垃圾占多少（拦得准不准）：<b>「精确率」</b></li><li>🕸️ 所有垃圾邮件里，抓到了多少（抓得全不全）：<b>「召回率」</b></li></ul><p>你亲身体会到了：调得很松，精确率 100% 但漏掉一堆垃圾；调得很严，召回率 100% 但冤枉了好邮件。<b>精确率和召回率常常此消彼长</b>，要根据实际需要找平衡点。</p>',
    quiz: {
      q: '医院用 AI 筛查一种严重的疾病。<b>漏掉一个真正的病人</b>后果非常严重，而多让几个健康的人去复查问题不大。应该优先保证哪个指标高？',
      options: ['召回率：真病人尽量一个都不漏', '精确率：被判为生病的人一定真的生病', '都不重要', '只看准确率就够了'],
      answer: 0,
      hint: '“一个都不漏”对应的是“抓得全不全”。',
      explain: '漏诊代价高时，要优先提高召回率（抓得全），宁可多一些误报，让医生再复查。'
    },

    mount(stage, api) {
      api.missions([
        '调得<b>很宽松</b>：一封好邮件都不误杀（但至少拦下 1 封垃圾）',
        '调得<b>很严格</b>：一封垃圾邮件都不放过',
        '找到<b>最佳平衡点</b>：16 封里至少判对 13 封'
      ]);

      const inbox = h('div', {}), trash = h('div', {});
      const inCount = h('span', {}), trCount = h('span', {});
      const statAcc = h('b', {}), statP = h('b', {}), statR = h('b', {});
      const subAcc = h('div', { class: 'small' }), subP = h('div', { class: 'small' }), subR = h('div', { class: 'small' });
      const boxAcc = h('div', { class: 'stat' }, '✅ 判对了', statAcc, subAcc);
      const boxP = h('div', { class: 'stat' }, '🎯 拦得准不准', statP, subP);
      const boxR = h('div', { class: 'stat' }, '🕸️ 抓得全不全', statR, subR);
      const slider = G.slider({
        label: '🚧 拦截严格度：', min: 0, max: 100, step: 1, value: 30,
        format: (v) => `${v}（可疑度 ≥ ${100 - v} 就拦下）`,
        onInput: () => render(),
        onChange: () => judge()
      });
      slider.el.style.maxWidth = '560px';

      stage.append(
        h('div', { class: 'controls' }, slider.el),
        h('div', { class: 'stat-row' }, boxAcc, boxP, boxR),
        h('div', { class: 'mail-cols' },
          h('div', { class: 'mail-col' }, h('h3', {}, '📥 收件箱 ', inCount), inbox),
          h('div', { class: 'mail-col trash' }, h('h3', {}, '🗑️ 垃圾箱 ', trCount), trash)));

      function calc() {
        const T = 100 - slider.value;
        let tp = 0, fp = 0, fn = 0, tn = 0;
        MAILS.forEach((m) => {
          const blocked = m.s >= T;
          if (blocked && m.spam) tp++; else if (blocked) fp++; else if (m.spam) fn++; else tn++;
        });
        return { T, tp, fp, fn, tn };
      }

      function mailEl(m, blocked) {
        const badPlace = blocked !== m.spam;
        return h('div', { class: 'mail' + (badPlace ? ' bad-place' : '') },
          h('span', { class: 'who' }, m.spam ? '👾' : '😊'),
          h('span', { class: 'subj' }, m.t),
          badPlace && h('span', { class: 'flag' }, blocked ? '误杀!' : '漏网!'),
          h('span', { class: 'sc' }, '可疑 ' + m.s));
      }

      let lastKey = '';
      function render() {
        const { T, tp, fp, fn, tn } = calc();
        const key = `${tp},${fp}`;
        if (key !== lastKey) { api.sfx('pop'); lastKey = key; }
        inbox.innerHTML = ''; trash.innerHTML = '';
        MAILS.forEach((m) => (m.s >= T ? trash : inbox).append(mailEl(m, m.s >= T)));
        inCount.textContent = `(${fn + tn})`;
        trCount.textContent = `(${tp + fp})`;
        const acc = tp + tn;
        statAcc.textContent = `${acc} / 16`;
        subAcc.textContent = `${Math.round((acc / 16) * 100)}%`;
        statP.textContent = tp + fp ? Math.round((tp / (tp + fp)) * 100) + '%' : '—';
        subP.textContent = tp + fp ? `拦下 ${tp + fp} 封，真垃圾 ${tp} 封` : '一封都没拦';
        statR.textContent = Math.round((tp / TOTAL_SPAM) * 100) + '%';
        subR.textContent = `${TOTAL_SPAM} 封垃圾，抓到 ${tp} 封`;
        boxAcc.className = 'stat ' + (acc >= 13 ? 'good' : '');
        boxP.className = 'stat ' + (tp + fp && fp === 0 ? 'good' : fp >= 3 ? 'bad' : '');
        boxR.className = 'stat ' + (fn === 0 ? 'good' : fn >= 4 ? 'bad' : '');
      }

      function judge() {
        const { tp, fp, fn, tn } = calc();
        const acc = tp + tn;
        let said = false;
        if (fp === 0 && tp >= 1 && api.check(0)) {
          api.say(`好邮件一封都没被误杀，<b>拦得很准</b>！可是……看看收件箱，还有 ${fn} 封垃圾<b>漏网了</b> 👾`, 'think'); said = true;
        }
        if (fn === 0 && api.check(1)) {
          api.say(`垃圾邮件一封不漏，<b>抓得很全</b>！可是垃圾箱里冤枉了 ${fp} 封好邮件，连妈妈的饺子邮件都${fp >= 8 ? '被拦了' : '差点被拦'} 😱`, 'wow'); said = true;
        }
        if (acc >= 13 && api.checked(0) && api.checked(1) && api.check(2)) {
          api.win(); return;
        }
        if (acc >= 13 && !(api.checked(0) && api.checked(1))) {
          api.say('这个位置判得挺好！不过先完成前两个实验：调到<b>很松</b>和<b>很严</b>各看一看～', 'happy'); said = true;
        }
        if (!said) {
          if (fp > 0 && fn > 0) api.say(`现在有 ${fp} 封好邮件被误杀，${fn} 封垃圾漏网。继续调调看～`, 'think');
          else if (tp + fp === 0) api.say('一封都没拦！这样垃圾邮件全跑进收件箱啦～', 'sad');
        }
      }

      render();
    }
  });
})();
