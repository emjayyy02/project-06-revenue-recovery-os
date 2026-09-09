import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getCustomers } from "../api/client";
import type { Customer } from "../types/api";

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load customers"
        );
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, []);

  if (loading) {
    return <p>Loading customers...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <section>
      <h1>Customers</h1>

      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Company</th>
            <th>Value</th>
            <th>Status</th>
            <th>Owner</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>
                <Link to={`/customers/${customer.id}`}>
                  {customer.full_name}
                </Link>
              </td>

              <td>{customer.company}</td>

              <td>
                ₱{customer.account_value.toLocaleString()}
              </td>

              <td>
                {customer.customer_health_status}
              </td>

              <td>{customer.owner ?? "Unassigned"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}