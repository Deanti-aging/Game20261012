# 🤖 训练你的小机器人 · 机器学习大冒险

一个面向普通人（包括孩子）的 HTML5 学习小游戏：**先动手玩，再揭晓名字**。
玩家扮演“训练师”，每一关教小机器人「波波」一项新本领，通关后才揭晓：“你刚才做的事情，叫——梯度下降！”

纯 HTML / CSS / JavaScript，无需任何构建工具、无外部依赖（可爱字体加载失败时会自动使用系统字体）。

**中英双语**：默认英文，标题页和地图右上角的 🌐 按钮可以切换中文 / English（选择会保存在浏览器里）。也可以用 URL 直接指定：`index.html?lang=zh` 或 `?lang=en`。

## 关卡一览

| # | 关卡 | 玩法 | 解锁术语 |
|---|------|------|----------|
| 1 | 水果还是动物？ | 给图片贴标签，机器人照着学，再考新图片 | 标签、监督学习 |
| 2 | 猫猫狗狗分不清 | 只能挑 2–3 条线索区分猫狗 | 特征 |
| 3 | 小球下山谷 | 看坡度箭头，手动把小球挪到谷底 | 损失、梯度下降 |
| 4 | 步子迈多大？ | 调步长：太大乱晃/飞出，太小像蜗牛 | 学习率 |
| 5 | 弯弯曲线描点点 | 调曲线弯曲度去拟合散点 | 欠拟合、过拟合 |
| 6 | 刷题与期末考 | 出考卷，揭穿只会背答案的机器人 | 训练集、测试集 |
| 7 | 信号水管网 | 调连线粗细，让信号流向正确答案 | 神经网络、权重 |
| 8 | 小鸡找队长 | 拖动队长，看小鸡自动归队（会卡住！） | 聚类、K 均值 |
| 9 | 垃圾邮件守门员 | 调拦截严格度，体会误杀与漏网的取舍 | 准确率、精确率、召回率 |
| 10 | 波波学坏了！ | 找出贴错标签的数据，补上缺少的样本 | 垃圾进垃圾出、数据偏差 |
| 11 | 迷宫里的蛋糕 | 设定奖励规则，看机器人试错学会走迷宫（Q-learning） | 强化学习、奖励 |
| 12 | 下一个词猜猜猜 | 猜下一个词 + 调“大胆程度”写故事 | 大语言模型、Token、温度 |

每关：开场故事 → 动手玩（带任务清单、即时反馈、允许失败） → 揭晓术语 → 解锁术语卡 → 换个新场景的小测验。
术语卡含“人话解释 + 生活比喻”，公式放在可折叠的“想深入了解”区。全部通关可领取毕业证书。

## 发布前必改：打赏链接

编辑 [js/config.js](js/config.js)：

```js
paypalUrl: 'https://paypal.me/你的PayPal名',
afdianUrl: 'https://afdian.com/a/你的爱发电ID',
author: '你的署名',
```

## 发布到 itch.io

1. 打包（Windows PowerShell，在项目根目录）：
   ```powershell
   powershell -ExecutionPolicy Bypass -File tools/build-itch.ps1
   ```
   生成 `dist/ml-robot-trainer.zip`（约 75 KB，`index.html` 在 zip 根目录）。
2. itch.io → **Create new project**
   - Kind of project：**HTML**
   - Uploads：上传上面的 zip，勾选 **This file will be played in the browser**
   - Embed options：建议 **Viewport 1000 × 720**，勾选 **Mobile friendly**、**Fullscreen button**、**Enable scrollbars**
3. 建议同时在 itch.io 的 **Payments** 里设为 “No payments” 或 “Donations”，游戏内已有 PayPal / 爱发电按钮。
4. 标签建议：`educational`, `machine-learning`, `ai`, `kids`, `learning`, `english`, `chinese`

> 游戏内打赏链接会以新窗口打开（`target="_blank"`），在 itch.io 的 iframe 里也能正常跳转。

## 本地运行 / 开发

直接双击 `index.html` 即可在浏览器里玩。

- `index.html?level=5`：直接进入第 5 关（调试用）
- 进度保存在浏览器 `localStorage`；“关于”里可以清空进度
- `tools/test.html`：自动化测试，会逐关模拟操作并检查能否通关
- `tools/shot.html?level=N`、`tools/mobile.html?q=level=N`：截图 / 手机宽度预览

### 结构

```
index.html
css/style.css          卡通风格样式
js/config.js           打赏链接等配置
js/engine.js           引擎：屏幕、存档、音效、机器人、揭晓、术语卡、测验、打赏、证书
js/cards.js            24 张术语卡内容
js/levels/NN-*.js      每关一个文件，调用 G.registerLevel({...})
tools/                 打包脚本与测试页（不会打进 zip）
```

新增关卡：在 `js/levels/` 新建文件，调用 `G.registerLevel({ id, icon, title, skill, terms, story, reveal, quiz, mount(stage, api) })`，并在 `index.html` 引入。`api` 提供 `say / missions / check / win / wait / after / onCleanup` 等方法。

### 双语文字

所有玩家能看到的文字都写成 `tr('中文', 'English')`（`const tr = G.t;`），按当前语言二选一。关卡和术语卡的数据在脚本加载时就确定了，所以切换语言会保存设置并刷新页面（`G.setLang`）。第 12 关的句子和候选词中英文各有一套，不是逐字翻译。

`tools/test.html` 按中文按钮文字查找元素，所以默认以中文界面运行。

## 许可

MIT，见 [LICENSE](LICENSE)。
