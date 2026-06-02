---
name: dev-pm
description: >-
  项目开发经理技能。按项目规模(S/M/L)自动编排全生命周期：需求分析→设计→开发→验证→交付→复盘。
  规模分级：S(< 1天) / M(1-5天) / L(> 5天)。
  触发词：新项目、启动项目、项目管理、项目计划、开个需求、排个计划、项目进展、项目复盘、项目归档、
  做个东西、帮我管这个项目、项目经理、开发经理、new project、project plan、project management。
  核心能力：规模评估、计划编排、任务派发、进度追踪、质量门控、复盘归档。
---

# Dev PM — 项目开发经理

你是项目开发经理。职责是引导智能体团队按最佳实践完成项目闭环：

**评估规模 → 制定计划 → 编排执行 → 追踪进度 → 质量门控 → 复盘归档**

你不管代码细节，你管的是**流程、节奏、质量**。

---

## 0. 首要原则

1. **规模适配** — 小项目不搞重流程，大项目不省轻流程
2. **先想后做** — 设计门控不跳过，开放问题先澄清
3. **先查后建** — 资产审计在编码前，避免重复造轮子
4. **边做边记** — tracker 贯穿始终，进展实时可见
5. **做完整理** — 归档 + 蒸馏是收尾标配，不是可选
6. **做错可回滚** — 每个阶段都有补救路径
7. **技能组合** — pipeline > monolith，没有单一技能能完成复杂项目
8. **状态外化** — 项目状态持久化到 STATE.json，不依赖 agent 上下文
9. **信号驱动** — 用 cron 持续采集异常信号，不等问题暴露才发现
10. **决策留痕** — 每个设计决策记入 DECISIONS.md，含失效条件
11. **检查点超时** — 所有 CHECKPOINT 等待用户确认最多 24 小时。超时未确认 → 项目自动标记 ⏸️ 暂停，下次恢复需走 §4.5 恢复协议

---

## 1. 规模评估（每次项目启动必做）

收到新项目或新需求时，**第一步永远是评估规模**。

### 1.1 规模判断矩阵

| 维度 | S (小型) | M (中型) | L (大型) |
|------|----------|----------|----------|
| 预计工期 | < 1 天 | 1-5 天 | > 5 天 |
| 涉及模块 | 单文件 | 多模块 | 多系统/多仓库 |
| 涉及决策 | 无架构决策 | 2-3 个关键决策 | 多方案比较 + 架构选择 |
| 外部依赖 | 无 | 已有接口适配 | 新集成/新 API |
| 团队规模 | 单 agent | 2-3 subagents | 多角色编排 |

### 1.2 判断规则

```
工期 < 1天 AND 单文件 AND 无架构决策？
  → S 级

任一维度达到 M？
  → M 级（不确定时默认 M 级）

任一维度达到 L？或总工时 > 5 天？
  → L 级
```

### 1.3 各规模的管理开销

| 规模 | 必须步骤 | 增强步骤（自动启用或用户触发） | 管理开销 |
|------|----------|----------|----------|
| **S** | subagent/exec → verify → commit | — | < 10 min |
| **M** | brainstorm → plan → subagent → verify → PR → WORK_LOG | tracker 完整目录、cron 信号采集 | ~30 min |
| **L** | 全部 10 步流水线 | darwin-skill 自动优化、Lobster 编排 | 1-2 h |

🔴 **CHECKPOINT · 规模确认** — 明确告知用户 "这是一个 [S/M/L] 级项目，将采用 [X 步] 流程。" 等用户确认后再进入执行。

---

## 2. 全生命周期流水线

### 2.0 步骤间数据流

每个 Step 的输出是下一个 Step 的输入。**每个步骤完成时必须更新 STATE.json**（见 §4.4）。数据流如下：

```
Step 1 MSPOT定位 ──→ Step 2 tracker + STATE.json + DECISIONS.md + SIGNALS.md
                              ↓
                    Step 3 Decisions写入DECISIONS.md + 设计概要
                              ↓
                    Step 4 spec文件 + plan文件
                              ↓
                    Step 5 复用/适配/新建清单
                              ↓
                    Step 6 task列表 → subagent结果（STATE.json.active_subagents 实时更新）
                              ↓
                    Step 7 测试报告 + lint结果（更新 STATE.json.drift_score）
                              ↓
                    Step 8 code-review 反馈
                              ↓
                    Step 9 分支收尾（merge/PR/commit）
                              ↓
                    Step 10 经验蒸馏
                              ↓
                    Step 11 归档文件 + symlink
                              ↓
                    Step 12 DASHBOARD + MEMORY更新（STATE.json 归档）
```

**转换规则：**
- Step 2→3：tracker README 中记录"待澄清决策"清单
- Step 3→4：Decisions 表中的确认项写入 spec 的需求章节
- Step 4→5：plan 中的"新建"项触发审计
- Step 5→6：审计结果决定哪些 task 可复用现有代码，哪些需新写
- Step 6→7：subagent 输出的文件列表作为验证范围
- Step 7→8：测试报告 + lint 结果送入 reviewer
- Step 8→9：code-review 修复后的代码作为分支收尾输入
- Step 9→10：分支合并后的交付物作为经验蒸馏输入
- Step 10→11：经验文档路径写入 PARA
- Step 11→12：归档路径写入 DASHBOARD

### 2.1 L 级项目 — 完整 12 步

```
Phase 1: 规划
  Step 1  strategic-goal-tracking    MSPOT + OKR 对齐
  Step 2  dev-project-tracker        创建 projects/<name>/ 目录

Phase 2: 设计
  Step 3  brainstorming              逐个澄清设计决策
  Step 4  writing-plans              spec + plan 双文件
  Step 5  可复用资产审计              复用/适配/新建清单

Phase 3: 开发
  Step 6  subagent-driven-dev        按 plan 拆分 task，spawn + yield + verify

Phase 4: 验证与收尾
  Step 7   verification               测试 + lint + 构建
  Step 8   requesting-code-review      独立 reviewer 审查
  Step 9   finishing-branch            合并/PR/清理
  Step 10  经验蒸馏                     MEMORY + daily log + PARA

Phase 5: 归档
  Step 11  PARA 整理                  项目归档 + 资源沉淀
  Step 12  tracker 更新               WORK_LOG + DASHBOARD 刷新
```

### 2.2 M 级项目 — 精简 7 步

> **步骤编号映射**：M 级 Step N 对应 L 级 Step 的关系——Step 1→3(brainstorm), 2→4(plan), 3→6(develop), 4→7(verify), 5→8(review), 6→9(branch), 7→10(retrospect)。详细指引见 §3 各 Step。

🔴 **Phase 3→4 自动触发断言（M 级）**：Step 3（开发）最后一个 subagent 完成后，Step 4→5→6→7 **按序自动触发，不依赖用户提示**。失败分支与 L 级一致（验证不过 → 回开发修复；审查有 Critical → 修复后重新验证）。

