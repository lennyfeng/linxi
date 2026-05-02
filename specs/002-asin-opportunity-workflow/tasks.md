# Tasks: ASIN 新品机会分析工作流

**Input**: Design documents from `/specs/002-asin-opportunity-workflow/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api-spec.md`  
**Feature**: `002-asin-opportunity-workflow`  
**Product Role**: 高级产品经理驱动  

---

## Format: `[ID] [P?] [Story] Description`

- `[P]`: Can be executed in parallel if dependencies are satisfied
- `[US1]`: User Story 1 - 批量提交 ASIN 分析任务
- `[US2]`: User Story 2 - 查看 SellerSprite MCP 分析结果
- `[US3]`: User Story 3 - 标记进入下一轮或淘汰
- `[US4]`: User Story 4 - 产品设计与差异化评估
- `[US5]`: User Story 5 - 成本与打样评估

---

# Phase 1: Setup & Architecture Foundation

**Goal**: Establish module boundaries, database migration, routing, and API foundation.

- [x] T001 Create backend module directory `apps/api/src/modules/asin-opportunities/`
- [x] T002 Create backend service directory `apps/api/src/modules/asin-opportunities/service/`
- [x] T003 Create frontend page directory `apps/web/src/pages/product-dev/asin-opportunities/`
- [x] T004 Create frontend API client file `apps/web/src/api/asinOpportunities.ts`
- [x] T005 Create migration file `apps/api/src/database/migrations/002_asin_opportunity_workflow.sql`
- [x] T006 Define database tables in migration: `asin_analysis_batches`, `asin_analysis_items`, `asin_analysis_snapshots`, `asin_analysis_reviews`, `product_design_evaluations`, `sample_evaluations`
- [x] T007 Add indexes for batch/item/status/score fields in migration
- [x] T008 Register `asin-opportunities` backend route in `apps/api/src/main.ts`
- [x] T009 Add route handler scaffold in `apps/api/src/modules/asin-opportunities/index.ts`
- [x] T010 Add frontend route/menu entry for ASIN 新品机会分析 under 新品开发 domain

**Checkpoint**: Module skeleton exists, migration can be inspected, backend can compile after route registration.

---

# Phase 2: Foundational Backend Services

**Goal**: Build shared backend services required by all user stories.

- [x] T011 [P] Implement ASIN parser service in `apps/api/src/modules/asin-opportunities/service/asin-parser.service.ts`
- [x] T012 [P] Support parsing ASINs from newline/comma/space separated text
- [x] T013 [P] Support extracting ASIN from Amazon `/dp/{ASIN}` and `/gp/product/{ASIN}` links
- [x] T014 [P] Implement ASIN format validation and invalid item reporting
- [x] T015 [P] Implement marketplace normalization with default `US`
- [x] T016 Implement shared DB query helpers for batches/items in `asin-analysis.service.ts`
- [x] T017 Implement batch number generation rule `ASINyyyyMMddNNNN`
- [x] T018 Implement scoring service scaffold in `asin-scoring.service.ts`
- [x] T019 Implement MCP adapter interface in `asin-mcp-adapter.service.ts`
- [x] T020 Implement MVP mock/manual MCP adapter fallback for local workflow validation
- [x] T021 Implement status transition helper to prevent invalid workflow jumps
- [x] T022 Implement review history writer for all decisions and status transitions

**Checkpoint**: Parser, scoring scaffold, MCP adapter interface, and status transition helpers are available for feature stories.

---

# Phase 3: User Story 1 - 批量提交 ASIN 分析任务 (Priority: P1) 🎯 MVP

**Goal**: Product designer can create an ASIN analysis batch by entering ASINs or Amazon links.

## Backend Tasks

- [x] T023 [US1] Implement `POST /asin-opportunities/batches` endpoint in `index.ts`
- [x] T024 [US1] Validate required fields: `name`, `marketplace`, `asin_input`
- [x] T025 [US1] Parse and deduplicate ASIN input using parser service
- [x] T026 [US1] Return invalid ASIN list and duplicate count in API response
- [x] T027 [US1] Insert valid batch record into `asin_analysis_batches`
- [x] T028 [US1] Insert valid ASIN records into `asin_analysis_items`
- [x] T029 [US1] Set initial batch status to `submitted` and item status to `pending`
- [x] T030 [US1] Trigger MVP asynchronous analysis processing after batch creation
- [x] T031 [US1] Implement `GET /asin-opportunities/batches` endpoint with pagination/search/status filter
- [x] T032 [US1] Implement `GET /asin-opportunities/batches/:id` endpoint for batch summary

## Frontend Tasks

