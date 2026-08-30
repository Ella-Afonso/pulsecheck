import { getActiveAlert } from "./activeAlert";
import { applyManualTriageOrder } from "./riskScore";

const FLAG_PRIORITIES = new Set(["watch", "urgent", "critical"]);
const PROPOSAL_ORIGINS = new Set(["agent", "demo"]);

function isNonEmptyString(value, maximumLength) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    (maximumLength === undefined || value.length <= maximumLength)
  );
}

function hasValidBaseProposal(proposal) {
  return (
    proposal?.status === "pending" &&
    isNonEmptyString(proposal.id) &&
    isNonEmptyString(proposal.summary, 140) &&
    isNonEmptyString(proposal.provenanceReason, 280) &&
    isNonEmptyString(proposal.createdAt) &&
    PROPOSAL_ORIGINS.has(proposal.origin)
  );
}

function isFlagProposal(proposal) {
  return (
    hasValidBaseProposal(proposal) &&
    isNonEmptyString(proposal.patient_id, 64) &&
    proposal.tool === "flag_patient" &&
    isNonEmptyString(proposal.payload?.reason, 280) &&
    FLAG_PRIORITIES.has(proposal.payload?.priority)
  );
}

function isAnnotationProposal(proposal) {
  return (
    hasValidBaseProposal(proposal) &&
    proposal.origin === "agent" &&
    isNonEmptyString(proposal.patient_id, 64) &&
    proposal.tool === "annotate_patient" &&
    isNonEmptyString(proposal.payload?.note, 280) &&
    (proposal.payload?.reason === null ||
      proposal.payload?.reason === undefined ||
      isNonEmptyString(proposal.payload.reason, 280))
  );
}

function isAcknowledgementProposal(proposal) {
  const note = proposal?.payload?.note;

  return (
    hasValidBaseProposal(proposal) &&
    proposal.origin === "agent" &&
    isNonEmptyString(proposal.patient_id, 64) &&
    proposal.tool === "acknowledge_alert" &&
    isNonEmptyString(proposal.payload?.alertId, 96) &&
    (note === null || note === undefined || isNonEmptyString(note, 280))
  );
}

function hasCompleteLiveWardOrder(patients, patientIds) {
  if (
    !Array.isArray(patients) ||
    !Array.isArray(patientIds) ||
    patients.length !== 6 ||
    patientIds.length !== 6 ||
    new Set(patientIds).size !== 6
  ) {
    return false;
  }

  const liveIds = new Set(patients.map((patient) => patient.patient_id));
  return liveIds.size === 6 && patientIds.every((id) => liveIds.has(id));
}

function isTriageProposal(proposal, patients) {
  return (
    hasValidBaseProposal(proposal) &&
    proposal.origin === "agent" &&
    proposal.patient_id === null &&
    proposal.tool === "propose_triage_order" &&
    isNonEmptyString(proposal.payload?.reason, 280) &&
    hasCompleteLiveWardOrder(patients, proposal.payload?.patientIds)
  );
}

function findPatient(patients, patientId) {
  return patients.find((patient) => patient.patient_id === patientId);
}

function replacePatient(patients, patientId, update) {
  return patients.map((patient) =>
    patient.patient_id === patientId ? update(patient) : patient,
  );
}

function committedPatient(proposal, kind) {
  return {
    patient_id: proposal.patient_id,
    kind,
  };
}

/**
 * Applies one nurse-approved proposal without reading time or mutating inputs.
 * Triage proposals additionally return their approved override for the store.
 */
export function applyProposal(patients, proposal, approvedAt) {
  if (!Array.isArray(patients) || !isNonEmptyString(approvedAt)) {
    return { ok: false, code: "invalid_proposal", patients };
  }

  switch (proposal?.tool) {
    case "flag_patient":
      return applyFlagProposal(patients, proposal, approvedAt);
    case "annotate_patient":
      return applyAnnotationProposal(patients, proposal, approvedAt);
    case "acknowledge_alert":
      return applyAcknowledgementProposal(patients, proposal, approvedAt);
    case "propose_triage_order":
      return applyTriageProposal(patients, proposal, approvedAt);
    default:
      return { ok: false, code: "invalid_proposal", patients };
  }
}

