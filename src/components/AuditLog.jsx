import { useWardStore } from "../state/useWardStore";

function formatTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function actionLabel(entry) {
  const actor = entry.actor === "agent" ? "Agent" : "Nurse";
  return `${actor} ${entry.action} a patient flag`;
}

export function AuditLog() {
  const auditLog = useWardStore((state) => state.auditLog);
  const entries = auditLog.slice().reverse();

  return (
    <section className="audit-log" aria-labelledby="audit-log-title">
      <header className="audit-log__header">
        <p className="audit-log__eyebrow">Traceable co-work</p>
        <h2 id="audit-log-title">Audit log</h2>
      </header>

      {entries.length === 0 ? (
        <p className="audit-log__empty">Agent proposals and nurse decisions appear here.</p>
      ) : (
        <ol className="audit-log__list">
          {entries.map((entry) => (
            <li className="audit-row" key={entry.id}>
              <span
                className={`audit-row__actor audit-row__actor--${entry.actor}`}
                aria-hidden="true"
              />
              <div>
                <p className="audit-row__action">{actionLabel(entry)}</p>
                <p className="audit-row__detail">{entry.detail}</p>
              </div>
              <time className="audit-row__time" dateTime={entry.at}>
                {formatTime(entry.at)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
