import { useCallback, useEffect, useState } from "react";

import {
  approveIntervention,
  getInterventions,
  rejectIntervention,
} from "../api/client";

import type { Intervention } from "../types/api";

export function ApprovalsPage() {
  const [interventions, setInterventions] =
    useState<Intervention[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const loadInterventions = useCallback(async () => {
    try {
      setError(null);

      const data = await getInterventions();

      setInterventions(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load interventions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInterventions();
  }, [loadInterventions]);

  async function handleApprove(id: string) {
    try {
      setProcessingId(id);
      setError(null);

      await approveIntervention(id);
      await loadInterventions();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to approve intervention."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    try {
      setProcessingId(id);
      setError(null);

      await rejectIntervention(id);
      await loadInterventions();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to reject intervention."
      );
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return <p>Loading approvals...</p>;
  }

  const pending = interventions.filter(
    (intervention) =>
      intervention.status === "pending_approval"
  );

  const decided = interventions.filter(
    (intervention) =>
      intervention.status !== "pending_approval"
  );

  return (
    <section>
      <header>
        <h1>Approvals</h1>
        <p>
          Review sensitive recovery interventions before
          execution.
        </p>
      </header>

      {error && <p>{error}</p>}

      <section>
        <h2>Pending Approval</h2>

        {pending.length === 0 ? (
          <p>No interventions are waiting for approval.</p>
        ) : (
          <div>
            {pending.map((intervention) => (
              <article key={intervention.id}>
                <h3>
                  {intervention.customers?.company ??
                    "Unknown Customer"}
                </h3>

                <p>
                  {intervention.customers?.full_name}
                </p>

                <p>
                  <strong>Account Value:</strong>{" "}
                  ₱
                  {(
                    intervention.customers
                      ?.account_value ?? 0
                  ).toLocaleString()}
                </p>

                <p>
                  <strong>Playbook:</strong>{" "}
                  {intervention.recovery_playbooks
                    ?.name ??
                    intervention.recommended_action}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {intervention.status}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    handleApprove(intervention.id)
                  }
                  disabled={
                    processingId === intervention.id
                  }
                >
                  Approve
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleReject(intervention.id)
                  }
                  disabled={
                    processingId === intervention.id
                  }
                >
                  Reject
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Decision History</h2>

        {decided.length === 0 ? (
          <p>No approval decisions yet.</p>
        ) : (
          <div>
            {decided.map((intervention) => (
              <article key={intervention.id}>
                <strong>
                  {intervention.customers?.company ??
                    "Unknown Customer"}
                </strong>

                <p>
                  {intervention.recovery_playbooks?.name ??
                    intervention.recommended_action}
                </p>

                <p>
                  Status: {intervention.status}
                </p>

                {intervention.approved_at && (
                  <p>
                    Approved:{" "}
                    {new Date(
                      intervention.approved_at
                    ).toLocaleString()}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}