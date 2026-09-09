# Milestone 9 — implementation and verification

Status: **PASS for M9 implementation and verification.** External n8n/Slack delivery was regression-tested through mocked HTTP responses, not a fresh live automation run. No commit or Git push was performed.

Verified September 9–10, 2026 (Asia/Taipei).

## Database

- Reused `interventions.outcome` (nullable text). Existing nulls remain unresolved.
- Added `supabase/migrations/20260909233733_add_intervention_outcome_recorded_at.sql`: one nullable `outcome_recorded_at timestamptz` column, with no backfill or default.
- Dry run showed only the new migration; it was pushed successfully. Final local/remote migration history matches across all five migrations.
- Regenerated `backend/src/types/database.ts` from the linked database. The new field appears in Row, Insert and Update. Comparing decoded content confirms these are the only schema changes. CLI output is UTF-8; the previous checked-in file was UTF-16LE, so Git displays its diff as binary.
- Existing migrations, customer health, risk scoring, and execution behavior remain unchanged.

## Routes and definitions

`POST /api/interventions/:id/outcome` accepts only `recovered` or `not_recovered`, validated with Zod. Only `status = sent` with null/pending outcome may resolve. Outcome and timestamp are written together with status/outcome conditions on the database update to protect against concurrent overwrites. Invalid payload/malformed JSON returns 400; missing intervention 404; invalid status/already-resolved/concurrent conflict 409; success 200. Outcomes are final, including rejecting repeated submissions of the same resolved value.

`GET /api/analytics` returns the existing `{ data }` envelope. `backend/src/services/analytics.ts` owns all business formulas, using paginated reads of customers, risk_scores and interventions.

| Metric | Definition |
| --- | --- |
| Total customers | Customer row count |
| At risk | Latest risk is high or critical |
| Critical | Latest risk is critical |
| Revenue exposure | Sum of account value for latest high/critical customers; integer cents used during aggregation |
| Recovered customers | Unique customers with at least one recovered outcome |
| Recovery success rate | Recovered / (recovered + not_recovered), returned as a percentage from 0–100; zero when denominator is zero |
| Risk distribution | Each customer once: low, medium, high, critical or uncalculated |
| Revenue by risk | Account values grouped by latest low/medium/high/critical; uncalculated excluded |
| Pending outcomes | Only sent interventions with null or pending outcome |
| Resolved outcome counts | All recovered/not_recovered intervention outcomes |
| Recent recovery activity | Up to eight dated outcome/sent events, newest first; outcome_recorded_at for outcomes and executed_at for sent events |

Latest risk uses the greatest calculated_at per customer, with ID as a deterministic tie-breaker for equal timestamps. Legacy outcomes without timestamps still count, but no invented outcome date is displayed. Successful execution never automatically creates a recovered outcome.

## Frontend

- Dashboard: six real KPIs and three sections (risk distribution, revenue by risk, recent activity).
- Analytics: operational outcome counts/rate, risk coverage table, revenue bars and recent activity. Shared API data; no competing React business formulas or invented trends.
- Approvals: sent/unresolved outcome buttons, save/disabled/error handling, final-decision notice, outcome/timestamp display and data refresh.
- Customer 360: small real history list using the existing interventions API, filtered to the customer; playbook, status, outcome, execution result and timestamps. History is hidden while switching to a different customer until its data loads. No redesign or health mutation.
- Scoped CSS follows Customer 360 styling for analytics pages. No chart library or dependency installed.

## Verification

| Check | Result |
| --- | --- |
| Frontend build — `npm.cmd --prefix frontend run build` | PASS |
| Frontend lint — `npm.cmd --prefix frontend run lint` | PASS, no warnings |
| Backend TypeScript — local `tsc.cmd --noEmit` | PASS |
| Backend tests — `npm.cmd run test -- --run` | PASS, 54 tests across four files |
| Linked migration history | PASS |
| Live Supabase persistence and concurrency | PASS |
| Dashboard / Analytics / Approvals at 320, 768, 1440px | PASS, rendered checks and no horizontal overflow |
| Dashboard and Analytics loading, empty, error, retry | PASS, isolated local HTTP fixtures |
| Customer 360 outcome history | PASS, live temporary fixture and mobile inspection |
| Browser logs on live tested views | No warnings/errors observed |

Automated tests cover both allowed outcomes from null/pending, every prohibited execution status, final outcomes, invalid/malformed payloads, missing records, conditional-write conflicts and write errors. Analytics tests cover historical deduplication, equal timestamp ties, exposure/critical counts, unique recovery, rate changes, zero states, real activity dates, unknown outcomes and paginated reads beyond 1,000 records.

Regression tests exercise customer/risk/signal/event reads, approval creation/deduplication, approve/reject, execute/retry and attempt tracking, webhook failure, success/failure callbacks, deterministic risk thresholds/recalculation and AI fallback. These use mocked external HTTP; no new Slack message was sent and the live AI provider was not invoked.

Live verification created one explicitly labeled temporary customer, two historical scores and three sent intervention fixtures. Both outcome buttons were clicked through the browser. Supabase confirmed persisted outcomes/timestamps; concurrent resolution produced one 200 and one 409. Two recoveries counted as one customer, and two recovered plus one not_recovered yielded 66.6667%. Customer health remained healthy. Only the newly created fixture account and its child rows were removed. A before/after comparison confirmed all pre-existing customer health values, intervention states/outcomes and analytics were unchanged.

Baseline after cleanup: 24 customers; 1 at risk; 1 critical; PHP 180,000 exposed; 0 recovered customers; 0% recovery success; 5 sent interventions awaiting outcome. These are a verification snapshot, not fixed product data.

## Exact changed files

Existing files:

- `backend/src/index.ts`
- `backend/src/types/database.ts`
- `frontend/src/api/client.ts`
- `frontend/src/types/api.ts`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/pages/AnalyticsPage.tsx`
- `frontend/src/pages/ApprovalsPage.tsx`
- `frontend/src/pages/CustomerPage.tsx`
- `frontend/src/pages/CustomerPage.css`

New files:

- `supabase/migrations/20260909233733_add_intervention_outcome_recorded_at.sql`
- `backend/src/services/analytics.ts`
- `backend/test/outcome.spec.ts`
- `backend/test/analytics.spec.ts`
- `backend/test/m9-regression.spec.ts`
- `frontend/src/api/useAnalytics.ts`
- `frontend/src/components/AnalyticsSummary.tsx`
- `frontend/src/components/analyticsFormatting.ts`
- `frontend/src/pages/Analytics.css`
- `frontend/src/pages/ApprovalsPage.css`
- `M9_VERIFICATION.md`

## Scope and limitations

No authentication, RBAC, correction system, automatic customer-health updates, new providers/modules, global style rewrite, historical time series, dependencies, or changes to risk/AI/n8n/Slack/execution rules. Live external delivery is not newly certified by these checks. Customer 360 reuses the existing V1 intervention-list API; its existing server row limit remains, while analytics explicitly reads all pages.

Suggested manual commit: `feat: add recovery outcome tracking and analytics`.
