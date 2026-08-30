import { comparePatientsByRisk } from "./riskScore";
import { deriveTopConcernTrend } from "./trend";

const PENDING_LABELS = {
  flag_patient: "patient flag",
  annotate_patient: "patient note",
  acknowledge_alert: "alert acknowledgement",
  propose_triage_order: "manual triage order",
};

function sentenceCase(value) {
  return typeof value === "string" && value.length > 0
    ? `${value.charAt(0).toUpperCase()}${value.slice(1)}`
    : null;
}

function formatVitalValue(value, unit) {
  if (!Number.isFinite(value)) return null;

  return unit ? `${value} ${unit}` : String(value);
}

function concernSummary(patient) {
  const concern = patient.topConcern;

  if (!concern) return "No active top concern";
  if (concern.kind === "data_quality") return "Data-quality concern requires review";

  const trend = deriveTopConcernTrend(concern, patient.vitalsHistory);
  const currentValue = formatVitalValue(concern.value, concern.unit);
  const startValue = formatVitalValue(trend.start_value, concern.unit);
  const latestValue = formatVitalValue(trend.latest_value, concern.unit);
  const trendText =
    trend.state === "unavailable"
      ? "trend unavailable"
      : startValue && latestValue
        ? `trend ${trend.state} (${startValue} to ${latestValue})`
        : `trend ${trend.state}`;

  return `${concern.label}: ${currentValue ?? "value unavailable"}; ${
    concern.direction
  } (${concern.band}); ${trendText}`;
}

function workflowSummary(patient, pendingProposals) {
  const workflow = patient.workflow ?? {};
  const details = [];

  if (workflow.flag) {
    details.push(`flag ${sentenceCase(workflow.flag.priority) ?? "active"}`);
  }

  const acknowledgements = Object.values(workflow.acknowledgements ?? {});
  if (acknowledgements.length > 0) {
    details.push("alert acknowledged");
  }

  const latestNote = workflow.notes?.at(-1);
  if (latestNote?.note) {
    details.push(`note: ${latestNote.note}`);
  }

  const pendingItems = pendingProposals
    .filter(
      (proposal) =>
        proposal.status === "pending" && proposal.patient_id === patient.patient_id,
    )
    .map((proposal) => PENDING_LABELS[proposal.tool])
    .filter(Boolean);

  if (pendingItems.length > 0) {
    details.push(`pending nurse approval: ${pendingItems.join(", ")}`);
  }

  return details.length > 0 ? details.join("; ") : "No active workflow items";
}

/**
 * Produces a deterministic, concise shared handoff from the supplied live state.
 * Inputs are not mutated; callers own ward and focus-patient validation.
 */
export function composeHandoff({ patients, pendingProposals = [] } = {}) {
  const riskOrderedPatients = Array.isArray(patients)
    ? [...patients].sort(comparePatientsByRisk)
    : [];
  const pending = Array.isArray(pendingProposals) ? pendingProposals : [];

  if (riskOrderedPatients.length === 0) {
    return "No patients available for handoff.";
  }

  const ward = riskOrderedPatients[0].ward ?? "Ward";
  const lines = [
    `${ward} shift handoff · ${riskOrderedPatients.length} patient${
      riskOrderedPatients.length === 1 ? "" : "s"
    } · highest clinical risk first`,
  ];

  riskOrderedPatients.forEach((patient, index) => {
    lines.push(
      `${index + 1}. ${patient.bed} · ${patient.name} — severity ${
        patient.severity
      }; risk ${patient.riskScore}; ${concernSummary(patient)}. Workflow: ${workflowSummary(
        patient,
        pending,
      )}.`,
    );
  });

  const wardPendingItems = pending
    .filter(
      (proposal) =>
        proposal.status === "pending" && proposal.patient_id === null,
    )
    .map((proposal) => PENDING_LABELS[proposal.tool])
    .filter(Boolean);

  if (wardPendingItems.length > 0) {
    lines.push(
      `Ward-level pending nurse approval: ${wardPendingItems.join(", ")}.`,
    );
  }

  return lines.join("\n");
}
