import { Link } from "react-router-dom";
import type { Analytics } from "../types/api";
import { currency, percentage, riskLevels } from "./analyticsFormatting";
import { Icon } from "./Icon";
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

export function RiskCoverage({ data }: { data: Analytics }) {
  const scored = data.total_customers - data.risk_distribution.uncalculated;
  const coverage = data.total_customers ? scored / data.total_customers * 100 : 0;
  return <div className="risk-coverage">
    <div><p><strong>{scored}<span> / {data.total_customers}</span></strong> accounts scored</p><span>{percentage(coverage)} coverage</span></div>
    <div className="coverage-track" aria-hidden="true"><span style={{ width: `${coverage}%` }} /></div>
    <p>{data.risk_distribution.uncalculated} uncalculated · latest score per account</p>
  </div>;
}

export function RiskDistribution({ data }: { data: Analytics }) {
  const levels = [...riskLevels, "uncalculated" as const];
  return <section className="analytics-panel portfolio-risk">
    <h2>Portfolio Risk Distribution</h2><p className="analytics-muted">Current risk across the customer base.</p>
    <div className="risk-distribution-layout">
      <div className="risk-ring">
        <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
          <circle className="ring-track" cx="100" cy="100" r="80" fill="none" strokeWidth="14" />
          {levels.map((level, index) => {
            const share = data.total_customers ? data.risk_distribution[level] / data.total_customers * 100 : 0;
            const offset = data.total_customers ? levels.slice(0, index).reduce((sum, key) => sum + data.risk_distribution[key], 0) / data.total_customers * 100 : 0;
            return share > 0 && <circle key={level} data-level={level} cx="100" cy="100" r="80" pathLength="100" fill="none" strokeWidth="14" strokeDasharray={`${share} ${100 - share}`} strokeDashoffset={-offset} transform="rotate(-90 100 100)" />;
          })}
        </svg>
        <div className="ring-center"><strong>{data.total_customers}</strong><span>{data.total_customers === 0 ? "No accounts yet" : "Total customers"}</span></div>
      </div>
      <ul className="risk-legend">{levels.map(level => <li key={level}><span><i className="semantic-dot" data-level={level} aria-hidden="true" />{label(level)}</span><strong>{data.risk_distribution[level]}</strong></li>)}</ul>
    </div>
    <RiskCoverage data={data} />
  </section>;
}

export function RevenueByRisk({ data }: { data: Analytics }) {
  const maximum = Math.max(0, ...Object.values(data.revenue_exposure_by_risk));
  return <section className="analytics-panel revenue-risk">
    <h2>Revenue Exposure by Risk</h2><p className="analytics-muted">Account value, grouped by latest risk.</p>
    <ul className="analytics-bars">
      {riskLevels.map(level => <li key={level} data-exposed={level === "high" || level === "critical"}>
        <div><span>{label(level)}</span><strong>{currency(data.revenue_exposure_by_risk[level])}</strong></div>
        <div className="analytics-track" aria-hidden="true"><span data-level={level}
          style={{ width: `${maximum ? data.revenue_exposure_by_risk[level] / maximum * 100 : 0}%` }} /></div>
      </li>)}
    </ul>
    <div className="exposure-total"><span>High + Critical exposure</span><strong>{currency(data.revenue_exposure)}</strong></div>
    <p className="analytics-footnote">Uncalculated accounts excluded. Account value is not predicted loss.</p>
  </section>;
}

export function OutcomeDistribution({ data }: { data: Analytics }) {
  const outcomes = [
    { key: "recovered", name: "Recovered", count: data.intervention_outcomes.recovered },
    { key: "not_recovered", name: "Not recovered", count: data.intervention_outcomes.not_recovered },
    { key: "pending", name: "Awaiting outcome", count: data.intervention_outcomes.pending },
  ];
  const total = outcomes.reduce((sum, item) => sum + item.count, 0);
  return <div className="outcome-distribution">
    <div className="outcome-distribution-label"><span>Intervention outcomes</span><span>{total} total</span></div>
    <div className="outcome-stack" aria-hidden="true">{outcomes.map(item => <span key={item.key} data-outcome={item.key} style={{ width: `${total ? item.count / total * 100 : 0}%` }} />)}</div>
    <dl className="outcome-legend">{outcomes.map(item => <div key={item.key}><dt><i className="semantic-dot" data-outcome={item.key} aria-hidden="true" />{item.name}</dt><dd>{item.count}</dd></div>)}</dl>
    {total === 0 && <p className="analytics-empty">No sent or resolved interventions yet.</p>}
  </div>;
}

export function RecoveryActivity({ data }: { data: Analytics }) {
  return <section className="analytics-panel analytics-activity">
    <h2>Recent Recovery Activity</h2><p className="analytics-muted">Execution and confirmed customer outcomes.</p>
    {data.recent_recovery_activity.length === 0 ?
      <p className="analytics-empty">No dated recovery activity yet. Sent interventions and recorded outcomes will appear here.</p> :
      <ol>{data.recent_recovery_activity.map(item => <li key={`${item.intervention_id}-${item.outcome}`}>
        <span className="activity-marker" data-outcome={item.outcome}><Icon name={item.outcome === "sent" ? "sent" : item.outcome === "recovered" ? "check" : "risk"} /></span>
        <div className="activity-entry"><Link to={`/customers/${item.customer_id}`}>{item.company}</Link>
          <span>{item.outcome === "sent" ? "Recovery intervention sent" : `Marked ${label(item.outcome).toLowerCase()}`}</span>
        </div>
        <time dateTime={item.occurred_at}>{new Date(item.occurred_at).toLocaleString(undefined, {
          month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
        })}</time>
      </li>)}</ol>}
  </section>;
}
