# Implementation Plan: ASIN 新品机会分析工作流

**Branch**: `daiguangsen.windsurf` | **Date**: 2026-04-29 | **Spec**: `specs/002-asin-opportunity-workflow/spec.md`  
**Input**: Feature specification from `/specs/002-asin-opportunity-workflow/spec.md`

---

## Summary

实现一个 ASIN 新品机会分析工作流。用户在前端批量录入 ASIN 后，后端创建分析批次和分析项，后台任务调用 SellerSprite MCP 或预留 MCP 分析适配层获取产品数据，系统保存原始快照、标准化字段、机会评分和推荐结论。用户可以在结果页进行进入下一轮、淘汰、人工复核等操作，并对通过第一轮的 ASIN 填写产品设计评估。

MVP 范围聚焦：ASIN 批量录入、分析任务管理、结果展示、评分推荐、人工决策、设计评估。

---

## Technical Context

**Language/Version**: TypeScript, Node.js, React 18  
**Primary Dependencies**: mysql2, Vite, React Router, Ant Design, Zustand, Axios  
**Storage**: MySQL 8.4 (`internal_platform`)  
**Testing**: Manual API smoke validation + browser validation; future can add automated tests  
**Target Platform**: Internal web application on Windows local development environment  
**Project Type**: Web application with API backend and React frontend  
**Performance Goals**: list API p95 < 500ms for <=1000 records; ASIN analysis submitted asynchronously  
**Constraints**: MCP calls may be slow/unavailable; each ASIN must fail independently; historical analysis snapshots must be retained  
**Scale/Scope**: MVP supports batches up to 100 ASINs; list pagination default 20/page

---

## Constitution Check

### Article 1: Spec-Driven Development

Pass. This feature has `spec.md`, `plan.md`, and will generate `tasks.md` before implementation.

### Article 2: Architectural Integrity

Pass. Backend will follow existing `apps/api/src/modules/<name>` pattern. Frontend will follow existing React + Ant Design app structure. Database changes will use migration SQL.

### Article 3: Code Quality

Pass with caution. Existing codebase allows some `any` in frontend error handling. New code should use typed interfaces where practical and avoid unsafe SQL string concatenation.

### Article 4: User Experience

Pass. MVP includes loading states, validation, status display, decision feedback, and paginated lists.

### Article 5: Security & Permissions

Pass. All APIs will be behind existing auth middleware. Role-specific fine-grained permissions can be phased in; initial MVP relies on authenticated user + admin role.

### Article 6: Performance & Maintainability

Pass. Analysis is asynchronous. Lists are paginated. MCP adapter layer is isolated.

---

## Project Structure

### Documentation

```text
specs/002-asin-opportunity-workflow/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api-spec.md
└── tasks.md
```

### Source Code

```text
apps/api/src/
├── database/migrations/
│   └── 002_asin_opportunity_workflow.sql
├── modules/asin-opportunities/
│   ├── index.ts
│   └── service/
│       ├── asin-parser.service.ts
│       ├── asin-analysis.service.ts
│       ├── asin-scoring.service.ts
│       ├── asin-design.service.ts
│       └── asin-mcp-adapter.service.ts
└── main.ts

apps/web/src/
├── pages/product-dev/asin-opportunities/
│   ├── AsinBatchListPage.tsx
│   ├── AsinBatchCreatePage.tsx
│   ├── AsinBatchDetailPage.tsx
│   ├── AsinReportDrawer.tsx
│   └── DesignEvaluationModal.tsx
├── api/asinOpportunities.ts
└── router/menu integration files
```

**Structure Decision**: Use existing monorepo architecture. Backend module name: `asin-opportunities`. Frontend page lives under `product-dev` domain because it is part of新品开发流程.

---

## Implementation Phases

### Phase 0: Research

- Confirm existing product-dev module structure and menu routing
- Confirm existing migration convention
- Confirm user identity fields available in RequestContext
- Define MCP adapter interface and fallback mock/manual mode

### Phase 1: Data Model & API Contracts

- Create MySQL tables for batches, items, snapshots, reviews, design evaluations
- Define API contract for batch create/list/detail, item decision, retry, design evaluation
- Define status enum and recommendation enum

### Phase 2: Backend MVP

- Implement ASIN parser and validation
- Implement batch creation and item creation
- Implement list/detail APIs
- Implement analysis service with MCP adapter interface
- Implement scoring service
- Implement decision and review APIs
- Implement design evaluation APIs

### Phase 3: Frontend MVP

- Add navigation entry under新品开发
- Implement batch list page
- Implement batch create page
- Implement batch detail/result page
- Implement report drawer
- Implement decision actions
- Implement design evaluation modal

### Phase 4: Validation

- Run migration
- Start API and web
- Create sample batch
- Verify list/detail
- Verify decision transitions
- Verify design evaluation submission
- Verify `/health` remains connected

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Async analysis state machine | MCP calls can be slow/fail independently | Synchronous submission would block UI and fail whole batch |
| Snapshot table | Decisions need traceability | Only storing normalized fields loses historical evidence |
| Separate design evaluation table | Design round has different fields and lifecycle | Overloading item table would become hard to maintain |
