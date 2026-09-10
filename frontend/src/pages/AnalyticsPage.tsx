import { useAnalytics } from "../api/useAnalytics";
import { AnalyticsState, OutcomeDistribution, RecoveryActivity, RevenueByRisk, RiskCoverage } from "../components/AnalyticsSummary";
import { currency, percentage, riskLevels } from "../components/analyticsFormatting";
import { Icon } from "../components/Icon";
import "./Analytics.css";

export function AnalyticsPage() {
  const { data, error, loading, refresh } = useAnalytics();
  return <section className="analytics-page" aria-busy={loading}>
    <header className="analytics-header">
      <div><p className="analytics-eyebrow">Recovery performance</p><h1>Analytics</h1><p>Risk coverage and confirmed intervention outcomes.</p></div>
      <button type="button" onClick={refresh} disabled={loading}><Icon name="refresh" />Refresh analytics</button>
    </header>
    {loading || error || !data ? <AnalyticsState loading={loading} error={error} refresh={refresh} /> : <>
      {data.total_customers === 0 && <p className="analytics-state">No customers yet. Risk and recovery breakdowns will appear as activity is recorded.</p>}
      <section className="recovery-performance">
        <div className="performance-primary"><h2>Recovery Performance</h2><p className="performance-value">{percentage(data.recovery_success_rate)}</p><p className="performance-label">Recovery success rate</p>
          <p className="analytics-muted">{data.recovered_customers} unique recovered customers</p></div>
        <div><OutcomeDistribution data={data} />
          <p className="analytics-footnote">Success rate: recovered ÷ resolved interventions. Awaiting outcome includes only sent, unresolved interventions.</p>
          {data.intervention_outcomes.recovered === 0 && data.intervention_outcomes.not_recovered === 0 && <p className="analytics-muted">No resolved outcomes yet. The success rate remains 0%.</p>}
        </div>
      </section>
      <div className="analytics-grid">
        <section className="analytics-panel analytical-coverage">
          <h2>Risk Coverage</h2><RiskCoverage data={data} />
          <table className="analytics-table">
            <caption>Current risk distribution · latest score per account</caption>
            <thead><tr><th scope="col">Risk</th><th scope="col">Customers</th><th scope="col">Account value</th></tr></thead>
            <tbody>{[...riskLevels, "uncalculated" as const].map(level => <tr key={level}>
              <th scope="row"><i className="semantic-dot" data-level={level} aria-hidden="true" />{level === "uncalculated" ? "Uncalculated" : level[0].toUpperCase() + level.slice(1)}</th>
              <td>{data.risk_distribution[level]}</td><td>{level === "uncalculated" ? "Not included" : currency(data.revenue_exposure_by_risk[level])}</td>
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
