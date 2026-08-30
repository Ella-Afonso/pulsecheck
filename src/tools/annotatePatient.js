import { useWardStore } from "../state/useWardStore";
import { toolResult } from "./toolResult";

export const annotatePatient = {
  name: "annotate_patient",
  description:
    "Propose adding an agent note to a patient. The note remains pending until a nurse approves it.",
  inputSchema: {
    type: "object",
    properties: {
      patient_id: { type: "string", minLength: 1, maxLength: 64 },
      note: { type: "string", minLength: 1, maxLength: 280 },
      reason: { type: "string", minLength: 1, maxLength: 280 },
    },
    required: ["patient_id", "note"],
    additionalProperties: false,
  },
  async execute({ patient_id: patientId, note, reason } = {}) {
    const result = useWardStore.getState().addProposal({
      tool: "annotate_patient",
      patient_id: patientId,
      note,
      reason,
    });

    if (!result.ok) {
      return toolResult({ status: "not_created", error: result.code });
    }

    return toolResult({
      status: "pending_approval",
      proposal_id: result.proposalId,
    });
  },
};
