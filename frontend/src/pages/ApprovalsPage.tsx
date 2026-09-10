import { useCallback, useEffect, useRef, useState } from "react";

import {
  approveIntervention,
  executeIntervention,
  getInterventions,
  rejectIntervention,
  recordInterventionOutcome,
} from "../api/client";

import type { Intervention, RecoveryOutcome } from "../types/api";
import { Link } from "react-router-dom";
import { EmptyState, StatusBadge } from "../components/Customer360";
import { currency } from "../components/analyticsFormatting";
import { Icon } from "../components/Icon";
import "./Operations.css";
import "./ApprovalsPage.css";

export function ApprovalsPage() {
  const [interventions, setInterventions] =
    useState<Intervention[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const actionInFlight = useRef(false);
  const [actionErrorId, setActionErrorId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const loadInterventions = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getInterventions();

      setInterventions(data);
      setError(null);
      setNeedsRefresh(false);
      setActionErrorId(null);
    } catch (error) {
      setNeedsRefresh(true);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load interventions."
      );
    } finally {
      setRefreshing(false);
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

        setNeedsRefresh(true);
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
    if (actionInFlight.current || refreshing || needsRefresh) return;
    actionInFlight.current = true;
    try {
      setProcessingId(id);
      setActionErrorId(null);
      setError(null);

      await approveIntervention(id);
      await loadInterventions();
    } catch (error) {
      setActionErrorId(id);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to approve intervention."
      );
    } finally {
      actionInFlight.current = false;
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    if (actionInFlight.current || refreshing || needsRefresh) return;
    actionInFlight.current = true;
    try {
      setProcessingId(id);
      setActionErrorId(null);
      setError(null);

      await rejectIntervention(id);
      await loadInterventions();
    } catch (error) {
      setActionErrorId(id);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to reject intervention."
      );
    } finally {
      actionInFlight.current = false;
      setProcessingId(null);
    }
  }

  async function handleExecute(id: string) {
    if (actionInFlight.current || refreshing || needsRefresh) return;
    actionInFlight.current = true;
    try {
      setProcessingId(id);
      setActionErrorId(null);
      setError(null);

      await executeIntervention(id);
      await loadInterventions();
    } catch (error) {
      setActionErrorId(id);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to execute intervention."
      );
    } finally {
      actionInFlight.current = false;
      setProcessingId(null);
    }
  }

  async function handleOutcome(id: string, outcome: RecoveryOutcome) {
    if (actionInFlight.current || refreshing || needsRefresh) return;
    actionInFlight.current = true;
    try {
      setProcessingId(id);
      setActionErrorId(null);
      setError(null);
      await recordInterventionOutcome(id, outcome);
      await loadInterventions();
    } catch (error) {
      setActionErrorId(id);
      setError(error instanceof Error ? error.message : "Failed to record outcome.");
    } finally {
      actionInFlight.current = false;
      setProcessingId(null);
    }
  }

  const pending = interventions.filter(intervention => intervention.status === "pending_approval");
  const decided = interventions.filter(intervention => intervention.status !== "pending_approval");
  const actionsDisabled = processingId !== null || refreshing || needsRefresh;

  function accountHeading(intervention: Intervention) {
    return <div className="intervention-heading">
      <div><h3><Link to={`/customers/${intervention.customer_id}`}>{intervention.customers?.company || "Customer account"}</Link></h3>
        {intervention.customers?.full_name && <p>{intervention.customers.full_name}</p>}</div>
      <StatusBadge value={intervention.status} />
    </div>;
  }

  return (
    <section className="operations-page approvals-page" aria-busy={loading || refreshing}>
      <header className="operations-header">
        <div><p className="operations-eyebrow">Recovery operations</p><h1>Approvals</h1>
          <p>Human decisions before sensitive recovery actions.</p></div>
        <button type="button" disabled={loading || refreshing || processingId !== null} onClick={loadInterventions}>
          <Icon name="refresh" />{refreshing ? "Refreshing…" : "Refresh approvals"}
        </button>
      </header>
      {!loading && !needsRefresh && <div className="queue-summary"><span><strong>{pending.length}</strong> awaiting review</span><span><strong>{decided.length}</strong> in decision & execution history</span></div>}
      {error && (!actionErrorId || needsRefresh) && <div className="operations-state operations-error" role="alert">
        <strong>{needsRefresh ? "Unable to refresh approvals" : "Action could not be completed"}</strong><p>{error}</p>
        <p>{needsRefresh ? "Refresh approvals before taking another action." : "Refresh to confirm the current status before trying again."}</p>
      </div>}
      <p className="approval-feedback" role="status">{processingId ? "Processing intervention…" : refreshing ? "Refreshing approvals…" : ""}</p>
      {loading ? <div className="operations-state" role="status"><strong>Loading approvals…</strong><p>Retrieving pending work and execution history.</p></div> : !needsRefresh && <>
        <section className="approval-queue" aria-labelledby="pending-heading">
          <div className="operations-section-heading"><h2 id="pending-heading">Pending Approval</h2><span className="operations-count">{pending.length} awaiting review</span></div>
          {pending.length === 0 ? <div className="operations-state"><EmptyState title="No approvals waiting" description="New recovery requests will appear here for your review." /></div> :
            <div className="approval-cards">{pending.map(intervention => <article className="intervention-card intervention-card--pending" key={intervention.id} aria-busy={processingId === intervention.id}>
              {accountHeading(intervention)}
              <dl className="intervention-details">
                {intervention.customers && <div><dt>Account value</dt><dd className="intervention-value">{currency(intervention.customers.account_value)}</dd></div>}
                <div><dt>Owner</dt><dd>{intervention.customers?.owner?.trim() || "Unassigned"}</dd></div>
                {intervention.created_at && <div><dt>Requested</dt><dd><time dateTime={intervention.created_at}>{new Date(intervention.created_at).toLocaleString()}</time></dd></div>}
              </dl>
              {intervention.recovery_playbooks?.name && <div className="intervention-playbook"><span>Playbook</span><p>{intervention.recovery_playbooks.name}</p></div>}
              {intervention.recommended_action && <div className="intervention-recommendation"><span>Recommended action</span><p>{intervention.recommended_action}</p></div>}
              {actionErrorId === intervention.id && error && <p className="intervention-error" role="alert">{error} Refresh approvals to confirm the current status before trying again.</p>}
              <footer className="intervention-actions">
                <button type="button" className="destructive" disabled={actionsDisabled} onClick={() => handleReject(intervention.id)}>Reject</button>
                <button type="button" className="primary" disabled={actionsDisabled} onClick={() => handleApprove(intervention.id)}>{processingId === intervention.id ? "Processing…" : "Approve"}<Icon name="arrow" /></button>
              </footer>
            </article>)}</div>}
        </section>
        <section className="approval-history" aria-labelledby="history-heading">
          <div className="operations-section-heading"><h2 id="history-heading">Decision & Execution History</h2><span className="operations-count">{decided.length} interventions</span></div>
          {decided.length === 0 ? <div className="operations-state"><EmptyState title="No decisions yet" description="Reviewed interventions and execution results will appear here." /></div> :
            <div className="approval-cards">{decided.map(intervention => {
              const isProcessing = processingId === intervention.id;
              const unresolved = intervention.outcome === null || intervention.outcome === "pending";
              return <article className="intervention-card" data-status={intervention.status} data-outcome={intervention.outcome ?? "pending"} key={intervention.id} aria-busy={isProcessing}>
                {accountHeading(intervention)}
                {(intervention.recovery_playbooks?.name || intervention.recommended_action) && <div className="intervention-playbook"><span>Playbook</span><p>{intervention.recovery_playbooks?.name ?? intervention.recommended_action}</p></div>}
                <dl className="intervention-details">
                  {intervention.approved_at && <div><dt>Approved</dt><dd><time dateTime={intervention.approved_at}>{new Date(intervention.approved_at).toLocaleString()}</time></dd></div>}
                  {intervention.executed_at && <div><dt>Executed</dt><dd><time dateTime={intervention.executed_at}>{new Date(intervention.executed_at).toLocaleString()}</time></dd></div>}
                  {intervention.execution_attempts !== undefined && (intervention.execution_attempts > 0 || intervention.status === "failed") && <div><dt>Execution attempts</dt><dd>{intervention.execution_attempts}</dd></div>}
                </dl>
                {intervention.execution_error && <div className="intervention-error"><strong>Execution error</strong><p>{intervention.execution_error}</p></div>}
                {intervention.status === "approved" && <div className="execution-controls"><p>Approved and ready to execute.</p><button type="button" className="primary" disabled={actionsDisabled} onClick={() => handleExecute(intervention.id)}>{isProcessing ? "Starting…" : "Execute"}</button></div>}
                {intervention.status === "failed" && <div className="execution-controls"><p>Execution failed. Review the error before retrying.</p><button type="button" disabled={actionsDisabled} onClick={() => handleExecute(intervention.id)}>{isProcessing ? "Retrying…" : "Retry"}</button></div>}
                {intervention.status === "executing" && <div className="execution-controls"><p role="status">Execution is in progress. Refresh to check the result.</p><button type="button" disabled>Executing…</button></div>}
                {intervention.status === "sent" && <div className="outcome-controls">
                  <p className="execution-success">Execution completed successfully.</p>
                  <div className="outcome-heading"><h4>Business outcome</h4><StatusBadge value={unresolved ? "pending_outcome" : intervention.outcome!} /></div>
                  {intervention.outcome_recorded_at && <p className="operations-muted">Recorded <time dateTime={intervention.outcome_recorded_at}>{new Date(intervention.outcome_recorded_at).toLocaleString()}</time></p>}
                  {unresolved ? <><p className="outcome-note">Record the customer result once confirmed. This decision is final.</p>
                    <div className="outcome-actions"><button type="button" disabled={actionsDisabled} onClick={() => handleOutcome(intervention.id, "recovered")}>{isProcessing ? "Saving…" : "Mark Recovered"}</button>
                      <button type="button" disabled={actionsDisabled} onClick={() => handleOutcome(intervention.id, "not_recovered")}>{isProcessing ? "Saving…" : "Mark Not Recovered"}</button></div></> : <p className="outcome-note">Final outcome recorded.</p>}
                </div>}
                {actionErrorId === intervention.id && error && <p className="intervention-error" role="alert">{error} Refresh approvals to confirm the current status before trying again.</p>}
                {intervention.status === "rejected" && <p className="intervention-final">This intervention was rejected and cannot be executed.</p>}
              </article>;
            })}</div>}
        </section>
      </>}
    </section>
  );
}
