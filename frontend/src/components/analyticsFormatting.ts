import type { RiskLevel } from "../types/api";

export const riskLevels: RiskLevel[] = ["low", "medium", "high", "critical"];
export const currency = (value: number) => new Intl.NumberFormat("en-PH", {
  style: "currency", currency: "PHP", minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2,
}).format(value);
export const percentage = (value: number) => `${value.toLocaleString("en-PH", { maximumFractionDigits: 1 })}%`;
