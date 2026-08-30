import { comparePatientsByRisk } from "../logic/riskScore";
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

function serializePatient(patient) {
  return {
    patient_id: patient.patient_id,
    bed: patient.bed,
    ward: patient.ward,
    severity: patient.severity,
    risk_score: patient.riskScore,
    top_concern: serializeTopConcern(patient.topConcern),
  };
}

function hasValidWard(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= 32
  );
}

function hasValidMinimumSeverity(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export const listPatientsByRisk = {
  name: "list_patients_by_risk",
  description:
    "List patients in descending clinical risk, independent of any nurse-approved manual board order, with optional ward and minimum-severity filters.",
  inputSchema: {
    type: "object",
    properties: {
      ward: {
        type: "string",
        minLength: 1,
        maxLength: 32,
      },
      min_severity: {
        type: "integer",
        minimum: 1,
        maximum: 5,
      },
    },
    additionalProperties: false,
  },
  annotations: {
    readOnlyHint: true,
    untrustedContentHint: true,
  },
  async execute({ ward, min_severity: minSeverity } = {}) {
    if (
      (ward !== undefined && !hasValidWard(ward)) ||
      (minSeverity !== undefined && !hasValidMinimumSeverity(minSeverity))
    ) {
      return toolResult({ error: "invalid_filters" });
    }

    const { patients } = useWardStore.getState();
    const normalizedWard = ward?.trim().toLowerCase();
    const scopedPatients = patients
      .filter(
        (patient) =>
          normalizedWard === undefined ||
          patient.ward.trim().toLowerCase() === normalizedWard,
      )
      .filter(
        (patient) =>
          minSeverity === undefined || patient.severity >= minSeverity,
      )
      .sort(comparePatientsByRisk)
      .map(serializePatient);

    return toolResult({ patients: scopedPatients });
  },
};
