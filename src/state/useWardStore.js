import { create } from "zustand";
import alertThresholds from "../data/map_alert_thresholds.json";
import vitalsRecords from "../data/bulk_vitals.json";
import { driftPatient } from "../data/drift";
import { normalizeWardPatients } from "../data/normalize";
import { applyProposal } from "../logic/applyProposal";
import { scoreAndRankPatients } from "../logic/riskScore";

const initialPatients = scoreAndRankPatients(
  normalizeWardPatients(vitalsRecords, {
    ward: "ICU",
    limit: 6,
  }),
  alertThresholds,
);

const FLAG_PRIORITIES = new Set(["watch", "urgent", "critical"]);
const MAX_SUMMARY_LENGTH = 140;
const MAX_REASON_LENGTH = 280;

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

function createPendingProposal(input) {
  const patientId = normalizeText(input?.patient_id, 64);
  const summary = normalizeText(input?.summary, MAX_SUMMARY_LENGTH);
  const provenanceReason = normalizeText(input?.provenanceReason, MAX_REASON_LENGTH);
  const reason = normalizeText(input?.reason, MAX_REASON_LENGTH);

  if (
    input?.tool !== "flag_patient" ||
    !patientId ||
    !summary ||
    !provenanceReason ||
    !reason ||
    !FLAG_PRIORITIES.has(input?.priority) ||
    !["agent", "demo"].includes(input?.origin)
  ) {
    return null;
  }

  return {
    id: createId("proposal"),
    tool: input.tool,
    patient_id: patientId,
    summary,
    provenanceReason,
    priority: input.priority,
    reason,
    status: "pending",
    createdAt: new Date().toISOString(),
    origin: input.origin,
  };
}

function createAuditEntry({ actor, action, proposal, detail }) {
  return {
    id: createId("audit"),
    actor,
    action,
    proposal_id: proposal.id,
    tool: proposal.tool,
    patient_id: proposal.patient_id,
    detail,
    at: new Date().toISOString(),
    ...(actor === "agent" ? { origin: proposal.origin } : {}),
  };
}

function auditDetail(proposal, decision) {
  const demoPrefix = proposal.origin === "demo" ? "Demo proposal — " : "";

  if (decision === "proposed") {
    return `${demoPrefix}${proposal.provenanceReason}`;
  }

  return `${demoPrefix}Nurse ${decision} ${proposal.summary.toLowerCase()}.`;
}

function approvalErrorMessage(code) {
  if (code === "unknown_patient") {
    return "This patient is no longer available. The proposal remains pending.";
  }

  if (code === "unsupported_proposal") {
    return "This proposal is not supported yet. The proposal remains pending.";
  }

  return "This proposal is no longer valid. The proposal remains pending.";
}

function withoutProposalError(proposalErrors, proposalId) {
  return Object.fromEntries(
    Object.entries(proposalErrors).filter(([id]) => id !== proposalId),
  );
}

export const useWardStore = create((set, get) => ({
  patients: initialPatients,
  thresholds: alertThresholds,
  pendingProposals: [],
  proposalErrors: {},
  auditLog: [],
  addProposal: (input) => {
    const proposal = createPendingProposal(input);

    if (!proposal) {
      return { ok: false, code: "invalid_proposal" };
    }

    const patientExists = get().patients.some(
      (patient) => patient.patient_id === proposal.patient_id,
    );

    if (!patientExists) {
      return { ok: false, code: "unknown_patient" };
    }

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
  queueDemoProposal: () => {
    const patient = get().patients[0];

    if (!patient) {
      return { ok: false, code: "no_patients" };
    }

    return get().addProposal({
      tool: "flag_patient",
      patient_id: patient.patient_id,
      summary: "Flag for urgent nurse review",
      provenanceReason:
        "Selected from the current highest-risk patient on the live ward queue.",
      priority: "urgent",
      reason: "Review for deterioration.",
      origin: "demo",
    });
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

    set((state) => ({
      patients: scoreAndRankPatients(
        state.patients.map((patient) => driftPatient(patient, timestamp)),
        state.thresholds,
      ),
    }));
  },
}));
