# Quickstart: ASIN 新品机会分析工作流

## Prerequisites

- MySQL running at `127.0.0.1:3306`
- API running at `http://localhost:3100`
- Web running at `http://localhost:5173`
- Logged in as `admin`

## Expected MVP Flow

1. Open web app

```text
http://localhost:5173
```

2. Login

```text
username: admin
password: admin123
```

3. Navigate to 新品开发 > ASIN 新品机会分析

4. Create a new ASIN analysis batch

Example input:

```text
B0XXXXXX01
B0XXXXXX02
https://www.amazon.com/dp/B0XXXXXX03
```

5. Submit batch

Expected:

- System creates batch
- Valid ASIN items are created
- Duplicates and invalid ASINs are reported

6. Open batch detail

Expected:

- Batch funnel counters are visible: ASIN 总数, 已分析, 推荐进入下一轮, 已淘汰
- PM workspace tabs are visible: 分析结果, 设计评估, 成本/打样评估, 决策历史
- Items are listed in the 分析结果 tab
- Each item shows analysis status, workflow status, opportunity score, recommendation, price, rating, reviews, and monthly sales
- Mock/MCP-assisted analysis results are visible after processing

7. Mark item to next round

Expected:

- Item status changes to `design_evaluation`
- Review history is recorded

8. Submit design evaluation

Expected:

- Design fields are saved
- Item status changes to `design_submitted`

9. Review design evaluation

Expected:

- Approve moves item to `cost_evaluation`
- Request changes moves item to `design_rework`
- Reject moves item to `design_rejected`

10. Submit cost/sample evaluation

Expected:

- Item in `cost_evaluation` can open 成本/打样评估
- `approve_sampling` moves item to `sampling`
- `hold` keeps item in `cost_evaluation` and requires comment
- `reject` moves item to `terminated` and requires comment

11. Open ASIN report drawer

Expected:

- Product basics, score breakdown, snapshots, review history, design evaluation, and cost/sample evaluation are visible
- Decision history records action, status transition, reason/comment, and time

## Validation APIs

Health:

```text
GET http://localhost:3100/health
```

Batch list:

```text
GET http://localhost:3100/asin-opportunities/batches
```

Batch detail:

```text
GET http://localhost:3100/asin-opportunities/batches/{batchId}
```

Batch items:

```text
GET http://localhost:3100/asin-opportunities/batches/{batchId}/items
```

Batch metrics:

```text
GET http://localhost:3100/asin-opportunities/batches/{batchId}/metrics
```

The batch detail page uses this endpoint to show rejection reason distribution for product decision review.

Item report:

```text
GET http://localhost:3100/asin-opportunities/items/{itemId}/report
```

First-round decision:

```text
POST http://localhost:3100/asin-opportunities/items/{itemId}/decision
```

Design evaluation:

```text
POST http://localhost:3100/asin-opportunities/items/{itemId}/design-evaluation
POST http://localhost:3100/asin-opportunities/items/{itemId}/design-review
```

Cost/sample evaluation:

```text
POST http://localhost:3100/asin-opportunities/items/{itemId}/sample-evaluation
```

## Local Type Checks

Database migration:

```text
cd apps/api
node --import tsx src/database/migrate.ts
```

API:

```text
cd apps/api
node ../../node_modules/typescript/bin/tsc --noEmit
```

Web:

```text
cd apps/web
npx tsc --noEmit
```

Web production build:

```text
npm run build -w @internal-platform/web
```

## Role-Based Action Visibility Check

On the batch detail page, action buttons must be visible only when both workflow status and permission match:

| Action | Required Permission | Status Gate |
| --- | --- | --- |
| 重试 | `asin-opportunities.analysis.retry` | Any item visible in the result table |
| 进入下一轮 | `asin-opportunities.decision.write` | `review_required` |
| 淘汰 | `asin-opportunities.decision.write` | `review_required`, `design_evaluation` |
| 设计评估 | `asin-opportunities.design.submit` | `design_evaluation`, `design_rework` |
| 设计通过 | `asin-opportunities.design.review` | `design_submitted` |
| 退回修改 | `asin-opportunities.design.review` | `design_submitted` |
| 成本/打样 | `asin-opportunities.sample.submit` | `cost_evaluation` |

## Latest Local Validation Notes

- API dev service starts on `http://127.0.0.1:3100`.
- `GET /health` returns database status `connected` for local MySQL database `internal_platform`.
- Web dev service starts on `http://127.0.0.1:5173` when Vite is launched with `--host 127.0.0.1`.
- Local admin login is verified through `POST /auth/login` with the seeded admin account.
- ASIN workflow migration `012_asin_opportunity_workflow.sql` creates the required batch, item, review, design evaluation, and sample evaluation tables.
- Migration runner `node --import tsx src/database/migrate.ts` is verified to use the same local default database credentials as the API service and skip already executed ASIN migration idempotently.
- Batch creation is verified for valid ASIN input and mixed duplicate/invalid ASIN input.
- Batch list `status`, `keyword`, `page`, and `page_size` filters are verified through the API.
- Decision workflow is verified through `review_required -> design_evaluation -> design_submitted -> cost_evaluation -> sampling`.
- Reject and override decisions are verified to require structured reasons.
- ASIN write endpoints are verified to reject unauthenticated retry calls with `401`, while Super Admin can execute retry/decision/evaluation actions.
- ASIN sensitive write operations are verified to append `audit_logs` rows for `create_batch` and `retry_failed_items`.
- API TypeScript check and web production build pass after the workflow validation.
