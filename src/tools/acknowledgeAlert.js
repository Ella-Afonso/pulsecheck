import { useWardStore } from "../state/useWardStore";
import { toolResult } from "./toolResult";

export const acknowledgeAlert = {
  name: "acknowledge_alert",
  description:
    "Propose acknowledging a currently active clinical alert. The acknowledgement remains pending until a nurse approves it.",
  inputSchema: {
    type: "object",
    properties: {
      patient_id: { type: "string", minLength: 1, maxLength: 64 },
      alert_id: {
        type: "string",
        minLength: 1,
        maxLength: 96,
        pattern:
          "^alert:[A-Za-z0-9-]{1,64}:(hr|spo2|resp|temp|systolicBp|diastolicBp):(warning|high|critical)$",
      },
      note: { type: "string", minLength: 1, maxLength: 280 },
    },
    required: ["patient_id", "alert_id"],
    additionalProperties: false,
  },
  async execute({ patient_id: patientId, alert_id: alertId, note } = {}) {
    const result = useWardStore.getState().addProposal({
      tool: "acknowledge_alert",
      patient_id: patientId,
      alert_id: alertId,
      note,
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
