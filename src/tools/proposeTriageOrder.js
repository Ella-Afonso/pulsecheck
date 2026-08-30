import { useWardStore } from "../state/useWardStore";
import { toolResult } from "./toolResult";

export const proposeTriageOrder = {
  name: "propose_triage_order",
  description:
    "Propose a manual order for the current ward queue. The order takes effect only after a nurse approves it.",
  inputSchema: {
    type: "object",
    properties: {
      ordered_patient_ids: {
        type: "array",
        minItems: 6,
        maxItems: 6,
        uniqueItems: true,
        items: { type: "string", minLength: 1, maxLength: 64 },
      },
      rationale: { type: "string", minLength: 1, maxLength: 280 },
    },
    required: ["ordered_patient_ids", "rationale"],
    additionalProperties: false,
  },
  async execute({ ordered_patient_ids: patientIds, rationale } = {}) {
    const result = useWardStore.getState().addProposal({
      tool: "propose_triage_order",
      ordered_patient_ids: patientIds,
      rationale,
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
