# actions/

发布、回复、下载、抓取、复刻等操作记录。

- 记录类型：`type: action`
- 命名：`YYYY-MM-DD-<动作brief>.md`
- 示例：`2026-11-06-publish-claude-skills-note.md`

分类型字段：
- `task_type`：publish | reply | analyze | download | viral_copy 等
- `input`：输入摘要
- `steps_taken`：按时间顺序 3–5 条
- `result`：success | failed | partial
- `blocker`：如果失败，卡在哪一步

一条记录只记一次完整动作，失败原因和回退策略同时写入 `reviews/`。
