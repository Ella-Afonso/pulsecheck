import { useWardStore } from "../state/useWardStore";
import { toolResult } from "./toolResult";

export const flagPatient = {
  name: "flag_patient",
  description:
    "Propose flagging a patient for nurse review. The flag remains pending until a nurse approves it.",
  inputSchema: {
    type: "object",
    properties: {
      patient_id: { type: "string", minLength: 1, maxLength: 64 },
      reason: { type: "string", minLength: 1, maxLength: 280 },
      priority: {
        type: "string",
        enum: ["watch", "urgent", "critical"],
      },
    },
    required: ["patient_id", "reason", "priority"],
    additionalProperties: false,
  },
  async execute({ patient_id: patientId, reason, priority } = {}) {
    const result = useWardStore.getState().addProposal({
      tool: "flag_patient",
      patient_id: patientId,
      reason,
      priority,
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
