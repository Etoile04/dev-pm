# dev-pm — OpenClaw 项目开发经理技能

[![Score: 93.0/100](https://img.shields.io/badge/rubric%20score-93.0%2F100-brightgreen)](https://github.com/Etoile04/dev-pm)
[![Version](https://img.shields.io/badge/version-0.1.0-blue)](https://github.com/Etoile04/dev-pm/releases/tag/v0.1.0)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-skill-purple)](https://docs.openclaw.ai)

按项目规模（S/M/L）自动编排全生命周期的项目管理技能：**需求分析 → 设计 → 开发 → 验证 → 交付 → 复盘**。

## 为什么需要 dev-pm？

AI agent 做项目开发时常踩的坑：

- ❌ 小项目搞重流程，浪费 30 分钟写计划
- ❌ 大项目跳过设计审查，返工 3 次
- ❌ Code review 被跳过，verifyAdmin 重复写 3 遍
- ❌ 经验靠事后补录，下次项目照样踩坑
- ❌ Phase 4（验证/审查/收尾）等用户提示才触发

dev-pm 用**强制性流程**解决这些问题。

## 核心特性

### 🎯 规模自适应（S/M/L）

| 规模 | 步骤数 | 管理开销 | 适用场景 |
|------|--------|----------|----------|
| **S** | 3 步 | < 10 min | 单文件 bug 修复、小脚本 |
| **M** | 7 步 | ~30 min | 多模块功能开发（1-5 天） |
| **L** | 12 步 | 1-2 h | 多系统/多仓库项目（> 5 天） |

### 🔄 Phase 4 自动触发

验证 → 审查 → 收尾 → 蒸馏**按序自动触发，不依赖用户提示**。失败分支显式编码（验证不过 → 回开发修复，最多 3 轮）。

### 🧠 GOAP A* 规划器（L 级）

移植自 Ruflo GOAP Planner，将模糊目标（"重构认证系统"）分解为可执行 Task 序列。

```bash
# 使用示例
echo '{"goal":{...},"initial":{...},"actions":[...]}' | npx tsx scripts/goap-planner.ts
```

### 🛡️ 强制性质量门控

- 8 处 🔴 CHECKPOINT + 🛑 STOP 显性标记
- Phase 4 每步都有三段式 fallback（超时 → 降级 → 兜底）
- 13 条操作黑名单 + 14 条反模式检查清单
- 9 条回滚策略（含 superpowers 技能覆盖）

### 📊 Learning Loop（经验蒸馏闭环）

项目执行轨迹 → 模式蒸馏 → Pattern Library → 未来项目 GOAP 分解时的 Actions 来源。

## 快速开始

### 安装

```bash
# 克隆到 OpenClaw 技能目录
git clone https://github.com/Etoile04/dev-pm.git ~/.openclaw/skills/dev-pm
```

### 依赖技能（可选）

dev-pm 通过 §7.2 Skill Discovery 自动扫描可用技能。以下技能增强体验但不强制：

| 技能 | 增强阶段 | 安装 |
|------|----------|------|
| `brainstorming` | Step 3 设计 | OpenClaw 内置 |
| `writing-plans` | Step 4 计划 | OpenClaw 内置 |
| `subagent-driven-development` | Step 6 开发 | OpenClaw superpowers |
| `verification-before-completion` | Step 7 验证 | OpenClaw 内置 |
| `requesting-code-review` | Step 8 审查 | OpenClaw superpowers |
| `finishing-a-development-branch` | Step 9 收尾 | OpenClaw superpowers |

### 触发词

对 OpenClaw 说以下任意一句即可触发：

> 新项目 / 启动项目 / 项目管理 / 项目计划 / 开个需求 / 排个计划 / 帮我管这个项目 / new project / project plan

## 评估轨迹

基于 [Darwin Skill 9 维度 Rubric](https://arxiv.org/abs/2605.23899)（SkillLens）评估，独立盲测验证：

| 维度 | 权重 | 得分 | 说明 |
|------|------|------|------|
| dim1 Frontmatter | 7 | 9 | 触发词覆盖中英文，description 信息密度高 |
| dim2 工作流清晰度 | 12 | 9 | §2.0 数据流图 + 每步输入/输出 |
| dim3 失败模式编码 | 12 | 9 | 三段式 fallback 覆盖 13 种异常 |
| dim4 检查点设计 | 6 | 9 | 8 处显性 CHECKPOINT + 超时机制 |
| dim5 可执行具体性 | 17 | **10** | 软化措辞清零，Task 模板具体 |
| dim6 资源整合度 | 4 | **10** | 委派表含完整路径 |
| dim7 整体架构 | 12 | **10** | 层次清晰，无冗余重叠 |
| dim8 实测表现 | 23 | 9 | NFMD Review 模块验证通过 |
| dim9 反例与黑名单 | 6 | **10** | 13 条黑名单 + 14 条反模式 |
| **总计** | **100** | **93.0** | |

```
59.5 (基线) → 82.25 (R1) → 87.2 (R2) → 93.0 (R3)
```

## 文件结构

```
dev-pm/
├── SKILL.md              # 技能主体（1212 行）
├── scripts/
│   └── goap-planner.ts   # GOAP A* 规划器
├── .gitignore
└── README.md             # 本文件
```

## 实战案例

以 NFMD Review 模块（M 级，3 天工期）为例，dev-pm 能避免以下真实问题：

| 问题 | dev-pm 如何避免 |
|------|----------------|
| verifyAdmin 重复写 3 遍 | Step 8 强制 isolated code review |
| NEXT_PUBLIC_ 泄露敏感 key | Step 8 安全审查维度 + 黑名单 #9 |
| N+1 查询（300 RPC → 10 RPC） | Step 8 reviewer 审查维度含性能检查 |
| 先写代码再 review | Phase 4 自动触发断言 |
| 经验靠事后补录 | Step 10 强制蒸馏 + 技能闭环 |

## 致谢

- **评估框架**：[Darwin Skill](https://github.com/alchaincyf/darwin-skill)（基于 [SkillLens: arXiv 2605.23899](https://arxiv.org/abs/2605.23899)）
- **GOAP Planner**：移植自 Ruflo GOAP A* Planner（MIT License）
- **运行平台**：[OpenClaw](https://github.com/openclaw/openclaw)

## License

MIT
