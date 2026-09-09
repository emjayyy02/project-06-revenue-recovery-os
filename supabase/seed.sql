-- =========================================================
-- RESET DEMO DATA
-- =========================================================

truncate table
  public.interventions,
  public.risk_scores,
  public.risk_signals,
  public.customer_events,
  public.recovery_playbooks,
  public.customers
restart identity cascade;

insert into public.customers (
  id,
  full_name,
  email,
  company,
  account_value,
  lifecycle_status,
  customer_health_status,
  owner,
  last_activity_at
)
values
(
  '11111111-1111-1111-1111-111111111111',
  'Sarah Lim',
  'sarah.lim@apexdigital.demo',
  'Apex Digital',
  180000.00,
  'active',
  'at_risk',
  'Marvin',
  now() - interval '16 days'
),
(
  '22222222-2222-2222-2222-222222222222',
  'Marco Cruz',
  'marco.cruz@novatech.demo',
  'NovaTech',
  95000.00,
  'active',
  'at_risk',
  'Angela',
  now() - interval '6 days'
),
(
  '33333333-3333-3333-3333-333333333333',
  'Jane Lee',
  'jane.lee@vertexlabs.demo',
  'Vertex Labs',
  120000.00,
  'active',
  'healthy',
  'Marvin',
  now()
),
(
  '44444444-4444-4444-4444-444444444444',
  'David Tan',
  'david.tan@acmesystems.demo',
  'Acme Systems',
  75000.00,
  'active',
  'healthy',
  'Angela',
  now() - interval '1 day'
),
(
  '55555555-5555-5555-5555-555555555555',
  'Nina Reyes',
  'nina.reyes@northstar.demo',
  'Northstar Solutions',
  210000.00,
  'active',
  'at_risk',
  'Marvin',
  now() - interval '20 days'
),
(
  '66666666-6666-6666-6666-666666666666',
  'Kevin Ong',
  'kevin.ong@cloudbridge.demo',
  'CloudBridge',
  45000.00,
  'active',
  'healthy',
  'Angela',
  now() - interval '2 days'
),
(
  '77777777-7777-7777-7777-777777777777',
  'Patricia Gomez',
  'patricia.gomez@brightops.demo',
  'BrightOps',
  150000.00,
  'active',
  'at_risk',
  'Marvin',
  now() - interval '11 days'
),
(
  '88888888-8888-8888-8888-888888888888',
  'Daniel Yu',
  'daniel.yu@orbitsaas.demo',
  'Orbit SaaS',
  68000.00,
  'active',
  'healthy',
  'Angela',
  now()
),
(
  '99999999-9999-9999-9999-999999999999',
  'Michelle Ramos',
  'michelle.ramos@prismworks.demo',
  'PrismWorks',
  300000.00,
  'active',
  'at_risk',
  'Marvin',
  now() - interval '18 days'
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Luis Mendoza',
  'luis.mendoza@flowgrid.demo',
  'FlowGrid',
  55000.00,
  'active',
  'healthy',
  'Angela',
  now() - interval '3 days'
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Amanda Co',
  'amanda.co@syncpoint.demo',
  'SyncPoint',
  132000.00,
  'active',
  'recovering',
  'Marvin',
  now() - interval '1 day'
),
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'John Reyes',
  'john.reyes@quantumops.demo',
  'QuantumOps',
  88000.00,
  'active',
  'healthy',
  'Angela',
  now()
),

-- HelioMetrics: healthy onboarding account with recent activity.
(
  '30000000-0000-0000-0000-000000000013',
  'Elena Torres',
  'elena.torres@heliometrics.demo',
  'HelioMetrics',
  36000.00,
  'onboarding',
  'healthy',
  'Marvin',
  now() - interval '5 hours'
),

-- LedgerLane: medium-risk renewal with declining usage and short inactivity.
(
  '30000000-0000-0000-0000-000000000014',
  'Owen Park',
  'owen.park@ledgerlane.demo',
  'LedgerLane',
  84000.00,
  'renewal_pending',
  'at_risk',
  'Angela',
  now() - interval '8 days'
),

