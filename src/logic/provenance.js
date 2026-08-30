import { deriveTopConcernTrend } from "./trend";

function serializeTopConcern(topConcern) {
  if (!topConcern) return null;

  return {
    kind: topConcern.kind,
    vital_key: topConcern.vitalKey,
    label: topConcern.label,
    value: topConcern.value,
    unit: topConcern.unit,
    direction: topConcern.direction,
    band: topConcern.band,
  };
}

function formatValue(value, unit) {
  return `${value}${unit ? ` ${unit}` : ""}`;
}

export function describePatientRisk(patient, trend) {
  const { topConcern } = patient;

  if (!topConcern) {
    return `Current risk score is ${patient.riskScore} with no abnormal top concern.`;
  }

  if (topConcern.kind === "data_quality") {
    return `Top concern: ${topConcern.label} data is unavailable.`;
  }

  const currentValue = formatValue(topConcern.value, topConcern.unit);

  if (trend.state === "unavailable") {
    return `Top concern: ${topConcern.label} is ${topConcern.direction} at ${currentValue} (${topConcern.band}). A valid three-reading trend is unavailable.`;
  }

  const startValue = formatValue(trend.start_value, topConcern.unit);
  const latestValue = formatValue(trend.latest_value, topConcern.unit);
  const trendVerb =
    trend.state === "stable" ? "remained stable" : trend.state;

  return `Top concern: ${topConcern.label} is ${topConcern.direction} at ${currentValue} (${topConcern.band}) and ${trendVerb} from ${startValue} to ${latestValue} across the last three readings.`;
}

export function createPatientProvenance(patient, capturedAt) {
  const trend = deriveTopConcernTrend(
    patient.topConcern,
    patient.vitalsHistory,
  );
  const evidence = describePatientRisk(patient, trend);

  return {
    source: "live_risk_snapshot",
    capturedAt,
    risk: {
      score: patient.riskScore,
      severity: patient.severity,
      top_concern: serializeTopConcern(patient.topConcern),
    },
    trend,
    evidence,
  };
}

export function createTriageProvenance(patients, capturedAt) {
  return {
    source: "live_ward_risk_snapshot",
    capturedAt,
    risk: patients.map((patient) => ({
      patient_id: patient.patient_id,
      score: patient.riskScore,
      severity: patient.severity,
    })),
    evidence: "Proposed order was captured from the current six-patient live ward queue.",
  };
}
