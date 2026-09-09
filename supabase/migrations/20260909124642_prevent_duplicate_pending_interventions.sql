create unique index unique_pending_intervention_per_playbook
on public.interventions (
  customer_id,
  playbook_id
)
where status = 'pending_approval';