-- SignalCraft: high-risk active account with product and support concerns.
(
  '30000000-0000-0000-0000-000000000015',
  'Priya Nair',
  'priya.nair@signalcraft.demo',
  'SignalCraft',
  165000.00,
  'active',
  'at_risk',
  'Marvin',
  now() - interval '15 days'
),

-- MetricForge: critical past-due account with compounding churn signals.
(
  '30000000-0000-0000-0000-000000000016',
  'Caleb Wong',
  'caleb.wong@metricforge.demo',
  'MetricForge',
  275000.00,
  'past_due',
  'at_risk',
  'Angela',
  now() - interval '24 days'
),

-- RelayWorks: recovering account after billing and engagement outreach.
(
  '30000000-0000-0000-0000-000000000017',
  'Sofia Alvarez',
  'sofia.alvarez@relayworks.demo',
  'RelayWorks',
  118000.00,
  'active',
  'recovering',
  'Marvin',
  now() - interval '10 hours'
),

-- Clearpath Cloud: healthy active account with steady engagement.
(
  '30000000-0000-0000-0000-000000000018',
  'Isaac Chen',
  'isaac.chen@clearpathcloud.demo',
  'Clearpath Cloud',
  62000.00,
  'active',
  'healthy',
  'Angela',
  now() - interval '1 day'
),

-- ScalePilot: medium-risk account approaching renewal after a billing issue.
(
  '30000000-0000-0000-0000-000000000019',
  'Maya Patel',
  'maya.patel@scalepilot.demo',
  'ScalePilot',
  142000.00,
  'renewal_pending',
  'at_risk',
  'Marvin',
  now() - interval '6 days'
),

-- BeaconDesk: high-risk service account with sustained disengagement.
(
  '30000000-0000-0000-0000-000000000020',
  'Theo Martin',
  'theo.martin@beacondesk.demo',
  'BeaconDesk',
  99000.00,
  'active',
  'at_risk',
  'Angela',
  now() - interval '19 days'
),

-- Vectorly: critical high-value account with billing and support escalation.
(
  '30000000-0000-0000-0000-000000000021',
  'Rina Santos',
  'rina.santos@vectorly.demo',
  'Vectorly',
  340000.00,
  'past_due',
  'at_risk',
  'Marvin',
  now() - interval '28 days'
),

-- Loopline Services: recovering after resolving adoption concerns.
(
  '30000000-0000-0000-0000-000000000022',
  'Noah Williams',
  'noah.williams@looplineservices.demo',
  'Loopline Services',
  72000.00,
  'active',
  'recovering',
  'Angela',
  now() - interval '7 hours'
),

-- LaunchStack: healthy onboarding customer building early usage habits.
(
  '30000000-0000-0000-0000-000000000023',
  'Aisha Grant',
  'aisha.grant@launchstack.demo',
  'LaunchStack',
  28000.00,
  'onboarding',
  'healthy',
  'Marvin',
  now() - interval '2 hours'
),

-- CoreVista: recovering renewal after payment and sentiment issues.
(
  '30000000-0000-0000-0000-000000000024',
  'Gabriel Silva',
  'gabriel.silva@corevista.demo',
  'CoreVista',
  196000.00,
  'renewal_pending',
  'recovering',
  'Angela',
  now() - interval '14 hours'
);

insert into public.recovery_playbooks (
  id,
  name,
  description,
  risk_level,
  requires_approval,
  action_type
)
values
(
  '10000000-0000-0000-0000-000000000001',
  'High-Risk Account Check-in',
  'Personal account-manager outreach for high-value customers with severe churn indicators.',
  'critical',
  true,
  'personal_outreach'
),
(
  '10000000-0000-0000-0000-000000000002',
  'Billing Recovery Outreach',
  'Gentle outreach when failed-payment signals indicate billing-related churn risk.',
  'high',
  true,
  'billing_outreach'
),
(
  '10000000-0000-0000-0000-000000000003',
  'Inactive Customer Re-engagement',
  'Helpful re-engagement message for customers showing prolonged inactivity without severe support issues.',
  'medium',
  false,
  'reengagement'
);

-- =========================================================
-- CUSTOMER EVENTS
-- =========================================================

