import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getCustomer,
  getCustomerEvents,
  getCustomerRisk,
  getCustomerSignals,
  createIntervention,
  getAiAssistance,
} from "../api/client";

import type {
  Customer,
  CustomerEvent,
  RiskScore,
  RiskSignal,
  AiAssistance,
} from "../types/api";

import {
  EmptyState,
  MetricBlock,
  SignalRow,
  StatusBadge,
  TimelineItem,
} from "../components/Customer360";
import "./CustomerPage.css";


const PLAYBOOK_IDS: Record<string, string> = {
  "High-Risk Account Check-in":
    "10000000-0000-0000-0000-000000000001",

  "Billing Recovery Outreach":
    "10000000-0000-0000-0000-000000000002",

  "Inactive Customer Re-engagement":
    "10000000-0000-0000-0000-000000000003",
};

export function CustomerPage() {
  const { id } = useParams();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [events, setEvents] = useState<CustomerEvent[]>([]);
  const [risk, setRisk] = useState<RiskScore | null>(null);
  const [signals, setSignals] = useState<RiskSignal[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [requestingApproval, setRequestingApproval] =
  useState(false);

  const [approvalMessage, setApprovalMessage] =
  useState<string | null>(null);

  const [aiAssistance, setAiAssistance] =
  useState<AiAssistance | null>(null);

  const [aiProvider, setAiProvider] =
    useState<"openrouter" | "fallback" | null>(null);

  const [loadingAi, setLoadingAi] =
    useState(false);

  const [aiError, setAiError] =
    useState<string | null>(null);

  useEffect(() => {
  if (!id) {
    return;
  }

  async function loadCustomer360() {
    try {
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
      setError(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load customer."
      );
    } finally {
      setLoading(false);
    }
  }

  loadCustomer360();
}, [id]);

if (!id) {
  return (
    <section>
      <h1>Customer 360</h1>
      <p>Customer ID is missing.</p>
    </section>
  );
}

  if (loading) {
    return (
      <section
        className="customer-360"
        aria-busy="true"
        aria-label="Customer 360"
      >
        <p className="c360-eyebrow">Customer 360</p>
        <div className="c360-loading" role="status">
          Loading customer account, risk signals and activity…
        </div>
        <div className="c360-skeleton" aria-hidden="true" />
        <div className="c360-skeleton c360-skeleton--body" aria-hidden="true" />
      </section>
    );
  }

  if (error || !customer) {
    return (
      <section className="customer-360">
        <Link className="c360-back" to="/customers">
          ← All customers
        </Link>
        <h1>Customer 360</h1>
        <div className="c360-panel" role="alert">
          <EmptyState
            title={
              error ? "Unable to load this customer" : "Customer not found"
            }
            description={
              error ??
              "This customer is unavailable. Return to the customer list to select an account."
            }
          />
          {error && (
            <p className="c360-error-help">
              Refresh the page to try again, or return to the customer list.
            </p>
          )}
        </div>
      </section>
    );
  }
  const recommendedPlaybook =
    risk?.risk_level === "critical"
      ? "High-Risk Account Check-in"
      : risk?.risk_level === "high"
        ? "Billing Recovery Outreach"
        : risk?.risk_level === "medium"
          ? "Inactive Customer Re-engagement"
          : null;

  const timelineEvents = [...events].sort(
    (a, b) =>
      new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  );

      async function handleRequestApproval() {
        if (!customer || !recommendedPlaybook) {
          setApprovalMessage(
            "Customer or recommended playbook is unavailable."
          );
          return;
        }

        const playbookId =
          PLAYBOOK_IDS[recommendedPlaybook];

        if (!playbookId) {
          setApprovalMessage(
            "Unable to identify the recommended playbook."
          );
          return;
        }

        try {
          setRequestingApproval(true);
          setApprovalMessage(null);

          const payload = {
            customer_id: customer.id,
            playbook_id: playbookId,
            type: "recovery_outreach",
            recommended_action: recommendedPlaybook,
          };

          console.log("Creating intervention:", payload);

          await createIntervention(payload);

          setApprovalMessage(
            "Approval requested successfully."
          );
        } catch (error) {
          console.error("Approval request failed:", error);

          setApprovalMessage(
            error instanceof Error
              ? error.message
              : "Failed to request approval."
          );
        } finally {
          // VERY IMPORTANT
          setRequestingApproval(false);
        }
      }

      async function handleGenerateAiAssistance() {
        if (!id) return;

        try {
          setLoadingAi(true);
          setAiError(null);

          const result = await getAiAssistance(id);

          setAiAssistance(result.data);
          setAiProvider(result.provider);
        } catch (error) {
          setAiError(
            error instanceof Error
              ? error.message
              : "Failed to generate assistance."
          );
        } finally {
          setLoadingAi(false);
        }
      }

  return (
    <section className="customer-360">
      <nav className="c360-breadcrumb" aria-label="Breadcrumb">
        <Link className="c360-back" to="/customers">
          ← All customers
        </Link>
        <span aria-hidden="true">/</span>
        <span>Customer 360</span>
      </nav>
      <header className="c360-account">
        <div className="c360-identity">
          <p className="c360-eyebrow">Customer account</p>
          <h1>{customer.company}</h1>
          <p className="c360-contact">{customer.full_name}</p>
        </div>
        <div className="c360-risk" data-level={risk?.risk_level}>
          <div className="c360-risk-label">
            Current risk {risk && <StatusBadge value={risk.risk_level} />}
          </div>
          <p className="c360-score">
            {risk ? (
              <>
                {risk.score}
                <span>/ 100</span>
              </>
            ) : (
              <span>Not calculated</span>
            )}
          </p>
          {risk && (
            <p className="c360-calculated">
              Updated {new Date(risk.calculated_at).toLocaleString()}
            </p>
          )}
        </div>
        <dl className="c360-metrics">
          <MetricBlock label="Account value">
            <span className="c360-value">
              ₱{customer.account_value.toLocaleString()}
            </span>
          </MetricBlock>
          <MetricBlock label="Account owner">
            {customer.owner ?? "Unassigned"}
          </MetricBlock>
          <MetricBlock label="Lifecycle">
            <StatusBadge value={customer.lifecycle_status} />
          </MetricBlock>
          <MetricBlock label="Customer health">
            <StatusBadge value={customer.customer_health_status} />
          </MetricBlock>
        </dl>
      </header>

      <div className="c360-columns">
        <div className="c360-main-column">
          <section className="c360-panel" aria-labelledby="risk-heading">
            <div className="c360-section-heading">
              <div>
                <h2 id="risk-heading">Risk explanation</h2>
                <p>The signals behind this account’s score.</p>
              </div>
              <span className="c360-count">{signals.length} active</span>
            </div>
            {signals.length === 0 ? (
              <EmptyState
                title="No active risk signals"
                description="There are no active churn signals recorded for this account."
              />
            ) : (
              <ul className="c360-signals">
                {signals.map((signal) => (
                  <SignalRow key={signal.id} signal={signal} />
                ))}
              </ul>
            )}
            <p className="c360-footnote">
              Signal weights show risk contributions. Recovery events can lower the
              score, so weights may not sum to the total. See the timeline for
              customer replies, successful payments and usage recovery.
            </p>
          </section>
          <section className="c360-panel" aria-labelledby="timeline-heading">
            <div className="c360-section-heading">
              <div>
                <h2 id="timeline-heading">Customer timeline</h2>
                <p>Recent account activity · newest first</p>
              </div>
              <span className="c360-count">{events.length} events</span>
            </div>
            {events.length === 0 ? (
              <EmptyState
                title="No activity recorded"
                description="Customer events will appear here as they are received."
              />
            ) : (
              <ol className="c360-timeline">
                {timelineEvents.map((event) => (
                  <TimelineItem key={event.id} event={event} />
                ))}
              </ol>
            )}
          </section>
        </div>
        <div className="c360-side-column">
          <section
            className="c360-panel c360-recovery"
            aria-labelledby="recovery-heading"
          >
            <div className="c360-section-heading">
              <h2 id="recovery-heading">Recommended recovery action</h2>
            </div>
            {recommendedPlaybook ? (
              <div className="c360-action-body">
                <p className="c360-eyebrow">Suggested playbook</p>
                <h3 className="c360-playbook">{recommendedPlaybook}</h3>
                <p>
                  Recommended from this account’s current {risk?.risk_level}{" "}
                  risk level and active churn signals.
                </p>
                <h4>Suggested next steps</h4>
                <ol className="c360-steps">
                  <li>
                    Review the active signals and recent customer activity.
                  </li>
                  <li>
                    Coordinate the outreach plan with{" "}
                    {customer.owner ?? "the account owner"}.
                  </li>
                  <li>Request approval before starting recovery outreach.</li>
                </ol>
                <div className="c360-approval">
                  <span>Approval required</span>
                  <button
                    type="button"
                    onClick={handleRequestApproval}
                    disabled={requestingApproval}
                  >
                    {requestingApproval
                      ? "Requesting..."
                      : "Request Approval"}
                  </button>
                  {approvalMessage && (
                  <p>{approvalMessage}</p>
                )}
                </div>
              </div>
            ) : (
              <EmptyState
                title={
                  risk
                    ? "No recovery action required"
                    : "Recommendation unavailable"
                }
                description={
                  risk
                    ? "Continue monitoring account activity and customer health."
                    : "A calculated risk level is needed before a recovery playbook can be recommended."
                }
              />
            )}
          </section>
          <section className="c360-ai">
            <div>
              <h2>AI Assistance</h2>
              <p>
                Generates a concise risk summary, recommended next action,
                and outreach draft from the current customer context.
              </p>
            </div>

            {!aiAssistance && (
              <button
                type="button"
                onClick={handleGenerateAiAssistance}
                disabled={loadingAi}
              >
                {loadingAi
                  ? "Generating..."
                  : "Generate AI Assistance"}
              </button>
            )}

            {aiError && (
              <p>{aiError}</p>
            )}

            {aiAssistance && (
              <div>
                <p>
                  <strong>Provider:</strong>{" "}
                  {aiProvider === "openrouter"
                    ? "OpenRouter"
                    : "Fallback"}
                </p>

                <article>
                  <h3>Risk Summary</h3>
                  <p>{aiAssistance.risk_summary}</p>
                </article>

                <article>
                  <h3>Recommended Next Action</h3>
                  <p>
                    {aiAssistance.recommended_next_action}
                  </p>
                </article>

                <article>
                  <h3>Draft Outreach</h3>
                  <p>{aiAssistance.draft_message}</p>
                </article>

                <button
                  type="button"
                  onClick={handleGenerateAiAssistance}
                  disabled={loadingAi}
                >
                  {loadingAi
                    ? "Regenerating..."
                    : "Regenerate"}
                </button>
              </div>
            )}
          </section>
          <section
            className="c360-panel"
            aria-labelledby="interventions-heading"
          >
            <div className="c360-section-heading">
              <h2 id="interventions-heading">Intervention history</h2>
            </div>
            <EmptyState
              title="No interventions yet"
              description="No recovery interventions have been created yet. This section is reserved for intervention records once recovery execution is available."
            />
          </section>
        </div>
      </div>
    </section>
  );
}
