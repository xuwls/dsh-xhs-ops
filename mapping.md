# OpenClaw browser.* → DSH ego_* 映射表

> 来源：`references/xhs-eval-patterns.md`、`references/xhs-runtime-rules.md`、`references/xhs-comment-ops.md`、`references/xhs-publish-flows.md`、`references/xhs-viral-copy-flow.md`、`references/xhs-account-analysis.md`、`references/xhs-home-feed-analysis.md`、`SKILL.md`。
>
> 目的：把原 skill 中对 OpenClaw 内置浏览器（`profile="openclaw"`，openclaw-manager 通道）的调用，一一映射为 DeepSeek Harness 的 `ego_*` 浏览器工具调用，供插件实现层（`scripts/` 或 prompt 侧）直接引用。
>
> DSH 侧统一以 **单一持久化 task space `default`** 替代 OpenClaw 的 `profile="openclaw"` 概念：登录态由 ego 持久化 profile 目录落盘，跨重启保留，无需每次 `browser.start`。

---

## 1. 核心概念映射

| OpenClaw 概念 | DSH 对应 | 说明 |
| --- | --- | --- |
| `profile="openclaw"`（内置浏览器 profile） | `ego_space_open({ name: "default" })` | 整个插件只使用 `default` 一个 task space；禁止新建 `#4/#5` 之类的编号 space。 |
| `browser.start --profile openclaw` | `ego_space_open` + `ego_page_info` | 幂等；已打开则复用。配合 `ego_status` 做 CLI 可用性自检。 |
| 会话目标 tab（`targetId` 复用） | `ego_tabs({ action: "list" })` / `switch` / `open` / `close` | 关键页（创作页、探索页、用户页）复用同一 `targetId`，不重复 open。 |
| 浏览器能力不可用故障引导 | `ego_status()` → 失败则 `ego_doctor()` | 原 skill 引导用户读 `docs.openclaw.ai/tools/browser`；DSH 改为引导用户检查 ego-browser CLI 与 Chrome 候选。 |
| 登录态（扫码/验证码） | `ego_captcha()` 检测 + `ego_wait_for_human({ reason: "login" })` | 用户在 ego lite 浏览器窗口手动完成；完成后 `ego_auth_flush()` 落盘 cookie。 |
| 登录态持久化 | `ego_auth_flush()` | 对应 OpenClaw profile 目录隐式落盘；DSH 需要显式 flush 一次。 |
| `/tmp/openclaw/uploads` 上传目录约束 | 无目录约束：`ego_upload({ path, selector })` 直接接受宿主机绝对路径 | 原 SOP 中的 `cp` 步骤可删除。 |

---

## 2. 工具级 API 映射（一一对应）

