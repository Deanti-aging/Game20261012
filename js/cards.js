/* ===================================================================
 *  术语卡：人话解释 + 生活比喻 + 深入了解（公式放在折叠区）
 *  每段文字都是 tr('中文', 'English')
 * =================================================================== */
(function () {
  const tr = G.t;
  G.registerCards([
    {
      id: 'label', name: tr('标签', 'Label'), en: 'Label', emoji: '🏷️', color: 'yellow',
      plain: tr('给每个例子写上的“正确答案”。比如这张图是“水果”，那张是“动物”。', 'The “right answer” written on each example. This picture is a “fruit”, that one is an “animal”.'),
      metaphor: tr('就像给抽屉贴小纸条：“袜子”“T恤”，别人一看就知道里面装的是什么。', 'Like sticky notes on drawers — “socks”, “T-shirts” — so anyone can tell what’s inside at a glance.'),
      deep: tr(
        '<p>训练数据通常写成一对一对的 <code>(x, y)</code>：<code>x</code> 是输入（比如一张图片），<code>y</code> 就是标签（比如“水果”）。</p><p>标签大多由人来标注，又贵又慢；而且<b>标签一旦贴错，模型就会学错</b>——你在第 10 关会亲眼看到。</p>',
        '<p>Training data is usually written as pairs <code>(x, y)</code>: <code>x</code> is the input (say, a picture) and <code>y</code> is the label (say, “fruit”).</p><p>Labels are mostly added by people, which is slow and expensive. And <b>if a label is wrong, the model learns the wrong thing</b> — you’ll see this for yourself in Level 10.</p>')
    },
    {
      id: 'supervised', name: tr('监督学习', 'Supervised Learning'), en: 'Supervised Learning', emoji: '👩‍🏫', color: 'yellow',
      plain: tr('先给机器看很多“题目 + 答案”，让它自己总结规律，以后遇到新题也会答。', 'Show the machine lots of “questions + answers” so it can figure out the pattern and answer new questions later.'),
      metaphor: tr('像老师拿着答案批改练习册，学生做多了，就慢慢学会了解题方法。', 'Like a teacher marking homework with an answer key — after enough practice, the student learns how to solve the problems.'),
      deep: tr(
        '<p>目标是学到一个函数 <code>f</code>，让 <code>f(x) ≈ y</code>。</p><ul><li><b>分类</b>：输出一个类别（猫/狗、垃圾/正常邮件）</li><li><b>回归</b>：输出一个数字（房价、明天气温）</li></ul><p>与之相对的是<b>无监督学习</b>（没有答案，第 8 关）和<b>强化学习</b>（只有奖励，第 11 关）。</p>',
        '<p>The goal is to learn a function <code>f</code> so that <code>f(x) ≈ y</code>.</p><ul><li><b>Classification</b>: output a category (cat/dog, spam/not spam)</li><li><b>Regression</b>: output a number (house price, tomorrow’s temperature)</li></ul><p>Compare with <b>unsupervised learning</b> (no answers, Level 8) and <b>reinforcement learning</b> (only rewards, Level 11).</p>')
    },
    {
      id: 'feature', name: tr('特征', 'Feature'), en: 'Feature', emoji: '🔍', color: 'pink',
      plain: tr('机器用来做判断的线索，比如“耳朵是尖的还是垂的”“鼻子长不长”。', 'A clue the machine uses to decide — like “are the ears pointy or floppy?” or “is the snout long?”'),
      metaphor: tr('玩猜谜时的提示：“它会飞”比“它是彩色的”有用多了。', 'Hints in a guessing game: “it can fly” is far more useful than “it’s colorful”.'),
      deep: tr(
        '<p>每个样本会被表示成一串数字，叫<b>特征向量</b>：<code>x = (x₁, x₂, …, xₙ)</code>。</p><p>好的特征和要预测的东西关系密切；无关的特征只会带来干扰（你在第 2 关加入“毛色”时可能已经发现了）。挑选和设计特征的过程叫<b>特征工程</b>。深度学习的一大优势是能从原始数据中自动学出特征。</p>',
        '<p>Each example is turned into a list of numbers called a <b>feature vector</b>: <code>x = (x₁, x₂, …, xₙ)</code>.</p><p>Good features are closely related to what you want to predict; irrelevant ones just add noise (you may have noticed this when you picked “fur color” in Level 2). Choosing and designing features is called <b>feature engineering</b>. A big strength of deep learning is that it can learn features from raw data by itself.</p>')
    },
    {
      id: 'loss', name: tr('损失', 'Loss'), en: 'Loss', emoji: '📉', color: 'mint',
      plain: tr('一个分数，衡量机器的答案错得有多离谱。越小越好。也常叫“误差”。', 'A score for how wrong the machine’s answers are. Smaller is better. Often called “error”.'),
      metaphor: tr('投篮时球离篮筐的距离——偏得越远，“损失”越大。', 'How far your basketball shot lands from the hoop — the bigger the miss, the bigger the “loss”.'),
      deep: tr(
        '<p>计算损失的公式叫<b>损失函数</b>。最常见的是均方误差：</p><p class="formula">MSE = (1/n) · Σ (预测ᵢ − 真实ᵢ)²</p><p>分类问题常用<b>交叉熵</b>。“训练模型”本质上就是：找到一组参数，让损失尽可能小。第 3 关里山谷的高度，就是损失。</p>',
        '<p>The formula that computes it is the <b>loss function</b>. The most common one is mean squared error:</p><p class="formula">MSE = (1/n) · Σ (predictedᵢ − actualᵢ)²</p><p>Classification usually uses <b>cross-entropy</b>. “Training a model” really means finding the parameters that make the loss as small as possible. The height of the valley in Level 3 is the loss.</p>')
    },
    {
      id: 'gd', name: tr('梯度下降', 'Gradient Descent'), en: 'Gradient Descent', emoji: '⛷️', color: 'mint',
      plain: tr('看看脚下哪边是下坡，就往那边走一步；不断重复，直到走到谷底（损失最小）。', 'Feel which way is downhill, take a step that way, and repeat until you reach the bottom (lowest loss).'),
      metaphor: tr('蒙着眼睛下山：用脚感受坡往哪边低，一步一步往低处挪。', 'Walking down a hill blindfolded: feel with your feet which way slopes down, and shuffle that way step by step.'),
      deep: tr(
        '<p>每一步按下面的规则更新参数 θ：</p><p class="formula">θ ← θ − η · ∂L/∂θ</p><p><code>∂L/∂θ</code> 就是<b>梯度</b>，表示“往哪个方向损失增加最快”，所以要<b>减去</b>它，才是下坡。<code>η</code> 是学习率（第 4 关）。</p><p>真实模型有成千上万个参数，相当于在一个超高维度的“山谷”里下山；神经网络用<b>反向传播</b>来高效地算出梯度。</p>',
        '<p>Each step updates the parameter θ with this rule:</p><p class="formula">θ ← θ − η · ∂L/∂θ</p><p><code>∂L/∂θ</code> is the <b>gradient</b> — the direction in which the loss grows fastest — so we <b>subtract</b> it to go downhill. <code>η</code> is the learning rate (Level 4).</p><p>Real models have thousands to billions of parameters, so it’s like walking down a valley with a huge number of dimensions. Neural networks use <b>backpropagation</b> to compute the gradient efficiently.</p>')
    },
    {
      id: 'lr', name: tr('学习率', 'Learning Rate'), en: 'Learning Rate', emoji: '👟', color: 'mint',
      plain: tr('每一步迈多大。太大会来回乱跳、甚至越跳越远；太小要走很久很久。', 'How big each step is. Too big and you bounce around or even fly off; too small and it takes forever.'),
      metaphor: tr('调洗澡水温度：拧得太猛一会儿烫一会儿冰，拧得太慢半天都不热。', 'Adjusting shower temperature: crank the knob too hard and it flips between scalding and freezing; turn it too gently and it never warms up.'),
      deep: tr(
        '<p>就是梯度下降公式 <code>θ ← θ − η · ∂L/∂θ</code> 里的 <code>η</code>（读作 eta）。</p><ul><li>η 太大：在谷底两边来回<b>震荡</b>，严重时<b>发散</b>（飞出山谷）</li><li>η 太小：收敛极慢，还可能卡在半路</li></ul><p>实践中常试 0.1、0.01、0.001；也常让学习率随训练逐渐变小（<b>学习率衰减</b>），或使用 Adam 等能自动调节步长的优化器。学习率是最重要的<b>超参数</b>之一——“超参数”就是人在训练前手动设定的参数。</p>',
        '<p>It’s the <code>η</code> (eta) in the gradient descent rule <code>θ ← θ − η · ∂L/∂θ</code>.</p><ul><li>η too large: you <b>oscillate</b> back and forth across the bottom, and in bad cases <b>diverge</b> (fly out of the valley)</li><li>η too small: progress is painfully slow, and you may get stuck halfway</li></ul><p>People often try 0.1, 0.01, 0.001; shrink the rate as training goes on (<b>learning-rate decay</b>); or use optimizers like Adam that adjust the step size automatically. The learning rate is one of the most important <b>hyperparameters</b> — settings a person chooses before training starts.</p>')
    },
    {
      id: 'underfit', name: tr('欠拟合', 'Underfitting'), en: 'Underfitting', emoji: '📏', color: 'blue',
      plain: tr('模型太简单，连训练数据里的基本规律都没抓住。', 'The model is too simple to capture even the basic pattern in the training data.'),
      metaphor: tr('拿一把直尺去描一条弯弯曲曲的山路。', 'Trying to trace a winding mountain road with a straight ruler.'),
      deep: tr(
        '<p>表现：<b>训练误差高，测试误差也高</b>。</p><p>对策：换更复杂（更“弯”）的模型、加入更好的特征、训练更久。</p>',
        '<p>Symptom: <b>high training error and high test error</b>.</p><p>Fixes: use a more complex (“bendier”) model, add better features, or train longer.</p>')
    },
    {
      id: 'overfit', name: tr('过拟合', 'Overfitting'), en: 'Overfitting', emoji: '🤪', color: 'blue',
      plain: tr('模型把训练数据连同里面的噪声、巧合都死记硬背下来，换成新数据就不灵了。', 'The model memorizes the training data — noise, coincidences and all — and falls apart on new data.'),
      metaphor: tr('背下了去年试卷的答案，今年题目一换就傻眼。', 'Memorizing last year’s exam answers, then freezing when this year’s questions are different.'),
      deep: tr(
        '<p>表现：<b>训练误差很低，测试误差却很高</b>。</p><p>对策：收集更多数据、用更简单的模型、<b>正则化</b>（惩罚过大的参数）、<b>提前停止</b>、<b>Dropout</b>（训练时随机关掉一些神经元）等。</p><p>第 5 关的“弯曲度”在数学上是多项式的<b>次数</b>：12 个点能被 11 次多项式完美穿过，但那条曲线毫无用处。</p>',
        '<p>Symptom: <b>very low training error but high test error</b>.</p><p>Fixes: collect more data, use a simpler model, <b>regularization</b> (penalize overly large parameters), <b>early stopping</b>, <b>dropout</b> (randomly switch off some neurons during training), and so on.</p><p>The “bendiness” in Level 5 is, mathematically, the <b>degree</b> of a polynomial: a degree-11 polynomial can pass exactly through 12 points, but that curve is useless.</p>')
    },
    {
      id: 'trainset', name: tr('训练集', 'Training Set'), en: 'Training Set', emoji: '📒', color: 'orange',
      plain: tr('给机器“刷题”用的数据，机器从这里学规律。', 'The data the machine practices on and learns patterns from.'),
      metaphor: tr('平时的练习册。', 'Your everyday homework workbook.'),
      deep: tr(
        '<p>常见做法是把全部数据随机分成三份，比如 70% / 15% / 15%：</p><ul><li><b>训练集</b>：用来学习参数</li><li><b>验证集</b>：用来挑模型、调超参数</li><li><b>测试集</b>：最后只用一次，估计真实水平</li></ul><p>数据少时还会用<b>交叉验证</b>：轮流拿不同部分当验证集。</p>',
        '<p>A common approach is to randomly split all the data into three parts, e.g. 70% / 15% / 15%:</p><ul><li><b>Training set</b>: used to learn the parameters</li><li><b>Validation set</b>: used to pick models and tune hyperparameters</li><li><b>Test set</b>: used only once at the end, to estimate real performance</li></ul><p>With little data, people use <b>cross-validation</b>: taking turns using different parts as the validation set.</p>')
    },
    {
      id: 'testset', name: tr('测试集', 'Test Set'), en: 'Test Set', emoji: '📝', color: 'orange',
      plain: tr('训练时从没给机器看过的数据，专门用来检验它是不是真学会了。', 'Data the machine never saw during training, kept aside to check whether it really learned.'),
      metaphor: tr('期末考试——题目必须是没见过的，才能考出真本事。', 'The final exam — the questions have to be new, or it doesn’t prove anything.'),
      deep: tr(
        '<p>测试集必须和训练集<b>严格分开</b>。如果测试题偷偷混进了训练数据，分数就会虚高，这叫<b>数据泄漏</b>（Data Leakage）。</p><p>机器在新数据上的表现能力，叫<b>泛化能力</b>（Generalization）——这才是我们真正关心的。</p>',
        '<p>The test set must be <b>strictly separate</b> from the training set. If test questions sneak into the training data, the score gets inflated — this is called <b>data leakage</b>.</p><p>How well a model does on new data is called <b>generalization</b> — and that’s what we really care about.</p>')
    },
    {
      id: 'nn', name: tr('神经网络', 'Neural Network'), en: 'Neural Network', emoji: '🕸️', color: 'purple',
      plain: tr('由很多小“节点”连成的网。信号从输入流到输出，每条连线都有自己的强弱。', 'A web of little “nodes”. Signals flow from the inputs to the outputs, and every connection has its own strength.'),
      metaphor: tr('一张由水管连起来的网：每根水管粗细不同，最后哪个水桶接的水最多，就选哪个答案。', 'A network of water pipes of different widths: whichever bucket at the end collects the most water is the answer.'),
      deep: tr(
        '<p>每个节点（神经元）做一件简单的事：</p><p class="formula">输出 = σ( w₁x₁ + w₂x₂ + … + b )</p><p><code>w</code> 是权重，<code>b</code> 是偏置，<code>σ</code> 是激活函数（让网络能表达弯曲的规律）。把很多层叠起来，就是<b>深度学习</b>。</p><p>第 7 关你是手动调权重；真实网络有成千上万甚至上万亿个权重，靠<b>反向传播 + 梯度下降</b>自动调。</p>',
        '<p>Each node (neuron) does one simple thing:</p><p class="formula">output = σ( w₁x₁ + w₂x₂ + … + b )</p><p><code>w</code> are the weights, <code>b</code> is the bias, and <code>σ</code> is the activation function (it lets the network express curvy patterns). Stack many layers and you get <b>deep learning</b>.</p><p>In Level 7 you set the weights by hand; real networks have thousands to trillions of weights, tuned automatically by <b>backpropagation + gradient descent</b>.</p>')
    },
    {
      id: 'weight', name: tr('权重', 'Weight'), en: 'Weight', emoji: '🎚️', color: 'purple',
      plain: tr('每条连线的“音量”，决定这条线索对结果的影响有多大。', 'The “volume” of each connection — how much a clue affects the result.'),
      metaphor: tr('调音台上的推子：往上推，这个声音就更响。', 'A slider on a mixing desk: push it up and that sound gets louder.'),
      deep: tr(
        '<p>在 <code>Σ wᵢxᵢ</code> 里，<code>wᵢ</code> 越大，第 i 条线索越重要。权重可以是负数，表示“这条线索出现时，反而<b>不</b>像这个答案”。</p><p>人们常说的模型“参数量”（比如 70 亿参数）主要就是在数权重的个数。“训练”就是把所有权重调到合适的值。</p>',
        '<p>In <code>Σ wᵢxᵢ</code>, the bigger <code>wᵢ</code> is, the more clue i matters. Weights can be negative, meaning “when this clue shows up, it’s <b>less</b> likely to be this answer”.</p><p>When people talk about a model’s “parameter count” (say, 7 billion parameters), they’re mostly counting weights. “Training” means setting all the weights to good values.</p>')
    },
    {
      id: 'cluster', name: tr('聚类', 'Clustering'), en: 'Clustering', emoji: '🫧', color: 'pink',
      plain: tr('不告诉机器答案，让它自己把相似的东西分到一堆。', 'Without giving the machine any answers, let it group similar things together on its own.'),
      metaphor: tr('开学第一天，同学们自然而然按兴趣聚成几个小圈子。', 'On the first day of school, kids naturally form little groups around shared interests.'),
      deep: tr(
        '<p>聚类属于<b>无监督学习</b>：数据没有标签，机器自己找结构。</p><p>应用：给顾客分群、整理相册、发现异常交易、压缩图片颜色……</p>',
        '<p>Clustering is <b>unsupervised learning</b>: the data has no labels, so the machine finds the structure itself.</p><p>Uses: grouping customers, organizing photo albums, spotting unusual transactions, compressing image colors…</p>')
    },
    {
      id: 'kmeans', name: tr('K 均值', 'K-means'), en: 'K-means', emoji: '🚩', color: 'pink',
      plain: tr('先放 K 个“队长”；每个点跟最近的队长；队长再走到自己队伍的正中间；重复几次就分好了。', 'Place K “captains”; every point joins its nearest captain; each captain moves to the middle of its team; repeat a few times and you’re done.'),
      metaphor: tr('几个导游举着小旗：游客找最近的导游，导游再站到自己那群人中间。', 'Tour guides holding up flags: tourists go to the nearest guide, then each guide steps into the middle of their crowd.'),
      deep: tr(
        '<p>反复执行两步，直到队长不再移动（<b>收敛</b>）：</p><ol><li><b>分配</b>：每个点归到最近的中心</li><li><b>更新</b>：中心 = 这一组点的平均位置</li></ol><p>它一定会停下，但可能停在“不够好”的地方（<b>局部最优</b>），比如两个队长挤在同一堆里。所以实践中会多试几次起点，或用 <b>k-means++</b> 聪明地挑起点。K 要人来定。</p>',
        '<p>Repeat two steps until the captains stop moving (<b>convergence</b>):</p><ol><li><b>Assign</b>: each point joins its nearest center</li><li><b>Update</b>: each center = the average position of its points</li></ol><p>It always stops, but it may stop somewhere “not good enough” (a <b>local optimum</b>) — for example, two captains crammed into the same cluster. That’s why people try several starting points, or use <b>k-means++</b> to choose them cleverly. A person has to pick K.</p>')
    },
    {
      id: 'accuracy', name: tr('准确率', 'Accuracy'), en: 'Accuracy', emoji: '✅', color: 'orange',
      plain: tr('所有判断里，判对了多少。', 'Out of all the decisions, how many were right.'),
      metaphor: tr('100 道判断题答对 90 道，准确率就是 90%。', 'Get 90 out of 100 true/false questions right, and your accuracy is 90%.'),
      deep: tr(
        '<p class="formula">准确率 = (TP + TN) / 全部</p><p>TP = 抓对的垃圾，TN = 放对的好邮件。</p><p>⚠️ 当类别很不平衡时，准确率会骗人：如果 99% 都是正常邮件，一个“永远说正常”的笨过滤器也有 99% 的准确率，但它一封垃圾都没抓到。</p>',
        '<p class="formula">Accuracy = (TP + TN) / total</p><p>TP = spam correctly caught, TN = good mail correctly let through.</p><p>⚠️ When classes are very unbalanced, accuracy can fool you: if 99% of mail is legit, a dumb filter that always says “legit” scores 99% accuracy — yet catches zero spam.</p>')
    },
    {
      id: 'precision', name: tr('精确率', 'Precision'), en: 'Precision', emoji: '🎯', color: 'orange',
      plain: tr('被我拦下的邮件里，真的是垃圾邮件的比例——“拦得准不准”。', 'Of the emails I blocked, the share that really were spam — “how accurate is my blocking?”'),
      metaphor: tr('渔夫一网捞上来的东西里，真正是鱼（而不是破鞋）的比例。', 'Of everything in the fisherman’s net, the share that’s actually fish (not old boots).'),
      deep: tr(
        '<p class="formula">精确率 = TP / (TP + FP)</p><p>FP（假阳性）= 被误杀的好邮件。精确率低，说明“冤枉好人”多。</p><p>适合优先看精确率的场景：垃圾邮件过滤（误删重要邮件很糟糕）、推荐系统。</p>',
        '<p class="formula">Precision = TP / (TP + FP)</p><p>FP (false positive) = good mail wrongly blocked. Low precision means lots of innocent mail gets punished.</p><p>Prioritize precision when false alarms are costly: spam filters (losing an important email is bad), recommendation systems.</p>')
    },
    {
      id: 'recall', name: tr('召回率', 'Recall'), en: 'Recall', emoji: '🕸️', color: 'orange',
      plain: tr('所有垃圾邮件里，被我抓到的比例——“抓得全不全”。', 'Of all the spam out there, the share I caught — “did I catch them all?”'),
      metaphor: tr('池塘里所有的鱼，被渔夫捞上来了多少。', 'Of all the fish in the pond, how many the fisherman managed to catch.'),
      deep: tr(
        '<p class="formula">召回率 = TP / (TP + FN)</p><p>FN（假阴性）= 漏网的垃圾邮件。</p><p>精确率和召回率常常<b>此消彼长</b>：拦得越严，抓得越全，但误杀越多。综合两者的指标叫 <b>F1 分数</b>：<code>F1 = 2PR / (P + R)</code>。疾病筛查通常优先保证召回率。</p>',
        '<p class="formula">Recall = TP / (TP + FN)</p><p>FN (false negative) = spam that slipped through.</p><p>Precision and recall usually <b>trade off</b>: the stricter you block, the more spam you catch — but the more good mail you hit too. A score combining both is the <b>F1 score</b>: <code>F1 = 2PR / (P + R)</code>. Medical screening usually prioritizes recall.</p>')
    },
    {
      id: 'gigo', name: tr('垃圾进，垃圾出', 'Garbage In, Garbage Out'), en: 'Garbage In, Garbage Out', emoji: '🗑️', color: 'red',
      plain: tr('喂给机器的数据有错，它学出来的本领也是错的。', 'Feed a machine bad data, and what it learns will be bad too.'),
      metaphor: tr('照着写错的菜谱做菜，厨艺再好也做不出好味道。', 'Follow a recipe full of mistakes, and even a great cook can’t make it taste good.'),
      deep: tr(
        '<p>常见的“垃圾数据”：标签贴错、重复样本、乱码、离谱的异常值、混进来的无关数据。</p><p>在真实项目里，<b>数据清洗</b>往往占掉大部分时间。业界常说：好数据比花哨的模型更重要。</p>',
        '<p>Common “garbage data”: wrong labels, duplicates, corrupted text, absurd outliers, unrelated data that slipped in.</p><p>In real projects, <b>data cleaning</b> often takes most of the time. As the saying goes in the industry: good data matters more than a fancy model.</p>')
    },
    {
      id: 'bias', name: tr('数据偏差', 'Data Bias'), en: 'Data Bias', emoji: '⚖️', color: 'red',
      plain: tr('训练数据不能代表真实世界（比如只见过红苹果），机器学到的本领就是偏的。', 'When training data doesn’t represent the real world (say, only red apples), what the machine learns is skewed.'),
      metaphor: tr('只在南方长大的孩子，第一次见到雪可能认不出来。', 'A kid who grew up somewhere tropical might not recognize snow the first time they see it.'),
      deep: tr(
        '<p>偏差的来源：采样不全面（只收集了某一类人）、历史偏见（过去的数据本身就不公平）、标注者的主观偏见等。</p><p>后果：模型对少见的群体表现很差，甚至造成歧视。对策：收集更多样的数据、检查各类别的数据分布、分组评估模型表现。</p>',
        '<p>Where bias comes from: incomplete sampling (only collecting one kind of people), historical bias (the past data itself was unfair), annotators’ personal biases, and more.</p><p>Consequences: the model performs poorly on under-represented groups, and can even discriminate. Fixes: collect more diverse data, check how the data is distributed across groups, and evaluate the model separately for each group.</p>')
    },
    {
      id: 'rl', name: tr('强化学习', 'Reinforcement Learning'), en: 'Reinforcement Learning', emoji: '🕹️', color: 'purple',
      plain: tr('不给标准答案，只给“奖励”和“惩罚”，让机器自己不断试错，慢慢学会怎么做最好。', 'No answer key — just rewards and penalties. The machine learns the best way to act through trial and error.'),
      metaphor: tr('训练小狗：做对了给零食，做错了没零食。它慢慢就知道该怎么做。', 'Training a puppy: a treat when it gets it right, no treat when it doesn’t. Gradually it figures out what to do.'),
      deep: tr(
        '<p>智能体在状态 <code>s</code> 选动作 <code>a</code>，得到奖励 <code>r</code>，进入新状态 <code>s\'</code>。第 11 关用的是 <b>Q-learning</b>，每个格子记着“往各方向走有多好”：</p><p class="formula">Q(s,a) ← Q(s,a) + α·[ r + γ·max Q(s\',·) − Q(s,a) ]</p><p>α 是学习率，γ 是对未来奖励的“重视程度”。机器既要<b>探索</b>（随便试试新路），也要<b>利用</b>（走已知最好的路）。AlphaGo、机器人行走、大语言模型的 RLHF 都用到了强化学习。</p>',
        '<p>An agent in state <code>s</code> picks action <code>a</code>, receives reward <code>r</code>, and lands in a new state <code>s\'</code>. Level 11 uses <b>Q-learning</b>: each square remembers “how good is it to move in each direction”:</p><p class="formula">Q(s,a) ← Q(s,a) + α·[ r + γ·max Q(s\',·) − Q(s,a) ]</p><p>α is the learning rate and γ is how much future rewards count. The machine has to balance <b>exploration</b> (trying new paths) with <b>exploitation</b> (taking the best known path). AlphaGo, walking robots, and the RLHF step for large language models all use reinforcement learning.</p>')
    },
    {
      id: 'reward', name: tr('奖励', 'Reward'), en: 'Reward', emoji: '🍰', color: 'purple',
      plain: tr('告诉机器“刚才做得好不好”的分数。机器的目标就是让得到的总奖励最多。', 'A score telling the machine how well it just did. Its goal is to collect as much total reward as possible.'),
      metaphor: tr('游戏里的金币和扣血。', 'Coins and lost health points in a video game.'),
      deep: tr(
        '<p>奖励规则就是在告诉机器“你的目标是什么”。没有奖励，机器就没有方向（第 11 关你应该体会到了）。</p><p>⚠️ 奖励设计不好，机器会“钻空子”刷分，而不是完成你真正想要的事，这叫 <b>Reward Hacking</b>。</p>',
        '<p>The reward rules tell the machine what its goal is. Without a reward, it has no direction (you probably felt this in Level 11).</p><p>⚠️ With badly designed rewards, the machine will exploit loopholes to rack up points instead of doing what you actually wanted. This is called <b>reward hacking</b>.</p>')
    },
    {
      id: 'llm', name: tr('大语言模型', 'Large Language Model (LLM)'), en: 'Large Language Model (LLM)', emoji: '💬', color: 'blue',
      plain: tr('读过海量文字的模型。它最核心的本领只有一个：根据前文，猜下一个词最可能是什么。', 'A model that has read an enormous amount of text. Its core skill is just one thing: given the text so far, guess the most likely next word.'),
      metaphor: tr('超级加强版的“输入法联想”：你打“生日”，它就猜你要打“快乐”。', 'A super-powered version of your phone’s autocomplete: type “happy”, and it guesses “birthday”.'),
      deep: tr(
        '<p>大语言模型基于 <b>Transformer</b> 神经网络，在海量文本上反复练习“预测下一个 token”。一个词一个词地猜下去，就写出了整段话。</p><p>之后再通过<b>指令微调</b>和<b>人类反馈强化学习（RLHF）</b>，学会听懂指令、好好聊天。它没有真正“看到”世界，所以有时会一本正经地编造内容（<b>幻觉</b>）。</p>',
        '<p>Large language models are built on the <b>Transformer</b> neural network and practice “predicting the next token” over a vast amount of text. Guess one word after another, and you get whole paragraphs.</p><p>Then <b>instruction tuning</b> and <b>reinforcement learning from human feedback (RLHF)</b> teach it to follow instructions and chat helpfully. It has never actually “seen” the world, so it sometimes confidently makes things up (<b>hallucination</b>).</p>')
    },
    {
      id: 'token', name: tr('Token（词元）', 'Token'), en: 'Token', emoji: '🧩', color: 'blue',
      plain: tr('模型读写文字的最小单位，可能是一个字、一个词，或词的一部分。', 'The smallest unit of text a model reads and writes — a word, a character, or part of a word.'),
      metaphor: tr('拼乐高用的一块块积木：句子是用 token 一块块拼出来的。', 'LEGO bricks: sentences are snapped together one token at a time.'),
      deep: tr(
        '<p>文字先被<b>分词器</b>（tokenizer）切成 token，再变成编号交给模型。英文里 1 个 token 约等于 ¾ 个单词；中文里 1 个 token 常常是 1～2 个汉字。</p><p>模型能“记住”的上下文长度、API 的计费，都是按 token 数算的。</p>',
        '<p>Text is first chopped into tokens by a <b>tokenizer</b>, then turned into ID numbers for the model. In English, 1 token is roughly ¾ of a word; in Chinese, 1 token is often 1–2 characters.</p><p>How much context a model can “remember”, and how APIs charge, are both measured in tokens.</p>')
    },
    {
      id: 'temperature', name: tr('温度', 'Temperature'), en: 'Temperature', emoji: '🌡️', color: 'blue',
      plain: tr('控制模型说话“大胆程度”的旋钮。温度低：总挑最可能的词；温度高：更爱冒险、更有创意，也更容易胡说。', 'A dial for how “bold” the model is. Low temperature: always picks the most likely word. High: more adventurous and creative — and more likely to talk nonsense.'),
      metaphor: tr('点菜：温度低的人总点招牌菜，温度高的人敢点从没吃过的怪菜。', 'Ordering food: a low-temperature person always gets the house special; a high-temperature person orders the weird dish they’ve never tried.'),
      deep: tr(
        '<p>模型先给每个候选词打分 <code>zᵢ</code>，再换算成概率：</p><p class="formula">pᵢ = exp(zᵢ / T) / Σⱼ exp(zⱼ / T)</p><p>T 越小，概率越集中在第一名；T 越大，分布越平均。写代码、答事实题常用低温；写诗、头脑风暴可以调高一点。</p>',
        '<p>The model gives each candidate word a score <code>zᵢ</code>, then turns the scores into probabilities:</p><p class="formula">pᵢ = exp(zᵢ / T) / Σⱼ exp(zⱼ / T)</p><p>The smaller T is, the more the probability piles onto the top choice; the bigger T is, the more even it gets. Coding and factual answers usually use low temperature; poetry and brainstorming can go higher.</p>')
    }
  ]);
})();