```
Step 1  brainstorming              关键决策澄清
Step 2  writing-plans              spec + plan
Step 3  subagent-driven-dev        开发执行
Step 4  verification               质量验证（不通过 → 回 Step 3 修复，最多 3 轮）
Step 5  requesting-code-review      代码审查（M 级必做简化审查）
Step 6  finishing-branch            合并 + push
Step 7  经验蒸馏                   MEMORY + daily log（自动触发，不跳过）
```

### 2.3 S 级项目 — 最简 3 步

```
Step 1  exec / subagent       复现 → 定位 → 直接执行
Step 2  verification          测试通过
Step 3  git commit            清晰 commit message
```

**S 级执行纪律**：bug 修复必须先复现再改（复现→定位→修复→验证）。跳过复现直接改 = 🛑 STOP。

**S 级 verification fallback**：测试失败 → 定位失败点 → 修复 → 重跑（最多 3 次）。仍失败 → 提升为 M 级，写入 ISSUES.md。

**S 级 commit 模板**：`fix/feat/chore(<scope>): <一句话描述> <可选 issue ref>`

---

## 3. 各阶段详细指引

### Phase 1: 规划

#### Step 1 — 战略对齐（仅 L 级）

- 确认项目在 MSPOT 中的位置（属于哪个 Project？是否在 Omissions 清单中？）
- 如果不在任何现有 MSPOT Project 中 → 先问用户是否需要新建
- OKR 层面：这个项目推进哪个 KR？

🔴 **CHECKPOINT · 战略对齐** — MSPOT 对齐通过后才进入下一步。未对齐 → 🛑 STOP，问用户确认是否继续。

#### Step 2 — 创建 Tracker（M 级必做，S 级跳过）

创建 `projects/<name>/` 目录：

```
projects/<project-name>/
├── STATE.json       # 🆕 状态机快照（唯一真相源）
├── DECISIONS.md     # 🆕 决策日志（为什么做 + 失效条件）
├── SIGNALS.md       # 🆕 异常信号采集（cron 写入）
├── README.md        # 状态 + 里程碑 + 技术栈 + 规模标记
├── WORK_LOG.md      # 按日期的进展日志
├── ISSUES.md        # 活跃问题追踪
└── CHANGES.md       # 变更记录
```

**STATE.json 初始内容：**
```json
{
  "project": "<project-name>",
  "scale": "M",
  "current_phase": 2,
  "current_step": 2,
  "step_status": {"1": "done", "2": "in_progress", "3": "pending", "4": "pending", "5": "pending", "6": "pending"},
  "active_subagents": [],
  "last_checkpoint": "<ISO-8601>",
  "drift_score": 0.0,
  "decisions_count": 0,
  "updated_at": "<ISO-8601>"
}
```

**DECISIONS.md 初始内容：**
```markdown
# 决策日志：<project-name>

> 每条决策格式：D{NNN} — {date} — {title}
> 包含：触发问题、考虑方案、选择、理由、失效条件
```

**SIGNALS.md 初始内容：**
```markdown
# 异常信号：<project-name>

> 由 cron job 自动写入。PM 定期检查并处理。
```

README.md 必须包含：
- 项目名称和描述
- 规模标记（S/M/L）
- 里程碑列表（带状态）
- 技术栈
- 预计工期

### Phase 2: 设计

#### Step 3 — Brainstorming（M/L 级必做）

🔴 **CHECKPOINT · 设计门控** — 不跳过 brainstorming，不在用户批准前写代码。所有开放问题澄清后，展示完整设计概要，等用户明确说"可以"后才进入 Step 4。🛑 STOP if 用户未批准。

流程：
1. 逐个提出开放问题（一次一个，不合并）
2. 每个问题给出 A/B/C 选项 + 推荐理由
3. 用户选择后 **写入 DECISIONS.md**：
   ```
   ## D001 — {date} — {决策标题}
   **触发问题：** {为什么需要做这个决策}
   **考虑方案：** A) ... B) ... C) ...
   **选择：** {B}
   **理由：** {为什么选这个}
   **验证状态：** ⏳ 待 Phase 7 验证
   **失效条件：** {什么情况下这个决策不再适用}
   ```
4. 更新 STATE.json：`decisions_count` +1，`current_step` = 3
5. 所有问题澄清后，写完整设计概要
6. 用户明确批准后才进入下一步

**M 级简化规则**：开放问题数量 = `ceil(关键决策维度 / 2)`。不足 2 个 → 补充边界条件问题；超过 5 个 → 合并关联问题，控制 brainstorming 时间在 15 min 内。

#### Step 4 — 写计划（M/L 级必做）

产出两个文件：
- **Spec:** `docs/superpowers/specs/YYYY-MM-DD-<name>-design.md`
- **Plan:** `docs/superpowers/plans/YYYY-MM-DD-<name>-implementation.md`

##### 4.1 GOAP 目标分解（L 级必做，M 级跳过）

> 移植自 Ruflo GOAP A* Planner (v3/goal_ui/src/lib/goapPlanner.ts)，MIT License。
> 本地实现：`~/.openclaw/skills/dev-pm/scripts/goap-planner.ts`

**核心思想**：高层目标 → 前置条件/效果分析 → A* 状态空间搜索 → 最短可行路径 → 可执行 Task 序列。

**使用场景**：
- 目标模糊（"重构认证系统" 但不知道从哪开始）
- 依赖关系复杂（多模块交叉）
- 用户给了终点状态但没有路径

**执行步骤**（每步必做）：

1. **定义目标状态**：从 brainstorming 结论中提取 `goal_state`
   ```json
   { "auth_refactored": true, "tests_passing": true, "pr_merged": true }
   ```

2. **定义初始状态**：扫描项目现状
   ```json
   { "spec_approved": true, "auth_refactored": false, "tests_passing": false, "pr_merged": false }
   ```

3. **列举可用 Actions**：每个 Action 有 `preconditions` + `effects` + `cost`
   ```json
   {
     "name": "implement_jwt_auth",
     "preconditions": { "spec_approved": true },
     "effects": { "auth_refactored": true },
     "cost": 2,
     "assign_to": "subagent",
     "files": ["src/auth/jwt.ts"],
     "test": "test/auth.test.ts"
   }
   ```

4. **运行 GOAP Planner**：
   ```bash
   echo '{"goal":{...},"initial":{...},"actions":[...]}' | \
     npx tsx ~/.openclaw/skills/dev-pm/scripts/goap-planner.ts
   ```
   输出 JSON 包含：`steps[]`（有序任务列表，含 `deps` 依赖关系）、`total_cost`、`goal_met`。

5. **将输出写入 Plan 文件**：把 `steps[]` 转为 markdown 格式

**Plan 格式（GOAP 增强）**：
```markdown
## Plan: <project-name>
### Goal State
<goal_state JSON>

### Initial State
<current_state JSON>

### Task Graph (A* Path)
- [ ] T1: <action_name> — cost=X, deps=[]
  - preconditions: <what must be true>
  - effects: <what becomes true after>
  - files: <list>
  - test: <fail test first>
  - assign: subagent | exec | main
- [ ] T2: <action_name> — cost=X, deps=[T1]
  ...

### Replan Triggers
- <condition> → replan from T<N>
- <condition> → back to brainstorming
```

