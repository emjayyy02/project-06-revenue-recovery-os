import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getCustomerRisk, getCustomers } from "../api/client";
import { EmptyState, StatusBadge } from "../components/Customer360";
import { currency } from "../components/analyticsFormatting";
import { Icon } from "../components/Icon";
import type { Customer } from "../types/api";
import "./Operations.css";
import "./CustomersPage.css";

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [risks, setRisks] = useState<Record<string, string>>({});
  const [riskLoading, setRiskLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [healthFilter, setHealthFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadCustomers() {
      setLoading(true);
      setError(null);
      setRisks({});
      try {
        const data = await getCustomers();
        if (cancelled) return;
        setCustomers(data);
        setLoading(false);
        setRiskLoading(true);
        // Reuse the authoritative latest-risk endpoint, with bounded concurrency.
        // A failed request is unavailable, never an uncalculated score.
        for (let offset = 0; offset < data.length; offset += 4) {
          if (cancelled) return;
          const batch = await Promise.all(data.slice(offset, offset + 4).map(async customer => {
            try {
              const risk = await getCustomerRisk(customer.id);
              return [customer.id, risk?.risk_level ?? "uncalculated"] as const;
            } catch {
              return [customer.id, "unavailable"] as const;
            }
          }));
          if (cancelled) return;
          setRisks(previous => ({ ...previous, ...Object.fromEntries(batch) }));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load customers.");
      } finally {
        if (!cancelled) { setLoading(false); setRiskLoading(false); }
      }
    }
    void loadCustomers();
    return () => { cancelled = true; };
  }, [revision]);

  const ownerOf = (customer: Customer) => customer.owner?.trim() || "Unassigned";
  const options = (values: string[]) => [...new Set(values)].filter(Boolean).sort();
  const query = search.trim().toLocaleLowerCase();
  const filtered = customers.filter(customer =>
    (!query || [customer.full_name, customer.company, customer.email, ownerOf(customer)]
      .some(value => value.toLocaleLowerCase().includes(query))) &&
    (!riskFilter || risks[customer.id] === riskFilter) &&
    (!healthFilter || customer.customer_health_status === healthFilter) &&
    (!ownerFilter || ownerOf(customer) === ownerFilter) &&
    (!lifecycleFilter || customer.lifecycle_status === lifecycleFilter)
  );
  const hasFilters = !!(search || riskFilter || healthFilter || ownerFilter || lifecycleFilter);
  function clearFilters() {
    setSearch(""); setRiskFilter(""); setHealthFilter(""); setOwnerFilter(""); setLifecycleFilter("");
  }
  const riskUnavailable = Object.values(risks).includes("unavailable");

  return (
    <section className="operations-page customers-page" aria-busy={loading}>
      <header className="operations-header">
        <div><p className="operations-eyebrow">Account intelligence</p><h1>Customers</h1>
          <p>Monitor account health, risk, and customer activity.</p></div>
        <button type="button" onClick={() => setRevision(value => value + 1)} disabled={loading || riskLoading}><Icon name="refresh" />Refresh customers</button>
      </header>
      {loading ? <div className="operations-state" role="status"><strong>Loading customers…</strong><p>Retrieving account details.</p></div> :
        error ? <div className="operations-state operations-error" role="alert"><strong>Unable to load customers</strong><p>{error}</p>
          <button type="button" onClick={() => setRevision(value => value + 1)}>Try again</button></div> :
        customers.length === 0 ? <div className="operations-state"><EmptyState title="No customers yet" description="Customer accounts will appear here once they are added." /></div> : <>
          <div className="customer-filters" role="search" aria-label="Filter customers">
            <label className="customer-search">Search customers
              <Icon name="search" /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, company, email, or owner" />
            </label>
            <label>Risk<select aria-label="Risk" value={riskFilter} onChange={event => setRiskFilter(event.target.value)}>
              <option value="">All risks</option>
              {["low", "medium", "high", "critical", "uncalculated", ...(riskUnavailable ? ["unavailable"] : [])].map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
            </select></label>
            <label>Health<select aria-label="Health" value={healthFilter} onChange={event => setHealthFilter(event.target.value)}>
              <option value="">All health states</option>
              {options(customers.map(customer => customer.customer_health_status)).map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
            </select></label>
            <label>Owner<select aria-label="Owner" value={ownerFilter} onChange={event => setOwnerFilter(event.target.value)}>
              <option value="">All owners</option>
              {options(customers.map(ownerOf)).map(value => <option key={value} value={value}>{value}</option>)}
            </select></label>
            <label>Lifecycle<select aria-label="Lifecycle" value={lifecycleFilter} onChange={event => setLifecycleFilter(event.target.value)}>
              <option value="">All lifecycles</option>
              {options(customers.map(customer => customer.lifecycle_status)).map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
            </select></label>
          </div>
          <div className="customer-results">
            <p role="status">{filtered.length} of {customers.length} customers{riskLoading ? " · Loading risk scores…" : ""}</p>
            <button type="button" onClick={clearFilters} disabled={!hasFilters}>Clear filters</button>
          </div>
          {riskUnavailable && <div className="operations-state operations-error" role="status"><strong>Some risk scores are unavailable</strong><p>Account details are still available. Refresh customers to retry.</p></div>}
          {filtered.length === 0 ? <div className="operations-state"><EmptyState title={riskLoading && riskFilter ? "Checking risk scores…" : "No customers match your current filters."}
            description="Try a different search or clear your filters." /><button type="button" onClick={clearFilters}>Clear filters</button></div> :
            <div className="customer-table-scroll" role="region" aria-label="Customer accounts, scroll horizontally for all columns" tabIndex={0}>
              <table className="customer-table">
                <caption>Customer accounts · Risk is calculated separately from customer health.</caption>
                <thead><tr>{["Customer", "Company", "Account Value", "Risk", "Health", "Lifecycle", "Owner", "Last Activity"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
                <tbody>{filtered.map(customer => <tr key={customer.id}>
                  <th scope="row"><div className="customer-identity"><span className="customer-initials" aria-hidden="true">{customer.full_name.trim().split(/\s+/).filter(Boolean).map(part => part[0]).filter((_, index, all) => index === 0 || index === all.length - 1).join("").toUpperCase()}</span><div><Link to={`/customers/${customer.id}`}>{customer.full_name}</Link><span className="customer-email" title={customer.email}>{customer.email}</span></div></div></th>
                  <td>{customer.company}</td><td className="customer-value">{currency(customer.account_value)}</td>
                  <td><StatusBadge value={risks[customer.id] ?? "loading"} /></td>
                  <td><StatusBadge value={customer.customer_health_status} /></td>
                  <td><StatusBadge value={customer.lifecycle_status} /></td>
                  <td>{ownerOf(customer)}</td>
                  <td>{customer.last_activity_at ? <time dateTime={customer.last_activity_at}>{new Date(customer.last_activity_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time> : <span className="operations-muted">No activity</span>}</td>
                </tr>)}</tbody>
              </table>
            </div>}
        </>}
    </section>
  );
}
