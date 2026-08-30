import { ProvenanceChip } from "./ProvenanceChip";

function formatPriority(priority) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function targetLabel(proposal, patient) {
  if (proposal.tool === "propose_triage_order") {
    return "Six-patient ward queue";
  }

  return patient ? `${patient.bed} · ${patient.name}` : "Patient unavailable";
}

function ProposalDetails({ proposal }) {
  const { payload } = proposal;

  switch (proposal.tool) {
    case "flag_patient":
      return (
        <div className="proposal-card__detail">
          <span>Agent rationale</span>
          <p>{payload.reason}</p>
        </div>
      );
    case "annotate_patient":
      return (
        <div className="proposal-card__detail">
          <span>Agent note</span>
          <p>{payload.note}</p>
          {payload.reason ? (
            <>
              <span>Agent rationale</span>
              <p>{payload.reason}</p>
            </>
          ) : null}
        </div>
      );
    case "acknowledge_alert":
      return payload.note ? (
        <div className="proposal-card__detail">
          <span>Acknowledgement note</span>
          <p>{payload.note}</p>
        </div>
      ) : null;
    case "propose_triage_order":
      return (
        <div className="proposal-card__detail">
          <span>Proposed order</span>
          <p>{payload.patientIds.length} patients in the current ward queue</p>
          <span>Agent rationale</span>
          <p>{payload.reason}</p>
        </div>
      );
    default:
      return null;
  }
}

export function ProposalCard({ proposal, approvalError, patient, onApprove, onReject }) {
  const patientLabel = targetLabel(proposal, patient);

  return (
    <article className="proposal-card">
      <header className="proposal-card__header">
        <p className="proposal-card__eyebrow">Agent proposal</p>
        {proposal.priority ? (
          <p className="proposal-card__priority">{formatPriority(proposal.priority)}</p>
        ) : null}
      </header>

      <h3>{proposal.summary}</h3>
      <p className="proposal-card__patient">{patientLabel}</p>
      <ProposalDetails proposal={proposal} />
      <ProvenanceChip reason={proposal.provenanceReason} />
      {approvalError ? (
        <p className="proposal-card__error" role="alert">
          {approvalError}
        </p>
      ) : null}

      <div className="proposal-card__actions">
        <button
          className="proposal-card__approve"
          type="button"
          onClick={() => onApprove(proposal.id)}
        >
          Approve
        </button>
        <button
          className="proposal-card__reject"
          type="button"
          onClick={() => onReject(proposal.id)}
        >
          Reject
        </button>
      </div>
    </article>
  );
}
