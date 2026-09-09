import type { ApiResponse, Customer } from "../types/api";

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