insert into public.customer_events (
  id,
  customer_id,
  event_type,
  source,
  event_value,
  description,
  occurred_at
)
values

-- =========================================================
-- APEX DIGITAL
-- Intended result later: CRITICAL
-- +25 usage decline
-- +20 failed payment
-- +15 negative support
-- +15 inactivity
-- =========================================================

(
  '20000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'usage_decline',
  'product_demo',
  '{"decline_percent": 57}'::jsonb,
  'Product usage declined 57% over the last 30 days.',
  now() - interval '12 days'
),
(
  '20000000-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'payment_failed',
  'billing_demo',
  '{"attempt_number": 1}'::jsonb,
  'Monthly subscription payment failed.',
  now() - interval '7 days'
),
(
  '20000000-0000-0000-0000-000000000003',
  '11111111-1111-1111-1111-111111111111',
  'negative_support',
  'support_demo',
  '{"severity": "high"}'::jsonb,
  'Customer expressed frustration regarding an unresolved support issue.',
  now() - interval '5 days'
),
(
  '20000000-0000-0000-0000-000000000004',
  '11111111-1111-1111-1111-111111111111',
  'login_inactivity',
  'product_demo',
  '{"days_inactive": 16}'::jsonb,
  'Customer has not logged in for 16 days.',
  now() - interval '1 day'
),


-- =========================================================
-- NOVATECH
-- Intended result later: MEDIUM
-- +15 usage decline
-- +20 payment failure
-- =========================================================

(
  '20000000-0000-0000-0000-000000000005',
  '22222222-2222-2222-2222-222222222222',
  'usage_decline',
  'product_demo',
  '{"decline_percent": 38}'::jsonb,
  'Product usage declined 38% over the last 30 days.',
  now() - interval '5 days'
),
(
  '20000000-0000-0000-0000-000000000006',
  '22222222-2222-2222-2222-222222222222',
  'payment_failed',
  'billing_demo',
  '{"attempt_number": 1}'::jsonb,
  'Latest subscription payment failed.',
  now() - interval '3 days'
),


-- =========================================================
-- VERTEX LABS
-- Healthy
-- =========================================================

(
  '20000000-0000-0000-0000-000000000007',
  '33333333-3333-3333-3333-333333333333',
  'login',
  'product_demo',
  '{"session": "normal"}'::jsonb,
  'Customer logged in and used the product normally.',
  now() - interval '4 hours'
),
(
  '20000000-0000-0000-0000-000000000008',
  '33333333-3333-3333-3333-333333333333',
  'successful_payment',
  'billing_demo',
  '{"status": "paid"}'::jsonb,
  'Latest subscription payment completed successfully.',
  now() - interval '2 days'
),


-- =========================================================
-- ACME SYSTEMS
-- Healthy
-- =========================================================

(
  '20000000-0000-0000-0000-000000000009',
  '44444444-4444-4444-4444-444444444444',
  'login',
  'product_demo',
  '{"session": "normal"}'::jsonb,
  'Customer logged in successfully.',
  now() - interval '1 day'
),
(
  '20000000-0000-0000-0000-000000000010',
  '44444444-4444-4444-4444-444444444444',
  'successful_payment',
  'billing_demo',
  '{"status": "paid"}'::jsonb,
  'Subscription renewal completed successfully.',
  now() - interval '5 days'
),


-- =========================================================
-- NORTHSTAR SOLUTIONS
-- Intended result later: HIGH
-- inactivity + repeated payment failure + support issue
-- =========================================================

(
  '20000000-0000-0000-0000-000000000011',
  '55555555-5555-5555-5555-555555555555',
  'login_inactivity',
  'product_demo',
  '{"days_inactive": 20}'::jsonb,
  'Customer has been inactive for 20 days.',
  now() - interval '2 days'
),
(
  '20000000-0000-0000-0000-000000000012',
  '55555555-5555-5555-5555-555555555555',
  'payment_failed',
  'billing_demo',
  '{"attempt_number": 1}'::jsonb,
  'First subscription payment attempt failed.',
  now() - interval '10 days'
),
(
  '20000000-0000-0000-0000-000000000013',
  '55555555-5555-5555-5555-555555555555',
  'payment_failed',
  'billing_demo',
  '{"attempt_number": 2}'::jsonb,
  'Second subscription payment attempt failed.',
  now() - interval '4 days'
),
(
  '20000000-0000-0000-0000-000000000014',
  '55555555-5555-5555-5555-555555555555',
  'negative_support',
  'support_demo',
  '{"severity": "medium"}'::jsonb,
  'Customer reported an unresolved technical issue.',
  now() - interval '3 days'
),


