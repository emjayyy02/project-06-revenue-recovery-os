import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getCustomer,
  getCustomerEvents,
  getCustomerRisk,
  getCustomerSignals,
} from "../api/client";

import type {
  Customer,
  CustomerEvent,
  RiskScore,
  RiskSignal,
} from "../types/api";

export function CustomerPage() {
  const { id } = useParams();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [events, setEvents] = useState<CustomerEvent[]>([]);
  const [risk, setRisk] = useState<RiskScore | null>(null);
  const [signals, setSignals] = useState<RiskSignal[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Customer ID is missing.");
      setLoading(false);
      return;
    }

    async function loadCustomer360() {
      try {
        setLoading(true);
        setError(null);

        const [
          customerData,
          eventsData,
          riskData,
          signalsData,
        ] = await Promise.all([
          getCustomer(id!),
          getCustomerEvents(id!),
          getCustomerRisk(id!),
          getCustomerSignals(id!),
        ]);

        setCustomer(customerData);
        setEvents(eventsData);
        setRisk(riskData);
        setSignals(signalsData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load customer."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCustomer360();
  }, [id]);

  if (loading) {
    return <p>Loading customer...</p>;
  }

  if (error) {
    return (
      <section>
        <h1>Customer 360</h1>
        <p>{error}</p>
      </section>
    );
  }

  if (!customer) {
    return <p>Customer not found.</p>;
  }

  const recommendedPlaybook =
    risk?.risk_level === "critical"
      ? "High-Risk Account Check-in"
      : risk?.risk_level === "high"
      ? "Billing Recovery Outreach"
      : risk?.risk_level === "medium"
      ? "Inactive Customer Re-engagement"
      : null;

  return (
    <section>
      <header>
        <h1>{customer.company}</h1>
        <p>{customer.full_name}</p>
      </header>

      <hr />

      <section>
        <h2>Account Overview</h2>

        <p>
          <strong>Account Value:</strong>{" "}
          ₱{customer.account_value.toLocaleString()}
        </p>

        <p>
          <strong>Account Owner:</strong>{" "}
          {customer.owner ?? "Unassigned"}
        </p>

        <p>
          <strong>Lifecycle Status:</strong>{" "}
          {customer.lifecycle_status}
        </p>

        <p>
          <strong>Customer Health:</strong>{" "}
          {customer.customer_health_status}
        </p>

        <p>
          <strong>Risk Score:</strong>{" "}
          {risk ? `${risk.score} / 100` : "Not calculated"}
        </p>

        <p>
          <strong>Risk Level:</strong>{" "}
          {risk ? risk.risk_level.toUpperCase() : "N/A"}
        </p>
      </section>

      <hr />

      <section>
        <h2>Why Is This Customer At Risk?</h2>

        {signals.length === 0 ? (
          <p>No active risk signals.</p>
        ) : (
          <ul>
            {signals.map((signal) => (
              <li key={signal.id}>
                <strong>{signal.signal_type}</strong>
                {" "}
                +{signal.weight}
                <br />
                {signal.explanation}
              </li>
            ))}
          </ul>
        )}
      </section>

      <hr />

      <section>
        <h2>Customer Timeline</h2>

        {events.length === 0 ? (
          <p>No customer events recorded.</p>
        ) : (
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                <strong>
                  {new Date(
                    event.occurred_at
                  ).toLocaleString()}
                </strong>
                <br />
                {event.event_type}
                <br />
                {event.description ??
                  "No description available"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <hr />

      <section>
        <h2>Recommended Recovery Action</h2>

        {recommendedPlaybook ? (
          <>
            <p>
              <strong>Recommended Playbook:</strong>{" "}
              {recommendedPlaybook}
            </p>

            <p>
              Recommendation based on the customer's
              current deterministic risk level and
              active churn signals.
            </p>

            <button type="button">
              Request Approval
            </button>
          </>
        ) : (
          <p>
            No recovery action is currently required.
          </p>
        )}
      </section>

      <hr />

      <section>
        <h2>Intervention History</h2>

        <p>
          No recovery interventions have been created yet.
        </p>
      </section>
    </section>
  );
}