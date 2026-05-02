# Research: ASIN 新品机会分析工作流

## Existing System Findings

### Backend

- API server entry: `apps/api/src/main.ts`
- Auth middleware: `apps/api/src/common/auth-middleware.ts`
- Database helper: `apps/api/src/database/index.ts`
- Job worker exists: `apps/api/src/jobs/worker.ts`
- Product development module exists: `apps/api/src/modules/product-dev/`
- Database uses `mysql2/promise`
- Environment config uses `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

### Frontend

- React + Vite + Ant Design
- API client: `apps/web/src/api/client.ts`
- API base URL: `/api`
- Vite proxy rewrites `/api` to backend path
- Product development pages exist under `apps/web/src/pages/product-dev/`

## SellerSprite MCP Integration Strategy

### Available MCP Capabilities

Recommended tools for this feature:

- `asin_detail` / `asin_detail_with_coupon_trend`: product basics, pricing, coupon, rating, listing quality
- `asin_prediction`: sales and revenue predictions
- `keepa_info`: historical price, BSR, review, seller trends
- `traffic_keyword` / `traffic_keyword_stat`: keyword traffic and source structure
- `traffic_listing` / `traffic_listing_stat`: related listings and association traffic
- `competitor_lookup`: comparable product discovery
- `review`: review content for pain point extraction
- `market_research_statistics`: category-level validation after category is known

### MVP Decision

MVP should not hard-bind application runtime to direct MCP execution because MCP tools are currently available through the AI/runtime environment, not necessarily through the deployed Node API process.

Therefore implement an `asin-mcp-adapter.service.ts` abstraction with two modes:

1. **Manual/mock mode for MVP runtime**: API creates analysis tasks and can populate sample/basic fields, allowing workflow UI and state machine to work.
2. **MCP assisted mode**: AI/operator can call SellerSprite MCP externally and write normalized results through backend APIs or future internal adapter.

This keeps the product workflow implementable now while preserving the integration boundary.

## Scoring Model

MVP scoring fields:

- market_score: demand and revenue potential
- competition_score: inverse pressure score; higher means easier competition
- design_score: pain point and differentiation opportunity
- risk_score: higher means more risky
- opportunity_score: weighted final result

Formula:

```text
opportunity_score = market_score * 0.35 + competition_score * 0.20 + design_score * 0.30 - risk_score * 0.15
```

Recommendation:

- >= 80: `recommend_next_round`
- 60-79: `manual_review`
- < 60: `reject`
- risk_score >= 80: `manual_review` even if opportunity score is high

## Status Model

Batch status:

- draft
- submitted
- analyzing
- completed
- partially_failed
- failed

Item status:

- pending
- analyzing
- analysis_failed
- analyzed
- recommended
- review_required
- rejected_round_1
- design_evaluation
- design_submitted
- design_approved
- design_rejected
- cost_evaluation
- sampling
- sample_review
- sample_passed
- terminated
- project_created

## Open Questions

- Whether direct SellerSprite MCP calls should be embedded in backend via a service bridge later
- Whether design attachments should use MinIO immediately or store URLs/JSON first
- Whether first MVP should include sample/cost pages or stop at design evaluation
