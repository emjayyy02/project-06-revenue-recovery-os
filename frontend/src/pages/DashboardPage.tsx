import { Link } from "react-router-dom";
import { useAnalytics } from "../api/useAnalytics";
import { AnalyticsState, RecoveryActivity, RevenueByRisk, RiskDistribution } from "../components/AnalyticsSummary";
import { currency, percentage } from "../components/analyticsFormatting";
import "./Analytics.css";

export function DashboardPage() {
  const { data, error, loading, refresh } = useAnalytics();
  return <section className="analytics-page" aria-busy={loading}>
    <header className="analytics-header">
      <div><p className="analytics-eyebrow">Revenue Recovery OS</p><h1>Dashboard</h1>
        <p>Current exposure. Measurable recovery.</p></div>
      <Link to="/analytics">View analytics →</Link>
    </header>
    {loading || error || !data ? <AnalyticsState loading={loading} error={error} refresh={refresh} /> : <>
      {data.total_customers === 0 && <p className="analytics-state">No customers yet. Metrics will appear as customer activity is recorded.</p>}
      <dl className="analytics-kpis">
        {[
          ["Total Customers", data.total_customers.toLocaleString(), "All customer accounts"],
          ["At Risk", data.at_risk_customers.toLocaleString(), "Latest risk: High + Critical"],
          ["Critical", data.critical_customers.toLocaleString(), "Latest risk: Critical"],
          ["Revenue Exposure", currency(data.revenue_exposure), "High + Critical account value"],
          ["Recovered Customers", data.recovered_customers.toLocaleString(), "Unique accounts with a recovery"],
          ["Recovery Success Rate", percentage(data.recovery_success_rate), "Across resolved interventions"],
        ].map(([title, value, note]) => <div key={title}><dt>{title}</dt><dd>{value}</dd><p>{note}</p></div>)}
      </dl>
      <div className="analytics-grid"><RiskDistribution data={data} /><RevenueByRisk data={data} /></div>
      <RecoveryActivity data={data} />
    </>}
  </section>;
}