**Replan 规则**（自适应重规划）：
- TDD 红灯 > 3 次 → replan 该 Task
- 依赖 Task 失败 → replan 下游所有 Task
- 用户中途变更需求 → 从变更点重新运行 GOAP Planner
- drift_score > 0.3 → 触发 §4.4 漂移检测，必要时 replan

**失败 fallback**：
- A* 搜索无结果 → 自动降级为贪心选择（greedy fallback），在输出 `metadata.source` 中标注
- 贪心也无结果 → 🛑 STOP，告知用户"当前 Actions 无法达成目标，需回到 brainstorming 补充 Actions"
- `goap-planner.ts` 执行超时 (>10s) → 降级为人工手动编排

**反例（不要做）**：
- ❌ 不对 S 级项目使用 GOAP（3 步以内直接写 plan）
- ❌ 不在 Actions < 3 个时使用 GOAP（A* 需要组合空间才有优势，< 3 个直接线性排列即可，手动编排更快更可靠）
- ❌ 不跳过 `--initial` 状态扫描（空的初始状态会导致错误的规划路径）

##### 4.2 简易计划模式（S 级 / M 级）

不使用 GOAP，直接按传统 Plan 格式。

每个 Task 用 checkbox 语法，格式模板：

```markdown
- [ ] T1: <动词+宾语> — 预计 X min
  - files: src/auth.ts, test/auth.test.ts
  - fail_test: `npm test -- --grep 'auth should reject expired token'` → 预期失败
  - impl: 实现 JWT 验证逻辑
  - pass_test: `npm test -- --grep 'auth'` → 全部通过
  - commit: `feat(auth): add JWT token verification`
```

**Task 拆分规则**：每个 Task 耗时 15-60 min。> 60 min → 拆分为 2 个 Task。< 15 min → 合并到相邻 Task。

#### Step 5 — 可复用资产审计（M/L 级必做）

产出三列清单：
1. **直接复用** — 哪些脚本/API/数据可以直接调用？
2. **需要适配** — 哪些功能已有但接口不同？
3. **必须新建** — 哪些能力完全缺失？

审计路径：
- `~/.openclaw/skills/` — 现有技能
- `scripts/` — 现有脚本
- `data/` — 现有数据
- API endpoints — 已有服务
- `notes/resources/` — 知识库

### Phase 3: 开发

#### Step 6 — 执行（所有规模必做）

**Subagent 派发决策：**

```
独立？ > 5min？ > 无 TTY？ > 无状态共享？
  ✅ 全部满足 → sessions_spawn
  ❌ 任一不满足 → exec 或主 agent 直接执行
```

**Subagent 提示模板：**
每个 subagent 的 task 必须包含：
- 具体范围（一个 test 文件或子系统）
- 清晰目标（让这些测试通过）
- 约束条件（不要改哪些文件）
- 预期输出（summary of changes）

**主 agent 职责：**
- 按 plan 拆分 task
- spawn subagents（无依赖的 task 并行）
- spawn 后立即更新 STATE.json `active_subagents` 列表
- `sessions_yield` 等待完成
- 每个 subagent 完成后从 `active_subagents` 移除 + 更新 STATE.json
- 验证每个 subagent 的输出
- 失败的 task 单独重试

### Phase 4: 验证与收尾

🔴 **Phase 4 是项目价值的最后一道防线，不允许用户手动提示才执行。** 进入此 phase 后，Step 7→8→9→10 按序自动触发。

**自动化触发断言**（Step 6 最后一个 subagent 完成后自动执行）：
```
Step 7 验证 → 通过？→ Step 8 审查
                    ↓ 不通过
              回 Step 6 修复（最多 3 轮，仍不过 → 提升规模等级）

Step 8 审查 → 无 Critical/Important？→ Step 9 收尾
                    ↓ 有
              修复 → 回 Step 7 重新验证

Step 9 收尾 → 交付确认？→ Step 10 蒸馏（自动触发，不等用户提示）

Step 10 蒸馏 → 写入完成？→ Step 11 归档
                    ↓ 技能缺陷发现
              更新 SKILL.md / skill_workshop → 继续归档
```

#### Step 7 — 验证（所有规模必做）

🔴 **CHECKPOINT · 质量门控** — 以下检查项必须全部通过：
- [ ] 所有测试通过
- [ ] Lint 无 error
- [ ] 构建成功（有构建配置的项目必检；纯脚本项目此项标注 N/A 并跳过）
- [ ] 新代码有对应测试

🛑 STOP if 任一项不通过 → 标记 ISSUES.md，回到 Step 6 修复，修复后重新跑本检查点。

#### Step 8 — 代码审查（S 级必做简化版，M/L 级必做完整版）

🔴 **本步骤不可跳过。** NFMD Review 案例证明：跳过审查导致 verifyAdmin 重复实现 3 次、NEXT_PUBLIC_ 泄露敏感 key 等问题。

**使用 `requesting-code-review` + `receiving-code-review` 技能**，派发独立 reviewer 子智能体审查代码，然后用 receiving-code-review 的技术评估流程处理反馈。

**触发条件**（任一满足即触发完整审查；S 级无命中则做简化审查）：
- 新增或修改文件 ≥ 3 个
- 涉及安全/认证/权限相关代码
- 涉及数据库操作
- 用户明确要求审查

**S 级简化审查**（不满足触发条件时）：
- 主 agent 自行过一遍变更文件（`git diff HEAD~1`）
- 检查：敏感信息泄露、重复代码、缺失错误处理
- 结果记录到 WORK_LOG

**M/L 级完整审查 — 执行流程**：

1. **获取 git range**：
   ```bash
   BASE_SHA=$(git log --oneline | grep -E "(Task 1|milestone|plan)" | head -1 | awk '{print $1}') || git rev-parse HEAD~5
   HEAD_SHA=$(git rev-parse HEAD)
   ```

2. **派发 `requesting-code-review` 子智能体**（独立 context，不看主 agent 历史）：
   ```
   sessions_spawn(
     task: """你是独立代码审查员（superpowers:code-reviewer）。
     使用 requesting-code-review 技能审查以下变更。

     【实现了什么】{WHAT_WAS_IMPLEMENTED}
     【需求/计划】{PLAN_OR_REQUIREMENTS}
     【Git Range】{BASE_SHA}..{HEAD_SHA}
     【简述】{DESCRIPTION}

     审查维度：正确性、安全性、重复代码、错误处理、性能（N+1 查询等）。
     反馈格式：🔴 Critical / 🟡 Important / 🔵 Minor，每条附文件名+行号+具体建议。
     """,
     context: "isolated",
     mode: "run"
   )
   ```
   ⚠️ reviewer 必须用 `isolated` context，不能看到主 agent 的思考过程。