-- =========================================================
-- CLOUDBRIDGE
-- Healthy
-- =========================================================

(
  '20000000-0000-0000-0000-000000000015',
  '66666666-6666-6666-6666-666666666666',
  'login',
  'product_demo',
  '{"session": "normal"}'::jsonb,
  'Customer logged in normally.',
  now() - interval '1 day'
),
(
  '20000000-0000-0000-0000-000000000016',
  '66666666-6666-6666-6666-666666666666',
  'successful_payment',
  'billing_demo',
  '{"status": "paid"}'::jsonb,
  'Subscription payment completed successfully.',
  now() - interval '6 days'
),


-- =========================================================
-- BRIGHTOPS
-- Intended result later: MEDIUM
-- +25 usage decline
-- +8 inactivity
-- =========================================================

(
  '20000000-0000-0000-0000-000000000017',
  '77777777-7777-7777-7777-777777777777',
  'usage_decline',
  'product_demo',
  '{"decline_percent": 58}'::jsonb,
  'Product usage declined 58% over the last 30 days.',
  now() - interval '9 days'
),
(
  '20000000-0000-0000-0000-000000000018',
  '77777777-7777-7777-7777-777777777777',
  'login_inactivity',
  'product_demo',
  '{"days_inactive": 11}'::jsonb,
  'Customer has not logged in for 11 days.',
  now() - interval '1 day'
),


-- =========================================================
-- ORBIT SAAS
-- Healthy
-- =========================================================

(
  '20000000-0000-0000-0000-000000000019',
  '88888888-8888-8888-8888-888888888888',
  'login',
  'product_demo',
  '{"session": "normal"}'::jsonb,
  'Customer logged in and remained active.',
  now() - interval '6 hours'
),
(
  '20000000-0000-0000-0000-000000000020',
  '88888888-8888-8888-8888-888888888888',
  'successful_payment',
  'billing_demo',
  '{"status": "paid"}'::jsonb,
  'Latest payment completed successfully.',
  now() - interval '3 days'
),


-- =========================================================
-- PRISMWORKS
-- Intended result later: HIGH
-- +15 moderate usage decline
-- +15 long inactivity
-- +15 negative support
-- +10 negative feedback
-- =========================================================

(
  '20000000-0000-0000-0000-000000000021',
  '99999999-9999-9999-9999-999999999999',
  'usage_decline',
  'product_demo',
  '{"decline_percent": 42}'::jsonb,
  'Product usage declined 42% over the last 30 days.',
  now() - interval '15 days'
),
(
  '20000000-0000-0000-0000-000000000022',
  '99999999-9999-9999-9999-999999999999',
  'login_inactivity',
  'product_demo',
  '{"days_inactive": 18}'::jsonb,
  'Customer has not logged in for 18 days.',
  now() - interval '2 days'
),
(
  '20000000-0000-0000-0000-000000000023',
  '99999999-9999-9999-9999-999999999999',
  'negative_support',
  'support_demo',
  '{"severity": "high"}'::jsonb,
  'Customer reported repeated frustration with a support issue.',
  now() - interval '6 days'
),
(
  '20000000-0000-0000-0000-000000000024',
  '99999999-9999-9999-9999-999999999999',
  'negative_feedback',
  'feedback_demo',
  '{"severity": "high"}'::jsonb,
  'Customer submitted strongly negative product feedback.',
  now() - interval '4 days'
),


-- =========================================================
-- FLOWGRID
-- Healthy
-- =========================================================

