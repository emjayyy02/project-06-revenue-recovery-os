export interface Customer {
  id: string;
  full_name: string;
  email: string;
  company: string;
  account_value: number;
  lifecycle_status: string;
  customer_health_status: string;
  owner: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface CustomerEvent {
  id: string;
  customer_id: string;
  event_type: string;
  source: string;
  event_value: unknown;
  description: string | null;
  occurred_at: string;
  metadata: unknown;
  created_at: string;
}

export interface RiskScore {
  id: string;
  customer_id: string;
  score: number;
  risk_level: string;
  calculated_at: string;
}

export interface RiskSignal {
  id: string;
  customer_id: string;
  source_event_id: string | null;
  signal_type: string;
  weight: number;
  severity: string;
  explanation: string;
  active: boolean;
  created_at: string;
}

export interface Intervention {
  id: string;
  customer_id: string;
  playbook_id: string;
  type: string;
  status: string;
  recommended_action: string | null;
  draft_message: string | null;
  approved_at: string | null;
  executed_at: string | null;
  outcome: string | null;
  created_at: string;

  customers?: {
    full_name: string;
    company: string;
    account_value: number;
    owner: string | null;
  } | null;

  recovery_playbooks?: {
    name: string;
    requires_approval: boolean;
    action_type: string;
  } | null;
}