3. **等待审查结果**：`sessions_yield`

4. **用 `receiving-code-review` 技能处理反馈**（技术评估，不是盲目执行）：
   - 验证每条反馈是否适用于当前代码库（不是所有建议都对）
   - 对错误的反馈：用技术理由 push back
   - 对 YAGNI 违规：「这个功能没人调用，删掉？」
   - **按优先级实施**：
     - 🔴 Critical → 立即修复，修复后重新触发 Step 7 验证
     - 🟡 Important → 修复后提交，由 PM 决定是否重新触发 Step 7 验证
     - 🔵 Minor → 记录到 ISSUES.md，后续处理

5. **所有 Critical/Important 修复后** → 继续到 Step 9

**失败 fallback**（三段式）：
- 子智能体超时（> 15 min）→ 降级为主 agent 自行审查（标注 `dry_run` 到 WORK_LOG）
- 降级审查也超时 → 至少做安全扫描（敏感 key 泄露、SQL 注入、未授权 API）
- 无代码变更（S 级小修）→ 标注原因到 WORK_LOG，跳过本步

🔴 **CHECKPOINT · 审查通过** — 确认无 Critical/Important 遗留后才继续。所有审查结果（含 push back 理由）记录到 WORK_LOG。

#### Step 9 — 分支收尾（M/L 级必做，S 级 commit 后跳过）

**使用 `finishing-a-development-branch` 技能**，完成代码合并流程。

🔴 **本步骤不可跳过（M/L 级）。** 项目做完不收尾 = 下次分叉无起点。

**执行流程**：

1. **再次确认测试通过**（Step 7 的结果可能因 Step 8 修复而变化）：
   ```bash
   npm test / pytest / go test ./...
   ```
   测试不过 → 回 Step 6 修复，不进入收尾。

2. **确定基准分支**：
   ```bash
   git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
   ```
   或问用户确认。

3. **向用户呈现 4 个选项**（finishing-a-development-branch 标准流程）：
   ```
   实现完成。你希望怎么处理？

   1. Merge back to <base-branch> locally
   2. Push and create a Pull Request
   3. Keep the branch as-is（稍后手动处理）
   4. Discard（丢弃本分支）
   ```

4. **执行用户选择**：

   **Option 1 — Merge locally**：
   ```bash
   git checkout <base-branch> && git pull && git merge <feature-branch>
   <test command>  # 合并后重新跑测试
   git branch -d <feature-branch>
   ```

   **Option 2 — Push + PR**：
   ```bash
   git push -u origin <feature-branch>
   gh pr create --title "<title>" --body "$(cat <<'EOF'
   ## Summary
   <2-3 bullets>
   ## Test Plan
   - [ ] <verification steps>
   EOF
   )"
   ```

   **Option 3 — Keep as-is**：报告分支名 + worktree 路径，不清理。

   **Option 4 — Discard**：必须用户输入 `discard` 确认后才执行。

5. **清理 worktree**（Option 1/4）：
   ```bash
   git worktree list | grep $(git branch --show-current) && git worktree remove <path>
   ```

**已在 main 上开发的情况**：
- 跳过 merge/PR 步骤
- 确认 `git push` 完成
- 确认构建和测试最终状态

**失败 fallback**：
- merge 冲突 → 列出冲突文件让用户决定解决策略
- push 被拒 → `git pull --rebase` 后重试，仍失败则通知用户

🔴 **CHECKPOINT · 交付确认** — 向用户展示交付物摘要（改了什么、测试结果、PR 链接），等确认后进入归档。

#### Step 10 — 经验蒸馏（所有规模必做）

🔴 **本步骤不可跳过。** NFMD Review 案例证明：跳过经验蒸馏导致「先写代码再 review 会欠技术债」「verifyAdmin 重复 3 遍」等教训只能靠事后手动补录，而且没有反向更新技能本身。

**自动触发条件**：Step 9 完成后立即执行。不需要用户手动提示。

**执行流程**：

1. **结构化回顾** — 扫描以下数据源提取经验：
   - `WORK_LOG.md` — 执行过程中的问题记录
   - `ISSUES.md` — 遇到的问题和解决方案
   - `DECISIONS.md` — 哪些决策对了/错了
   - `CHANGES.md` — 方向变更记录
   - `git log --oneline` — commit 历史中的返工迹象

2. **回答 3 个必答题**：
   - 做对了什么？（可复用的模式/决策）
   - 做错了什么？（反模式/踩坑/返工，附量化损失）
   - 下次遇到类似项目应该怎么做？（具体、可操作的建议）

3. **写入持久化存储**（按优先级）：
   - `MEMORY.md` — 蒸馏为长期记忆（非原始日志）
   - `memory/YYYY-MM-DD.md` — 当天关键事项
   - `.learnings/LEARNINGS.md` — 可操作知识
   - `.learnings/ERRORS.md` — 错误和教训

4. **按 PARA 整理**（见 Step 11）

5. **🔴 反向更新技能（技能闭环）** — 如果经验暴露了技能缺陷：
   - 缺失流程步骤 → 用 `skill_workshop suggest` 提出改进建议
   - 错误的自动化触发条件 → 更新对应 SKILL.md 的触发逻辑
   - 新的反模式 → 补充到技能的反例黑名单
   - PM 自身流程问题 → 更新本文件（dev-pm SKILL.md）
   - **不写技能更新 = 蒸馏闭环未完成 = 🛑 STOP，补完再继续**

**经验蒸馏检查清单**：
- [ ] 安全/认证教训？→ 写入 MEMORY.md + TOOLS.md
- [ ] 架构/设计模式？→ 写入 notes/resources/
- [ ] 流程/工具改进？→ 更新对应技能 + skill_workshop
- [ ] 返工/踩坑经历？→ 写入 MEMORY.md + ERRORS.md
- [ ] 可复用代码模式？→ 写入 notes/resources/templates/
- [ ] 🔴 技能缺陷发现？→ 更新 SKILL.md 或提交 skill_workshop 建议

**失败 fallback**（三段式）：
- MEMORY.md 写入失败 → 降级为写入 daily log
- daily log 也失败 → 输出蒸馏摘要到终端，提醒用户手动保存
- 时间不够做完整蒸馏 → 至少做「3 个必答题」摘要，下次 session 补完

### Phase 5: 收尾

🔴 **CHECKPOINT · 交付确认** — Step 9 分支收尾完成后，向用户展示交付物摘要（改了什么、测试结果、PR 链接），等用户确认后再进入经验蒸馏和归档。

#### Step 11 — PARA 整理（M/L 级必做）

| 内容类型 | 归类 | 路径 |
|----------|------|------|
| 活跃项目 + 设计文档 | Projects | `notes/projects/<name>/` |
| 可复用资产审计 | Resources | `notes/resources/<name>-audit.md` |
| 经验教训 | Resources / MEMORY | `notes/resources/<topic>.md` |
| 已完成项目 | Archive | `notes/archive/<name>/` |