(
  '20000000-0000-0000-0000-000000000025',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'login',
  'product_demo',
  '{"session": "normal"}'::jsonb,
  'Customer logged in normally.',
  now() - interval '2 days'
),
(
  '20000000-0000-0000-0000-000000000026',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'successful_payment',
  'billing_demo',
  '{"status": "paid"}'::jsonb,
  'Subscription payment completed successfully.',
  now() - interval '7 days'
),


-- =========================================================
-- SYNCPOINT
-- Recovery story
--
-- First becomes HIGH risk:
-- usage decline + payment failure + inactivity
--
-- Then later:
-- customer reply + successful payment + usage recovery
-- =========================================================

(
  '20000000-0000-0000-0000-000000000027',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'usage_decline',
  'product_demo',
  '{"decline_percent": 60}'::jsonb,
  'Product usage declined 60% over the previous month.',
  now() - interval '20 days'
),
(
  '20000000-0000-0000-0000-000000000028',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'payment_failed',
  'billing_demo',
  '{"attempt_number": 1}'::jsonb,
  'Subscription payment failed.',
  now() - interval '18 days'
),
(
  '20000000-0000-0000-0000-000000000029',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'login_inactivity',
  'product_demo',
  '{"days_inactive": 16}'::jsonb,
  'Customer remained inactive for 16 days.',
  now() - interval '17 days'
),
(
  '20000000-0000-0000-0000-000000000030',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'customer_reply',
  'recovery_demo',
  '{"response": "positive"}'::jsonb,
  'Customer responded positively to recovery outreach.',
  now() - interval '2 days'
),
(
  '20000000-0000-0000-0000-000000000031',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'successful_payment',
  'billing_demo',
  '{"status": "paid"}'::jsonb,
  'Previously failed subscription payment was resolved.',
  now() - interval '1 day'
),
(
  '20000000-0000-0000-0000-000000000032',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'usage_recovered',
  'product_demo',
  '{"recovery_percent": 48}'::jsonb,
  'Product usage recovered significantly after outreach.',
  now() - interval '12 hours'
),


-- =========================================================
-- QUANTUMOPS
-- Healthy
-- =========================================================

(
  '20000000-0000-0000-0000-000000000033',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'login',
  'product_demo',
  '{"session": "normal"}'::jsonb,
  'Customer logged in recently.',
  now() - interval '3 hours'
),
(
  '20000000-0000-0000-0000-000000000034',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'successful_payment',
  'billing_demo',
  '{"status": "paid"}'::jsonb,
  'Latest subscription payment completed successfully.',
  now() - interval '4 days'
),


-- =========================================================
-- HELIOMETRICS
-- Healthy onboarding scenario
-- Recent login and successful first subscription payment
-- =========================================================

(
  '20000000-0000-0000-0000-000000000035',
  '30000000-0000-0000-0000-000000000013',
  'login',
  'product_demo',
  '{"session": "onboarding"}'::jsonb,
  'Customer completed an onboarding session and configured the first workspace.',
  now() - interval '5 hours'
),
(
  '20000000-0000-0000-0000-000000000036',
  '30000000-0000-0000-0000-000000000013',
  'successful_payment',
  'billing_demo',
  '{"status": "paid"}'::jsonb,
  'First subscription payment completed successfully.',
  now() - interval '3 days'
),


-- =========================================================
-- LEDGERLANE
-- Intended result later: MEDIUM
-- Moderate usage decline plus short login inactivity
-- =========================================================

(
  '20000000-0000-0000-0000-000000000037',
  '30000000-0000-0000-0000-000000000014',
  'usage_decline',
  'product_demo',
  '{"decline_percent": 34}'::jsonb,
  'Product usage declined 34% as the account approached renewal.',
  now() - interval '7 days'
),
(
  '20000000-0000-0000-0000-000000000038',
  '30000000-0000-0000-0000-000000000014',
  'login_inactivity',
  'product_demo',
  '{"days_inactive": 8}'::jsonb,
  'Customer has not logged in for 8 days.',
  now() - interval '1 day'
),


-- =========================================================
-- SIGNALCRAFT
-- Intended result later: HIGH
-- Severe usage decline, prolonged inactivity, and support friction
-- =========================================================

