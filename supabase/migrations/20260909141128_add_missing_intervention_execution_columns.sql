alter table public.interventions
add column if not exists execution_error text,
add column if not exists execution_attempts integer not null default 0,
add column if not exists last_execution_at timestamptz;