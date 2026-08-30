import { ProvenanceChip } from "./ProvenanceChip";

function formatPriority(priority) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function ProposalCard({ proposal, approvalError, patient, onApprove, onReject }) {
  const proposalLabel = proposal.origin === "demo" ? "Demo proposal" : "Agent proposal";
  const patientLabel = patient
    ? `${patient.bed} · ${patient.name}`
    : `Patient ${proposal.patient_id}`;

  return (
    <article className="proposal-card">
      <header className="proposal-card__header">
        <p className="proposal-card__eyebrow">{proposalLabel}</p>
        <p className="proposal-card__priority">{formatPriority(proposal.priority)}</p>
      </header>

      <h3>{proposal.summary}</h3>
      <p className="proposal-card__patient">{patientLabel}</p>
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