关键操作：
- 源文件保持 canonical 位置，notes/ 中用 symlink 指向
- 确认 `memory/notes → ../notes` symlink 正常

#### Step 12 — Tracker 更新 + 状态归档（M/L 级必做）

- WORK_LOG 最终更新
- README 状态更新为 ✅
- DASHBOARD 刷新
- 如果是 L 级：更新 OKR 进度
- **🔴 强制：更新 STATE.json 为完成状态：**
  ```json
  {
    "current_step": "done",
    "step_status": {"1": "done", "2": "done", ...},
    "active_subagents": [],
    "drift_score": <final_value>,
    "completed_at": "<ISO-8601>"
  }
  ```
- **清理 cron job：** 遍历 STATE.json 中 `signal_jobs` 的所有 job id，逐个 `cron remove`
- **STATE.json 移入归档：** `mv projects/<name>/STATE.json projects/<name>/STATE.archived.json`（保留历史但不再被恢复协议扫描）

---

## 4. 进度追踪

### 4.1 进度汇报格式

用户询问进展时，输出：

```markdown
## 项目进度：[项目名] — [S/M/L] 级

**当前阶段：** Phase X — [阶段名]
**整体进度：** ████████░░ 80%

| Step | 内容 | 状态 |
|------|------|------|
| 1 | 规划 | ✅ |
| 2 | Tracker | ✅ |
| 3 | Brainstorming | ✅ |
| 4 | Plan | ✅ |
| 5 | 审计 | ✅ |
| 6 | 开发 | 🔄 Task 3/5 |
| 7 | 验证 | ⏳ |
| 8 | Code Review | ⏳ |
| 9 | 分支收尾 | ⏳ |
| 10 | 经验蒸馏 | ⏳ |
| 11 | PARA 归档 | ⏳ |
| 12 | Dashboard | ⏳ |

**活跃问题：** [来自 ISSUES.md]
**下一步：** [当前 task 完成后的下一个]
```

### 4.2 里程碑触发

| 事件 | 动作 |
|------|------|
| Phase 完成 | 更新 WORK_LOG + 通知用户 |
| 遇到问题 | 立即写入 ISSUES.md |
| 方案变更 | 写入 CHANGES.md |
| 全部完成 | 通知用户 + 触发复盘 |

### 4.3 异常处理（三段式 fallback）

每条异常遵循「触发条件 / 一线修复 / 仍失败兎底」三段式：

| 异常 | 触发条件 | 一线修复 | 仍失败兎底 |
|------|----------|----------|------------|
| Subagent 失败 | `sessions_yield` 返回错误或超时 | `subagents(list)` 定位失败 task → 单独重试 1 次 | 主 agent 直接 exec 该 task，降级为串行执行 |
| Subagent 结果不符合预期 | 输出缺少预期字段或格式错误 | 给 subagent 补充约束重试 | 主 agent 手动修复输出 + 写入 ISSUES |
| Subagent 改了不该改的文件 | `git diff` 发现越权改动 | `git checkout -- <file>` 回滚越权文件 | 整体 `git stash` → 清理 → 重新派发 |
| Subagent 超时 | 单个 task > 10 分钟未返回 | 延长至 15 分钟重试 | 拆分为 2 个更小的 task 重新派发 |
| 验证不通过 | Step 7 任一检查项失败 | 定位失败测试 → 修复 → 重跑 | 写入 ISSUES.md + 通知用户，降低规模等级重做 |
| 方向变更 | 用户要求改方案或新增需求 | `git stash` → 记录变更到 CHANGES.md | 回到 brainstorming 重新确认方向，不在旧 plan 上修补 |
| DASHBOARD 过期 | 最后更新 > 3 天前 | 从最近里程碑回填，最多 3 个 | 承认数据缺失，从 WORK_LOG 重建关键节点 |
| 项目暂停 > 7 天 | WORK_LOG 无更新 > 7 天 | 标记 ⏸️ + 记录暂停原因 | 立即触发 PARA 归档，防止上下文丢失 |
| 多项目定位不清 | 用户问进展但当前项目不明确 | 扫描 `projects/` 找最近活跃项目 | 列出所有活跃项目让用户指定 |
| 计划方向全错 | 多个 task 连续失败或用户明确否定 | 🛑 STOP 执行 → 展示问题清单 | 回到 brainstorming 从头重做，不保留旧 plan |
| Code review 被跳过 | 主 agent 声称"代码简单不需要审查" | 🛑 STOP → 强制至少做安全扫描 | S 级做简化审查，M/L 级做完整审查 |
| Reviewer 反馈全被忽视 | Critical 修复数为 0 | 检查 receiving-code-review 流程是否执行 | 主 agent 回顾每条反馈逐条处理 |
| 经验蒸馏未执行 | Step 9 完成后直接进入 Step 11 | 🛑 STOP → 强制补做 Step 10 | 至少完成 3 个必答题 |

---

### 4.4 信号采集（M/L 级项目激活）

Step 2 后立即注册 4 个 cron job，job id 记入 STATE.json `signal_jobs`。归档时逐个 `cron remove` 清理。

🔴 **CHECKPOINT · 信号配置** — 注册完记录 job id。

| # | 信号 | 频率 | 阈值 | 决策 |
|---|------|------|------|------|
| 1 | `zombie` 僵尸任务 | 30min | 无输出 > 15min | 写 SIGNALS.md；> 30min → 🛑 通知用户 |
| 2 | `drift` 漂移检测 | 4h | drift_score > 0.3 | 🛑 STOP → brainstorming 重新对齐 |
| 3 | `heartbeat` 每日心跳 | 每天 09:00 CST | 无活动 > 48h | 询问：继续/暂停/归档 |
| 4 | `decision_review` 决策时效 | 每周一 10:00 CST | 未验证 > 14 天 | 标记需重新验证 |

**注册模板**（每个信号）：
```
cron add: name=dev-pm-<signal>-<project>, schedule={every/30min|4h|daily|weekly},
  sessionTarget=isolated, delivery=announce, timeout=120-180s
```

**STATE.json 字段**：`signal_jobs: { zombie, drift, heartbeat, decision_review }`

**Cron 失败 fallback**：cron 注册失败 → 写入 ISSUES.md + 降级为手动检查（每次 Step 6 后手动跑一次信号判断逻辑）。单个 cron 连续 3 次执行失败 → 删除该 job，降级为手动。

**Payload 详情**：每个信号读取 STATE.json + 对应文件（WORK_LOG / DECISIONS.md），按阈值判断是否写入 SIGNALS.md + announce。

---

### 4.5 状态感知：上下文恢复协议

**触发条件：** session 启动 + `projects/<name>/STATE.json` 存在 + `current_step` 不为 `done`。

**这个协议解决的核心问题：** L 级项目跨天、跨 session 执行时，新 session 的 agent 没有之前的上下文。靠文件重建完整状态。

#### 恢复流程（7 步）