| OpenClaw 调用 | DSH ego_* 调用 | 备注 / 参数差异 |
| --- | --- | --- |
| `browser.start --profile openclaw` | `ego_space_open({ name: "default" })` | 见 §1 |
| `browser.open(url)` / `browser.navigate(url)` | `ego_navigate({ url, tab?, wait: true })` | 优先复用已打开同 URL tab；`wait` 默认等 document load。 |
| `browser.snapshot()`（ref 树） | `ego_snapshot({ scope: "full_page" })` | 返回带 `[ref=N, loc=...]` 标注的语义树，供 click/fill 定位。仅在关键节点调用（登录确认、到发布页、填写完成、发布前停顿）。 |
| `browser.screenshot`（含 fullPage） | `ego_screenshot({ path?, selector?, deliver })` | 原 SOP 禁止 fullPage，DSH 默认即视口截图，天然满足；元素级截图传 `selector`。 |
| `browser.click(ref)` | `ego_click({ selector })` 或 `ego_click({ x, y })` | selector 支持 CSS / `xpath=` / `loc=` / `ref=N`（直接复用 snapshot 的 ref）。 |
| `browser.fill({ ref, text })`（单字段，可能报 `Error: fields are required`） | `ego_fill({ selector, text })` | DSH 无 `fields` 数组要求，原 SOP 的 fill 兼容分支可整段删除。 |
| `browser.type(ref, text)`（逐字输入） | `ego_key({ text })`（向当前焦点逐字输入）或 `ego_fill` 后按需触发 | 评论回复默认仍走“逐字输入”语义：先 `ego_click` 聚焦输入框，再 `ego_key({ text })`。 |
| `browser.press(key)` / 键盘 | `ego_key({ key: "Enter" / "Escape" / "Control+a" })` | 原 SOP 规定发送不用 Enter——DSH 同样只用于 Escape/全选等辅助键。 |
| `browser.upload(ref, path)`（限 `/tmp/openclaw/uploads`） | `ego_upload({ selector, path })` | path 为宿主机绝对路径，无沙箱目录限制。 |
| `browser.evaluate(js)` | `ego_js({ expression })` | **核心提取手段**，见 §3 模板移植。 |
| `browser.wait_for_selector` | `ego_wait_for_selector({ selector, state, timeout })` | state: visible/attached/hidden/detached。 |
| `browser.wait_for_url` | `ego_wait_for_url({ pattern })` | Playwright 通配符语义；只观察调用期间发生的导航，已完成的导航读 `ego_page_info`。 |
| `browser.wait(ms)` | `ego_wait({ ms })` | 用于动画/风控间隔（8–15s 回复节奏）。 |
| `browser.scroll` | `ego_scroll({ deltaY })` 或 `ego_scroll({ selector })` | 推荐流采样翻页用 deltaY；定位元素用 selector。 |
| `browser.hover` | `ego_hover({ selector })` | 触发下拉/hover 态。 |
| `browser.select`（下拉框） | `ego_select({ selector, value })` | 发布页可见范围等设置。 |
| `browser.check` | `ego_check({ selector, checked })` | checkbox/radio。 |
| `browser.dialog`（accept/dismiss） | `ego_dialog({ accept, text? })` | 原生 alert/confirm/prompt。 |
| `browser.download` | `ego_download({ triggerSelector / triggerScript, savePath? })` | 爆款封面转存 PNG/JPG 时可用；也可直接 `ego_js` 取 `currentSrc` 后 HTTP 抓取。 |
| `browser.tabs` / targetId 管理 | `ego_tabs({ action, targetId?, url? })` | |
| `browser.status` / profiles | `ego_status()` / `ego_page_info()` | |
| `browser.close` | `ego_space_close({ name: "default", keep: true })` | **持久化模式下默认不关 space**，任务结束直接回复用户，保留登录态。 |
| （无对应）复杂多步流程 | `ego_script({ script })` | 一个调用内跑完整多步任务（如“进详情→抓 active 封面→校验 key”），减少往返。 |
| （无对应）页面上下文跨域请求 | `ego_http({ url, method?, mode: "browser" })` | 可替代部分 evaluate 内 fetch。 |

---

## 3. evaluate 提取模板移植（xhs-eval-patterns.md → ego_js）

原模板可**原样**作为 `ego_js({ expression })` 的表达式运行（IIFE 包裹即可）：

```js
ego_js({ expression: `(() => {
  const pickText = (el, sels) => {
    for (const s of sels) {
      const v = el.querySelector?.(s)?.textContent?.trim();
      if (v) return v;
    }
    return '';
  };
  const num = (v) => {
    const m = String(v || '').replace(/,/g, '').match(/\\d+(?:\\.\\d+)?/);
    return m ? Number(m[0]) : 0;
  };
  return [...document.querySelectorAll('.note-item, .comment-item, li, [data-item]')]
    .slice(0, 20)
    .map((el) => ({
      title: pickText(el, ['.title', '.note-title', 'h1', 'h2', 'h3']),
      hook: pickText(el, ['.desc', '.description', '.summary', '.intro']),
      angle: pickText(el, ['.tag', '.category', '.angle']),
      comments_signal: pickText(el, ['.comment', '.comments', '[data-comment]']),
      cta: pickText(el, ['.cta', '.action', '.footer']),
      likes: num(pickText(el, ['.like', '.likes', '[data-like]'])),
      tags: pickText(el, ['.tag-list', '.tags'])
    }))
    .filter(x => x.title || x.hook);
})()` })
```

规则沿用：先 20 条以内试跑；字段缺失返回空串；selector 失效时先 `ego_snapshot` 再调整，不盲跑旧路径。

---

## 4. DOM 选择器清单（全部保留，DSH 通用）

### 4.1 通用卡片提取（eval 模板）
- 卡片容器：`.note-item`, `.comment-item`, `li`, `[data-item]`
- 标题：`.title`, `.note-title`, `h1`, `h2`, `h3`
- 摘要/钩子：`.desc`, `.description`, `.summary`, `.intro`
- 角度/分类：`.tag`, `.category`, `.angle`
- 评论信号：`.comment`, `.comments`, `[data-comment]`
- CTA：`.cta`, `.action`, `.footer`
- 点赞：`.like`, `.likes`, `[data-like]`（`num()` 去逗号提取数字）
- 标签组：`.tag-list`, `.tags`

