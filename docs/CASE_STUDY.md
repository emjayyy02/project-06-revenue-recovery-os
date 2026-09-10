# Revenue Recovery OS

## V1 — Customer Churn & Recovery Intelligence

[Live Demo](https://revenue-recovery-os-et.vercel.app) · [Source Code](https://github.com/emjayyy02/project-06-revenue-recovery-os) · [Technical README](../README.md)

## 1. Project Overview

I built Revenue Recovery OS to connect customer-risk evidence with accountable recovery work. A React workspace surfaces account context, a Cloudflare Worker owns business rules, and Supabase/PostgreSQL stores the operational record. n8n and Slack provide external execution, while AI assistance supports review without controlling decisions. The public version demonstrates this design using fictional data and read-only business actions—not real customer results.

## 2. The Business Problem

The problem I designed for was fragmentation. Product usage, billing failures, support interactions, and feedback can each reveal concern without giving an account owner a coherent next step. Knowing that a customer is unhappy is different from knowing which accounts need attention first, what value is exposed, and whether someone has acted.

A notification workflow addresses only part of that problem. It may send an alert without retaining approval state, execution history, or a confirmed recovery outcome. I wanted one operational view that connected evidence, prioritization, responsibility, and follow-through. This is a designed business scenario, not a claim of measured impact at a client organization.

## 3. What I Wanted the System to Own

The intended business flow is:

```text
Customer → Events → Risk Signals → Risk Score
    → Recovery Recommendation → Human Approval → Execution
    → Confirmed Outcome → Analytics
```

My guiding principle was: **a workflow performs a process; a system owns the process.** n8n should perform external work, not become the only place where the business can discover what happened.

Ownership therefore lives in application records and explicit transitions. Event ingestion and risk recalculation are separate operations; accepting an event does not automatically launch recovery. This keeps the conceptual flow from implying an autonomous pipeline that V1 does not implement.

## 4. Architecture

The deployed read path and configured development execution path have different permissions:

```text
PUBLIC DEPLOYMENT
Visitor → Vercel / React → Cloudflare Worker → Demo Supabase

DEVELOPMENT EXECUTION
Worker → n8n → Slack → success callback → Worker / database
           └─ invalid payload → failure callback ───────┘
```

React owns presentation and interaction. The Worker owns the API, validation, scoring, analytics, lifecycle operations, and demo security boundary. PostgreSQL is the source of truth. n8n handles external execution; AI provides assistance; a human makes sensitive decisions.

This division keeps business rules out of individual screens and automation nodes. The frontend reads backend analytics rather than maintaining a second set of formulas. The public deployment does not expose the execution path as an interactive capability.

## 5. Explainable Risk Model

I chose deterministic scoring instead of AI-owned risk because an operator needs an answer to “why is this account high risk?” Each positive signal retains its source event, weight, severity, and explanation.

| Evidence | Contribution |
| --- | ---: |
| Usage decline 25–50% | +15 per event |
| Usage decline >50% | +25 per event |
| Inactivity >7 through 14 days | +8 per event |
| Inactivity >14 days | +15 per event |
| One failed payment | +20 |
| Two or more failed payments | +30 total |
| Negative support | +15 per event |
| Negative feedback | +10 per event |
| Customer reply | −10 once |
| Successful payment | −15 once |
| Usage recovered | −20 once |

The score is clamped to 0–100: Low is 0–24, Medium 25–49, High 50–74, and Critical 75–100. Each recovery reduction applies once when that event type exists, not once per occurrence.

These rules are predictable, auditable, and straightforward to test. They also have limits: weights need manual refinement, and the engine evaluates supplied history without time decay. Recalculation replaces current signals and appends a score. This is explainable prioritization, not predictive machine learning or a calibrated probability of churn.

## 6. Customer 360 and Revenue Exposure

Customer 360 turns a score into a working account view: account value, owner, health, risk, contributing signals, activity, recommendation, and intervention history. The operator can inspect evidence before choosing a recovery action instead of responding to an unexplained number.

I kept **risk level separate from customer health**. Risk is derived from events; health is a distinct stored account attribute. Recording recovery does not silently update health or recalculate risk.

Revenue Exposure sums the account values of customers whose latest risk is High or Critical. It answers “how much account value needs attention?” rather than pretending to predict exact financial loss. Customer 360 maps eligible risk levels to existing playbooks; AI does not make that selection.

![Dashboard showing account-value exposure, risk distribution, and recovery activity](assets/dashboard.png)

The public demo connects exposure with risk coverage and confirmed recovery activity.

![Apex Digital Customer 360 with a 75/100 critical score and four explained risk signals](assets/customer-360.png)

Apex Digital's signals, activity, recommendation, and pending intervention appear together. The [Customers workspace](assets/customers.png) provides the portfolio-wide account view.

## 7. Recovery Lifecycle

```text
pending_approval
├─ approve → approved
│  └─ execute → executing
│     ├─ sent → recovered / not_recovered
│     └─ failed → retry → executing
└─ reject → rejected
```

The strongest modeling decision was separating technical execution status from business outcome. `sent` describes delivery; `recovered` and `not_recovered` belong to a separate outcome field. A message being sent does not prove that a customer recovered.

Only a sent, unresolved intervention can receive a final outcome. Recovery success rate uses recovered interventions divided by resolved interventions, excluding those awaiting a decision. Recovered-customer counts are deduplicated. This prevents successful delivery from inflating business performance.

![Approvals showing disabled decision controls, execution history, failure details, and separate business outcomes](assets/approvals.png)

The seeded records show pending approval, approved, failed, and sent states alongside recovered and not-recovered outcomes. Public-demo actions are disabled.

## 8. Human Approval

Approval is an accountability boundary. An account owner may know context that an event stream cannot capture: a sensitive conversation, an existing commitment, or an inappropriate moment for outreach.

The lifecycle therefore includes approval, rejection, explicit execution, and manually confirmed outcomes. Approval does not itself dispatch the action. Keeping these decisions visible makes responsibility clearer; it is not simply a workaround for AI limitations. V1 models this workflow without claiming authenticated approver identity or role-based access control.

## 9. AI Assistance

AI can provide a risk summary, recommended next action, and draft outreach message. It cannot calculate authoritative risk, approve an intervention, execute it, or record an outcome. The UI presents assistance for review and does not automatically submit the generated draft as an intervention.

In configured development, the optional OpenRouter provider returns structured content validated with Zod. Provider failure, malformed JSON, invalid output, or missing credentials falls back to deterministic assistance. The public demo always uses that fallback.

This makes assistance useful without making the process depend on provider availability. Schema validation checks structure, not factual truth, so human review remains necessary even when provider output passes validation.

## 10. Automation and Failure Handling

The sanitized n8n workflow accepts a webhook, validates the payload, sends a Slack notification on the valid branch, and calls back with success. Invalid payloads take a failure-callback branch. Slack delivery here is an operational notification, not proof of customer outreach or recovery.

Before dispatch, the Worker sets `executing`, increments `execution_attempts`, records the attempt time, and clears the previous `execution_error`. Accepted webhook dispatch is not proof of completion: the application remains in progress until callback state is recorded. Start failures and failure callbacks record `failed`; an operator can retry a failed intervention.

The boundary has real limitations. The export does not catch every Slack error, reconcile missing callbacks, or provide automatic retries and exactly-once delivery. A lost callback can leave execution unresolved. V1 exposes execution state and manual retry without claiming durable delivery guarantees it does not have.

![Local n8n canvas showing validation, Slack notification, and success/failure callbacks](assets/n8n-workflow.png)

The current local canvas includes a Slack Error → Failure Callback connection absent from the sanitized public export. Only the canvas is shown; credentials and endpoint details are not exposed, and this image is not proof of successful execution.

## 11. Reliability Decisions

I put critical protections below the UI. Zod validates request shapes, but database-backed state decides whether an operation is meaningful. A partial unique index prevents two pending interventions for the same customer and playbook, including requests that race past an application-level check.

Final outcomes use conditional writes: eligibility is checked again in the update that records both the outcome and timestamp. A concurrent request cannot overwrite the first confirmed result. This protection is specific; it does not imply that every lifecycle operation has equivalent concurrency guarantees.

Attempt counts, errors, and timestamps support investigation. Sanitized 5xx responses avoid returning internal details. Loading, empty, error, refresh, and disabled-action states help the operator distinguish missing data from a failed request. Reliability includes how uncertainty is presented, not only the happy path.

## 12. Public Deployment and Security

The public deployment runs on Vercel, a Cloudflare Worker, and a separate Demo Supabase project. Reads and deterministic assistance are allowed; business mutations return `403 DEMO_READ_ONLY` before privileged work. Missing or invalid application modes also deny writes. Frontend restrictions mirror this server-enforced boundary.

The database hardening migration enables RLS on six application tables, denies direct `anon` and `authenticated` table access through privilege revocation, and preserves the service-role operations the backend needs. Because that role bypasses RLS, Worker enforcement remains essential. Exact-origin CORS controls browser access; it is not authentication.

Secrets stay server-side. No OpenRouter key or n8n execution URL is exposed publicly, and demo mode prevents those external calls. The prior documentation audit verified read behavior, fallback assistance, and mutation denial; it did not repeat direct authenticated-JWT or hosted privilege probes. Those verification boundaries are recorded in the [security documentation](DEMO_DATABASE_SECURITY.md).

This is a **V1 public-demo security model**, not enterprise authentication. The development write API belongs in a trusted environment, not on a public authenticated-service boundary it does not implement.

## 13. Demo Snapshot

The public snapshot is **fictional, sanitized portfolio data**, not real customer activity or commercial results:

| Measure | Snapshot |
| --- | ---: |
| Customers / events | 24 / 75 |
| Risk signals / risk scores | 43 / 24 |
| Playbooks / interventions | 3 / 6 |
| Low / Medium / High / Critical | 14 / 3 / 5 / 2 |
| At-risk / critical customers | 7 / 2 |
| Revenue exposure | ₱1,569,000 |
| Recovered customers | 1 |
| Recovery success rate | 50% |

The fixed seed makes the demonstration reproducible. Its risk and analytics outputs are checked using the actual application functions rather than separately invented presentation values.

![Analytics showing 50 percent recovery success, three outcome categories, risk coverage, and revenue exposure](assets/analytics.png)

Captured from the public demo on September 11, 2026, at a 1440px desktop viewport in dark mode. These figures describe the fictional snapshot, not commercial performance.

## 14. The Hardest Problems I Solved

**Frontend/backend TypeScript boundaries.** The frontend configuration had included backend service files, causing the Vercel build to cross runtime boundaries. Restricting the frontend application scope to `src` removed that coupling. Local success is not enough when deployment uses a different build boundary.

**Production CORS.** A working localhost frontend did not establish permission for the Vercel origin. I made the deployed origin explicit in Worker configuration. The lesson was to treat CORS as environment configuration, never as a substitute for authorization.

**Execution confirmation.** I separated webhook acceptance from delivery and business recovery. Callback states, attempt tracking, and manual retry made failures inspectable while preserving the remaining delivery limitations.

**Database isolation.** Public deployment required a separate demo database, reviewed RLS and grants, and a Worker mutation guard. Protecting the browser alone would not protect privileged backend operations.

**Public workflow sanitization.** An n8n export can reveal operational metadata even without tokens. I replaced private configuration with placeholders, removed credential bindings and captured execution data, and included Git-history cleanup in the publication process. Reviewing only the latest file would have missed the history boundary.

## 15. Testing

The backend suite passes **100 tests across seven files**, covering risk rules, analytics, intervention lifecycle, outcomes, demo-mode security, CORS, and error handling. Frontend build and lint, backend TypeScript checks, and the offline seed/security verifier provide additional checks.

Earlier browser verification covered responsive layouts and operational states. The screenshots above were separately checked against the current public demo; this capture pass is not a new full responsive audit. Backend regression tests mock external HTTP and do not certify fresh Slack delivery. The prior live audit also observed a transient analytics 500 before repeated successful reads; its cause was not established.

## 16. Key Engineering Decisions

- Deterministic scoring instead of AI authority.
- Database ownership of business state; n8n ownership of external execution.
- Human approval before sensitive recovery actions.
- Separate execution status and confirmed business outcome.
- Database constraints and conditional writes for critical invariants.
- Validated AI output with deterministic fallback.
- Isolated public demo data and server-enforced read-only behavior.

## 17. What I Learned

The biggest shift was moving from workflows to business state, lifecycle, ownership, and failure. A successful HTTP request can still leave the business process unfinished. A useful dashboard depends on precise definitions of exposure and recovery, not just attractive totals.

I also learned to treat deployment boundaries as part of the design: compiler scope, allowed origins, database privileges, and public exports can each undermine an otherwise working local system. Database constraints protect assumptions that UI controls cannot guarantee. Keeping AI advisory made both responsibility and failure handling easier to explain.

## 18. Final Result

Revenue Recovery OS demonstrates how I translate a business process into explicit system boundaries, persistent state, controlled automation, and measurable definitions. It combines backend ownership, bounded AI assistance, failure handling, and a deliberately restricted public deployment. V1 is a working portfolio system with documented limits—not a claim of commercial readiness or proven customer recovery.
