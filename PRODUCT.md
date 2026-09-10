# Revenue Recovery OS

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is a Customer Success / Revenue Operations professional at a small-to-medium B2B SaaS or service company managing recurring customers: a Customer Success Manager, Account Manager, RevOps/Operations Manager, or founder.

Portfolio reviewers are a secondary audience evaluating the implementation, not the product persona.

## Product Purpose

Help operators identify explainable customer churn risk, understand revenue exposure, review recovery recommendations, approve appropriate interventions, and record recovery outcomes. Success means users can trace risk to evidence and follow a recovery action from review through execution and outcome.

## Positioning

Portfolio V1 demonstrating a connected customer retention workflow with fictional/demo customer data. Churn risk is deterministic and rule-based, with explainable signals. AI assists summaries, recommendations, and drafts; it does not calculate risk scores or replace human judgment.

Do not describe this as predictive machine learning or a production-ready enterprise churn platform. Describe automation and integrations as real only where demonstrated, with verification limits stated accurately.

## Operating Context

The existing web application uses React, TypeScript, Vite, and React Router. A Cloudflare Workers API owns business logic and accesses Supabase/PostgreSQL. n8n executes cross-system workflows; the application owns business state.

The implemented surfaces are Dashboard (`/dashboard`), Customers (`/customers`), Customer 360 (`/customers/:id`), Approvals (`/approvals`), and Analytics (`/analytics`). Operators inspect account health and risk evidence, review interventions, approve or reject sensitive actions, track execution, and manually record outcomes.

The frontend development command is `npm.cmd --prefix frontend run dev`. Its API URL is configured with `VITE_API_BASE_URL`, defaulting to `http://127.0.0.1:8787`.

## Capabilities and Constraints

- Preserve deterministic, explainable rule-based churn risk and the separation between risk calculation and AI assistance.
- Require human approval before sensitive actions.
- Keep execution status distinct from recovery outcome: successful delivery does not prove recovery.
- Recovery outcomes are manually recorded as recovered or not recovered. The current implementation treats resolved outcomes as final.
- Use actual application data for analytics. Do not invent trends, recovery results, customers, testimonials, or production claims.
- Keep fictional/demo data clearly identified. Existing integrations do not establish production readiness or universal live-delivery verification.
- Authentication, RBAC, outcome corrections, and automatic customer-health updates are outside the documented M9 implementation. Future scope changes require an explicit brief.

## Brand Commitments

Preserve the name Revenue Recovery OS.

The user identifies the polished Customer 360, Dashboard, and Analytics screens as the established visual source of truth. Future screens should follow those implementations; initialization does not redefine their visual system. References: `frontend/src/pages/CustomerPage.tsx`, `frontend/src/components/Customer360.tsx`, `frontend/src/pages/DashboardPage.tsx`, `frontend/src/pages/AnalyticsPage.tsx`, and their associated styles.

## Evidence on Hand

- `docs/ARCHITECTURE.md`: system responsibilities and human/AI/automation boundaries.
- `supabase/seed.sql`: demo customer and event data.
- `backend/src/services/risk-engine.ts`: implemented risk rules.
- `M9_VERIFICATION.md`: implementation and dated verification evidence, including limits on external delivery testing. Its numeric baseline is a historical snapshot, not fixed product data.
- Existing frontend routes and backend tests demonstrate implemented capabilities; do not treat historical test results as newly verified.

## Product Principles

1. Make risk explainable and traceable to evidence.
2. Keep humans responsible for sensitive recovery decisions.
3. Distinguish recommendations, approvals, execution, and outcomes.
4. Prioritize the operator's work while making the implementation understandable to secondary portfolio reviewers.
5. Represent demo data, measured results, and integration limits honestly.

## Open Decisions

No additional product-specific accessibility standard or production rollout requirements were established during initialization.
