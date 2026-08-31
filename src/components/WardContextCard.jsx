import { useWardStore } from "../state/useWardStore";
import { SeverityBadge } from "./SeverityBadge";

export function WardContextCard() {
  const patients = useWardStore((state) => state.patients);
  const topPatients = patients.slice(0, 3);
  const flaggedCount = patients.filter((patient) => patient.workflow?.flag).length;

  return (
    <section className="ward-context" aria-label="Ward snapshot">
      <p className="ward-context__eyebrow">Highest risk now</p>
      <ul className="ward-context__list">
        {topPatients.map((patient) => (
          <li className="ward-context__item" key={patient.patient_id}>
            <div className="ward-context__patient">
              <span className="ward-context__name">{patient.name}</span>
              <span className="ward-context__bed">
                {patient.bed} · {patient.ward}
              </span>
            </div>
            <SeverityBadge severity={patient.severity ?? 1} />
          </li>
        ))}
      </ul>
      <dl className="ward-context__stats">
        <div>
          <dt>On ward</dt>
          <dd>{patients.length}</dd>
        </div>
        <div>
          <dt>Flagged</dt>
          <dd>{flaggedCount}</dd>
        </div>
      </dl>
    </section>
  );
}
