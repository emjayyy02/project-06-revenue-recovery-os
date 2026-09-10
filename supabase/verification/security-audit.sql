-- PREPARED ONLY. Read-only catalog inspection after explicit project approval.
-- First verify target project identity out of band. Never print credentials.
-- Expected: six RLS-enabled tables; no policies; no client privileges;
-- service_role BYPASSRLS and exactly the required effective table privileges.

select current_database(), current_user, session_user;

select c.relname as table_name, pg_get_userbyid(c.relowner) as owner,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
  and c.relname in ('customers', 'customer_events', 'risk_signals',
                   'risk_scores', 'recovery_playbooks', 'interventions')
order by c.relname;

select rolname, rolbypassrls, rolsuper
from pg_roles where rolname in ('anon', 'authenticated', 'service_role');

select has_schema_privilege('service_role', 'public', 'USAGE') as service_schema_usage;

with app_tables(table_name) as (
  values ('customers'), ('customer_events'), ('risk_signals'),
         ('risk_scores'), ('recovery_playbooks'), ('interventions')
), roles(role_name) as (values ('anon'), ('authenticated'), ('service_role')),
privileges(privilege) as (
  values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
         ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
)
select table_name, role_name, privilege,
       has_table_privilege(role_name, 'public.' || table_name, privilege) as table_access,
       case when privilege in ('SELECT', 'INSERT', 'UPDATE', 'REFERENCES')
         then has_any_column_privilege(role_name, 'public.' || table_name, privilege)
         else null end as any_column_access
from app_tables cross join roles cross join privileges
order by table_name, role_name, privilege;

-- PUBLIC is an ACL pseudo-role, not a role to pass to has_table_privilege.
-- These two queries must return zero PUBLIC grants (table AND column scope).
select c.relname, a.privilege_type
from pg_class c join pg_namespace n on n.oid = c.relnamespace
cross join lateral aclexplode(c.relacl) a
where n.nspname = 'public' and a.grantee = 0
  and c.relname in ('customers', 'customer_events', 'risk_signals',
                   'risk_scores', 'recovery_playbooks', 'interventions');

select c.relname, col.attname, a.privilege_type
from pg_class c join pg_namespace n on n.oid = c.relnamespace
join pg_attribute col on col.attrelid = c.oid and col.attnum > 0 and not col.attisdropped
cross join lateral aclexplode(col.attacl) a
where n.nspname = 'public' and a.grantee = 0
  and c.relname in ('customers', 'customer_events', 'risk_signals',
                   'risk_scores', 'recovery_playbooks', 'interventions');

select tablename, policyname, roles, cmd
from pg_policies where schemaname = 'public'
  and tablename in ('customers', 'customer_events', 'risk_signals',
                   'risk_scores', 'recovery_playbooks', 'interventions');

-- Table ownership alone does not prove the creator used by future migrations.
-- Inspect defaults only; no ALTER DEFAULT PRIVILEGES is prepared.
select pg_get_userbyid(d.defaclrole) as creator_role, d.defaclobjtype, d.defaclacl
from pg_default_acl d join pg_namespace n on n.oid = d.defaclnamespace
where n.nspname = 'public';
