const SAFEGUARDS = [
  "No autonomous writes",
  "Provenance on every action",
  "Scoped data only",
];

export function Safeguards() {
  return (
    <section className="safeguards" aria-label="Wardround safeguards">
      <p className="safeguards__eyebrow">Safeguards</p>
      <ul className="safeguards__list">
        {SAFEGUARDS.map((item) => (
          <li className="safeguards__item" key={item}>
            <span className="safeguards__check" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