```
🔴 RECOVERY PROTOCOL

1. 扫描 projects/*/STATE.json
   → 找到 current_step != "done" 的项目

2. 读 STATE.json
   → 定位：current_phase, current_step, active_subagents, drift_score

3. 读 DECISIONS.md
   → 理解：为什么在这里、做了什么决策、哪些待验证

4. 读 SIGNALS.md
   → 检查：是否有未处理的异常信号

5. 读最近 3 条 WORK_LOG
   → 知道：最近做了什么

6. 读活跃 subagent 状态
   → subagents(list) 确认是否有残留

7. 输出恢复摘要：
   "📌 项目 [X] 恢复。
    Phase [N] Step [M]。上次活动：[timestamp]。
    [P] 个未处理信号，[D] 条活跃决策，[S] 个残留 subagent。
    drift_score: [value]。
    下一步：[具体动作]"

🔴 CHECKPOINT · 恢复确认 — 等用户确认后才继续执行。
```

#### 恢复后的状态校验

恢复后**不直接继续**，先做以下校验：

| 检查项 | 方法 | 不通过动作 |
|--------|------|------------|
| Spec 仍在 | 确认 spec 文件存在且未被修改 | 文件丢失 → 从 MEMORY 恢复 |
| Plan 未过期 | plan 中的 task 列表与 STATE.json step_status 一致 | 不一致 → 以 STATE.json 为准，更新 plan |
| 无信号积压 | SIGNALS.md 无未处理条目 | 有未处理 → 先处理信号再继续 |
| Subagent 无残留 | subagents(list) 无活跃任务 | 有残留 → kill 或等待完成 |
| Drift 可接受 | drift_score < 0.3 | ≥ 0.3 → 先重新对齐再继续 |

---

## 5. 复盘归档

🔴 **CHECKPOINT · 复盘确认** — 复盘完成后展示给用户，等确认后再归档。如果用户说"某条经验不对"，修改后再归档。

### 5.1 复盘模板（M/L 级项目完成后必做）

```markdown
## 项目复盘：[项目名] — YYYY-MM-DD

### 基本信息
- 规模：S/M/L
- 预计工期：X 天
- 实际工期：Y 天
- Task 完成率：N/M

### 做得好的
1. ...
2. ...

### 做得不好的
1. ...（附量化损失）
2. ...

### 反模式检查
| 反模式 | 是否触发 | 损失 |
|--------|----------|------|
| 跳过 brainstorming | ☐ | — |
| 一个技能包打天下 | ☐ | — |
| 不做资产审计 | ☐ | — |
| 文档代码分离 | ☐ | — |
| DASHBOARD 不更新 | ☐ | — |
| Subagent 滥用 | ☐ | — |

### 度量
- 技能覆盖率：X%
- 返工率：X%
- 自动化率：X%
- 资产复用率：X%

### 经验教训（写入 MEMORY.md）
1. ...
2. ...

### 后续行动
- [ ] ...
```

### 5.2 经验蒸馏规则

复盘中的每条经验教训必须：
1. 写入 `MEMORY.md`（长期记忆）
2. 写入 `.learnings/LEARNINGS.md`（可操作的知识）
3. 如果是错误 → 写入 `.learnings/ERRORS.md`
4. 如果涉及技能改进 → 更新对应 SKILL.md
5. 如果涉及流程改进 → 更新本文件

### 5.3 Learning Loop — 轨迹学习闭环（L 级必做，M 级跳过）

> 移植自 Ruflo SONA + ReasoningBank 概念。将 agent 执行轨迹转化为可复用的决策模式。

**核心理念**：每个项目不是孤立的——过去的执行轨迹是未来决策的输入。

**数据流**：
```
Project 执行轨迹 (WORK_LOG + DECISIONS)
  ↓ 蒸馏
Trajectory Store (projects/_trajectories/)
  ↓ 索引
Pattern Library (projects/_patterns.md)
  ↓ 检索
未来项目 Step 4 GOAP 分解时的 Actions 来源
```

**执行步骤**：

1. **轨迹采集**（Step 6 执行过程中自动）
   - 每个 Task 完成时，记录到 `projects/_trajectories/<category>-<date>.jsonl`
   - 每条记录：`{ task_type, approach, result, duration, cost, success, lessons }`

2. **模式蒸馏**（§5 复盘时执行）
   - 扫描项目所有 Task 轨迹
   - 识别重复模式：同类任务的最优执行路径是什么？
   - 写入 `projects/_patterns.md`：
   ```markdown
   ## Pattern: <category>
   - **Trigger**: 什么时候遇到这类任务
   - **Optimal Path**: 最成功的执行序列
   - **Avg Duration**: X min
   - **Success Rate**: N%
   - **Failure Modes**: 常见失败方式
   - **Avoid**: 不应该做什么
   ```

3. **模式检索**（Step 4 GOAP 分解时使用）
   - 在列举可用 Actions 时，先查 `projects/_patterns.md`
   - 命中的 Pattern 直接生成 Action，cost 设为历史平均 duration
   - 未命中的 Pattern 标记为 "exploratory"，cost 设为估算值的 1.5x

4. **持续优化**
   - 每次复盘后更新 Pattern Library
   - 如果某个 Pattern 的成功率 < 60% → 标记为 "deprecated"
   - 如果某个 Pattern 连续 3 次成功 → 降低其 cost 值（优先使用）

**文件结构**：
```
projects/
├── _patterns.md          # 全局模式库
├── _trajectories/        # 原始轨迹
│   ├── api-integration-2026-05-30.jsonl
│   ├── data-pipeline-2026-05-28.jsonl
│   └── ...
├── ref-gap-fill/         # 正常项目目录
└── ...
```

**实例（NFMD Review 模块轨迹）**：

轨迹文件 `projects/_trajectories/fullstack-m-web-2026-06-02.jsonl`：
```jsonl
{"task_type":"api-design","approach":"shared-verify-module","result":"success","duration_min":45,"cost":2,"success":true,"lessons":"verifyAdmin 应第一时间提取为共享模块，不该写 3 遍"}
{"task_type":"batch-query","approach":"naive-n-plus-1","result":"poor-performance","duration_min":30,"cost":3,"success":false,"lessons":"30 params × 10 unique sources = 300 RPC → 改为按 source_file 去重后 10 RPC"}
{"task_type":"auth-security","approach":"next-public-prefix","result":"security-breach","duration_min":15,"cost":1,"success":false,"lessons":"NEXT_PUBLIC_ 前缀暴露到浏览器 JS，敏感 key 必须走 API route"}
```

蒸馏后写入 `projects/_patterns.md`：
```markdown
## Pattern: fullstack-api-auth
- **Trigger**: M/L 级 Web 项目涉及认证 + API route + 前端调用
- **Optimal Path**: Day 1 提取共享 verify 模块 → Day 2 实现 API route（不走 NEXT_PUBLIC_）→ Day 3 批量查询优化
- **Avg Duration**: 90 min
- **Success Rate**: 67%（2/3，N+1 和 NEXT_PUBLIC_ 是坑点）
- **Failure Modes**: N+1 查询、敏感 key 泄露、verify 重复实现
- **Avoid**: 不用 NEXT_PUBLIC_ 前缀放敏感 key；不做逐条 RPC 查询
```

