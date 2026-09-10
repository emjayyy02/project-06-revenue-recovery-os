# Revenue Recovery OS — Architecture

## V1

Customer Churn & Recovery Intelligence

## System Flow

Public deployment:

```text
Public visitor → Vercel React / TypeScript frontend
→ Cloudflare Worker API → separate Demo Supabase / PostgreSQL
```

The Worker derives risk signals and scores from customer events, calculates
analytics, and owns the intervention lifecycle. Public demo mode permits reads
and deterministic assistance while blocking business mutations.

Execution in configured development mode:

```text
Approved intervention → Worker → n8n → Slack
→ execution callback → Worker → database state
→ human-confirmed recovery outcome
```

The [sanitized workflow](../n8n/revenue-recovery-intervention-executor.json)
routes valid payloads through Slack to a success callback; invalid payloads take
the failure callback. Its failure branch is not a catch-all Slack-error handler.
Public visitors cannot execute this workflow.

## Responsibility Split

### Frontend

- user interface
- navigation
- tables
- charts
- customer views
- approval actions
- loading / error states

### Backend

- API routes
- input validation
- authorization boundary
- business logic
- risk calculation
- intervention lifecycle
- database access

### Database

- customers
- customer events
- risk signals
- risk score history
- recovery playbooks
- interventions

### n8n

- external workflow execution
- Slack notifications
- execution callbacks

The Worker records attempts and failures; the application exposes manual retry.
The export does not configure automatic retries or exactly-once delivery.

### AI

- risk summaries
- recovery recommendations
- outreach drafts

AI does not calculate the churn-risk score.
Optional OpenRouter output is validated with Zod and falls back on failure.
Public demo assistance always uses the deterministic fallback.

### Human

- approve / reject sensitive interventions
- review exceptions
- decide sensitive recovery actions
- record confirmed recovered / not-recovered outcomes

## Core Principle

The application owns business state.

n8n executes cross-system work.

AI assists interpretation and drafting.

Humans own sensitive judgment.

Successful delivery and business recovery are separate states. See the
[README](../README.md#recovery-lifecycle) for lifecycle rules and the
[database security guide](DEMO_DATABASE_SECURITY.md) for the demo boundary.