- [x] T033 [US1] Implement `createBatch` API method in `apps/web/src/api/asinOpportunities.ts`
- [x] T034 [US1] Implement `listBatches` API method
- [x] T035 [US1] Implement `getBatch` API method
- [x] T036 [US1] Create `AsinBatchListPage.tsx` with search, status filter, pagination
- [x] T037 [US1] Create `AsinBatchCreatePage.tsx` with batch name, marketplace, product direction, target category, ASIN input, remark
- [x] T038 [US1] Add frontend validation for empty name, empty ASIN input, marketplace required
- [x] T039 [US1] Display invalid ASINs and duplicate count after submission
- [x] T040 [US1] Navigate from successful create page to batch detail page

## Product Acceptance

- [x] T041 [US1] Verify designer can submit 20 ASINs within 3 minutes
- [x] T042 [US1] Verify duplicate ASINs are deduplicated and counted
- [x] T043 [US1] Verify Amazon links can be converted into ASINs
- [x] T044 [US1] Verify illegal ASINs are shown to user clearly

**Checkpoint**: A user can create a batch and see it in the batch list.

---

# Phase 4: User Story 2 - 查看 SellerSprite MCP 分析结果 (Priority: P1) 🎯 MVP

**Goal**: User can view ASIN analysis result list and detailed analysis report.

## Backend Tasks

- [x] T045 [US2] Implement MVP analysis processor that updates items from `pending` to `analyzing` to `completed`
- [x] T046 [US2] Implement MCP adapter result normalization for product basics: title, brand, image, price, rating, review count, category
- [x] T047 [US2] Implement normalization fields for sales, revenue, BSR, scores and recommendation
- [x] T048 [US2] Save raw snapshot records to `asin_analysis_snapshots`
- [x] T049 [US2] Implement scoring calculation in `asin-scoring.service.ts`
- [x] T050 [US2] Generate recommendation: `recommend_next_round`, `manual_review`, `reject`
- [x] T051 [US2] Update batch counters: analyzed count, recommended count, rejected count
- [x] T052 [US2] Implement `GET /asin-opportunities/batches/:id/items` endpoint with pagination/search/status/recommendation filters
- [x] T053 [US2] Implement `GET /asin-opportunities/items/:id/report` endpoint
- [x] T054 [US2] Implement `POST /asin-opportunities/items/:id/retry-analysis` endpoint
- [x] T055 [US2] Implement `POST /asin-opportunities/batches/:id/retry-failed` endpoint
- [x] T056 [US2] Ensure one failed ASIN does not fail the entire batch

## Frontend Tasks

- [x] T057 [US2] Implement `listBatchItems` API method
- [x] T058 [US2] Implement `getItemReport` API method
- [x] T059 [US2] Implement `retryAnalysis` API method
- [x] T060 [US2] Create `AsinBatchDetailPage.tsx`
- [x] T061 [US2] Display batch summary cards: total, analyzed, recommended, rejected, failed
- [x] T062 [US2] Display ASIN result table with ASIN, image, title, price, rating, reviews, monthly sales, revenue, score, recommendation, status
- [x] T063 [US2] Add filters for status, recommendation, score range, keyword
- [x] T064 [US2] Add row action: view report
- [x] T065 [US2] Create `AsinReportDrawer.tsx` for full analysis report
- [x] T066 [US2] Show product basics, score breakdown, recommendation reason, snapshots, and review history in drawer
- [x] T067 [US2] Add failed item retry action and loading state

## Product Acceptance

- [x] T068 [US2] Verify analysis progress is visible at batch level
- [x] T069 [US2] Verify each ASIN displays key product and opportunity data
- [x] T070 [US2] Verify failed items can be retried independently
- [x] T071 [US2] Verify historical snapshot data is retained and visible in report

**Checkpoint**: A user can open a batch, view analysis results, and inspect single-ASIN report.

---

# Phase 5: User Story 3 - 标记进入下一轮或淘汰 (Priority: P1) 🎯 MVP

**Goal**: User can decide whether each ASIN enters design evaluation or is rejected.

## Backend Tasks

- [x] T072 [US3] Implement `POST /asin-opportunities/items/:id/decision` endpoint
- [x] T073 [US3] Support decision action `next_round`
- [x] T074 [US3] Support decision action `reject`
- [x] T075 [US3] Support decision action `override_next_round`
- [x] T076 [US3] Require reason for `reject`, `override_next_round`, and `terminate`
- [x] T077 [US3] Update item workflow status according to decision
- [x] T078 [US3] Write review history record for each decision
- [x] T079 [US3] Prevent normal users from progressing already rejected items
- [x] T080 [US3] Return updated item status and latest review history

## Frontend Tasks

