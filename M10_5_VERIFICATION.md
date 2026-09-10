# Milestone 10.5 — Visual identity and product experience

**Status: PASS.** Verified September 10, 2026 (Asia/Taipei). Frontend presentation only; no application dependency, backend, database, API contract, or business-rule changes. No commit or push.

## Design direction

Revenue Recovery OS now uses a compact recovery-signal mark, a consistent inline-SVG stroke icon family, restrained blue interaction states, and a flat sectional composition. Revenue exposure leads the dashboard; supporting measures are subordinate. Portfolio risk and coverage explain the population behind that exposure. Recovery activity and the outcome checkpoint connect the analysis to the operator's next step.

Customers retain the same search/filter data flow with lighter controls, name-derived initials, aligned account values, and compact dot labels. Approvals retain all action handlers and conditions, with a pending-review summary, amber pending rail, state-aware history rails, and compact metadata. The independent reviewer measured the first desktop history item at approximately 259px versus 386px in the M10 reference.

Customer 360 keeps its structure, data loading, AI assistance, recommendations, history, and actions. It inherits only the shared identity, typography, icon/navigation, and badge vocabulary.

## Skills used

- **Impeccable:** project context; Operate guidance; visual hierarchy and craft-floor guidance; one mechanical detector pass; independent finish review; design documentation. User-pinned dark styling, eyebrows, dominant business metric, and semantic rails took priority over conflicting generic recommendations.
- **Independent finish reviewer:** reviewed all 15 top captures, ten full-page desktop/mobile captures, and two approval fixture captures. Final disposition: **ship**, with no material visual fixes.
- **Documenter:** the documentation agent reached its usage limit after saving `DESIGN.md`. The primary agent completed the local fallback, checked the prose against the implemented direction, and generated `.impeccable/design.json` with eight component references.
- **find-skills:** no searches performed. Installed Impeccable guidance and native React/CSS/SVG were sufficient; no additional skill installation was necessary.

## Data visualization — NO FAKE DATA

| Visualization | Existing source | Presentation calculation |
| --- | --- | --- |
| Portfolio risk ring | `Analytics.risk_distribution` and `total_customers` | Each segment is its count / total; zero-count segments are absent and all five legend labels remain |
| Risk coverage bar | `total_customers` and `risk_distribution.uncalculated` | Scored = total minus uncalculated; coverage = scored / total, safely zero for an empty portfolio |
| Revenue by risk bars | `revenue_exposure_by_risk` | Bar widths normalized to the largest value; the displayed exposure total comes directly from `revenue_exposure` |
| Outcome distribution | `intervention_outcomes` | Recovered, not recovered, and pending shares of the returned counts; zero data produces an empty track |
| Recovery activity timeline | `recent_recovery_activity` | Existing event order, company, outcome, and timestamp; no additional events |

`recovery_success_rate`, revenue exposure, risk counts, and unique recovered-customer counts remain backend results. Chart geometry and coverage display do not replace analytics formulas. Low/medium account values are not described as lost revenue. Execution remains distinct from a confirmed customer outcome.

Application data is never replaced with fixture constants. Synthetic values exist only inside the isolated verification harness and its clearly identified screenshots.

## Verification

| Check | Result |
| --- | --- |
| `npm.cmd --prefix frontend run build` | PASS |
| `npm.cmd --prefix frontend run lint` | PASS, no warnings |
| `git diff --check` | PASS |
| Impeccable detector on changed UI | PASS, empty finding list |
| Dashboard, Customers, Approvals, Analytics, Customer 360 at 320 / 768 / 1440px | PASS; no page overflow |
| Full desktop/mobile visual review, including lower charts, timelines, and outcome actions | PASS; reviewer disposition `ship` |
| Search by customer/company/email/owner; all four combined filters and clear | PASS |
| Keyboard customer navigation, button/input focus, table scrolling | PASS |
| Approval/status badge contrast | PASS; measured at least 4.5:1 |
| Dark product theme with light OS preference; reduced-motion setting | PASS |
| Zero/large account values, missing owner/activity, 32 table rows | PASS |
| Long names/company/playbook/error content and missing related objects | PASS at all three widths |
| Customers/Approvals loading, empty, error, retry, unavailable risk | PASS |
| Approve, Reject, Execute, Retry, both outcome decisions, final/read-only states | PASS with isolated HTTP fixtures |
| Duplicate click and disabled concurrent actions | PASS; one POST observed |
| Failed action and failed post-action refresh | PASS |
| Customer 360 AI assistance and approval-request UI wiring | PASS with isolated HTTP fixtures |
| Risk-ring proportions, outcome-stack proportions, coverage, server success rate | PASS |
| Zero analytics, majority uncalculated, analytics loading/error/retry | PASS; no invented segments, NaN, or Infinity |
| Uncaught browser errors | None in passing checks |
| Backend tests | Not run; backend unchanged |

The harness `frontend/verification/m105-browser.cjs` records **33 grouped checks** in `screenshots/m105-browser-results.json`. It intercepts every API request; write actions never reach the live backend. It verifies frontend behavior and request wiring, not backend persistence or external delivery. Existing approval deduplication remains authoritative and unchanged; no live deduplication mutation was performed.

