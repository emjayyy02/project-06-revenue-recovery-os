import type {
  AiAssistanceResponse,
  ApiResponse,
  Customer,
  CustomerEvent,
  RiskScore,
  RiskSignal,
  Intervention,
} from "../types/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getCustomers() {
  const response = await request<ApiResponse<Customer[]>>(
    "/api/customers"
  );

  return response.data;
}

export async function getCustomer(id: string) {
  const response = await request<ApiResponse<Customer>>(
    `/api/customers/${id}`
  );

  return response.data;
}

export async function getCustomerEvents(id: string) {
  const response = await request<ApiResponse<CustomerEvent[]>>(
    `/api/customers/${id}/events`
  );

  return response.data;
}

export async function getCustomerRisk(id: string) {
  const response = await request<ApiResponse<RiskScore | null>>(
    `/api/customers/${id}/risk`
  );

  return response.data;
}

export async function getCustomerSignals(id: string) {
  const response = await request<ApiResponse<RiskSignal[]>>(
    `/api/customers/${id}/signals`
  );

  return response.data;
}

export async function getInterventions() {
  const response = await request<ApiResponse<Intervention[]>>(
    "/api/interventions"
  );

  return response.data;
}

export async function createIntervention(payload: {
  customer_id: string;
  playbook_id: string;
  type: string;
  recommended_action: string;
  draft_message?: string;
}) {
  const response = await fetch(
    `${API_BASE_URL}/api/interventions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const result =
    (await response.json()) as ApiResponse<Intervention>;

  return result.data;
}

export async function approveIntervention(id: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/interventions/${id}/approve`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const result =
    (await response.json()) as ApiResponse<Intervention>;

  return result.data;
}

export async function rejectIntervention(id: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/interventions/${id}/reject`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const result =
    (await response.json()) as ApiResponse<Intervention>;

  return result.data;
}

export async function getAiAssistance(id: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/customers/${id}/ai-assistance`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as AiAssistanceResponse;
}