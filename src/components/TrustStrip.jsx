const TRUST_ITEMS = [
  ["Live clinical risk", "Scores continue to update with the ward feed."],
  ["Visible agent reasoning", "Every proposal carries its clinical provenance."],
  ["Nurse-approved actions", "No patient workflow change commits alone."],
  ["One audit trail", "Proposals and decisions remain traceable."],
];

export function TrustStrip() {
  return (
    <section className="trust-strip" aria-label="Wardround safeguards">
      <ul className="trust-strip__list">
        {TRUST_ITEMS.map(([label, detail]) => (
          <li className="trust-strip__item" key={label}>
            <strong>{label}</strong>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
