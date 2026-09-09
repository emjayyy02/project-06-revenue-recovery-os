import { useAnalytics } from "../api/useAnalytics";
import { AnalyticsState, RecoveryActivity, RevenueByRisk } from "../components/AnalyticsSummary";
import { currency, percentage, riskLevels } from "../components/analyticsFormatting";
import "./Analytics.css";

export function AnalyticsPage() {
  const { data, error, loading, refresh } = useAnalytics();
  return <section className="analytics-page" aria-busy={loading}>
    <header className="analytics-header">
      <div><p className="analytics-eyebrow">Recovery performance</p><h1>Analytics</h1>
        <p>Risk coverage and confirmed intervention outcomes.</p></div>
      <button type="button" onClick={refresh} disabled={loading}>Refresh analytics</button>
    </header>
    {loading || error || !data ? <AnalyticsState loading={loading} error={error} refresh={refresh} /> : <>
      {data.total_customers === 0 && <p className="analytics-state">No customers yet. Risk and recovery breakdowns will appear as activity is recorded.</p>}
      <section className="analytics-panel">
        <h2>Intervention Outcomes</h2>
        <p className="analytics-muted">Business outcomes are recorded separately from execution success.</p>
        <dl className="analytics-outcomes">
          <div><dt>Recovery Success Rate</dt><dd>{percentage(data.recovery_success_rate)}</dd></div>
          <div><dt>Recovered</dt><dd>{data.intervention_outcomes.recovered}</dd></div>
          <div><dt>Not Recovered</dt><dd>{data.intervention_outcomes.not_recovered}</dd></div>
          <div><dt>Awaiting Outcome</dt><dd>{data.intervention_outcomes.pending}</dd></div>
        </dl>
        <p className="analytics-footnote">Recovered ÷ resolved interventions. Awaiting outcome includes only sent, unresolved interventions.</p>
        {data.intervention_outcomes.recovered === 0 && data.intervention_outcomes.not_recovered === 0 &&
          <p className="analytics-empty">No outcomes recorded yet. The success rate is 0% until an intervention is resolved.</p>}
        <p className="analytics-muted">{data.recovered_customers} unique recovered customers. A customer with multiple recoveries counts once.</p>
      </section>
      <div className="analytics-grid">
        <section className="analytics-panel">
          <h2>Risk Distribution</h2>
          <p className="analytics-muted">Latest score per customer; historical scores are excluded.</p>
          <table className="analytics-table">
            <caption>Current risk coverage across {data.total_customers} customers</caption>
            <thead><tr><th scope="col">Risk</th><th scope="col">Customers</th><th scope="col">Account value</th></tr></thead>
            <tbody>{[...riskLevels, "uncalculated" as const].map(level => <tr key={level}>
              <th scope="row">{level === "uncalculated" ? "Uncalculated" : level[0].toUpperCase() + level.slice(1)}</th>
              <td>{data.risk_distribution[level]}</td>
              <td>{level === "uncalculated" ? "Not included" : currency(data.revenue_exposure_by_risk[level])}</td>
            </tr>)}</tbody>
          </table>
          <p className="analytics-footnote">{data.at_risk_customers} at risk · {data.critical_customers} critical · {currency(data.revenue_exposure)} exposed</p>
        </section>
        <RevenueByRisk data={data} />
      </div>
      <RecoveryActivity data={data} />
    </>}
  </section>;
}
