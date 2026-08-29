const SEVERITY_LABELS = {
  1: "Normal",
  2: "Low",
  3: "Moderate",
  4: "High",
  5: "Critical",
};

export function SeverityBadge({ severity }) {
  const safeSeverity = SEVERITY_LABELS[severity] ? severity : 1;

  return (
    <span className={`severity-badge severity-badge--${safeSeverity}`}>
      <span className="severity-badge__dot" aria-hidden="true" />
      {SEVERITY_LABELS[safeSeverity]} · {safeSeverity}
    </span>
  );
}
