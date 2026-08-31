import { useEffect } from "react";
import { useWardStore } from "../state/useWardStore";
import { PatientCard } from "./PatientCard";

const COMMIT_MARKER_DURATION_MS = 1_200;

export function PatientBoard() {
  const patients = useWardStore((state) => state.patients);
  const triageOrderOverride = useWardStore((state) => state.triageOrderOverride);
  const lastCommittedId = useWardStore((state) => state.lastCommittedId);
  const clearLastCommittedId = useWardStore((state) => state.clearLastCommittedId);
  const boardHeading = triageOrderOverride
    ? "Nurse-approved triage order"
    : "Patients by risk";

  useEffect(() => {
    if (!lastCommittedId) return undefined;

    const committedId = lastCommittedId;
    const timeoutId = window.setTimeout(() => {
      clearLastCommittedId(committedId);
    }, COMMIT_MARKER_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [clearLastCommittedId, lastCommittedId]);

  return (
    <section className="patient-board" aria-labelledby="patient-board-title">
      <header className="patient-board__header">
        <div>
          <p className="patient-board__eyebrow">ICU · live ward queue</p>
          <h2 id="patient-board-title">{boardHeading}</h2>
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

      <div
        className="patient-board__list"
        tabIndex={0}
        role="group"
        aria-label="Patient list, scrollable"
      >
        {patients.map((patient) => (
          <PatientCard
            key={patient.patient_id}
            patient={patient}
            isRecentlyCommitted={patient.patient_id === lastCommittedId}
          />
        ))}
      </div>
    </section>
  );
}
