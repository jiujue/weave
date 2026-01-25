# 设计原则与演进方向

## 设计原则

### 1) DisplayList First

- core 的输出是 DisplayList，而不是直接绑定 Canvas API
- 好处：可测试、可序列化、可跨线程/跨平台复用

### 2) 布局与绘制解耦

- Yoga 只负责几何（LayoutFrame）
- paint 阶段只消费 frame + node，生成绘制指令

### 3) 场景是纯数据

- Worker 协作依赖结构化克隆：SceneNode 与 Patch 必须可序列化
- 不把函数/类实例塞进 scene tree

### 4) 可扩展的测量系统

- TextMeasurer 由运行时注入（浏览器/Node 各自实现）
- core 内部缓存测量结果，避免热点重复计算

## Table 原语的设计动机

- 大表格如果用 container 拼，会产生大量 Yoga 节点与大量 patch
- Table 作为原语，内部自布局/自绘制，能在保持功能的同时控制复杂度

## Table 的关键能力

- 多级表头（分组表头）：header tree → 展开为 header cells（colSpan/rowSpan）
- 对齐：列/分组/tableStyle 的对齐优先级
- 固定高度裁剪：clipRect 实现 overflow hidden

## 未来演进建议

- overflow: scroll：tableStyle 增加 scrollTop/scrollLeft，body 区域 translate + clip
- 文本排版：更完善的断词策略、inline metrics、字体 fallback 策略抽象
- 更多图元：image、path fillRule、gradient 等（保持 DisplayList 最小可用并渐进扩展）
