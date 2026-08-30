const FLAG_PRIORITIES = new Set(["watch", "urgent", "critical"]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isFlagProposal(proposal) {
  return (
    proposal?.status === "pending" &&
    proposal.tool === "flag_patient" &&
    isNonEmptyString(proposal.patient_id) &&
    isNonEmptyString(proposal.summary) &&
    isNonEmptyString(proposal.provenanceReason) &&
    isNonEmptyString(proposal.reason) &&
    FLAG_PRIORITIES.has(proposal.priority) &&
    (proposal.origin === "agent" || proposal.origin === "demo") &&
    isNonEmptyString(proposal.id) &&
    isNonEmptyString(proposal.createdAt)
  );
}

/**
 * Applies one nurse-approved proposal without reading time or mutating inputs.
 * The returned patients array is the only patient-state output the store may use.
 */
export function applyProposal(patients, proposal, approvedAt) {
  if (!Array.isArray(patients)) {
    return { ok: false, code: "invalid_proposal", patients };
  }

  switch (proposal?.tool) {
    case "flag_patient":
      return applyFlagProposal(patients, proposal, approvedAt);
    case "annotate_patient":
    case "acknowledge_alert":
    case "propose_triage_order":
      return { ok: false, code: "unsupported_proposal", patients };
    default:
      return { ok: false, code: "invalid_proposal", patients };
  }
}

function applyFlagProposal(patients, proposal, approvedAt) {
  if (!isFlagProposal(proposal) || !isNonEmptyString(approvedAt)) {
    return {
      ok: false,
      code: "invalid_proposal",
      patients,
    };
  }

  const patient = patients.find(
    (candidate) => candidate.patient_id === proposal.patient_id,
  );

  if (!patient) {
    return {
      ok: false,
      code: "unknown_patient",
      patients,
    };
  }

  return {
    ok: true,
    patients: patients.map((candidate) => {
      if (candidate.patient_id !== proposal.patient_id) return candidate;

      return {
        ...candidate,
        workflow: {
          ...candidate.workflow,
          flag: {
            proposalId: proposal.id,
            priority: proposal.priority,
            reason: proposal.reason,
            provenanceReason: proposal.provenanceReason,
            createdAt: proposal.createdAt,
            approvedAt,
            origin: proposal.origin,
          },
        },
      };
    }),
    committed: {
      patient_id: proposal.patient_id,
      kind: "patient_flag",
    },
  };
}
