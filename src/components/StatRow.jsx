import { useWardStore } from "../state/useWardStore";

export function StatRow() {
  const onWard = useWardStore((state) => state.patients.length);
  const pending = useWardStore((state) => state.pendingProposals.length);
  const approvedToday = useWardStore(
    (state) =>
      state.auditLog.filter(
        (entry) => entry.actor === "nurse" && entry.action === "approved",
      ).length,
  );
  const flagged = useWardStore(
    (state) =>
      state.patients.filter((patient) => patient.workflow?.flag).length,
  );

  const stats = [
    ["On ward", onWard],
    ["Pending", pending],
    ["Approved today", approvedToday],
    ["Flagged", flagged],
    ["Last sync", "now"],
  ];

  return (
    <footer className="stat-row" aria-label="Live ward summary">
      <dl className="stat-row__list">
        {stats.map(([label, value]) => (
          <div className="stat-row__item" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </footer>
  );
}
