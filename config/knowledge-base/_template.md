# 通用 frontmatter 模板

所有知识库记录文件统一使用如下 frontmatter，再叠加各自类型的字段。

```yaml
---
id: 2026-11-06-akuai-positioning
type: account          # account | topic | pattern | action | review
status: active         # active | deprecated | experimental
created_at: 2026-11-06T16:30:00+08:00
updated_at: 2026-11-06T16:30:00+08:00
source:
  kind: manual         # xhs_post | notification | publish_flow | manual
  url: ""              # 可选
  account: "阿快的AI笔记"
  note_id: ""          # 可选
summary: "一句话结论"
evidence:
  - "截图或快照说明"
  - "关键字段或页面状态"
tags:
  - ai-tools
confidence: medium     # low | medium | high
next_action: "下一次要怎么用"
---
```

## 写入规则

- 一条记录只解决一个问题。
- 结论必须可执行。
- 证据优先保留摘要，不保留大段原文。
- 同类条目重复出现时，先更新旧条目，再新增条目。
- 失效条目标记 `status: deprecated`，不直接删除。
