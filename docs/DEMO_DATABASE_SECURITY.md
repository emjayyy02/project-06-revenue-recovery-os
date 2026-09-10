# Development and public demo databases

M11.3 prepares files only. No project has been created, linked, migrated, or seeded.
The new migration is pending in the normal migration directory: do not run a
blanket database push against the currently linked development project.

| Environment | Database | Application behavior |
|---|---|---|
| Local development | Existing development Supabase | Explicit development modes preserve writes and integrations |
| Future public portfolio | Separate demo Supabase | Worker demo mode exposes reads and deterministic assistance; denies business mutations |

Separation prevents local testing from changing the portfolio snapshot. The
browser calls the Worker and receives no Supabase key. The Worker holds
`SUPABASE_SECRET_KEY` server-side and uses the Data API. Keep the Data API enabled.
RLS and client privilege revocation prevent direct client table access; Worker
demo enforcement is still required because the secret/service role bypasses RLS.
See [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
and [API security](https://supabase.com/docs/guides/api/securing-your-api).

## Inspected schema and required access

Repository evidence: five existing migrations, generated database types, backend
route handlers and analytics reads. No old migration is changed.

| Table | Required service-role privileges | Current code use |
|---|---|---|
| `customers` | SELECT | Customer reads, assistance, execution joins, analytics |
| `customer_events` | SELECT, INSERT | Timeline, assistance, event ingestion, recalculation |
| `risk_signals` | SELECT, INSERT, DELETE | Signal reads and replacement on recalculation |
| `risk_scores` | SELECT, INSERT | Latest stored score, analytics, recalculation history |
| `recovery_playbooks` | SELECT | Embedded intervention/execution joins |
| `interventions` | SELECT, INSERT, UPDATE | Creation, decisions, execution/retry/callback, outcomes, analytics |

All six tables have UUID primary keys using `gen_random_uuid()` defaults. No
application sequences or functions are created; generated public Views and
Functions types are empty. The generated `graphql_public.graphql` function is a
Supabase facility, not an application function, and is untouched.

Foreign keys:

- `customer_events.customer_id`, `risk_signals.customer_id`,
  `risk_scores.customer_id`, `interventions.customer_id` reference customers;
  customer deletion cascades.
- `risk_signals.source_event_id` references customer events, with DELETE SET NULL.
- `interventions.playbook_id` references recovery playbooks, with DELETE RESTRICT.

Indexes, in addition to six primary-key indexes:

- Events: `idx_customer_events_customer_id`, `idx_customer_events_event_type`,
  `idx_customer_events_occurred_at` (descending).
- Signals: `idx_risk_signals_customer_id`, `idx_risk_signals_source_event_id`,
  `idx_risk_signals_active`.
- Scores: `idx_risk_scores_customer_id`, `idx_risk_scores_calculated_at` (descending).
- Interventions: `idx_interventions_customer_id`, `idx_interventions_status`,
  `idx_interventions_playbook_id`; unique customer/playbook pair where status is
  `pending_approval` via `unique_pending_intervention_per_playbook`.

Before the new migration, no repository migration enables RLS, defines policies,
or changes grants. Ordinary SQL creation leaves RLS disabled. Hosted state is
unverified. Config exposes `public`/`graphql_public`, has PostgreSQL 17, and retains
the development `seed.sql`. The commented `auto_expose_new_tables` explanation
mentions `postgres`, but neither it nor the migrations proves the actual
object-creating login/role. There are no SET ROLE or ALTER OWNER statements.

## Prepared migration

`20260910090000_harden_application_table_access.sql` enables RLS on the six tables,
revokes all table privileges from `anon`, `authenticated`, and PUBLIC, then
normalizes direct `service_role` grants to the table-specific matrix above.
The revoke/regrant happens in one transaction. No policies, CASCADE clauses,
schema changes, schema-wide revocations, or data changes are included.

Do not add service-role policies. Check its BYPASSRLS attribute and effective
privileges later. Seeding requires an owner/admin connection: application
permissions intentionally do not allow inserting customers or playbooks.

Default privileges are deliberately unchanged because the actual creator role is
not established. Future tables require a separate review and explicit security
configuration. Existing column grants, role inheritance, or hosted policy drift
are also not established by this repository; the verification queries inspect
effective table/column access before release. Stop for review if hosted state
differs; do not compensate with broad grants or revocations.

## Stable fictional snapshot

`supabase/demo_seed.sql` is separate from the development seed and is not added
to `config.toml`. It contains only fictional portfolio records. Emails end in
`.demo`; owner names are fictional seed personas. Event descriptions and metadata,
drafts, and the generic failure message explicitly identify demo content. No real
delivery, customer, or recovery performance is claimed.

Fixed snapshot: **2026-09-09 12:00 UTC**. Customer/playbook creation is August 1;
all other dates are at or before the snapshot. Old relative event timestamps are
materialized against this date. IDs are deterministic. Risk scores/signals come
from the existing engine with events ordered by occurred_at; no scoring rules or
analytics outputs are reimplemented in SQL or the frontend.

The seed is **clean-project-only**, not an upsert/reset script. It locks the six
tables in a transaction, refuses any nonempty table, then inserts records in FK
order. Repeat application is an intentional error, not a destructive reset.
Any failure requires rollback; it must never be followed by partial manual inserts.
Use a reviewed SQL runner with stop-on-error and rollback-on-error. Do not first
run development `seed.sql` (it truncates and populates the tables).

After future provisioning approval: confirm the separate project's identity,
review/apply the schema and security migration there, confirm six empty tables,
then seed as owner/admin. Rebuilding a populated demo is a separate explicit
decision; this milestone provides no deletion/reset procedure.

Offline check: `node supabase/verification/demo-data.cjs`. It uses already
installed backend TypeScript, the real pure risk/analytics functions, and a narrow
literal SQL parser; it has no database/network client. `--write` regenerates only
the local demo SQL file after a deliberate source-data review. It never executes
SQL. The development seed remains the source of fictional customer/event inputs.

## M11.4 verification plan (not executed)

1. Confirm the demo project identity independently before any connection or
   application. Never change the development link or existing credentials as a
   shortcut. Check migration history and table owners; apply only after approval.
2. Run `supabase/verification/security-audit.sql` on the approved demo target.
   Expect six RLS-enabled tables, zero policies, zero PUBLIC table/column grants,
   no effective privileges for anon/authenticated, and the service matrix above.
   Verify service_role BYPASSRLS, public schema USAGE, and no inherited excess
   access. Current owner is not sufficient proof of future migration creator.
3. Test direct Data API reads on all six tables using the anon/publishable client
   identity: SELECT must fail with permission denial, not an empty successful
   response. Repeat with a genuine authenticated JWT from that target; do not
   substitute an anon request and call it an authenticated test. If no disposable
   test identity is authorized, record this as outstanding; SQL SET LOCAL ROLE
   verifies database permissions but does not replace end-to-end JWT verification.
4. For each client role, probe valid INSERT, UPDATE, and DELETE operations on all
   six tables in an approved isolated verification copy or rollback-only SQL
   transactions. Use valid UUIDs, required values, and existing FK references so
   denial is an authorization failure, not a schema/payload failure. Expected SQL
   state is 42501. Roll back every probe separately after errors. Never allow an
   unexpectedly successful probe to persist into the stable showcase.
5. As service_role, verify SELECT including embedded customer/playbook joins;
   test required INSERT/UPDATE/DELETE operations in rollback-only transactions
   in the isolated copy. Verify unsupported writes are denied. Do not seed through
   service_role or expand its grants to make owner-only seed operations work.
6. Run the Worker in development mode against that isolated copy: event ingestion,
   recalculation (including signal deletion), intervention creation, approve/reject,
   execute/retry, callback, outcome recording. Stub automation/provider endpoints;
   verify persisted results and unchanged contracts. Do not switch the public
   Worker to development mode. Leave the existing development project untouched.
7. Run demo mode with a provider key present: all eight mutation routes must
   return 403/DEMO_READ_ONLY before DB/external side effects; assistance must return
   fallback and issue no provider call. Compare table state before/after. Verify
   missing/invalid modes also deny mutation.
8. Read the seeded data through the Worker. Compare counts, all risk states, and
   analytics with M11_3_VERIFICATION.md; check Customers, Customer 360, Approvals,
   Dashboard, Analytics, and fallback assistance. Confirm no Supabase secret is
   exposed to frontend code or responses. Test repeat-seed refusal only on the
   approved disposable copy. None of these checks authorizes deployment.
