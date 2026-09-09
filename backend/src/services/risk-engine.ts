import type { Database, Json } from "../types/database";

type CustomerEvent =
  Database["public"]["Tables"]["customer_events"]["Row"];

type RiskSignalInsert =
  Database["public"]["Tables"]["risk_signals"]["Insert"];

export type RiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface RiskCalculationResult {
  score: number;
  riskLevel: RiskLevel;
  signals: RiskSignalInsert[];
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

export function calculateRiskFromEvents(
  customerId: string,
  events: CustomerEvent[]
): RiskCalculationResult {
  const signals: RiskSignalInsert[] = [];

  const addSignal = (
    sourceEvent: CustomerEvent,
    signalType: string,
    weight: number,
    severity: string,
    explanation: string
  ) => {
    signals.push({
      customer_id: customerId,
      source_event_id: sourceEvent.id,
      signal_type: signalType,
      weight,
      severity,
      explanation,
      active: true,
    });
  };

  const paymentFailures = events.filter(
    (event) => event.event_type === "payment_failed"
  );

  for (const event of events) {
    const value = (event.event_value ?? {}) as Record<string, unknown>;

    if (event.event_type === "usage_decline") {
      const declinePercent = Number(value.decline_percent ?? 0);

      if (declinePercent > 50) {
        addSignal(
          event,
          "usage_decline",
          25,
          "high",
          `Usage decreased ${declinePercent}% over the measured period.`
        );
      } else if (declinePercent >= 25) {
        addSignal(
          event,
          "usage_decline",
          15,
          "medium",
          `Usage decreased ${declinePercent}% over the measured period.`
        );
      }
    }

    if (event.event_type === "login_inactivity") {
      const daysInactive = Number(value.days_inactive ?? 0);

      if (daysInactive > 14) {
        addSignal(
          event,
          "login_inactivity",
          15,
          "high",
          `Customer has been inactive for ${daysInactive} days.`
        );
      } else if (daysInactive > 7) {
        addSignal(
          event,
          "login_inactivity",
          8,
          "medium",
          `Customer has been inactive for ${daysInactive} days.`
        );
      }
    }

    if (event.event_type === "negative_support") {
      addSignal(
        event,
        "negative_support",
        15,
        "high",
        event.description ?? "Negative support interaction detected."
      );
    }

    if (event.event_type === "negative_feedback") {
      addSignal(
        event,
        "negative_feedback",
        10,
        "medium",
        event.description ?? "Negative feedback detected."
      );
    }
  }

  // Payment failure rule:
  // one failed payment = +20
  // repeated failure = capped at +30 total
  if (paymentFailures.length === 1) {
    addSignal(
      paymentFailures[0],
      "payment_failed",
      20,
      "high",
      "A payment failure was detected."
    );
  }

  if (paymentFailures.length >= 2) {
    addSignal(
      paymentFailures[paymentFailures.length - 1],
      "repeated_payment_failure",
      30,
      "critical",
      "Repeated payment failures were detected."
    );
  }

        
  const hasCustomerReply = events.some(
  (event) => event.event_type === "customer_reply"
);

const hasSuccessfulPayment = events.some(
  (event) => event.event_type === "successful_payment"
);

const hasUsageRecovery = events.some(
  (event) => event.event_type === "usage_recovered"
);

let recoveryReduction = 0;

if (hasCustomerReply) {
  recoveryReduction += 10;
}

if (hasSuccessfulPayment) {
  recoveryReduction += 15;
}

if (hasUsageRecovery) {
  recoveryReduction += 20;
}

const riskPoints = signals.reduce(
  (total, signal) => total + (signal.weight ?? 0),
  0
);

const rawScore = riskPoints - recoveryReduction;

const score = clampScore(rawScore);

return {
  score,
  riskLevel: getRiskLevel(score),
  signals,
};    
}