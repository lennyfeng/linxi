# Decision Model: ASIN 新品机会分析工作流

**Feature**: `002-asin-opportunity-workflow`  
**Perspective**: 高级产品经理  
**Purpose**: 将 ASIN 数据分析转化为可追踪、可复核、可协同的新产品开发决策流程。

---

# 1. Product Positioning

This module is a **new product opportunity decision workspace**, not only an ASIN research page.

It helps the team answer:

1. 是否存在真实市场机会？
2. 是否存在可被设计解决的差异化空间？
3. 是否具备成本、供应链和利润可行性？
4. 应该推进、暂缓、打样、立项，还是终止？

The system provides structured evidence and recommendations. Final decisions remain human-owned and must be traceable.

---

# 2. Workflow State Machine

## 2.1 Batch Status

| Status | Label | Meaning |
| --- | --- | --- |
| `submitted` | 已提交 | 批次已创建，ASIN 已解析入库 |
| `analyzing` | 分析中 | 系统正在分析批次内 ASIN |
| `completed` | 已完成 | 批次内 ASIN 分析完成 |
| `partially_failed` | 部分失败 | 部分 ASIN 分析失败，可重试 |
| `cancelled` | 已取消 | 批次被终止，不再推进 |

## 2.2 Item Workflow Status

| Status | Label | Owner | Meaning |
| --- | --- | --- | --- |
| `pending` | 待分析 | System | ASIN 已入库但未分析 |
| `analyzing` | 分析中 | System | 正在采集和评分 |
| `analysis_failed` | 分析失败 | System / PM | 采集或评分失败 |
| `review_required` | 待人工复核 | PM | 系统结论冲突或不确定 |
| `design_evaluation` | 待设计评估 | Designer | 已通过一轮机会判断 |
| `design_submitted` | 设计已提交 | PM | 设计师已提交差异化评估 |
| `design_rework` | 设计需修改 | Designer | PM 要求补充或修改设计方案 |
| `cost_evaluation` | 待成本评估 | Procurement / PM | 设计机会通过，进入商业可行性判断 |
| `sampling` | 打样中 | Procurement / PM | 成本/打样判断通过 |
| `project_approved` | 已立项 | PM / Management | 已通过打样或商业评审 |
| `rejected_round_1` | 一轮淘汰 | PM | 市场机会阶段淘汰 |
| `design_rejected` | 设计淘汰 | PM | 设计评估阶段淘汰 |
| `terminated` | 已终止 | PM / Management | 成本、供应链、风险或战略原因终止 |

## 2.3 Required Transition Rules

| From | Action | To | Reason Required |
| --- | --- | --- | --- |
| `pending` | start_analysis | `analyzing` | No |
| `analyzing` | analysis_completed_recommend | `design_evaluation` | No |
| `analyzing` | analysis_completed_review | `review_required` | No |
| `analyzing` | analysis_completed_reject | `rejected_round_1` | Yes |
| `analyzing` | analysis_failed | `analysis_failed` | Yes |
| `analysis_failed` | retry_analysis | `analyzing` | No |
| `review_required` | next_round | `design_evaluation` | No |
| `review_required` | reject | `rejected_round_1` | Yes |
| `rejected_round_1` | override_next_round | `design_evaluation` | Yes |
| `design_evaluation` | submit_design | `design_submitted` | No |
| `design_submitted` | approve_design | `cost_evaluation` | No |
| `design_submitted` | request_design_changes | `design_rework` | Yes |
| `design_submitted` | reject_design | `design_rejected` | Yes |
| `design_rework` | submit_design | `design_submitted` | No |
| `cost_evaluation` | approve_sampling | `sampling` | No |
| `cost_evaluation` | hold_cost | `cost_evaluation` | Yes |
| `cost_evaluation` | reject_cost | `terminated` | Yes |
| `sampling` | approve_project | `project_approved` | No |
| `sampling` | terminate | `terminated` | Yes |

---

# 3. Scoring Model

## 3.1 Score Dimensions

| Dimension | Weight | Product Meaning |
| --- | ---: | --- |
| Market Demand | 30% | 搜索、销量、销售额、需求趋势是否足够 |
| Competition Pressure | 20% | 头部垄断、商品数、评论门槛、广告竞争是否可控 |
| Design Opportunity | 25% | 差评痛点、结构优化、材质优化、套装/包装优化空间 |
| Profit Feasibility | 15% | 价格带、预估成本、毛利空间、物流影响 |
| Risk Control | -10% | 合规、侵权、季节性、退货、供应链复杂度等风险扣分 |