function applyFlagProposal(patients, proposal, approvedAt) {
  if (!isFlagProposal(proposal)) {
    return { ok: false, code: "invalid_proposal", patients };
  }

  if (!findPatient(patients, proposal.patient_id)) {
    return { ok: false, code: "unknown_patient", patients };
  }

  return {
    ok: true,
    patients: replacePatient(patients, proposal.patient_id, (patient) => ({
      ...patient,
      workflow: {
        ...patient.workflow,
        flag: {
          proposalId: proposal.id,
          priority: proposal.payload.priority,
          reason: proposal.payload.reason,
          provenanceReason: proposal.provenanceReason,
          createdAt: proposal.createdAt,
          approvedAt,
          origin: proposal.origin,
        },
      },
    })),
    committed: committedPatient(proposal, "patient_flag"),
  };
}

function applyAnnotationProposal(patients, proposal, approvedAt) {
  if (!isAnnotationProposal(proposal)) {
    return { ok: false, code: "invalid_proposal", patients };
  }

  if (!findPatient(patients, proposal.patient_id)) {
    return { ok: false, code: "unknown_patient", patients };
  }

  return {
    ok: true,
    patients: replacePatient(patients, proposal.patient_id, (patient) => ({
      ...patient,
      workflow: {
        ...patient.workflow,
        notes: [
          ...(patient.workflow?.notes ?? []),
          {
            proposalId: proposal.id,
            note: proposal.payload.note,
            reason: proposal.payload.reason,
            provenanceReason: proposal.provenanceReason,
            createdAt: proposal.createdAt,
            approvedAt,
            origin: proposal.origin,
          },
        ],
      },
    })),
    committed: committedPatient(proposal, "patient_note"),
  };
}

function applyAcknowledgementProposal(patients, proposal, approvedAt) {
  if (!isAcknowledgementProposal(proposal)) {
    return { ok: false, code: "invalid_proposal", patients };
  }

  const patient = findPatient(patients, proposal.patient_id);

  if (!patient) {
    return { ok: false, code: "unknown_patient", patients };
  }

  const activeAlert = getActiveAlert(patient);

  if (activeAlert?.alertId !== proposal.payload.alertId) {
    return { ok: false, code: "stale_alert", patients };
  }

  if (patient.workflow?.acknowledgements?.[activeAlert.alertId]) {
    return { ok: false, code: "already_acknowledged", patients };
  }

  return {
    ok: true,
    patients: replacePatient(patients, proposal.patient_id, (candidate) => ({
      ...candidate,
      workflow: {
        ...candidate.workflow,
        acknowledgements: {
          ...candidate.workflow?.acknowledgements,
          [activeAlert.alertId]: {
            proposalId: proposal.id,
            alertId: activeAlert.alertId,
            note: proposal.payload.note ?? null,
            provenanceReason: proposal.provenanceReason,
            createdAt: proposal.createdAt,
            approvedAt,
            origin: proposal.origin,
          },
        },
      },
    })),
    committed: committedPatient(proposal, "alert_acknowledgement"),
  };
}

function applyTriageProposal(patients, proposal, approvedAt) {
  if (!isTriageProposal(proposal, patients)) {
    return { ok: false, code: "invalid_triage_order", patients };
  }

  const triageOrderOverride = {
    proposalId: proposal.id,
    patientIds: [...proposal.payload.patientIds],
    reason: proposal.payload.reason,
    provenanceReason: proposal.provenanceReason,
    createdAt: proposal.createdAt,
    approvedAt,
    origin: proposal.origin,
  };

  return {
    ok: true,
    patients: applyManualTriageOrder(patients, triageOrderOverride),
    triageOrderOverride,
    committed: {
      kind: "manual_triage_order",
      patient_count: triageOrderOverride.patientIds.length,
    },
  };
}
