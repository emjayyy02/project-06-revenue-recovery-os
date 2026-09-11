# Revenue Recovery OS

> An explainable customer churn-risk and recovery operations system connecting customer signals, human-approved interventions, automation, and tracked outcomes.

[Live Demo](https://revenue-recovery-os-et.vercel.app) · [Case Study](docs/CASE_STUDY.md)

Portfolio V1 built with fictional, sanitized demo data.

## Overview

Revenue Recovery OS models how a Customer Success or Revenue Operations team could turn fragmented customer-risk signals into accountable recovery work. It identifies explainable churn risk and revenue exposure, recommends recovery interventions, and requires human approval before external execution.

The system tracks recommendations, decisions, execution, and confirmed outcomes in one workflow. **Successful workflow execution does not mean a customer was recovered.** The public demo lets reviewers explore these records through a deployed, API-backed interface.

## Selected Screenshots

Existing desktop captures from the public demo; all customer records and metrics are fictional.

### Dashboard

![Dashboard showing revenue exposure, customer risk distribution, and recovery activity](docs/assets/dashboard.png)

### Customer 360

![Customer 360 showing weighted risk evidence, customer events, and a recommended recovery action](docs/assets/customer-360.png)

### Approvals

![Approvals workspace separating approval decisions, execution states, and recovery outcomes](docs/assets/approvals.png)

### Analytics

![Analytics showing risk distribution, revenue exposure, and confirmed recovery outcomes](docs/assets/analytics.png)

## The Problem

Usage decline, failed payments, support friction, and negative feedback can each indicate customer risk. Raw events alone do not tell an account owner which accounts need attention first, why they are risky, how much revenue is exposed, or which intervention to consider.

Revenue Recovery OS connects that evidence to a traceable record of what was recommended, approved, executed, and ultimately resolved.

## Key Features

- Customer risk dashboard with prioritized account visibility.
- Customer 360 with event history, signal explanations, weights, and severity.
- Deterministic, explainable churn-risk scoring.
- Revenue exposure based on the account values of high- and critical-risk customers.
- Recovery playbook recommendations with optional assistance for summaries and drafts.
- Human approval and rejection of proposed interventions.
- n8n execution of approved work, with callbacks, attempt tracking, and manual retry.
- Separate execution and recovery-outcome tracking, surfaced in analytics.

## System Architecture

```text
React + TypeScript (Vercel)
        ↓
Cloudflare Worker API
        ↕
Supabase / PostgreSQL

Customer events → Deterministic risk engine (Worker)
        → Recovery recommendation → Human approval
        → n8n execution → External action / callback
        → Worker records execution → Human records recovery outcome
```

| Layer | Responsibility |
| --- | --- |
| Frontend | Operator interface and workflow visibility |
| Cloudflare Worker | Validation, database access, business rules, and lifecycle control |
| Supabase / PostgreSQL | Customers, events, signals, risk scores, playbooks, and interventions |
| n8n | Approved external execution and callbacks |
| AI | Advisory summaries, recommendations, and draft assistance |
| Human | Approval/rejection of sensitive interventions and confirmed outcomes |

**The application owns business state. n8n executes external work. AI assists. Humans own sensitive judgment.** See [architecture details](docs/ARCHITECTURE.md).

The [sanitized n8n export](n8n/revenue-recovery-intervention-executor.json) validates incoming payloads, sends valid requests to Slack, and calls the Worker with execution results. It requires private configuration before use; public visitors cannot trigger it.

## Explainable Risk and AI Assistance

The [risk engine](backend/src/services/risk-engine.ts) applies weighted rules for usage decline, login inactivity, failed or repeated failed payments, negative support, and negative feedback. Customer replies, successful payments, and recovered usage reduce the score once per recovery-event type. Scores are clamped to 0–100 and classified as low, medium, high, or critical; positive signals retain their source-event links and explanations.

Risk recalculation is explicit and evaluates stored event history without time decay. **AI does not calculate churn-risk scores.** Customer 360 maps risk levels to existing playbooks. Optional OpenRouter assistance provides summaries, next-action suggestions, and outreach drafts, with Zod validation and deterministic fallback. The public demo always uses that fallback.

## Recovery Lifecycle

```text
Signal → Risk → Recommendation → Approval → Execution → Outcome
```

A recommendation proposes work; a human approves or rejects it. Approved interventions can execute through n8n, with success recorded as `sent` and failure as `failed`. Failed execution supports manual retry.

Only a sent intervention with an unresolved outcome can be recorded as `recovered` or `not_recovered`. An email, Slack message, or API request succeeding establishes delivery, not customer recovery. Analytics calculates recovery success from resolved outcomes; revenue exposure represents account value at risk, not predicted loss or measured recovered revenue.

## Public Demo and Safeguards

The frontend is deployed on Vercel and calls a Cloudflare Worker backed by a separate demo Supabase database. All data is fictional and sanitized; the database does not represent real customers. Reviewers can inspect the architecture in action, risk evidence, approval history, and analytics without access to production customer data.

The public frontend is read-only for consequential mutations. The Worker independently enforces `APP_MODE=demo`, returning `403 / DEMO_READ_ONLY` for business mutations before database writes or external execution. Missing or invalid modes also deny writes. Non-mutating assistance remains available through deterministic fallback.

The Worker uses an explicit frontend-origin CORS allowlist and keeps database credentials server-side. See [demo database security](docs/DEMO_DATABASE_SECURITY.md) for access restrictions and verification boundaries.

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, Zod |
| Backend | Cloudflare Workers, TypeScript, Zod, Supabase JS |
| Data | Supabase, PostgreSQL |
| Automation | n8n, Slack, HTTP callbacks |
| AI assistance | Optional OpenRouter integration; deterministic fallback |
| Testing / quality | Vitest, browser verification scripts, TypeScript, Oxlint |
| Deployment | Vercel frontend, Cloudflare Workers API |

## Verification and Review Evidence

The repository includes [backend tests](backend/test), [browser verification scripts](frontend/verification), and an [offline demo-data verifier](supabase/verification/demo-data.cjs). Coverage includes risk and business behavior, analytics, outcomes, demo-mode restrictions, CORS, regression behavior, and responsive UI checks.

Implementation evidence: [outcomes and analytics](M9_VERIFICATION.md), [frontend hardening](M10_VERIFICATION.md), [visual consistency](M10_5_VERIFICATION.md), [themes and responsive UI](M10_6_VERIFICATION.md), and [demo database preparation](M11_3_VERIFICATION.md). These reports document checks and their limits, not certifications or guarantees about current hosted state.

## Limitations

This is a portfolio-scale V1 with fictional data, no production customer deployment, and no claim of real recovered revenue. AI is advisory; humans retain decision authority. The public demo intentionally disables business mutations and live n8n execution.

The risk model is rule-based rather than predictive machine learning. The sanitized workflow does not provide automatic retries, exactly-once delivery, or a catch-all Slack-error handler. Full execution requires a privately configured development environment.

## Local Development

Use a Node.js version compatible with the repository's Vite and Wrangler packages, plus a separate development Supabase database with the [SQL migrations](supabase/migrations) applied.

Copy [frontend/.env.example](frontend/.env.example) to `frontend/.env.local` and [backend/.dev.vars.example](backend/.dev.vars.example) to `backend/.dev.vars`. Set `VITE_API_BASE_URL` to the local Worker address, configure your own server-side database connection, and set `ALLOWED_ORIGINS` to the exact local frontend origin. The example's older reserved-setting comment is stale: the Worker consumes this setting.

Use `VITE_APP_MODE=development` and `APP_MODE=development` for local business actions. Keep real secrets out of Git and frontend variables. Optional AI and n8n configuration is needed only for those integrations.

Run each server from the repository root in a separate terminal:

**Frontend**

```sh
cd frontend
npm install
npm run dev
```

**Backend**

```sh
cd backend
npm install
npm run dev
```