Live-data screenshot checks used a GET-only test proxy to the existing local API, with browser CORS adjusted only in the test response. A separate direct browser check at `http://localhost:5173` then confirmed Dashboard, Analytics, Customers, and Approvals load normally without that proxy or API alerts. Customer 360 also passed the GET-only live-data capture matrix. No environment file was read or changed. No live n8n/Slack execution, outcome write, or AI-provider request was made.

## Reproduction

From the repository root, run the frontend on `http://localhost:5173`. Set `M10_PLAYWRIGHT` to an already installed Playwright module directory when it is not normally resolvable, then run:

```powershell
node frontend/verification/m105-browser.cjs
```

The harness uses installed Microsoft Edge in headless mode. No npm dependency installation is part of this milestone.

## Exact M10.5 application file list

- `frontend/src/Product.css` (new shared identity and tokens)
- `frontend/src/main.tsx`
- `frontend/src/components/Icon.tsx` (new icon family and product mark)
- `frontend/src/components/AnalyticsSummary.tsx`
- `frontend/src/components/Customer360.tsx`
- `frontend/src/components/layout/AppLayout.tsx`
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/pages/AnalyticsPage.tsx`
- `frontend/src/pages/Analytics.css`
- `frontend/src/pages/CustomersPage.tsx`
- `frontend/src/pages/CustomersPage.css`
- `frontend/src/pages/ApprovalsPage.tsx`
- `frontend/src/pages/ApprovalsPage.css`

M10.5 documentation and verification:

- `DESIGN.md`
- `.impeccable/design.json`
- `M10_5_VERIFICATION.md`
- `frontend/verification/m105-browser.cjs`
- `screenshots/m105-browser-results.json`
- `screenshots/m105-dashboard-live.png`
- `screenshots/m105-analytics-live.png`
- `screenshots/m105-customers-1440.png`
- `screenshots/m105-customers-320.png`
- `screenshots/m105-approvals-1440.png`
- `screenshots/m105-approvals-320.png`

The four Customers/Approvals width-named screenshots are isolated fixtures, not real portfolio metrics. The two `-live` screenshots use local API data. The complete internal before/after capture paths are in the manifest below.

## Scope and Git

M10's existing uncommitted changes were present at the start and were preserved. `CustomerPage.css`, `Operations.css`, the M10 verification files, and earlier screenshots are pre-existing M10 work, not new M10.5 edits. Existing `.claude/`, `.codex/`, `.impeccable/`, `frontend/.impeccable/`, and `PRODUCT.md` tooling/product context was not swept into application changes. Only the explicitly listed new design documentation and review evidence were added under `.impeccable/`.

No changes to backend, Supabase, n8n, API client/types, analytics/risk formulas, approval/execution/retry/outcome rules, or AI providers/fallback. No new dependencies, staging, commit, or push.

Suggested eventual commit: `style: establish Revenue Recovery OS visual identity`.

## Internal capture manifest
- `.impeccable/review/m105-before/analytics-1440.png`
- `.impeccable/review/m105-before/analytics-320.png`
- `.impeccable/review/m105-before/analytics-768.png`
- `.impeccable/review/m105-before/approvals-1440.png`
- `.impeccable/review/m105-before/approvals-320.png`
- `.impeccable/review/m105-before/approvals-768.png`
- `.impeccable/review/m105-before/customer360-1440.png`
- `.impeccable/review/m105-before/customer360-320.png`
- `.impeccable/review/m105-before/customer360-768.png`
- `.impeccable/review/m105-before/customers-1440.png`
- `.impeccable/review/m105-before/customers-320.png`
- `.impeccable/review/m105-before/customers-768.png`
- `.impeccable/review/m105-before/dashboard-1440.png`
- `.impeccable/review/m105-before/dashboard-320.png`
- `.impeccable/review/m105-before/dashboard-768.png`
- `.impeccable/review/m105/analytics-1440-full.png`
- `.impeccable/review/m105/analytics-1440.png`
- `.impeccable/review/m105/analytics-320-full.png`
- `.impeccable/review/m105/analytics-320.png`
- `.impeccable/review/m105/analytics-768.png`
- `.impeccable/review/m105/approvals-1440-full.png`
- `.impeccable/review/m105/approvals-1440.png`
- `.impeccable/review/m105/approvals-320-full.png`
- `.impeccable/review/m105/approvals-320.png`
- `.impeccable/review/m105/approvals-768.png`
- `.impeccable/review/m105/customer360-1440-full.png`
- `.impeccable/review/m105/customer360-1440.png`
- `.impeccable/review/m105/customer360-320-full.png`
- `.impeccable/review/m105/customer360-320.png`
- `.impeccable/review/m105/customer360-768.png`
- `.impeccable/review/m105/customers-1440-full.png`
- `.impeccable/review/m105/customers-1440.png`
- `.impeccable/review/m105/customers-320-full.png`
- `.impeccable/review/m105/customers-320.png`
- `.impeccable/review/m105/customers-768.png`
- `.impeccable/review/m105/dashboard-1440-full.png`
- `.impeccable/review/m105/dashboard-1440.png`
- `.impeccable/review/m105/dashboard-320-full.png`
- `.impeccable/review/m105/dashboard-320.png`
- `.impeccable/review/m105/dashboard-768.png`
