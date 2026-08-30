import { useWardStore } from "../state/useWardStore";
import { ProposalCard } from "./ProposalCard";

export function ApprovalsRail() {
  const pendingProposals = useWardStore((state) => state.pendingProposals);
  const proposalErrors = useWardStore((state) => state.proposalErrors);
  const patients = useWardStore((state) => state.patients);
  const queueDemoProposal = useWardStore((state) => state.queueDemoProposal);
  const approveProposal = useWardStore((state) => state.approveProposal);
  const rejectProposal = useWardStore((state) => state.rejectProposal);

  const pendingLabel = `${pendingProposals.length} pending proposal${
    pendingProposals.length === 1 ? "" : "s"
  }`;

  return (
    <section className="approvals-rail" aria-labelledby="approvals-title">
      <header className="approvals-rail__header">
        <div>
          <p className="approvals-rail__eyebrow">Human approval required</p>
          <h2 id="approvals-title">Approvals</h2>
        </div>
        <p className="approvals-rail__count" aria-live="polite">
          {pendingLabel}
        </p>
      </header>

      <button
        className="approvals-rail__demo"
        type="button"
        onClick={queueDemoProposal}
        disabled={patients.length === 0}
      >
        Add Demo proposal
      </button>

      <div className="approvals-rail__list">
        {pendingProposals.length === 0 ? (
          <p className="approvals-rail__empty">
            No pending proposals. Add a Demo proposal to preview the approval loop.
          </p>
        ) : (
          pendingProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              approvalError={proposalErrors[proposal.id]}
              patient={patients.find(
                (patient) => patient.patient_id === proposal.patient_id,
              )}
              onApprove={approveProposal}
              onReject={rejectProposal}
            />
          ))
        )}
      </div>
    </section>
  );
}
