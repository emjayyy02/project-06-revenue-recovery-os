# M11.3 — preparation verification

Status: PASS for repository preparation. SQL execution, hosted role enforcement,
and live demo provisioning are deliberately unverified.

## Scope

One new hardening migration, one standalone demo seed, offline verification,
read-only future security-audit SQL, and documentation. Old migrations, config,
development seed, application source/types, risk rules, analytics, AI, n8n, and
frontend UI are unchanged. Initial working tree was clean on main.

## Dataset

| Table | Rows |
|---|---:|
| customers | 24 |
| recovery_playbooks | 3 |
| customer_events | 75 |
| risk_signals | 43 |
| risk_scores | 24 |
| interventions | 6 |

175 unique primary IDs, valid foreign references, explicit fixed timestamps, and
all required insert fields according to generated database types. Snapshot is
2026-09-09 12:00 UTC. All 24 stored scores and all 43 signal payloads match the real
engine given the seeded events; recovery reductions do not remove historic risk
signals because the current engine does not remove them.

| Company | Score | Risk |
|---|---:|---|
| Apex Digital | 75 | critical |
| NovaTech | 35 | medium |
| Vertex Labs | 0 | low |
| Acme Systems | 0 | low |
| Northstar Solutions | 60 | high |
| CloudBridge | 0 | low |
| BrightOps | 33 | medium |
| Orbit SaaS | 0 | low |
| PrismWorks | 55 | high |
| FlowGrid | 0 | low |
| SyncPoint | 15 | low |
| QuantumOps | 0 | low |
| HelioMetrics | 0 | low |
| LedgerLane | 23 | low |
| SignalCraft | 55 | high |
| MetricForge | 70 | high |
| RelayWorks | 8 | low |
| Clearpath Cloud | 0 | low |
| ScalePilot | 35 | medium |
| BeaconDesk | 50 | high |
| Vectorly | 75 | critical |
| Loopline Services | 0 | low |
| LaunchStack | 0 | low |
| CoreVista | 0 | low |

Old development-seed comments label LedgerLane medium and MetricForge critical.
The demo uses actual engine outputs (23/low and 70/high), not those comments.
Customer health remains separate from calculated risk.

| Customer | Intervention state |
|---|---|
| Apex Digital | pending_approval, no execution |
| NovaTech | approved, no execution |
| Northstar Solutions | sent, awaiting outcome |
| SyncPoint | sent, recovered, timestamp recorded |
| PrismWorks | sent, not_recovered, timestamp recorded |
| MetricForge | failed, one attempt, generic fictional error |

All sent records have approval and execution timestamps and no error. Completed
outcomes follow execution; SyncPoint's recorded recovery follows its recovery
events. Pending rows respect the unique customer/playbook constraint.

## Analytics derived by the existing function

| Metric | Value |
|---|---:|
| Total customers | 24 |
| At risk (high + critical) | 7 |
| Critical | 2 |
| Revenue exposure | 1,569,000 |
| Recovered customers | 1 |
| Recovery success rate | 50% |
| Risk distribution low / medium / high / critical / uncalculated | 14 / 3 / 5 / 2 / 0 |
| Revenue by risk low / medium / high / critical | 1,179,000 / 387,000 / 1,049,000 / 520,000 |
| Outcomes pending / recovered / not recovered | 1 / 1 / 1 |
| Recent recovery activity entries | 5 |

The five timeline entries are three sends and two outcome decisions, not five
distinct interventions. The backend's real function produces these figures;
there are no frontend constants or fake trend rows.

## Checks

- `node supabase/verification/demo-data.cjs`: PASS. Verifies exact generated SQL
  round trip, table/column names, required values, UUIDs/uniqueness, references,
  supported values, timestamp/lifecycle ordering, pending uniqueness, fictional
  metadata/email domains, URL/token/private-path absence, actual engine output,
  and real analytics.
- Security migration static checks: PASS. Six RLS enables, revocations scoped to
  six tables, exact service-role grant matrix, transaction boundaries, no policies
  or default-privilege changes. Manual SQL review included the seed guard.
- `git diff --check`: PASS, including new files checked with no-index diffs.
- `npm.cmd run test -- --run` in backend: PASS, 88 tests across five files.
- Application build/lint not required: no application or dependency changes.

Static SQL parsing is intentionally limited to literal INSERT blocks and security
statement structure. It is not a PostgreSQL execution or Data API permission test.
No PostgreSQL instance was started, reset, or contacted. No hosted verification
or browser rendering is claimed; UI support was checked against schema, route,
playbook-ID, state, and analytics expectations.

## Sanitization

Reviewed fictional names, `.demo` emails, owners, all 75 event descriptions/values,
three playbooks, generated signals, drafts, errors, and metadata. No private
customer information, keys, URLs, Slack identifiers, or machine details found.
Demo descriptions/drafts/errors and event metadata explicitly mark fiction.

## Deferred gates

Follow docs/DEMO_DATABASE_SECURITY.md and verification/security-audit.sql after
separate project approval. Live role/column/inherited grants, policies, owners,
service BYPASSRLS, direct anon/authenticated denials, backend permitted operations,
demo guard side effects, stable seed import/refusal, and API/UI results remain to
be proven. Default privilege hardening is deferred until the creator is known.

Hosted infrastructure changes: NONE. Database changes applied: NONE.
No commit. No push.
