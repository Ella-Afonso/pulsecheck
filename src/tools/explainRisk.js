import { getActiveAlert } from "../logic/activeAlert";
import { describePatientRisk } from "../logic/provenance";
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

function hasValidPatientId(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= 64
  );
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
    untrustedContentHint: true,
  },
  async execute({ patient_id: patientId } = {}) {
    if (!hasValidPatientId(patientId)) {
      return toolResult({ error: "unknown_patient", patient_id: null });
    }

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
    const activeAlert = getActiveAlert(patient);

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
      rationale: describePatientRisk(patient, trend),
      ...(activeAlert
        ? { active_alert: { alert_id: activeAlert.alertId } }
        : {}),
    });
  },
};
