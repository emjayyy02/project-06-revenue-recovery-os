import { Link } from "react-router-dom";
import { useAnalytics } from "../api/useAnalytics";
import { AnalyticsState, RecoveryActivity, RevenueByRisk, RiskDistribution } from "../components/AnalyticsSummary";
import { currency, percentage } from "../components/analyticsFormatting";
import { Icon } from "../components/Icon";
import "./Analytics.css";

export function DashboardPage() {
  const { data, error, loading, refresh } = useAnalytics();
  return <section className="analytics-page dashboard-page" aria-busy={loading}>
    <header className="analytics-header">
      <div><p className="analytics-eyebrow">Portfolio overview</p><h1>Dashboard</h1><p>Customer risk. Revenue exposure. Recovery action.</p></div>
      <Link className="rr-text-action" to="/analytics">View analytics <Icon name="arrow" /></Link>
    </header>
    {loading || error || !data ? <AnalyticsState loading={loading} error={error} refresh={refresh} /> : <>
      {data.total_customers === 0 && <p className="analytics-state">No customers yet. Metrics will appear as customer activity is recorded.</p>}
      <div className="exposure-overview">
        <div className="exposure-primary">
          <h2><Icon name="exposure" />Revenue Exposure</h2>
          <p className="exposure-value">{currency(data.revenue_exposure)}</p>
          <p className="exposure-context"><span>{data.at_risk_customers} at-risk {data.at_risk_customers === 1 ? "account" : "accounts"}</span><span>{data.critical_customers} critical</span></p>
          <p className="analytics-muted">High + Critical account value · not predicted loss</p>
          <Link className="rr-text-action" to="/customers">Inspect customer risk <Icon name="arrow" /></Link>
        </div>
        <dl className="supporting-kpis">
          <div><dt><Icon name="risk" />At Risk</dt><dd>{data.at_risk_customers.toLocaleString()}</dd><span>High + Critical</span></div>
          <div><dt><Icon name="pulse" />Critical</dt><dd>{data.critical_customers.toLocaleString()}</dd><span>Highest risk level</span></div>
          <div><dt><Icon name="check" />Recovered</dt><dd>{data.recovered_customers.toLocaleString()}</dd><span>Unique customers</span></div>
          <div><dt><Icon name="performance" />Success Rate</dt><dd>{percentage(data.recovery_success_rate)}</dd><span>Resolved interventions</span></div>
        </dl>
      </div>
      <div className="dashboard-analysis"><RiskDistribution data={data} /><RevenueByRisk data={data} /></div>
      <div className="dashboard-recovery"><RecoveryActivity data={data} />
        <section className="recovery-checkpoint"><h2>Recovery follow-through</h2>
          <p className="checkpoint-value">{data.intervention_outcomes.pending}<span>awaiting outcome</span></p>
          <p className="analytics-muted">Successful execution still needs a confirmed customer result.</p>
          <Link className="rr-text-action" to="/approvals">Review recovery work <Icon name="arrow" /></Link>
          <dl className="checkpoint-totals"><div><dt>Recovered</dt><dd>{data.intervention_outcomes.recovered}</dd></div><div><dt>Not recovered</dt><dd>{data.intervention_outcomes.not_recovered}</dd></div></dl>
        </section>
      </div>
    </>}
  </section>;
}
