# Revenue Recovery OS — Architecture

## V1
Customer Churn & Recovery Intelligence

## System Flow

React / TypeScript Frontend
↓
Cloudflare Workers Backend API
↓
Supabase / PostgreSQL
↓
Business Logic / Risk Engine
↓
Interventions / Approval
↓
n8n
↓
Slack / Email / Optional HubSpot
↓
Outcome Update

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
- email delivery
- integration retries
- execution callbacks

### AI
- risk summaries
- recovery recommendations
- outreach drafts
- optional sentiment analysis

AI does not calculate the churn-risk score.

### Human
- approve / reject sensitive interventions
- review exceptions
- decide sensitive recovery actions

## Core Principle

The application owns business state.

n8n executes cross-system work.

AI assists interpretation and drafting.

Humans own sensitive judgment.