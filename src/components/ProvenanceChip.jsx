export function ProvenanceChip({ reason }) {
  return (
    <p className="provenance-chip">
      <span>Because</span>
      {reason}
    </p>
  );
}
