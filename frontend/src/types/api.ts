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