# 维护与扩展

## 维护目标

- 保持 core 的纯粹：不引入平台依赖（浏览器/Node 的差异放在 adapter）
- 保持 DisplayList 指令集的可控：先最小可用，再渐进扩展
- 保持跨线程可用：scene/patch 始终是可序列化数据

## 常见风险点

- YogaNode 泄漏：任何删除/替换树都要确保对应节点 free
- 文本测量成本：whiteSpace=normal 可能带来大量测量，优先缓存并限制采样
- 大表格绘制：控制 draw ops 数量；必要时做可见行裁剪/分页

## 扩展建议

### 新增绘制能力

- 优先扩展 DisplayList schema，再由 core 产出对应 op，最后由 replay 实现
- 避免在 core 直接调用 ctx API（会破坏可测试性与跨平台能力）

### 新增 Patch

- Patch 需要明确：是否影响 layout（measure/style）还是只影响 paint
- 影响 layout 的 patch 必须触发重新测量/重新 layout

## 调试路径

- 浏览器：关注 Worker 的 `WEAVE_ERROR` 回传与控制台日志
- Node：若中文乱码，优先确认字体是否注册（WEAVE*FONT*\* 或系统字体兜底）
