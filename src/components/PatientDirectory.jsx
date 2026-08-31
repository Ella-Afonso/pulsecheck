import { useWardStore } from "../state/useWardStore";
import { SeverityBadge } from "./SeverityBadge";

function concernSummary(topConcern) {
  if (!topConcern) return "No active threshold concern";

  if (topConcern.kind === "data_quality") {
    return `${topConcern.label} unavailable`;
  }

  return `${topConcern.label} ${topConcern.value}${topConcern.unit} ${topConcern.direction}`;
}

export function PatientDirectory() {
  const patients = useWardStore((state) => state.patients);

  return (
    <section className="patient-directory" aria-labelledby="patient-directory-title">
      <header className="patient-directory__header">
        <div>
          <p className="patient-directory__eyebrow">ICU · patient directory</p>
          <h2 id="patient-directory-title">Patients</h2>
        </div>
        <p className="patient-directory__count">{patients.length} on ward</p>
      </header>

      <ul
        className="patient-directory__list"
        tabIndex={0}
        aria-label="Patient directory, scrollable"
      >
        {patients.map((patient) => {
          const flag = patient.workflow?.flag;

          return (
            <li className="patient-directory__row" key={patient.patient_id}>
              <div className="patient-directory__id">
                <span className="patient-directory__name">{patient.name}</span>
                <span className="patient-directory__bed">
                  {patient.bed} · {patient.ward}
                </span>
              </div>
              <div className="patient-directory__mid">
                <p className="patient-directory__concern">
                  {concernSummary(patient.topConcern)}
                </p>
                <p className="patient-directory__meta">
                  <span className="patient-directory__risk">
                    Risk {patient.riskScore}
                  </span>
                  {flag ? (
                    <span className="patient-directory__flag">Flagged</span>
                  ) : null}
                </p>
              </div>
              <SeverityBadge severity={patient.severity ?? 1} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
