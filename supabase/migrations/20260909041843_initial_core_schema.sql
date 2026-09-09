create table public.customers (
  id uuid primary key default gen_random_uuid(),

  full_name text not null,
  email text not null,
  company text not null,

  account_value numeric(12,2) not null default 0,

  lifecycle_status text not null,
  customer_health_status text not null,

  owner text,
  last_activity_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_events (
  id uuid primary key default gen_random_uuid(),

  customer_id uuid not null
    references public.customers(id)
    on delete cascade,

  event_type text not null,
  source text not null,

  event_value jsonb,

  description text,

  occurred_at timestamptz not null,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index idx_customer_events_customer_id
  on public.customer_events(customer_id);

create index idx_customer_events_event_type
  on public.customer_events(event_type);

create index idx_customer_events_occurred_at
  on public.customer_events(occurred_at desc);

  create table public.risk_signals (
  id uuid primary key default gen_random_uuid(),

  customer_id uuid not null
    references public.customers(id)
    on delete cascade,

  source_event_id uuid
    references public.customer_events(id)
    on delete set null,

  signal_type text not null,

  weight integer not null,

  severity text not null,

  explanation text not null,

  active boolean not null default true,

  created_at timestamptz not null default now()
);

create table public.risk_scores (
  id uuid primary key default gen_random_uuid(),

  customer_id uuid not null
    references public.customers(id)
    on delete cascade,

  score integer not null
    check (score >= 0 and score <= 100),

  risk_level text not null,

  calculated_at timestamptz not null default now()
);

create table public.recovery_playbooks (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  description text not null,

  risk_level text not null,

  requires_approval boolean not null default true,

  action_type text not null,

  created_at timestamptz not null default now()
);

create table public.interventions (
  id uuid primary key default gen_random_uuid(),

  customer_id uuid not null
    references public.customers(id)
    on delete cascade,

  playbook_id uuid not null
    references public.recovery_playbooks(id)
    on delete restrict,

  type text not null,

  status text not null,

  recommended_action text,

  draft_message text,

  approved_at timestamptz,
  executed_at timestamptz,

  outcome text,

  created_at timestamptz not null default now()
);

create index idx_risk_signals_customer_id
  on public.risk_signals(customer_id);

create index idx_risk_signals_source_event_id
  on public.risk_signals(source_event_id);

create index idx_risk_signals_active
  on public.risk_signals(active);

create index idx_risk_scores_customer_id
  on public.risk_scores(customer_id);

create index idx_risk_scores_calculated_at
  on public.risk_scores(calculated_at desc);

create index idx_interventions_customer_id
  on public.interventions(customer_id);

create index idx_interventions_status
  on public.interventions(status);

create index idx_interventions_playbook_id
  on public.interventions(playbook_id);