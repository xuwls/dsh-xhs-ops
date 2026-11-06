# xhs-ops

将 `xiaohongshu-ops-skill` 的小红书运营 SOP 复刻为 DeepSeek Harness（DSH）Cordis 插件。包含账号分析、首页与选题研究、内容生产、发布预演、评论回复、Viral Copy 和知识库模板；浏览器操作统一映射到 DSH `ego_*` 工具。

当前版本提供宿主服务、生命周期管理和随包 SOP 资源，不包含独立 Web 工作台。默认只执行到发布前确认，不自动点击最终“发布”。

## 环境要求

- Node.js `^22.19.0 || >=24.0.0`
- 可运行 `npx @deepseek-ai/dsh` 的 DSH 环境
- 浏览器任务使用 DSH ego 默认任务空间；小红书登录由用户在 DSH 浏览器中手动完成

## 本地安装

在本目录执行：

```bash
npm install
npm run typecheck
npm run check:structure
npm run build
```

然后将**本目录的绝对路径**安装到 DSH Web profile：

```bash
npx @deepseek-ai/dsh plugin --profile web add "<本目录绝对路径>"
npx @deepseek-ai/dsh web
```

Windows 示例（按实际位置替换）：

```powershell
npx @deepseek-ai/dsh plugin --profile web add "D:\workspace\xiaohuangyu\xhs-dsh-plugin"
```

卸载：

```bash
npx @deepseek-ai/dsh plugin --profile web remove xhs-ops
```

> 本地目录安装前必须先构建，`main` 指向 `lib/index.js`。从 Git 仓库分发时，应提交 `lib/` 预构建产物，或发布包含 `lib/` 的 npm 包/压缩包；DSH 从 Git 安装时不应依赖执行项目 build 脚本。

## 使用入口

运营任务以随包 `SKILL.md` 为总入口，按任务加载 `references/` 中的单项 SOP。所有文档路径以插件根目录为基准：

- 人设与语气：`config/persona.md`
- 知识库总览：`config/knowledge-base/README.md`
- 知识库模板：`config/knowledge-base/_template.md`
- OpenClaw → DSH 工具映射：`mapping.md`
- 页面提取模板：`references/xhs-eval-patterns.md`

发布、回复等外部动作遵循 SOP 的确认与风控要求。登录验证码、密码不由插件代填；默认发布流程停在“发布”按钮可见处，等待用户明确确认。

## 目录结构

```text
xhs-dsh-plugin/
├── cordis.patch.yml             # Cordis 插件安装声明
├── package.json                 # ESM 入口、依赖、构建与打包清单
├── tsconfig.json
├── src/
│   ├── index.ts                 # 配置解析与 ctx.effect 生命周期装配
│   └── service.ts               # 核心服务与随包资源完整性检查
├── config/
│   ├── persona.md               # 「阿快的AI笔记」人设
│   └── knowledge-base/          # 总览、模板及 5 类记录目录
├── references/                  # 9 份运营 SOP 与提取模板
├── scripts/
│   └── verify-structure.mjs     # 必需文件、文档路径和打包清单校验
├── SKILL.md                     # 运营能力总入口
├── mapping.md                   # 浏览器工具映射说明
└── persona.md                   # 上游原始人设存档；运行时不引用
```

`src/service.ts` 启动时检查核心 SOP 是否随包存在，缺失时明确报告相对路径，避免插件以缺少运营资源的状态启动。

## 开发与验证

```bash
npm run typecheck       # TypeScript strict 检查
npm run check:structure # 文件、SOP 引用与 package files 检查
npm run build           # 生成 lib/*.js 和 lib/*.d.ts
npm pack --dry-run      # 检查实际发布文件
```

修改 `src/` 后必须重新 `npm run build`。修改 SOP 或配置后运行 `check:structure`，并确认 `npm pack --dry-run` 仍包含 `config/`、`references/`、`SKILL.md` 和 `mapping.md`。

## 参考与边界

- 插件装配方式参考 [jerryjiao/dsh-wewrite](https://github.com/jerryjiao/dsh-wewrite)。
- 原始运营流程来自 [Xiangyu-CAS/xiaohongshu-ops-skill](https://github.com/Xiangyu-CAS/xiaohongshu-ops-skill)。
- 页面 selector 会随小红书前端变化；实际操作前按 `references/xhs-runtime-rules.md` 重新 snapshot 校准。
- `mapping.md` 保留旧工具名仅用于迁移对照，不是运行时调用说明。