(
  '20000000-0000-0000-0000-000000000039',
  '30000000-0000-0000-0000-000000000015',
  'usage_decline',
  'product_demo',
  '{"decline_percent": 63}'::jsonb,
  'Product usage declined 63% over the last 30 days.',
  now() - interval '13 days'
),
(
  '20000000-0000-0000-0000-000000000040',
  '30000000-0000-0000-0000-000000000015',
  'negative_support',
  'support_demo',
  '{"severity": "medium"}'::jsonb,
  'Customer reported repeated delays while resolving an integration issue.',
  now() - interval '6 days'
),
(
  '20000000-0000-0000-0000-000000000041',
  '30000000-0000-0000-0000-000000000015',
  'login_inactivity',
  'product_demo',
  '{"days_inactive": 15}'::jsonb,
  'Customer has not logged in for 15 days.',
  now() - interval '1 day'
),


-- =========================================================
-- METRICFORGE
-- Intended result later: CRITICAL
-- Repeated payment failure, long inactivity, and negative sentiment
-- =========================================================

(
  '20000000-0000-0000-0000-000000000042',
  '30000000-0000-0000-0000-000000000016',
  'payment_failed',
  'billing_demo',
  '{"attempt_number": 1}'::jsonb,
  'First annual renewal payment attempt failed.',
  now() - interval '14 days'
),
(
  '20000000-0000-0000-0000-000000000043',
  '30000000-0000-0000-0000-000000000016',
  'payment_failed',
  'billing_demo',
  '{"attempt_number": 2}'::jsonb,
  'Second annual renewal payment attempt failed.',
  now() - interval '8 days'
),
(
  '20000000-0000-0000-0000-000000000044',
  '30000000-0000-0000-0000-000000000016',
  'negative_support',
  'support_demo',
  '{"severity": "high"}'::jsonb,
  'Customer escalated an unresolved reporting issue to the account owner.',
  now() - interval '6 days'
),
(
  '20000000-0000-0000-0000-000000000045',
  '30000000-0000-0000-0000-000000000016',
  'negative_feedback',
  'feedback_demo',
  '{"severity": "high"}'::jsonb,
  'Customer indicated that renewal is at risk without a resolution plan.',
  now() - interval '4 days'
),
(
  '20000000-0000-0000-0000-000000000046',
  '30000000-0000-0000-0000-000000000016',
  'login_inactivity',
  'product_demo',
  '{"days_inactive": 24}'::jsonb,
  'Customer has not logged in for 24 days.',
  now() - interval '1 day'
),


-- =========================================================
-- RELAYWORKS
-- Recovery scenario
-- Billing and engagement risk followed by reply, payment, and usage recovery
-- =========================================================

(
  '20000000-0000-0000-0000-000000000047',
  '30000000-0000-0000-0000-000000000017',
  'usage_decline',
  'product_demo',
  '{"decline_percent": 52}'::jsonb,
  'Product usage declined 52% before recovery outreach began.',
  now() - interval '22 days'
),
(
  '20000000-0000-0000-0000-000000000048',
  '30000000-0000-0000-0000-000000000017',
  'payment_failed',
  'billing_demo',
  '{"attempt_number": 1}'::jsonb,
  'Subscription payment failed during the period of declining engagement.',
  now() - interval '18 days'
),
(
  '20000000-0000-0000-0000-000000000049',
  '30000000-0000-0000-0000-000000000017',
  'login_inactivity',
  'product_demo',
  '{"days_inactive": 14}'::jsonb,
  'Customer remained inactive for 14 days.',
  now() - interval '15 days'
),
(
  '20000000-0000-0000-0000-000000000050',
  '30000000-0000-0000-0000-000000000017',
  'customer_reply',
  'recovery_demo',
  '{"response": "positive"}'::jsonb,
  'Customer replied and agreed to a guided adoption session.',
  now() - interval '3 days'
),
(
  '20000000-0000-0000-0000-000000000051',
  '30000000-0000-0000-0000-000000000017',
  'successful_payment',
  'billing_demo',
  '{"status": "paid"}'::jsonb,
  'Previously failed subscription payment was resolved.',
  now() - interval '2 days'
),
(
  '20000000-0000-0000-0000-000000000052',
  '30000000-0000-0000-0000-000000000017',
  'usage_recovered',
  'product_demo',
  '{"recovery_percent": 45}'::jsonb,
  'Weekly product usage recovered 45% after the adoption session.',
  now() - interval '10 hours'
),


