alter table public.interventions
add column execution_error text,
add column execution_attempts integer not null default 0,
add column last_execution_at timestamptz;