import { useEffect, useState } from "react";

import { getCustomers } from "../api/client";
import type { Customer } from "../types/api";

export function DashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  const atRisk = customers.filter(
    (customer) =>
      customer.customer_health_status === "at_risk"
  );

  const recovering = customers.filter(
    (customer) =>
      customer.customer_health_status === "recovering"
  );

  const revenueExposure = atRisk.reduce(
    (total, customer) =>
      total + customer.account_value,
    0
  );

  return (
    <section>
      <h1>Dashboard</h1>

      <div className="metric-grid">
        <article>
          <span>Total Customers</span>
          <strong>{customers.length}</strong>
        </article>

        <article>
          <span>At Risk</span>
          <strong>{atRisk.length}</strong>
        </article>

        <article>
          <span>Recovering</span>
          <strong>{recovering.length}</strong>
        </article>

        <article>
          <span>Revenue Exposure</span>
          <strong>
            ₱{revenueExposure.toLocaleString()}
          </strong>
        </article>
      </div>
    </section>
  );
}