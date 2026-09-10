-- M11.3 preparation: review before applying to any hosted project.
-- Only the six application tables are affected. Data API remains enabled.
-- Existing code accesses these tables through a server-only secret/service role.

begin;

alter table public.customers enable row level security;
alter table public.customer_events enable row level security;
alter table public.risk_signals enable row level security;
alter table public.risk_scores enable row level security;
alter table public.recovery_playbooks enable row level security;
alter table public.interventions enable row level security;

revoke all privileges on table
  public.customers,
  public.customer_events,
  public.risk_signals,
  public.risk_scores,
  public.recovery_playbooks,
  public.interventions
from anon, authenticated, public;

-- Normalize direct service-role grants instead of retaining broader defaults.
-- Seeding is an owner/admin operation, not an application service-role operation.
revoke all privileges on table
  public.customers,
  public.customer_events,
  public.risk_signals,
  public.risk_scores,
  public.recovery_playbooks,
  public.interventions
from service_role;

grant select on table public.customers to service_role;
grant select, insert on table public.customer_events to service_role;
grant select, insert, delete on table public.risk_signals to service_role;
grant select, insert on table public.risk_scores to service_role;
grant select on table public.recovery_playbooks to service_role;
grant select, insert, update on table public.interventions to service_role;

-- No public or service-role RLS policies: service_role bypasses RLS.
-- No default-privilege changes: actual migration creator is not proven locally.
-- No CASCADE, internal-schema changes, functions, sequences, or data changes.

commit;
