import { create } from "zustand";
import alertThresholds from "../data/map_alert_thresholds.json";
import vitalsRecords from "../data/bulk_vitals.json";
import { driftPatient } from "../data/drift";
import { normalizeWardPatients } from "../data/normalize";
import { getActiveAlert } from "../logic/activeAlert";
import { applyProposal } from "../logic/applyProposal";
import {
  applyManualTriageOrder,
  scoreAndRankPatients,
} from "../logic/riskScore";
import {
  createPatientProvenance,
  createTriageProvenance,
} from "../logic/provenance";

const initialPatients = scoreAndRankPatients(
  normalizeWardPatients(vitalsRecords, {
    ward: "ICU",
    limit: 6,
  }),
  alertThresholds,
);

const FLAG_PRIORITIES = new Set(["watch", "urgent", "critical"]);
const MAX_REASON_LENGTH = 280;
const MAX_NOTE_LENGTH = 280;
const MAX_HANDOFF_LENGTH = 6_000;
const ALERT_ID_PATTERN = /^alert:[A-Za-z0-9-]{1,64}:(hr|spo2|resp|temp|systolicBp|diastolicBp):(warning|high|critical)$/;

function createId(prefix) {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeText(value, maximumLength) {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maximumLength
    ? normalized
    : null;
}

function normalizeHandoffContent(value) {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  return normalized.length <= MAX_HANDOFF_LENGTH ? normalized : null;
}

function findPatient(patients, patientId) {
  return patients.find((patient) => patient.patient_id === patientId);
}

function hasCompleteLiveWardOrder(patients, patientIds) {
  if (
    !Array.isArray(patientIds) ||
    patients.length !== 6 ||
    patientIds.length !== 6 ||
    new Set(patientIds).size !== 6 ||
    patientIds.some((patientId) => !normalizeText(patientId, 64))
  ) {
    return false;
  }

  const livePatientIds = new Set(patients.map((patient) => patient.patient_id));
  return livePatientIds.size === 6 && patientIds.every((id) => livePatientIds.has(id));
}

function createBaseProposal({
  tool,
  patientId = null,
  payload,
  summary,
  priority,
  provenance,
  createdAt,
}) {
  const provenanceReason = normalizeText(
    provenance?.evidence,
    MAX_REASON_LENGTH,
  );

  if (!provenanceReason) return null;

  return {
    id: createId("proposal"),
    tool,
    patient_id: patientId,
    payload,
    summary,
    ...(priority ? { priority } : {}),
    provenance,
    provenanceReason,
    status: "pending",
    createdAt,
  };
}

function createPatientProposal(input, patients, createdAt, type) {
  const patientId = normalizeText(input?.patient_id, 64);

  if (!patientId) return { ok: false, code: "invalid_proposal" };

  const patient = findPatient(patients, patientId);

  if (!patient) return { ok: false, code: "unknown_patient" };

  const provenance = createPatientProvenance(patient, createdAt);

  if (type === "flag") {
    const reason = normalizeText(input?.reason, MAX_REASON_LENGTH);
    const priority = input?.priority;

    if (!reason || !FLAG_PRIORITIES.has(priority)) {
      return { ok: false, code: "invalid_proposal" };
    }

    const proposal = createBaseProposal({
      tool: "flag_patient",
      patientId,
      payload: { reason, priority },
      summary: `Flag for ${priority} nurse review`,
      priority,
      provenance,
      createdAt,
    });

    return proposal
      ? { ok: true, proposal }
      : { ok: false, code: "invalid_proposal" };
  }

  if (type === "annotation") {
    const note = normalizeText(input?.note, MAX_NOTE_LENGTH);
    const reason =
      input?.reason === undefined
        ? null
        : normalizeText(input.reason, MAX_REASON_LENGTH);

    if (!note || (input?.reason !== undefined && !reason)) {
      return { ok: false, code: "invalid_proposal" };
    }

    const proposal = createBaseProposal({
      tool: "annotate_patient",
      patientId,
      payload: { note, reason },
      summary: "Add an agent note",
      provenance,
      createdAt,
    });

    return proposal
      ? { ok: true, proposal }
      : { ok: false, code: "invalid_proposal" };
  }

  const alertId = normalizeText(input?.alert_id, 96);
  const note = input?.note === undefined ? null : normalizeText(input.note, MAX_REASON_LENGTH);

  if (!alertId || !ALERT_ID_PATTERN.test(alertId) || input?.note !== undefined && !note) {
    return { ok: false, code: "invalid_proposal" };
  }

  if (getActiveAlert(patient)?.alertId !== alertId) {
    return { ok: false, code: "unknown_alert" };
  }

  if (patient.workflow?.acknowledgements?.[alertId]) {
    return { ok: false, code: "already_acknowledged" };
  }

  const proposal = createBaseProposal({
    tool: "acknowledge_alert",
    patientId,
    payload: { alertId, note },
    summary: "Acknowledge active alert",
    provenance,
    createdAt,
  });

  return proposal
    ? { ok: true, proposal }
    : { ok: false, code: "invalid_proposal" };
}

function createTriageProposal(input, patients, createdAt) {
  const patientIds = input?.ordered_patient_ids;
  const reason = normalizeText(input?.rationale, MAX_REASON_LENGTH);

  if (!reason || !hasCompleteLiveWardOrder(patients, patientIds)) {
    return { ok: false, code: "invalid_triage_order" };
  }

  const proposal = createBaseProposal({
    tool: "propose_triage_order",
    payload: { patientIds: [...patientIds], reason },
    summary: "Apply a manual ward triage order",
    provenance: createTriageProvenance(patients, createdAt),
    createdAt,
  });

  return proposal
    ? { ok: true, proposal }
    : { ok: false, code: "invalid_proposal" };
}

function createPendingProposal(input, patients) {
  const createdAt = new Date().toISOString();

  switch (input?.tool) {
    case "flag_patient":
      return createPatientProposal(input, patients, createdAt, "flag");
    case "annotate_patient":
      return createPatientProposal(input, patients, createdAt, "annotation");
    case "acknowledge_alert":
      return createPatientProposal(input, patients, createdAt, "acknowledgement");
    case "propose_triage_order":
      return createTriageProposal(input, patients, createdAt);
    default:
      return { ok: false, code: "invalid_proposal" };
  }
}

function createAuditEntry({ actor, action, proposal, detail }) {
  return {
    id: createId("audit"),
    actor,
    action,
    proposal_id: proposal.id,
    tool: proposal.tool,
    ...(proposal.patient_id ? { patient_id: proposal.patient_id } : {}),
    detail,
    at: new Date().toISOString(),
  };
}

function createHandoffAuditEntry({ actor, action, detail }) {
  return {
    id: createId("audit"),
    actor,
    action,
    proposal_id: null,
    tool: "draft_handoff_summary",
    detail,
    at: new Date().toISOString(),
  };
}

function auditDetail(proposal, decision) {
  if (decision === "proposed") {
    return proposal.provenanceReason;
  }

  const subject = {
    flag_patient: "patient flag",
    annotate_patient: "patient note",
    acknowledge_alert: "alert acknowledgement",
    propose_triage_order: "manual triage order",
  }[proposal.tool];

  return `Nurse ${decision} the ${subject}.`;
}

function approvalErrorMessage(code) {
  const messages = {
    unknown_patient: "This patient is no longer available. The proposal remains pending.",
    stale_alert: "This alert is no longer active. The proposal remains pending.",
    already_acknowledged:
      "This alert has already been acknowledged. The proposal remains pending.",
    invalid_triage_order:
      "The live ward order changed. The proposal remains pending.",
    invalid_proposal: "This proposal is no longer valid. The proposal remains pending.",
  };

  return messages[code] ?? "This proposal is no longer valid. The proposal remains pending.";
}

function withoutProposalError(proposalErrors, proposalId) {
  return Object.fromEntries(
    Object.entries(proposalErrors).filter(([id]) => id !== proposalId),
  );
}

function clearInactiveAcknowledgements(patient) {
  const acknowledgements = patient.workflow?.acknowledgements;

  if (!acknowledgements || Object.keys(acknowledgements).length === 0) {
    return patient;
  }

  const activeAlert = getActiveAlert(patient);
  const activeAcknowledgement = activeAlert
    ? acknowledgements[activeAlert.alertId]
    : null;

  const nextAcknowledgements = activeAcknowledgement
    ? { [activeAlert.alertId]: activeAcknowledgement }
    : {};

  if (
    Object.keys(acknowledgements).length === Object.keys(nextAcknowledgements).length &&
    (!activeAlert || acknowledgements[activeAlert.alertId] === activeAcknowledgement)
  ) {
    return patient;
  }

  return {
    ...patient,
    workflow: {
      ...patient.workflow,
      acknowledgements: nextAcknowledgements,
    },
  };
}

export const useWardStore = create((set, get) => ({
  patients: initialPatients,
  thresholds: alertThresholds,
  triageOrderOverride: null,
  handoffDraft: {
    content: "",
    authoredBy: null,
    lastEditedBy: null,
    updatedAt: null,
  },
  pendingProposals: [],
  proposalErrors: {},
  auditLog: [],
  addProposal: (input) => {
    const result = createPendingProposal(input, get().patients);

    if (!result.ok) {
      return { ok: false, code: result.code };
    }

    const { proposal } = result;

    set((state) => ({
      pendingProposals: [...state.pendingProposals, proposal],
      auditLog: [
        ...state.auditLog,
        createAuditEntry({
          actor: "agent",
          action: "proposed",
          proposal,
          detail: auditDetail(proposal, "proposed"),
        }),
      ],
    }));

    return { ok: true, proposalId: proposal.id };
  },
  draftHandoffSummary: (content) => {
    const normalizedContent = normalizeHandoffContent(content);

    if (normalizedContent === null) {
      return { ok: false, code: "invalid_handoff" };
    }

    const updatedAt = new Date().toISOString();

    set((state) => ({
      handoffDraft: {
        content: normalizedContent,
        authoredBy: "agent",
        lastEditedBy: "agent",
        updatedAt,
      },
      auditLog: [
        ...state.auditLog,
        createHandoffAuditEntry({
          actor: "agent",
          action: "drafted",
          detail: "Drafted the shared shift handoff from the current ward state.",
        }),
      ],
    }));

    return { ok: true, updatedAt };
  },
  saveNurseHandoffDraft: (content) => {
    const normalizedContent = normalizeHandoffContent(content);

    if (normalizedContent === null) {
      return { ok: false, code: "invalid_handoff" };
    }

    const currentDraft = get().handoffDraft;

    if (normalizedContent === currentDraft.content) {
      return { ok: true, unchanged: true, updatedAt: currentDraft.updatedAt };
    }

    const updatedAt = new Date().toISOString();
    const authoredBy =
      currentDraft.authoredBy === "agent" || currentDraft.authoredBy === "co"
        ? "co"
        : "nurse";

    set((state) => ({
      handoffDraft: {
        content: normalizedContent,
        authoredBy,
        lastEditedBy: "nurse",
        updatedAt,
      },
      auditLog: [
        ...state.auditLog,
        createHandoffAuditEntry({
          actor: "nurse",
          action: "edited",
          detail: "Saved an edit to the shared shift handoff.",
        }),
      ],
    }));

    return { ok: true, updatedAt };
  },
  approveProposal: (proposalId) => {
    const proposal = get().pendingProposals.find(
      (candidate) => candidate.id === proposalId,
    );

    if (!proposal) {
      return { ok: false, code: "unknown_proposal" };
    }

    const result = applyProposal(
      get().patients,
      proposal,
      new Date().toISOString(),
    );

    if (!result.ok) {
      set((state) => ({
        proposalErrors: {
          ...state.proposalErrors,
          [proposal.id]: approvalErrorMessage(result.code),
        },
      }));

      return result;
    }

    set((state) => ({
      patients: result.patients,
      ...(Object.hasOwn(result, "triageOrderOverride")
        ? { triageOrderOverride: result.triageOrderOverride }
        : {}),
      pendingProposals: state.pendingProposals.filter(
        (candidate) => candidate.id !== proposal.id,
      ),
      proposalErrors: withoutProposalError(state.proposalErrors, proposal.id),
      auditLog: [
        ...state.auditLog,
        createAuditEntry({
          actor: "nurse",
          action: "approved",
          proposal,
          detail: auditDetail(proposal, "approved"),
        }),
      ],
    }));

    return { ok: true, committed: result.committed };
  },
  rejectProposal: (proposalId) => {
    const proposal = get().pendingProposals.find(
      (candidate) => candidate.id === proposalId,
    );

    if (!proposal) {
      return { ok: false, code: "unknown_proposal" };
    }

    set((state) => ({
      pendingProposals: state.pendingProposals.filter(
        (candidate) => candidate.id !== proposal.id,
      ),
      proposalErrors: withoutProposalError(state.proposalErrors, proposal.id),
      auditLog: [
        ...state.auditLog,
        createAuditEntry({
          actor: "nurse",
          action: "rejected",
          proposal,
          detail: auditDetail(proposal, "rejected"),
        }),
      ],
    }));

    return { ok: true };
  },
  tick: () => {
    const timestamp = new Date().toISOString();

    set((state) => {
      const riskRankedPatients = scoreAndRankPatients(
        state.patients.map((patient) => driftPatient(patient, timestamp)),
        state.thresholds,
      ).map(clearInactiveAcknowledgements);

      return {
        patients: applyManualTriageOrder(
          riskRankedPatients,
          state.triageOrderOverride,
        ),
      };
    });
  },
}));
