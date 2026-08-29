import { SeverityBadge } from "./SeverityBadge";

function isConcernFor(topConcern, vitalKeys) {
  return vitalKeys.includes(topConcern?.vitalKey);
}

function formatTemperature(value) {
  return `${Number(value).toFixed(1)}°C`;
}

function concernText(topConcern) {
  if (!topConcern) return "No active threshold concern";

  if (topConcern.kind === "data_quality") {
    return `${topConcern.label} is unavailable`;
  }

  return `${topConcern.label} ${topConcern.value}${topConcern.unit} is ${topConcern.direction}`;
}

export function PatientCard({ patient }) {
  const { vitals, topConcern } = patient;
  const severity = patient.severity ?? 1;

  return (
    <article className={`patient-card patient-card--severity-${severity}`}>
      <div className="patient-card__header">
        <div>
          <p className="patient-card__eyebrow">
            {patient.bed} · {patient.ward}
          </p>
          <h2>{patient.name}</h2>
        </div>
        <SeverityBadge severity={severity} />
      </div>

      <div className="patient-card__vitals" aria-label={`${patient.name} vitals`}>
        <div
          className={`patient-card__vital ${
            isConcernFor(topConcern, ["hr"]) ? "patient-card__vital--concern" : ""
          }`}
        >
          <span>HR</span>
          <strong>{vitals.hr}</strong>
        </div>
        <div
          className={`patient-card__vital ${
            isConcernFor(topConcern, ["spo2"])
              ? "patient-card__vital--concern"
              : ""
          }`}
        >
          <span>SpO2</span>
          <strong>{vitals.spo2}%</strong>
        </div>
        <div
          className={`patient-card__vital ${
            isConcernFor(topConcern, ["resp"])
              ? "patient-card__vital--concern"
              : ""
          }`}
        >
          <span>Resp</span>
          <strong>{vitals.resp}</strong>
        </div>
        <div
          className={`patient-card__vital ${
            isConcernFor(topConcern, ["temp"])
              ? "patient-card__vital--concern"
              : ""
          }`}
        >
          <span>Temp</span>
          <strong>{formatTemperature(vitals.temp)}</strong>
        </div>
        <div
          className={`patient-card__vital patient-card__vital--bp ${
            isConcernFor(topConcern, ["systolicBp", "diastolicBp"])
              ? "patient-card__vital--concern"
              : ""
          }`}
        >
          <span>BP</span>
          <strong>
            {vitals.bp.systolic}/{vitals.bp.diastolic}
          </strong>
        </div>
      </div>

      <div className="patient-card__risk-row">
        <p className="patient-card__concern">{concernText(topConcern)}</p>
        <p className="patient-card__score" aria-label={`Risk score ${patient.riskScore}`}>
          Risk {patient.riskScore}
        </p>
      </div>
    </article>
  );
}