### 4.2 轮播详情页封面（xhs-viral-copy-flow / runtime-rules 强制）
- **首选**：`.swiper-slide-active:not(.swiper-slide-duplicate) .img-container img`
- **兜底**：`.swiper-slide-active .img-container img`
- **禁止**：直接取第一个 `.img-container` / 第一个 `.img-container img`（会抓到上一张或 duplicate）
- 取值：`currentSrc || src`；抓后人工核对 URL 末段 key（如 `.../1040g3k...`）与指定封面一致。

### 4.3 评论回复（xhs-comment-ops）
- 通知页路径：`/notification` →「评论和@」
- 目标行内「回复」入口（**不要点顶部搜索框**）
- 对位唯一凭证：输入框 `placeholder === "回复 <用户名>"`（发送前二次校验未漂移）
- 输入框可能为 `contenteditable` 或 `p.content-input`：需先触发输入事件再发送（DSH：`ego_click` 聚焦 + `ego_key({ text })` 逐字输入天然触发 input 事件）
- 发送：点击红色「发送」按钮，**不使用 Enter**
- 成功判定：输入框消失/清空

### 4.4 发布页（xhs-publish-flows）
- 入口 tab：「上传图文」（注意存在重复双 tab，第一个失败立即试第二个并 snapshot 校验）、「上传视频」、「写长文」
- 文字配图：「文字配图」→ 输入大字报文案 →「生成图片」→ 模板页选样式 →「下一步」
- 外部封面上传：优先点「上传图片」；编辑页可见标志 = 图片编辑区 + 标题/正文输入框
- 标题字数：出现 `xx/20` 超限立即压缩（≤20 字）
- 三要素校验：封面 / 标题 / 正文齐全后**停在「发布」按钮可见处**，默认不点击
- 草稿箱：默认视频 tab，需切「图文笔记」tab 再编辑

---

## 5. 页面流程映射（SOP 级）

### 5.1 启动与环境校验（所有任务前置）
| 步骤 | OpenClaw | DSH |
| --- | --- | --- |
| 固定 profile | `browser.start --profile openclaw` | `ego_space_open({ name: "default" })` |
| 能力自检 | openclaw-manager status/profiles 轻量重试 | `ego_status()`，失败则 `ego_doctor()` |
| 确认目标 tab | open 后 snapshot | `ego_tabs list` + `ego_page_info` |
| 通道异常（no tab connected / 错 profile） | 切回 openclaw 重试 | 重新 `ego_space_open default`；必要时 `ego_tabs switch` |
| 登录 | 扫码后 profile 隐式持久 | `ego_captcha` / `ego_wait_for_human(reason:"login")` → `ego_auth_flush()` |

### 5.2 首页推荐流采样
1. `ego_navigate` 到首页 → `ego_snapshot` 确认是推荐流（非搜索/个人/消息页）。
2. `ego_js` 跑 §3 模板采 10–20 条；`ego_scroll({ deltaY })` 翻页补足样本。
3. 卡片信息不全时 `ego_click` 卡片本体进详情补字段（不点头像/作者名）。
4. 降级：样本不足退回“前 10 条 + 2 个详情页”；连续 2 次定位失败停止盲试，人工确认。

### 5.3 搜索并浏览（核心约束保留）
1. **只允许从搜索结果页点击进入帖子**——禁止 `ego_navigate` 直达 `/explore/<id>`。
2. 默认跳过本账号作者内容。
3. 进入后 `ego_js`/`ego_snapshot` 校验：非 404、评论/互动可见、标题或可识别作者。
4. 优先点卡片本体。
5. 两条点击失败或 404 → 返回搜索页换下一条，不对同链接直跳重试。

### 5.4 评论检查与回复
| 步骤 | DSH 调用 |
| --- | --- |
| 打开通知页 | `ego_navigate({ url: ".../notification" })` → 点「评论和@」 |
| 抓取最新评论 | `ego_js`（用户名/评论文本/时间，复用 §3 pickText） |
| 点目标行「回复」 | `ego_click`（snapshot ref 定位到行内按钮） |
| 对位校验 | `ego_read_element({ selector: 输入框, what: "attribute", attribute: "placeholder" })` === `回复 <用户名>` |
| 输入 | `ego_click` 聚焦 → `ego_key({ text: 文案 })`（逐字；≤280 字） |
| 发送前二次对位 | 再次读 placeholder，漂移即 Escape 取消重来 |
| 发送 | `ego_click` 红色「发送」（不用 Enter） |
| 成功判定 | `ego_wait_for_selector` 输入框 hidden / 值清空 |
| 节奏 | one-send-per-turn；`ego_wait({ ms: 8000–15000 })` 间隔（用户明确加速可降至 ~5000） |
| 降级 | 通知页无法回复 → 帖子详情评论区同套对位流程 |