-- =========================================================
-- CLEARPATH CLOUD
-- Healthy active scenario
-- Recent engagement and reliable billing
-- =========================================================

(
  '20000000-0000-0000-0000-000000000053',
  '30000000-0000-0000-0000-000000000018',
  'login',
  'product_demo',
  '{"session": "normal"}'::jsonb,
  'Customer logged in and reviewed the weekly operations dashboard.',
  now() - interval '1 day'
),
(
  '20000000-0000-0000-0000-000000000054',
  '30000000-0000-0000-0000-000000000018',
  'successful_payment',
  'billing_demo',
  '{"status": "paid"}'::jsonb,
  'Monthly subscription payment completed successfully.',
  now() - interval '4 days'
),


-- =========================================================
-- SCALEPILOT
-- Intended result later: MEDIUM
-- Moderate usage decline combined with one failed payment
-- =========================================================

(
  '20000000-0000-0000-0000-000000000055',
  '30000000-0000-0000-0000-000000000019',
  'usage_decline',
  'product_demo',
  '{"decline_percent": 31}'::jsonb,
  'Product usage declined 31% during the current renewal review.',
  now() - interval '6 days'
),
(
  '20000000-0000-0000-0000-000000000056',
  '30000000-0000-0000-0000-000000000019',
  'payment_failed',
  'billing_demo',
  '{"attempt_number": 1}'::jsonb,
  'Latest subscription payment attempt failed.',
  now() - interval '2 days'
),


-- =========================================================
-- BEACONDESK
-- Intended result later: HIGH
-- Severe usage decline, long inactivity, and negative feedback
-- =========================================================

(
  '20000000-0000-0000-0000-000000000057',
  '30000000-0000-0000-0000-000000000020',
  'usage_decline',
  'product_demo',
  '{"decline_percent": 56}'::jsonb,
  'Product usage declined 56% across the service delivery team.',
  now() - interval '16 days'
),
(
  '20000000-0000-0000-0000-000000000058',
  '30000000-0000-0000-0000-000000000020',
  'negative_feedback',
  'feedback_demo',
  '{"severity": "medium"}'::jsonb,
  'Customer reported that the current workflow no longer fits the team process.',
  now() - interval '7 days'
),
(
  '20000000-0000-0000-0000-000000000059',
  '30000000-0000-0000-0000-000000000020',
  'login_inactivity',
  'product_demo',
  '{"days_inactive": 19}'::jsonb,
  'Customer has not logged in for 19 days.',
  now() - interval '1 day'
),


-- =========================================================
-- VECTORLY
-- Intended result later: CRITICAL
-- Severe product, billing, support, and inactivity signals
-- =========================================================

(
  '20000000-0000-0000-0000-000000000060',
  '30000000-0000-0000-0000-000000000021',
  'usage_decline',
  'product_demo',
  '{"decline_percent": 71}'::jsonb,
  'Product usage declined 71% across the customer organization.',
  now() - interval '25 days'
),
(
  '20000000-0000-0000-0000-000000000061',
  '30000000-0000-0000-0000-000000000021',
  'payment_failed',
  'billing_demo',
  '{"attempt_number": 1}'::jsonb,
  'Annual subscription renewal payment failed.',
  now() - interval '12 days'
),
(
  '20000000-0000-0000-0000-000000000062',
  '30000000-0000-0000-0000-000000000021',
  'negative_support',
  'support_demo',
  '{"severity": "high"}'::jsonb,
  'Executive sponsor escalated repeated data synchronization failures.',
  now() - interval '8 days'
),
(
  '20000000-0000-0000-0000-000000000063',
  '30000000-0000-0000-0000-000000000021',
  'login_inactivity',
  'product_demo',
  '{"days_inactive": 28}'::jsonb,
  'Customer has not logged in for 28 days.',
  now() - interval '1 day'
),