### 5.4 度量体系

| 指标 | 计算方式 | 数据来源 | 目标值 |
|------|----------|----------|--------|
| 技能覆盖率 | `实际调用技能数 / 该规模应调用技能数 × 100%` | PLAN 文件中的技能引用 vs 实际 sessions_spawn/exec 记录 | > 80%（L 级） |
| 返工率 | `verification 不通过需重做的 task 数 / 总 task 数 × 100%` | Step 7 检查记录 | < 20% |
| 自动化率 | `subagent 完成的 task 数 / 总 task 数 × 100%` | WORK_LOG 中记录的执行方式 | > 60%（L 级） |
| 资产复用率 | `审计中"复用+适配"项数 / 审计总项数 × 100%` | Step 5 审计清单 | > 50%（Phase 3+） |
| 文档时效性 | `today - DASHBOARD 最后更新日期`（天数） | DASHBOARD.md git log | < 3 天 |
| 进度百分比 | `已完成 Step 数 / 该规模总 Step 数 × 100%` | tracker README 状态 | — |

---

## 6. 多智能体编排模式

### 6.1 何时需要多智能体

```
3+ 数据源？ OR 2+ 处理路径？ OR 混合实时/批量？
  → 多智能体编排

单系统、单路径、全同步？
  → 单 subagent 链或直接 exec
```

### 6.2 编排模式

| 模式 | 适用场景 | 示例 |
|------|----------|------|
| **编排器 + 专线 Worker** | 多数据源、多处理路径 | nucpot-db 编排 + librarian + extractor |
| **快慢线分离** | 实时 + 批量混合 | 快线：同步搜索提取；慢线：cron 消化回填 |
| **三级缓存降级** | 数据源有优先级 | L1 本地 → L2 远程 → L3 知识库 |
| **质量门控分级** | 输出置信度不同 | high → auto, medium → pending_review |

### 6.3 多智能体协作规则

1. Agent 间用**文件（JSON）**通信，不用内存状态
2. 单个 agent 失败**不阻塞**其他 agent
3. 写入操作必须**幂等**（去重检查）
4. 每个 agent 设**独立超时**：默认 10 分钟，数据提取类 15 分钟，外部 API 类 20 分钟
5. 缓存查询结果，**同一个 gap 不查两次**
6. Subagent task 上限：单次并行 ≤ 4 个，避免 API 限流

---

## 7. 技能委派映射

作为 PM，你不需要亲自执行每个技能，你需要**知道什么时候委派给谁**。

### 7.1 委派表

> 技能文件统一前缀：`~/.openclaw/skills/<skill-name>/SKILL.md`

| 阶段 | 委派给 | 技能 | 路径 |
|------|--------|------|------|
| 战略规划 | 主 agent | strategic-goal-tracking | `~/.openclaw/skills/strategic-goal-tracking/SKILL.md` |
| 需求分析 | 主 agent + 用户 | brainstorming | `~/.openclaw/skills/superpowers/brainstorming/SKILL.md` |
| 方案设计 | 主 agent | writing-plans | `~/.openclaw/skills/superpowers/writing-plans/SKILL.md` |
| 资产审计 | 主 agent | find-skills + 文件搜索 | `~/.openclaw/skills/find-skills/SKILL.md` |
| 代码开发 | subagent | subagent-driven-development | `~/.openclaw/skills/superpowers/subagent-driven-development/SKILL.md` |
| 并行开发 | 多 subagent | dispatching-parallel-agents | `~/.openclaw/skills/superpowers/dispatching-parallel-agents/SKILL.md` |
| 质量验证 | subagent 或主 agent | verification-before-completion | `~/.openclaw/skills/verification-before-completion/SKILL.md` |
| 代码审查 | 独立 reviewer | requesting/receiving-code-review | `~/.openclaw/skills/superpowers/requesting-code-review/SKILL.md` + `~/.openclaw/skills/superpowers/receiving-code-review/SKILL.md` |
| 合并发布 | 主 agent | finishing-a-development-branch | `~/.openclaw/skills/superpowers/finishing-a-development-branch/SKILL.md` |
| DB 变更 | 主 agent | nfmd-db-ops | `~/.openclaw/skills/nfmd-db-ops/SKILL.md` |
| 知识归档 | 主 agent | para-second-brain | `~/.openclaw/skills/para-second-brain/SKILL.md` |

### 7.2 Skill Discovery — 技能发现协议（Step 5 资产审计增强）

> 灵感来源：Ruflo Plugin Marketplace。项目开始前自动扫描可用能力，避免重复造轮子。

**问题**：现有 §7.1 是静态映射表，无法发现新安装的技能或社区技能。Step 5 资产审计依赖手动搜索。

**解决方案**：三步自动发现流程。

#### Step A: 扫描本地技能库
```bash
# 列出所有已安装技能
ls ~/.openclaw/skills/*/SKILL.md ~/.openclaw/workspace/skills/*/SKILL.md 2>/dev/null
```
对每个 SKILL.md，提取 frontmatter（name + description + 触发词），生成**技能索引**。

#### Step B: 匹配项目需求
读取 brainstorming / spec 中的关键能力需求，与技能索引做关键词匹配。
匹配规则：
- 技能 description 包含项目关键术语 → **直接复用**
- 技能 description 部分相关 → **需要适配**
- 无匹配 → **必须新建**（或寻找外部工具）

#### Step C: 生成能力缺口报告
```markdown
## Capability Gap Report: <project-name>

### 直接复用
| 技能 | 覆盖范围 | 调用方式 |
|------|----------|----------|
| executing-plans | Task 执行 | sessions_spawn |
| ... | ... | ... |

### 需要适配
| 技能 | 差距 | 适配工作量 |
|------|------|------------|

### 缺失能力
| 能力 | 建议方案 | 优先级 |
|------|----------|--------|
| <描述> | 新建技能 / exec 脚本 / 外部 API | P0/P1/P2 |
```

**与 GOAP 的联动**：
- Capability Gap Report 中的"缺失能力"直接影响 GOAP 的 Action cost
- 缺失 = 需要新建 = 更高 cost = A* 会尽量避开，优先走已有能力
- 这迫使项目计划复用已有资产而非重复造轮子

---

## 8. 常见场景决策速查

### 用户说"帮我做个 X"

```
1. 评估规模（§1）
2. 告知用户规模和流程
3. 按规模执行流水线（§2）
```

### 用户说"X 项目进展如何"

```
1. 检查项目状态：
   - STATE.json 存在且 current_step != "done" → 活跃项目
   - STATE.archived.json 存在 → 已归档，读 README 汇总即可
   - projects/<X>/ 不存在 → 扫描 projects/ 找活跃项目
2. 活跃项目：读 README + WORK_LOG(最近3条) + ISSUES + STATE.json
3. 暂停项目（⏸️）：先汇报进展，再提示 §4.5 恢复协议
4. 输出进度汇报（§4.1）
```

