import { deriveTopConcernTrend } from "../logic/trend";
import { useWardStore } from "../state/useWardStore";
import { toolResult } from "./toolResult";

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

function riskRationale(patient, trend) {
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

export const explainRisk = {
  name: "explain_risk",
  description:
    "Explain a current patient's computed risk using its top concern and the trend across its three most recent vital readings.",
  inputSchema: {
    type: "object",
    properties: {
      patient_id: {
        type: "string",
        minLength: 1,
        maxLength: 64,
      },
    },
    required: ["patient_id"],
    additionalProperties: false,
  },
  annotations: {
    readOnlyHint: true,
  },
  async execute({ patient_id: patientId }) {
    const { patients } = useWardStore.getState();
    const patient = patients.find((candidate) => candidate.patient_id === patientId);

    if (!patient) {
      return toolResult({
        error: "unknown_patient",
        patient_id: patientId,
      });
    }

    const trend = deriveTopConcernTrend(
      patient.topConcern,
      patient.vitalsHistory,
    );

    return toolResult({
      patient: {
        patient_id: patient.patient_id,
        bed: patient.bed,
        ward: patient.ward,
      },
      risk: {
        score: patient.riskScore,
        severity: patient.severity,
        top_concern: serializeTopConcern(patient.topConcern),
      },
      trend,
      rationale: riskRationale(patient, trend),
    });
  },
};