-- =========================================================
-- LOOPLINE SERVICES
-- Recovery scenario
-- Earlier adoption concerns followed by positive engagement recovery
-- =========================================================

(
  '20000000-0000-0000-0000-000000000064',
  '30000000-0000-0000-0000-000000000022',
  'usage_decline',
  'product_demo',
  '{"decline_percent": 44}'::jsonb,
  'Product usage declined 44% after a change in the customer operations team.',
  now() - interval '19 days'
),
(
  '20000000-0000-0000-0000-000000000065',
  '30000000-0000-0000-0000-000000000022',
  'negative_support',
  'support_demo',
  '{"severity": "medium"}'::jsonb,
  'Customer requested clearer guidance for configuring a new workflow.',
  now() - interval '16 days'
),
(
  '20000000-0000-0000-0000-000000000066',
  '30000000-0000-0000-0000-000000000022',
  'customer_reply',
  'recovery_demo',
  '{"response": "positive"}'::jsonb,
  'Customer accepted the configuration guidance and scheduled a follow-up.',
  now() - interval '3 days'
),
(
  '20000000-0000-0000-0000-000000000067',
  '30000000-0000-0000-0000-000000000022',
  'usage_recovered',
  'product_demo',
  '{"recovery_percent": 39}'::jsonb,
  'Product usage recovered 39% after the workflow was reconfigured.',
  now() - interval '1 day'
),
(
  '20000000-0000-0000-0000-000000000068',
  '30000000-0000-0000-0000-000000000022',
  'login',
  'product_demo',
  '{"session": "reengaged"}'::jsonb,
  'Customer logged in and completed the revised workflow.',
  now() - interval '7 hours'
),


-- =========================================================
-- LAUNCHSTACK
-- Healthy onboarding scenario
-- Frequent early engagement with successful billing
-- =========================================================

(
  '20000000-0000-0000-0000-000000000069',
  '30000000-0000-0000-0000-000000000023',
  'successful_payment',
  'billing_demo',
  '{"status": "paid"}'::jsonb,
  'Initial subscription payment completed successfully.',
  now() - interval '5 days'
),
(
  '20000000-0000-0000-0000-000000000070',
  '30000000-0000-0000-0000-000000000023',
  'login',
  'product_demo',
  '{"session": "onboarding"}'::jsonb,
  'Customer logged in and invited the first project team.',
  now() - interval '2 hours'
),


-- =========================================================
-- COREVISTA
-- Recovery scenario
-- Failed billing and negative feedback resolved before renewal
-- =========================================================

(
  '20000000-0000-0000-0000-000000000071',
  '30000000-0000-0000-0000-000000000024',
  'payment_failed',
  'billing_demo',
  '{"attempt_number": 1}'::jsonb,
  'Renewal payment failed because the stored payment method had expired.',
  now() - interval '17 days'
),
(
  '20000000-0000-0000-0000-000000000072',
  '30000000-0000-0000-0000-000000000024',
  'negative_feedback',
  'feedback_demo',
  '{"severity": "medium"}'::jsonb,
  'Customer raised concerns about reporting flexibility before renewal.',
  now() - interval '14 days'
),
(
  '20000000-0000-0000-0000-000000000073',
  '30000000-0000-0000-0000-000000000024',
  'customer_reply',
  'recovery_demo',
  '{"response": "positive"}'::jsonb,
  'Customer confirmed that the reporting workaround met the immediate need.',
  now() - interval '3 days'
),
(
  '20000000-0000-0000-0000-000000000074',
  '30000000-0000-0000-0000-000000000024',
  'successful_payment',
  'billing_demo',
  '{"status": "paid"}'::jsonb,
  'Customer updated the payment method and completed the renewal payment.',
  now() - interval '2 days'
),
(
  '20000000-0000-0000-0000-000000000075',
  '30000000-0000-0000-0000-000000000024',
  'usage_recovered',
  'product_demo',
  '{"recovery_percent": 33}'::jsonb,
  'Product usage recovered 33% following the reporting resolution.',
  now() - interval '14 hours'
);
