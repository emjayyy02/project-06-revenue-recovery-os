import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "../types/database";

type Customer = Pick<Tables<"customers">, "id" | "company" | "account_value">;
type Risk = Pick<Tables<"risk_scores">, "id" | "customer_id" | "risk_level" | "calculated_at">;
type Intervention = Pick<Tables<"interventions">,
  "id" | "customer_id" | "status" | "outcome" | "outcome_recorded_at" | "executed_at">;
type RiskLevel = "low" | "medium" | "high" | "critical";

export interface Analytics {
  total_customers: number;
  at_risk_customers: number;
  critical_customers: number;
  revenue_exposure: number;
  recovered_customers: number;
  /** Percentage in the range 0–100, calculated from resolved interventions. */
  recovery_success_rate: number;
  risk_distribution: Record<RiskLevel | "uncalculated", number>;
  revenue_exposure_by_risk: Record<RiskLevel, number>;
  intervention_outcomes: { pending: number; recovered: number; not_recovered: number };
  recent_recovery_activity: {
    intervention_id: string;
    customer_id: string;
    company: string;
    outcome: "sent" | "recovered" | "not_recovered";
    occurred_at: string;
  }[];
}

// Read every page, including when the project's API row limit is below 1,000.
export async function readAllPages<T>(
  query: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (;;) {
    const { data, error } = await query(rows.length, rows.length + 999);
    if (error) throw new Error(error.message);
    if (!data?.length) return rows;
    rows.push(...data);
  }
}

export async function getAnalytics(supabase: SupabaseClient<Database>): Promise<Analytics> {
  const [customers, risks, interventions] = await Promise.all([
    readAllPages((from, to) => supabase.from("customers")
      .select("id, company, account_value").order("id").range(from, to)),
    readAllPages((from, to) => supabase.from("risk_scores")
      .select("id, customer_id, risk_level, calculated_at").order("id").range(from, to)),
    readAllPages((from, to) => supabase.from("interventions")
      .select("id, customer_id, status, outcome, outcome_recorded_at, executed_at")
      .order("id").range(from, to)),
  ]);
  return calculateAnalytics(customers, risks, interventions);
}

export function calculateAnalytics(
  customers: Customer[], risks: Risk[], interventions: Intervention[],
): Analytics {
  const riskDistribution: Analytics["risk_distribution"] = {
    low: 0, medium: 0, high: 0, critical: 0, uncalculated: 0,
  };
  // Sum integer cents to avoid accumulating binary floating-point currency errors.
  const revenueCents = { low: 0, medium: 0, high: 0, critical: 0 };
  const latestRisk = new Map<string, Risk>();
  for (const risk of risks) {
    const previous = latestRisk.get(risk.customer_id);
    const timestamp = Date.parse(risk.calculated_at);
    const previousTimestamp = previous ? Date.parse(previous.calculated_at) : -Infinity;
    if (!previous || timestamp > previousTimestamp ||
      (timestamp === previousTimestamp && risk.id > previous.id)) {
      latestRisk.set(risk.customer_id, risk);
    }
  }
  const customerById = new Map(customers.map(customer => [customer.id, customer]));
  for (const customer of customers) {
    const level = latestRisk.get(customer.id)?.risk_level;
    if (level === "low" || level === "medium" || level === "high" || level === "critical") {
      riskDistribution[level]++;
      revenueCents[level] += Math.round(customer.account_value * 100);
    } else {
      riskDistribution.uncalculated++;
    }
  }

  const outcomes = { pending: 0, recovered: 0, not_recovered: 0 };
  const recoveredCustomers = new Set<string>();
  const activity: Analytics["recent_recovery_activity"] = [];
  for (const intervention of interventions) {
    const customer = customerById.get(intervention.customer_id);
    if (!customer) continue;
    const outcome = intervention.outcome;
    if (outcome === "recovered" || outcome === "not_recovered") {
      outcomes[outcome]++;
      if (outcome === "recovered") recoveredCustomers.add(customer.id);
      // Legacy outcomes without a recorded timestamp still count, but cannot
      // truthfully be placed on a timeline of outcome decisions.
      if (intervention.outcome_recorded_at) {
        activity.push({
          intervention_id: intervention.id, customer_id: customer.id,
          company: customer.company, outcome, occurred_at: intervention.outcome_recorded_at,
        });
      }
    } else if (intervention.status === "sent" && (outcome === null || outcome === "pending")) {
      outcomes.pending++;
    }
    if (intervention.status === "sent" && intervention.executed_at) {
      activity.push({
        intervention_id: intervention.id, customer_id: customer.id,
        company: customer.company, outcome: "sent", occurred_at: intervention.executed_at,
      });
    }
  }
  const resolved = outcomes.recovered + outcomes.not_recovered;
  return {
    total_customers: customers.length,
    at_risk_customers: riskDistribution.high + riskDistribution.critical,
    critical_customers: riskDistribution.critical,
    revenue_exposure: (revenueCents.high + revenueCents.critical) / 100,
    recovered_customers: recoveredCustomers.size,
    recovery_success_rate: resolved === 0 ? 0 : outcomes.recovered / resolved * 100,
    risk_distribution: riskDistribution,
    revenue_exposure_by_risk: {
      low: revenueCents.low / 100, medium: revenueCents.medium / 100,
      high: revenueCents.high / 100, critical: revenueCents.critical / 100,
    },
    intervention_outcomes: outcomes,
    recent_recovery_activity: activity.sort((a, b) =>
      Date.parse(b.occurred_at) - Date.parse(a.occurred_at) ||
      b.intervention_id.localeCompare(a.intervention_id) || b.outcome.localeCompare(a.outcome),
    ).slice(0, 8),
  };
}
