import { useCallback, useEffect, useState } from "react";

import {
  approveIntervention,
  executeIntervention,
  getInterventions,
  rejectIntervention,
  recordInterventionOutcome,
} from "../api/client";

import type { Intervention, RecoveryOutcome } from "../types/api";
import "./ApprovalsPage.css";

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
      const data = await getInterventions();

      setInterventions(data);
      setError(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load interventions."
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    getInterventions()
      .then((data) => {
        if (cancelled) return;

        setInterventions(data);
        setError(null);
      })
      .catch((error) => {
        if (cancelled) return;

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load interventions."
        );
      })
      .finally(() => {
        if (cancelled) return;

        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  async function handleExecute(id: string) {
    try {
      setProcessingId(id);
      setError(null);

      await executeIntervention(id);
      await loadInterventions();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to execute intervention."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleOutcome(id: string, outcome: RecoveryOutcome) {
    try {
      setProcessingId(id);
      setError(null);
      await recordInterventionOutcome(id, outcome);
      await loadInterventions();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to record outcome.");
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return <section className="approvals-page" aria-busy="true"><p role="status">Loading approvals...</p></section>;
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
    <section className="approvals-page">
      <header>
        <h1>Approvals</h1>

        <p>
          Review sensitive recovery interventions before
          execution.
        </p>
      </header>

      {error && (
        <p role="alert">
          {error}
        </p>
      )}

      {/* =========================
          PENDING APPROVAL
      ========================== */}

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
                  {processingId === intervention.id
                    ? "Processing..."
                    : "Approve"}
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
                  {processingId === intervention.id
                    ? "Processing..."
                    : "Reject"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* =========================
          EXECUTION / HISTORY
      ========================== */}

      <section>
        <h2>Decision & Execution History</h2>

        {decided.length === 0 ? (
          <p>No approval decisions yet.</p>
        ) : (
          <div>
            {decided.map((intervention) => {
              const isProcessing =
                processingId === intervention.id;

              return (
                <article key={intervention.id}>
                  <h3>
                    {intervention.customers?.company ??
                      "Unknown Customer"}
                  </h3>

                  <p>
                    {intervention.customers?.full_name}
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

                  {intervention.approved_at && (
                    <p>
                      <strong>Approved:</strong>{" "}
                      {new Date(
                        intervention.approved_at
                      ).toLocaleString()}
                    </p>
                  )}

                  {intervention.executed_at && (
                    <p>
                      <strong>Executed:</strong>{" "}
                      {new Date(
                        intervention.executed_at
                      ).toLocaleString()}
                    </p>
                  )}

                  {intervention.execution_attempts !== undefined && (
                    <p>
                      <strong>Execution Attempts:</strong>{" "}
                      {intervention.execution_attempts}
                    </p>
                  )}

                  {intervention.execution_error && (
                    <p>
                      <strong>Execution Error:</strong>{" "}
                      {intervention.execution_error}
                    </p>
                  )}

                  {/* APPROVED → EXECUTE */}
                  {intervention.status === "approved" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleExecute(intervention.id)
                      }
                      disabled={isProcessing}
                    >
                      {isProcessing
                        ? "Starting..."
                        : "Execute"}
                    </button>
                  )}

                  {/* FAILED → RETRY */}
                  {intervention.status === "failed" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleExecute(intervention.id)
                      }
                      disabled={isProcessing}
                    >
                      {isProcessing
                        ? "Retrying..."
                        : "Retry"}
                    </button>
                  )}

                  {/* EXECUTING */}
                  {intervention.status === "executing" && (
                    <button
                      type="button"
                      disabled
                    >
                      Executing...
                    </button>
                  )}

                  {/* SENT */}
                  {intervention.status === "sent" && (
                    <div className="outcome-controls">
                      <p>Execution completed successfully.</p>
                      <p><strong>Outcome:</strong>{" "}
                        {intervention.outcome === null || intervention.outcome === "pending"
                          ? "Pending"
                          : intervention.outcome === "recovered" ? "Recovered"
                            : intervention.outcome === "not_recovered" ? "Not Recovered" : intervention.outcome}
                      </p>
                      {intervention.outcome_recorded_at && (
                        <p>Recorded {new Date(intervention.outcome_recorded_at).toLocaleString()}</p>
                      )}
                      {(intervention.outcome === null || intervention.outcome === "pending") && (
                        <>
                          <p className="outcome-note">Record the customer result once confirmed. This decision is final.</p>
                          <div className="outcome-actions">
                            <button type="button" disabled={processingId !== null}
                              onClick={() => handleOutcome(intervention.id, "recovered")}>
                              {isProcessing ? "Saving..." : "Mark Recovered"}
                            </button>
                            <button type="button" disabled={processingId !== null}
                              onClick={() => handleOutcome(intervention.id, "not_recovered")}>
                              {isProcessing ? "Saving..." : "Mark Not Recovered"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* REJECTED */}
                  {intervention.status === "rejected" && (
                    <p>
                      This intervention was rejected and
                      cannot be executed.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