### 5.5 发布链路（半程预发）
1. `ego_navigate` 创作后台 → `ego_snapshot` 确认到发布页。
2. 按类型走 tab：图文 / 视频 / 长文（误入长文立即切回「上传图文」）。
3. 上传：`ego_upload({ selector: 'input[type=file]', path: 绝对路径 })`（**不再需要 cp 到 /tmp/openclaw/uploads**）。
4. 填写：`ego_fill` 标题/正文 + 话题；`ego_js` 读 `xx/20` 字数校验。
5. 三要素齐全 → `ego_snapshot` 确认「发布」可见 → **停手等用户确认**。
6. 发布按钮元素失效：`ego_snapshot` 刷新 ref → 同动作最多再试 1 次 → 仍失败提示用户手动点击。

### 5.6 Viral Copy 封面抓取
建议用 `ego_script` 一次完成：
```
进详情 → ego_js 取 `.swiper-slide-active:not(.swiper-slide-duplicate) .img-container img` 的 currentSrc||src
→ 校验 URL 末段 key → ego_download 或 HTTP 转存 PNG/JPG → 作为生图输入
```
图生图相似度过高时改 style-only prompt 重生（纯 prompt 层，无浏览器动作）。

---

## 6. 风控与稳定策略映射（逐条对应）

| 原策略（runtime-rules / comment-ops） | DSH 落地 |
| --- | --- |
| 优先 evaluate，减少 dump | 优先 `ego_js`，关键节点才 `ego_snapshot` |
| 避免 fullPage | `ego_screenshot` 默认视口截图，天然满足 |
| 复用同一 targetId | `ego_tabs` 复用；关键页不重复 `ego_navigate` 开新 tab |
| 单动作最多重试 1 次，第二次失败改稳健路径 | 不变；稳健路径 = 直达点击改 `ego_js` 定位 / 同义入口 / 用户手动最后一击 |
| 连续 2 次点击/导航失败停止盲试 | 不变；先 `ego_snapshot` 更新 selector |
| one-send-per-turn | 不变 |
| 回复间隔 8–15s（可加速至 5s） | `ego_wait({ ms })` |
| 命中风控提示立即停：评论过于频繁 / 操作过快 / 请稍后再试 / 发送失败 / 网络异常 | `ego_js` 或 `ego_snapshot` 扫页面文案命中即停并汇报 |
| 连续 2 次发送失败停止自动化转人工 | 不变 |
| 误点搜索框 | 点击空白处（`ego_click` 坐标）或 `ego_key Escape` 收起，重新定位通知行 |
| placeholder 漂移 | 立即取消（Escape）重来 |
| 主页信息加载不全不反复刷新 | 轻量诊断降级，标注“样本偏少” |
| 记录关键证据（账号名、页面状态、按钮可见、字数） | `ego_snapshot` / `ego_screenshot({ deliver: true })` 输出证据 |
| 浏览器工具未启用故障引导 | `ego_status` → `ego_doctor`，告知用户修复 CLI/Chrome 环境 |

---

## 7. 可删除 / 需改写的 OpenClaw 特有内容

| 原内容 | 处理 |
| --- | --- |
| `profile="openclaw"` 字样（SKILL.md frontmatter description、各 SOP） | 改写为“固定使用 ego default task space” |
| `Error: fields are required` 的 fill 兼容分支（comment-ops §2.3、§6） | 删除；DSH `ego_fill` 单字段无此问题，默认逐字输入用 `ego_key` |
| `/tmp/openclaw/uploads` + `cp` 步骤（publish-flows §1.4、runtime-rules §6.0） | 删除；`ego_upload` 直接吃宿主机绝对路径 |
| `clawhub install nano-banana-pro` | 替换为 DSH 对应生图技能/插件安装指引（由内容生成模块决定） |
| `docs.openclaw.ai/tools/browser` 故障引导链接 | 替换为 ego-browser 本地诊断（`ego_doctor`）说明 |
| 飞书截图确认（SKILL.md §5） | DSH 改为 `ego_screenshot({ deliver: true })` 直接在会话中出图确认 |

---

## 8. 未映射项 / 待确认

- **发布页、通知页的具体业务 selector**（如「发送」按钮的 CSS、输入框精确 selector）原 SOP 均以语义描述（ref 树定位），未给固定 CSS——DSH 同样走 `ego_snapshot` ref 动态定位，无需硬编码；上线前需对真实页面做一次 snapshot 校准。
- **跨平台需求侧信号抓取**（SKILL.md §3-B 主流平台评论区）：原 skill 未给具体浏览器调用，映射表不覆盖，由具体任务临时使用同一套 `ego_navigate` + `ego_js` 模式。