## 3.2 Recommendation Rules

| Recommendation | Rule |
| --- | --- |
| `recommend_next_round` | 综合机会分 ≥ 80，且风险分 < 70 |
| `manual_review` | 综合机会分 60-79，或关键维度出现冲突 |
| `reject` | 综合机会分 < 60，或风险分 ≥ 80，或出现硬性淘汰条件 |

## 3.3 Hard Rejection Conditions

即使综合分较高，也应直接淘汰或强制人工复核：

- 明显侵权或合规高风险
- 头部品牌/ASIN 点击或销量高度垄断
- Review 门槛远高于团队可承受范围
- 差评痛点不可通过设计或供应链解决
- 成本结构无法支撑目标毛利
- 产品强季节性且当前窗口不适合开发

---

# 4. Role and Permission Model

| Role | Main Responsibilities | Allowed Actions |
| --- | --- | --- |
| Product Designer | 提交 ASIN、填写设计评估、补充差异化方案 | create batch, submit design, revise design |
| Product Manager | 复核系统建议、推进/淘汰、审核设计、最终判断 | next round, reject, override, design review, terminate |
| Procurement | 评估成本、MOQ、供应商、打样周期 | submit cost/sample evaluation |
| Management | 查看漏斗、复核高价值机会、批准立项 | approve project, audit decisions |
| Admin | 系统配置和异常处理 | retry, cancel batch, manage permissions |

All override, rejection, termination, and project approval actions must write review history.

---

# 5. Decision Reason Taxonomy

## 5.1 Next Round Reasons

- `market_demand_clear`: 市场需求明确
- `competition_acceptable`: 竞争强度可接受
- `design_gap_found`: 存在明确设计改良空间
- `price_band_friendly`: 价格带友好
- `review_pain_point_clear`: 评论痛点明确

## 5.2 Rejection Reasons

- `market_too_small`: 市场容量不足
- `competition_too_high`: 竞争过强
- `brand_monopoly`: 品牌或头部 ASIN 垄断
- `no_design_space`: 无明显设计差异化空间
- `compliance_risk`: 合规或侵权风险高
- `cost_unworkable`: 成本结构不可行
- `supply_chain_risk`: 供应链风险高

## 5.3 Review Reasons

- `data_incomplete`: 数据不完整
- `score_conflict`: 评分维度冲突
- `needs_design_input`: 需要设计师判断
- `needs_cost_input`: 需要采购判断成本
- `strategy_uncertain`: 与当前产品策略匹配度不确定

---

# 6. Page Information Architecture

## 6.1 Batch List Page

Primary goal: 管理分析批次和漏斗入口。

Required sections:

- Batch keyword search
- Status filter
- Marketplace filter
- Batch table
- Batch counters: total, analyzed, recommended, rejected, failed
- Create batch action

## 6.2 Batch Detail Page

Primary goal: 批量完成一轮机会判断。

Recommended tabs:

1. Analysis Results
2. Design Evaluation
3. Cost/Sampling Evaluation
4. Decision History

Required batch-level actions:

- Retry failed analysis
- Export placeholder
- Batch progress summary

Required item-level actions:

- View report
- Next round
- Reject
- Override next round
- Submit design evaluation
- Review design
- Submit cost/sample evaluation

## 6.3 ASIN Report Drawer

Primary goal: 支撑单个 ASIN 的深度复核。

Required sections:

- Product basics
- Score breakdown
- Recommendation and reason
- MCP/raw snapshots
- Review history
- Design evaluation
- Cost/sample evaluation

---

# 7. Product Metrics

| Metric | Meaning |
| --- | --- |
| ASIN submitted count | 团队机会池输入规模 |
| Valid ASIN rate | 输入质量 |
| Analysis completion rate | 系统处理稳定性 |
| Recommended rate | 市场机会质量 |
| Manual review rate | 系统判断确定性 |
| Design pass rate | 机会是否具备可差异化能力 |
| Sampling approval rate | 商业可行性 |
| Project approval rate | 最终转化效率 |
| Average decision time | 流程效率 |
| Rejection reason distribution | 团队失败模式和品类风险 |
