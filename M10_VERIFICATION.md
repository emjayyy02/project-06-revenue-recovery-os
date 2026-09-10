# Milestone 10 — Product hardening and UI/UX polish

Status: **PASS for the scoped frontend milestone.** Verified September 10, 2026 (Asia/Taipei). No backend/database changes, dependency installation, commit, or push.

## Implementation

- Customers: operational table with customer/email, company, PHP account value, risk, health, lifecycle, owner, and latest activity. Search matches name/company/email/owner; risk, health, owner, and lifecycle filters combine and reset. Uses real API fields only.
- Risk is read from the existing per-customer latest-risk endpoint. Requests run in batches of four, without blocking the account list. A successful null result means Uncalculated; a failed request means Unavailable. The frontend does not calculate risk or conflate it with customer health. Refresh retries the reads. This intentionally adds one existing GET per customer, suitable for the small V1 dataset; there is no new API or bulk endpoint.
- Approvals: pending requests are prioritized in a two-column desktop queue; history remains a single readable stream. Cards include supported account, owner, playbook, recommendation, and timestamp details. Missing optional fields do not generate blank rows or invented account values.
- Technical status and business outcome have separate labels. Approve is primary, Reject restrained, and final outcomes/rejections are read-only. Existing lifecycle conditions and API calls are preserved.
- A synchronous request guard and disabled controls prevent duplicate or overlapping approval actions. Failed writes show an alert inside the affected card. If a successful write cannot refresh the list, stale actions remain unavailable until a successful refresh.
- Shared styling extends the existing Analytics shell/sidebar rules to the two operations pages, reuses Customer 360 badges/empty states and PHP formatting, and gives Customer 360 AI buttons matching styles and keyboard focus. No route, dashboard metric, or analytics formula changes.

## Verification

| Check | Result |
| --- | --- |
| Frontend build: `npm.cmd --prefix frontend run build` | PASS |
| Frontend lint: `npm.cmd --prefix frontend run lint` | PASS |
| `git diff --check` | PASS |
| Customers, Approvals, Dashboard, Analytics, Customer 360 at 320 / 768 / 1440px | PASS; rendered pages, no horizontal page overflow |
| Customers table scrolling | PASS; contained horizontal scrolling, including keyboard ArrowRight |
| Search and all four combined filters | PASS |
| Uncalculated / unavailable risk and refresh recovery | PASS |
| Zero and large account values, missing owner/activity, 32 rows | PASS |
| Loading, empty, no results, API error, retry | PASS for Customers and Approvals |
| Approve / Reject / Execute / Retry | PASS through isolated HTTP fixtures |
| Both business outcomes and final/read-only states | PASS through isolated HTTP fixtures |
| Rapid repeated click and other-card disabled state | PASS; one POST observed |
| Failed write and failed post-write refresh recovery | PASS |
| Very long names, companies, playbooks, errors, missing related objects | PASS at all three widths |
| Keyboard customer navigation, form/button focus, disabled controls | PASS |
| Rendered approval/status badge contrast | PASS; checked ratios >= 4.5:1 |
| Light OS color preference and reduced-motion preference | PASS; dark product theme retained, no decorative motion added |
| Customer 360 AI-assistance and approval-request wiring | PASS through isolated HTTP fixtures |
| Browser uncaught exceptions | None during passing checks |
| Live GET-only rendering | PASS; 24 customers, Approvals, Dashboard, Analytics, Customer 360 |
| Backend tests | Not run; backend files unchanged, as requested |

`frontend/verification/m10-browser.cjs` records 30 grouped browser checks in `screenshots/m10-browser-results.json`. Its HTTP fixtures never write to the database or call live execution services. It validates UI transitions and outbound request wiring, not backend persistence or external delivery.

Live checks use `frontend/verification/m10-live-read.cjs`. The default preview's API fetch failed in the browser, and the local backend permits the `http://localhost:5173` browser origin rather than the additional test port. The test therefore proxies GET responses from `http://127.0.0.1:8787` inside Playwright and adjusts CORS only in the test response. Every non-GET API request is blocked. Production code, environment files, and backend CORS were not changed. This is live-data rendering verification, not certification of the default preview's connection configuration.

Approval-creation deduplication and authoritative lifecycle protections were reviewed in existing code and remain unchanged; no live creation/deduplication mutation was performed. No live AI-provider request, n8n execution, Slack delivery, or outcome write was made.

## Reproduce browser checks

The harness uses the already available Playwright runtime and installed Microsoft Edge. No dependency was added to the project. Start the frontend on the test port:

```powershell
npm.cmd --prefix frontend run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

In a second terminal, from the repository root, set `M10_PLAYWRIGHT` to an existing Playwright module directory (or omit it when Playwright is already resolvable), then run:

```powershell
node frontend/verification/m10-browser.cjs
# Optional: requires the local backend already running on port 8787; GET only.
node frontend/verification/m10-live-read.cjs
```

## Exact files for this milestone

Application files:

- `frontend/src/components/Customer360.tsx`
- `frontend/src/pages/Analytics.css`
- `frontend/src/pages/ApprovalsPage.tsx`
- `frontend/src/pages/ApprovalsPage.css`
- `frontend/src/pages/CustomerPage.css`
- `frontend/src/pages/CustomersPage.tsx`
- `frontend/src/pages/CustomersPage.css` (new)
- `frontend/src/pages/Operations.css` (new)

Verification files:

- `M10_VERIFICATION.md`
- `frontend/verification/m10-browser.cjs`
- `frontend/verification/m10-live-read.cjs`
- `screenshots/m10-browser-results.json`
- `screenshots/m10-customers-320.png`
- `screenshots/m10-customers-1440.png`
- `screenshots/m10-approvals-320.png`
- `screenshots/m10-approvals-1440.png`
- `screenshots/m10-customers-live.png`
- `screenshots/m10-approvals-live.png`

The four width-named screenshots show clearly synthetic browser fixtures, including deliberately extreme account values. The two `-live` screenshots show read-only local API data. They are verification snapshots, not fixed product content.

## Scope and Git

Backend logic, schema/migrations, risk rules, API types/client contracts, customer health, AI providers/fallback, n8n and Slack are unchanged. No secret/environment files were read or edited.

The working tree started clean. During this run, unrelated untracked `.claude/`, `.codex/`, `.impeccable/`, `frontend/.impeccable/`, and `PRODUCT.md` appeared. They were not created or modified by this milestone pass and were left untouched. Review/stage only the M10 file list above. No staging, commit, or push was performed.

Suggested manual commit: `style: polish Revenue Recovery OS product experience`.
