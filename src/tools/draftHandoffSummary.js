import { composeHandoff } from "../logic/composeHandoff";
import { useWardStore } from "../state/useWardStore";
import { toolResult } from "./toolResult";

function normalizedString(value, maximumLength) {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maximumLength
    ? normalized
    : null;
}

function resolvePatients(patients, ward, focusPatientIds) {
  const wardPatients = ward
    ? patients.filter(
        (patient) => patient.ward.toLocaleLowerCase() === ward.toLocaleLowerCase(),
      )
    : patients;

  if (ward && wardPatients.length === 0) {
    return { ok: false, code: "unknown_ward" };
  }

  if (!Array.isArray(focusPatientIds)) {
    return wardPatients.length > 0
      ? { ok: true, patients: wardPatients }
      : { ok: false, code: "no_patients" };
  }

  if (
    focusPatientIds.length === 0 ||
    focusPatientIds.length > 6 ||
    new Set(focusPatientIds).size !== focusPatientIds.length ||
    focusPatientIds.some((patientId) => !normalizedString(patientId, 64))
  ) {
    return { ok: false, code: "invalid_focus_patient_ids" };
  }

  const byId = new Map(
    wardPatients.map((patient) => [patient.patient_id, patient]),
  );
  const selectedPatients = focusPatientIds.map((patientId) => byId.get(patientId));

  return selectedPatients.every(Boolean)
    ? { ok: true, patients: selectedPatients }
    : { ok: false, code: "unknown_patient" };
}

export const draftHandoffSummary = {
  name: "draft_handoff_summary",
  description:
    "Draft a concise shared ward handoff from current clinical risk and workflow state.",
  inputSchema: {
    type: "object",
    properties: {
      ward: { type: "string", minLength: 1, maxLength: 64 },
      focus_patient_ids: {
        type: "array",
        minItems: 1,
        maxItems: 6,
        uniqueItems: true,
        items: { type: "string", minLength: 1, maxLength: 64 },
      },
    },
    additionalProperties: false,
  },
  async execute({ ward, focus_patient_ids: focusPatientIds } = {}) {
    const normalizedWard = ward === undefined ? null : normalizedString(ward, 64);

    if (ward !== undefined && !normalizedWard) {
      return toolResult({ status: "not_created", error: "invalid_ward" });
    }

    const state = useWardStore.getState();
    const selection = resolvePatients(
      state.patients,
      normalizedWard,
      focusPatientIds,
    );

    if (!selection.ok) {
      return toolResult({ status: "not_created", error: selection.code });
    }

    const result = state.draftHandoffSummary(
      composeHandoff({
        patients: selection.patients,
        pendingProposals: state.pendingProposals,
      }),
    );

    if (!result.ok) {
      return toolResult({ status: "not_created", error: result.code });
    }

    return toolResult({ status: "draft_updated", updated_at: result.updatedAt });
  },
};
