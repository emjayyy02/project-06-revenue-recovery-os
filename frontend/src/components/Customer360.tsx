import type { ReactNode } from "react";
import type { CustomerEvent, RiskSignal } from "../types/api";

function readableLabel(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function StatusBadge({ value }: { value: string }) {
  const tone = ["critical", "high", "medium", "low"].includes(
    value.toLowerCase(),
  )
    ? value.toLowerCase()
    : "neutral";
  return (
    <span className={`c360-badge c360-badge--${tone}`}>
      {readableLabel(value)}
    </span>
  );
}

export function MetricBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="c360-metric">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="c360-empty">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function SignalRow({ signal }: { signal: RiskSignal }) {
  return (
    <li className="c360-signal">
      <div className="c360-signal-heading">
        <h3>{readableLabel(signal.signal_type)}</h3>
        <StatusBadge value={signal.severity} />
      </div>
      <span className="c360-weight" aria-label={`${signal.weight} risk points`}>
        {signal.weight > 0 ? "+" : ""}
        {signal.weight}
        <small>points</small>
      </span>
      <p>{signal.explanation}</p>
    </li>
  );
}

export function TimelineItem({ event }: { event: CustomerEvent }) {
  return (
    <li className="c360-event">
      <div className="c360-event-heading">
        <h3>{readableLabel(event.event_type)}</h3>
        <time dateTime={event.occurred_at}>
          {new Date(event.occurred_at).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
      <p>{event.description ?? "No description available."}</p>
      {event.source && (
        <span className="c360-source">
          Source · {readableLabel(event.source)}
        </span>
      )}
    </li>
  );
}
