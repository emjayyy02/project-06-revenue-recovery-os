import { Link } from "react-router-dom";
import type { Analytics } from "../types/api";
import { currency, riskLevels } from "./analyticsFormatting";
const label = (value: string) => value.replaceAll("_", " ").replace(/^./, char => char.toUpperCase());

export function AnalyticsState({ loading, error, refresh }: {
  loading: boolean; error: string | null; refresh: () => void;
}) {
  if (loading) return <div className="analytics-state" role="status">Loading account risk and recovery outcomes…</div>;
  return <div className="analytics-state" role="alert">
    <h2>Unable to load analytics</h2><p>{error ?? "Analytics is unavailable."}</p>
    <button type="button" onClick={refresh}>Try again</button>
  </div>;
}

export function RiskDistribution({ data }: { data: Analytics }) {
  return <section className="analytics-panel">
    <h2>Risk Distribution</h2><p className="analytics-muted">One current risk level per customer.</p>
    <ul className="analytics-bars">
      {[...riskLevels, "uncalculated" as const].map(level => <li key={level}>
        <div><span>{label(level)}</span><strong>{data.risk_distribution[level]}</strong></div>
        <div className="analytics-track" aria-hidden="true"><span data-level={level}
          style={{ width: `${data.total_customers ? data.risk_distribution[level] / data.total_customers * 100 : 0}%` }} /></div>
      </li>)}
    </ul>
  </section>;
}

export function RevenueByRisk({ data }: { data: Analytics }) {
  const maximum = Math.max(0, ...Object.values(data.revenue_exposure_by_risk));
  return <section className="analytics-panel">
    <h2>Revenue Exposure by Risk</h2><p className="analytics-muted">Account value by risk. High + Critical form exposure.</p>
    <ul className="analytics-bars">
      {riskLevels.map(level => <li key={level}>
        <div><span>{label(level)}</span><strong>{currency(data.revenue_exposure_by_risk[level])}</strong></div>
        <div className="analytics-track" aria-hidden="true"><span data-level={level}
          style={{ width: `${maximum ? data.revenue_exposure_by_risk[level] / maximum * 100 : 0}%` }} /></div>
      </li>)}
    </ul>
    <p className="analytics-footnote">Uncalculated accounts are excluded. Exposure is account value, not predicted loss.</p>
  </section>;
}

export function RecoveryActivity({ data }: { data: Analytics }) {
  return <section className="analytics-panel analytics-activity">
    <h2>Recent Recovery Activity</h2><p className="analytics-muted">Recorded outcomes and successful execution.</p>
    {data.recent_recovery_activity.length === 0 ?
      <p className="analytics-empty">No dated recovery activity yet. Sent interventions and recorded outcomes will appear here.</p> :
      <ul>{data.recent_recovery_activity.map(item => <li key={`${item.intervention_id}-${item.outcome}`}>
        <div><Link to={`/customers/${item.customer_id}`}>{item.company}</Link>
          <span>{item.outcome === "sent" ? "Recovery intervention sent" : `Marked ${label(item.outcome).toLowerCase()}`}</span>
        </div>
        <time dateTime={item.occurred_at}>{new Date(item.occurred_at).toLocaleString(undefined, {
          month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
        })}</time>
      </li>)}</ul>}
  </section>;
}