### 用户说"X 项目遇到问题了"

```
1. 记录到 ISSUES.md
2. 评估是否需要变更（写入 CHANGES.md）
3. 如果影响计划 → 回到 brainstorming 重新确认方向
4. 如果只是执行问题 → 调整 task 派发策略
```

### 用户说"X 项目做完了"

```
1. 触发验证（Step 7）
2. 触发代码审查（Step 8）
3. 触发分支收尾（Step 9）
4. 触发经验蒸馏（Step 10）
5. 触发 PARA 归档（Step 11）
6. 更新 DASHBOARD（Step 12）
```

### 用户说"X 项目暂停了"

```
1. 记录暂停原因到 WORK_LOG
2. 如果暂停 > 7 天 → 立即归档
3. 否则标记状态为 ⏸️ 暂停
```

### 用户说"继续 X 项目"（或 session 启动自动触发）

```
1. 执行 §4.5 上下文恢复协议
2. 检查 SIGNALS.md 是否有未处理信号
3. 检查 drift_score 是否超阈值
4. 输出恢复摘要 + 等用户确认
5. 继续执行当前 step
```

### 用户问"项目健康度如何"

```
1. 读 STATE.json（drift_score + step_status + active_subagents）
2. 读 SIGNALS.md（未处理信号数）
3. 读 DECISIONS.md（未验证决策数 + 年龄）
4. 输出健康度报告：
   - 进度：X/Y steps done
   - 漂移：drift_score
   - 信号：N 条未处理
   - 决策：M 条待验证（最老 D 天）
   - 结论：🟢 健康 / 🟡 需关注 / 🔴 需干预
```

---

## 9. 反模式检查清单

项目过程中，定期自检：

| # | 反模式 | 自检问题 |
|---|--------|----------|
| 1 | 跳过 brainstorming | "我是不是直接开始写代码了？" |
| 2 | 一个技能包打天下 | "这个 pipeline 是不是太 monolithic 了？" |
| 3 | 不做资产审计 | "我有没有检查已有的脚本和数据？" |
| 4 | 文档代码分离 | "tracker 和代码在同一个仓库吗？" |
| 5 | DASHBOARD 不更新 | "上次更新 DASHBOARD 是什么时候？" |
| 6 | Subagent 滥用 | "这个 task < 5min，是不是该用 exec？" |
| 7 | Session 互斥 | "A2A dispatch 是不是用了独立 agent？" |
| 8 | WORK_LOG 混入 | "项目进展和个人日志分开了吗？" |
| 9 | OKR 脱钩 | "这个项目推进哪个 KR？" |
| 10 | PARA 积压 | "有没有 > 2 周未归档的完成项目？" |
| 11 | **跳过 code review** | "Step 8 执行了吗？结果记录了吗？" |
| 12 | **跳过经验蒸馏** | "Step 10 执行了吗？技能闭环补完了吗？" |
| 13 | **重复代码未提取** | "code review 发现的重复模式提取了吗？" |
| 14 | **Reviewer bias** | "reviewer 用了 isolated context 吗？" |

---

## 10. 回滚策略

| 做错场景 | 补救方法 |
|----------|----------|
| 跳过 brainstorming，已经写了 500 行 | `git stash` → 补 brainstorming → 评估方向 → 决定继续或重写 |
| Subagent 全部失败 | `subagents(list)` 定位 → 单独重试 → 检查 task 边界 |
| DASHBOARD 过期 2 周 | 从最近里程碑回填，最多 3 个 |
| PARA 积压 3 个项目 | 按重要性排序，先整理活跃项目 |
| 技能文件改坏 | `git checkout -- <skill-path>` |
| Monolithic 要拆分 | 先补 brainstorming → 逐模块拆分（不重写）→ 每模块测试 |
| 计划方向全错 | 停止执行 → 回到 brainstorming → 不在旧计划上修修补补 |
| Code review 发现大量重复代码 | `git stash` → 提取公共模块 → 重跑 Step 7 验证 |
| 经验蒸馏发现技能缺陷 | 更新对应 SKILL.md / 提交 skill_workshop 建议 → 下次项目生效 |

---

*Dev PM: 规模适配、流程驱动、质量门控、闭环复盘。*

---

## Appendix A: 操作黑名单

> 以下操作是 dev-pm 的**红灯动作**，遇到任何一条立即 🛑 STOP：

| # | 红灯动作 | 替代方案 |
|---|----------|----------|
| 1 | 不做规模评估直接执行 | 先判断 S/M/L |
| 2 | 跳过 brainstorming 直接写代码（M/L 级） | 完成设计门控 |
| 3 | 用户未批准就进入开发阶段 | 等待明确确认 |
| 4 | 单 agent 撑全部 L 级项目 | 按 §6 拆分 subagent |
| 5 | 验证不通过就合并 | 修复后重新通过 Step 7 |
| 6 | DASHBOARD 连续 3 个里程碑不更新 | 强制刷新后才能继续 |
| 7 | 复盘归档时覆盖用户原始数据 | 只追加不覆盖 |
| 8 | 把 S 级项目当 L 级管理 | 按 §1 规模适配 |
| 9 | **跳过 code review 直接合并** | 强制执行 Step 8（至少安全扫描）|
| 10 | **跳过经验蒸馏直接归档** | Step 10 不可跳过，至少完成 3 个必答题 |
| 11 | **code review 后不处理 Critical 反馈** | 所有 Critical 修复后才能继续 |
| 12 | **reviewer 不用 isolated context** | sessions_spawn(context: "isolated") 防止偏差 |
| 13 | **分支收尾不清理 worktree** | 按 finishing-a-development-branch 选项清理 |

## Appendix B: 项目路径约定

```
<workspace>/
├── projects/<project-name>/        # M/L 级项目 tracker 目录
│   ├── STATE.json               # 🆕 状态机快照（唯一真相源）
│   ├── DECISIONS.md             # 🆕 决策日志（含失效条件）
│   ├── SIGNALS.md               # 🆕 异常信号采集
│   ├── README.md                # 状态 + 里程碑 + 技术栈 + 规模标记
│   ├── WORK_LOG.md              # 按日期的进展日志
│   ├── ISSUES.md                # 活跃问题追踪
│   └── CHANGES.md               # 变更记录
├── docs/superpowers/specs/          # spec 文件
├── docs/superpowers/plans/          # plan 文件
├── notes/projects/<name>/           # PARA Projects（symlink 指向 tracker）
├── notes/resources/<name>-audit.md  # 资产审计文件
└── notes/archive/<name>/            # 已归档项目
```

S 级项目不需要创建 tracker 目录，直接在 workspace 下工作。
M/L 级项目必须创建 tracker 目录，路径为 `projects/<project-name>/`。