- [x] T081 [US3] Implement `makeDecision` API method
- [x] T082 [US3] Add row actions: 进入下一轮, 淘汰, 人工复核/强制进入下一轮
- [x] T083 [US3] Add decision confirmation modal
- [x] T084 [US3] Require reason input for reject and override actions
- [x] T085 [US3] Show updated status immediately after decision
- [x] T086 [US3] Add status badge mapping for all first-round states
- [x] T087 [US3] Display decision history in report drawer

## Product Acceptance

- [x] T088 [US3] Verify recommended ASIN can enter `design_evaluation`
- [x] T089 [US3] Verify rejected ASIN requires rejection reason
- [x] T090 [US3] Verify override requires reason and is recorded
- [x] T091 [US3] Verify decision history includes operator, action, reason, time

**Checkpoint**: Product team can complete first-round decision workflow.

---

# Phase 6: User Story 4 - 产品设计与差异化评估 (Priority: P2)

**Goal**: Designer can submit design evaluation for ASINs that passed the first round; PM can approve or reject.

## Backend Tasks

- [x] T092 [US4] Implement `POST /asin-opportunities/items/:id/design-evaluation` endpoint
- [x] T093 [US4] Validate item status must be `design_evaluation` or `design_rejected`
- [x] T094 [US4] Persist design fields into `product_design_evaluations`
- [x] T095 [US4] Support attachment metadata JSON field
- [x] T096 [US4] Update item status to `design_submitted`
- [x] T097 [US4] Write review history for design submission
- [x] T098 [US4] Implement `POST /asin-opportunities/items/:id/design-review` endpoint
- [x] T099 [US4] Support design review decision `approve`
- [x] T100 [US4] Support design review decision `reject`
- [x] T101 [US4] Support design review decision `request_changes`
- [x] T102 [US4] Update item status to `cost_evaluation` when approved
- [x] T103 [US4] Update item status back to `design_evaluation` when rejected or change requested
- [x] T104 [US4] Store review comment in design evaluation

## Frontend Tasks

- [x] T105 [US4] Implement `submitDesignEvaluation` API method
- [x] T106 [US4] Implement `reviewDesignEvaluation` API method
- [x] T107 [US4] Create `DesignEvaluationModal.tsx`
- [x] T108 [US4] Add fields: target user, usage scenario, pain points, design direction, material suggestion, structure suggestion, package suggestion, selling points, attachments
- [x] T109 [US4] Validate required fields: pain points, design direction, selling points
- [x] T110 [US4] Add design evaluation action for items in `design_evaluation`
- [x] T111 [US4] Display existing design evaluation in report drawer
- [x] T112 [US4] Add approve/reject/request changes actions for design-submitted items
- [x] T113 [US4] Show design review result in history

## Product Acceptance

- [x] T114 [US4] Verify item entering next round can submit design evaluation
- [x] T115 [US4] Verify required design fields enforce complete product thinking
- [x] T116 [US4] Verify PM approval moves item to cost evaluation
- [x] T117 [US4] Verify rejection returns item to design evaluation with reason

**Checkpoint**: Team can complete second-round design evaluation workflow.

---

# Phase 7: User Story 5 - 成本与打样评估 (Priority: P3)

**Goal**: Procurement or PM can evaluate cost and decide whether sampling is allowed.

## Backend Tasks

- [x] T118 [US5] Implement `POST /asin-opportunities/items/:id/sample-evaluation` endpoint
- [x] T119 [US5] Validate item status must be `cost_evaluation`
- [x] T120 [US5] Persist sample evaluation fields into `sample_evaluations`
- [x] T121 [US5] Calculate gross margin if target price and estimated cost exist and gross margin is absent
- [x] T122 [US5] Support decisions: `approve_sampling`, `reject`, `hold`
- [x] T123 [US5] Update item status to `sampling`, `terminated`, or `cost_evaluation` based on decision
- [x] T124 [US5] Write review history for sample decision

## Frontend Tasks

- [x] T125 [US5] Implement `submitSampleEvaluation` API method
- [x] T126 [US5] Create sample evaluation modal or section
- [x] T127 [US5] Add fields: target price, estimated cost, gross margin, MOQ, supplier, sample cost, sample cycle days, decision, comment
- [x] T128 [US5] Validate target price, estimated cost, and decision
- [x] T129 [US5] Display sample evaluation in report drawer
- [x] T130 [US5] Add sampling status badge and row actions

## Product Acceptance

- [x] T131 [US5] Verify approved design can enter sample evaluation
- [x] T132 [US5] Verify approve sampling changes status to sampling
- [x] T133 [US5] Verify reject terminates workflow with reason

**Checkpoint**: MVP can extend from design pass to sampling decision.

