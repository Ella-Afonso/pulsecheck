import { useWardStore } from "../state/useWardStore";
import { PatientCard } from "./PatientCard";

export function PatientBoard() {
  const patients = useWardStore((state) => state.patients);
  const triageOrderOverride = useWardStore((state) => state.triageOrderOverride);

  return (
    <section className="patient-board" aria-labelledby="patient-board-title">
      <header className="patient-board__header">
        <div>
          <p className="patient-board__eyebrow">ICU · live ward queue</p>
          <h1 id="patient-board-title">Patients by risk</h1>
        </div>
        <div className="patient-board__signals">
          {triageOrderOverride ? (
            <p className="patient-board__override" role="status">
              Nurse-approved triage order
            </p>
          ) : null}
          <p className="patient-board__live" aria-label="Live feed updates every four seconds">
            <span aria-hidden="true" /> Live · 4s
          </p>
        </div>
      </header>

      <div className="patient-board__list">
        {patients.map((patient) => (
          <PatientCard key={patient.patient_id} patient={patient} />
        ))}
      </div>
    </section>
  );
}