---

# Phase 8: Polish & Cross-Cutting Concerns

**Goal**: Improve usability, reliability, and operational readiness.

- [x] T134 Add consistent Chinese status labels for batch, item, recommendation, and decision actions
- [x] T135 Add Ant Design loading states to all list, detail, create, decision and modal actions
- [x] T136 Add error messages using backend `message` field where available
- [x] T137 Add empty state for no batches and no ASIN items
- [x] T138 Add export button placeholder for ASIN analysis result export
- [x] T139 Add visual risk tags: 高风险, 需复核, 机会较好, 建议淘汰
- [x] T140 Add simple dashboard counters on batch detail page
- [x] T141 Ensure all backend SQL queries use parameterized queries
- [x] T142 Ensure all new APIs return standard `{ code, message, data, request_id, timestamp }` response through existing helpers
- [x] T143 Verify auth middleware protects all new endpoints
- [x] T144 Update quickstart with final tested routes and UI path

---

# Phase 8.5: Product Decision Model Hardening

**Goal**: Convert the senior product manager decision framework into enforceable product rules, UI affordances, and audit standards.

- [x] T161 Add `decision-model.md` as source of truth for workflow states, scoring dimensions, permissions, reason taxonomy, and page information architecture
- [x] T162 Align backend item workflow statuses with the decision model
- [x] T163 Implement status transition guard so invalid jumps are rejected at service layer
- [x] T164 Require structured reason codes for rejection, override, termination, design rework, cost hold, and project termination
- [x] T165 Add recommendation tags: 市场需求明确, 竞争可控, 设计空间明确, 成本风险, 合规风险, 需人工复核
- [x] T166 Split score display into market demand, competition pressure, design opportunity, profit feasibility, and risk control dimensions
- [x] T167 Add PM-facing batch detail tabs: 分析结果, 设计评估, 成本/打样评估, 决策历史
- [x] T168 Add role-oriented action visibility rules for designer, product manager, procurement, management, and admin users
- [x] T169 Add rejection reason distribution as a future dashboard metric
- [x] T170 Ensure every override and terminal decision is visible in ASIN report drawer history

**Checkpoint**: Product decision rules are traceable in docs, backend validations, and frontend interactions.

---

# Phase 9: Validation & Acceptance

**Goal**: Validate that implementation meets MVP requirements and does not break existing application.

- [x] T145 Run database migration against local MySQL
- [x] T146 Start API service and verify `/health` remains `connected`
- [x] T147 Start web service and verify login still works
- [x] T148 Create one ASIN batch with valid ASINs
- [x] T149 Create one ASIN batch with duplicate and invalid ASINs
- [x] T150 Verify batch list pagination and filters
- [x] T151 Verify batch detail result table
- [x] T152 Verify report drawer opens and shows data
- [x] T153 Verify enter-next-round decision
- [x] T154 Verify reject decision requires reason
- [x] T155 Verify override decision requires reason
- [x] T156 Verify design evaluation submission
- [x] T157 Verify design review approve/reject
- [x] T158 Verify sample evaluation if implemented
- [x] T159 Verify no console errors on main pages
- [x] T160 Verify no TypeScript compile errors
- [x] T162 Verify sensitive ASIN write operations append audit logs

---

# Dependencies & Execution Order

## Phase Dependencies

1. Phase 1 must complete before all backend/frontend implementation.
2. Phase 2 must complete before US1-US5.
3. US1 must complete before US2 because analysis results depend on batches/items.
4. US2 must complete before US3 because decisions depend on item result visibility.
5. US3 must complete before US4 because design evaluation requires next-round status.
6. US4 must complete before US5 because sampling requires design approval.
7. Phase 8 and Phase 9 occur after story implementation.

## Parallel Opportunities

- Parser tasks T011-T015 can run in parallel.
- Frontend API methods T033-T035 can run after API contract is stable.
- US2 frontend report drawer can be developed in parallel with backend report endpoint after response shape is defined.
- UI status label mapping can be built while backend status transitions are implemented.

---

# Implementation Strategy

## MVP First

Implement through US1-US3 first:

1. Create batch
2. Analyze/mock analysis
3. Show results
4. Decide next round or reject

This provides a working product opportunity funnel.

## Incremental Delivery

After MVP:

1. Add design evaluation (US4)
2. Add cost/sample evaluation (US5)
3. Add real MCP bridge or assisted import mechanism
4. Add export and dashboard capabilities

## Product Acceptance Principle

A task is only complete when:

- The related UI/API is usable by a logged-in user
- The workflow state is persisted in MySQL
- The action has visible user feedback
- The decision/history is traceable
- The feature aligns with the constitution and spec
