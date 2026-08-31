# Wardround — Devpost submission

Paste-ready answers for the OpenAI WebMCP Challenge. Every claim below is supported by the repository.

## Inspiration

Agents today try to operate clinical software by scraping the DOM — brittle, opaque, and unsafe for patient data. Shift handoff and triage are exactly the high-cognitive-load moments where that fragility is dangerous. WebMCP flips the model: the app hands the agent structured, scoped tools instead of a screen to guess at. We wanted to show that pairing WebMCP with human approval and visible provenance turns the trust problem into the product's core feature.

## What it does

Wardround is a simulated ICU shift-handoff and triage co-pilot. A nurse and an AI agent work the same live patient board. The agent can read scoped clinical context (risk-ranked patients, a risk explanation), propose workflow changes (flag a patient, add a note, acknowledge an alert, reorder triage), and draft the shared shift handoff. Every proposed write lands in an Approvals rail with a provenance reason and takes effect only when the nurse approves it. Every proposal and decision is recorded in an audit log.

## How we built it

A client-side React single-page app with a single Zustand store as the one source of truth — no backend, no database. The seven WebMCP tools register once on mount via `document.modelContext.registerTool` inside a `useEffect` with `AbortController` cleanup; each tool's `execute` reads the live store snapshot at call time, so it never operates on stale data. A 4-second simulated vitals feed drifts each patient's vitals, and a scoring module ranks them against `map_alert_thresholds.json`. Tools contain no UI; they only validate inputs and call store actions. The visual layer reuses the PulseCheck design aesthetic (rose/plum palette, Playfair Display, glassmorphic cards).

## Challenges

Keeping the agent honest without making it useless: every write had to become a pending proposal, never a direct mutation, and `acknowledge_alert` had to be non-autonomous. Registering tools without the classic stale-closure bug meant reading state inside `execute` rather than closing over it. Building a bounded, internally scrolling dashboard that stays legible on a recording was fiddly. And for the demo we needed a patient to reach Critical reliably on camera — without touching the scoring rules — which we solved with a URL-gated deterministic vitals trajectory in the data layer alone.

## Accomplishments that we're proud of

Seven scoped WebMCP tools with tight schemas and no full-record dumps; a complete propose → approve → commit → audit loop with provenance on every action; a shared, editable handoff draft as a narrow auditable exception; and a live board that re-ranks as vitals drift — all client-side, with the agent as a visible co-actor rather than a chat sidebar.

## What we learned

The interesting design work in WebMCP is the tool contract: what to expose, how narrowly to scope returns, and how to keep descriptions static and injection-safe. We also learned that human-in-the-loop isn't a limitation to design around — framed as visible provenance plus approval, it becomes the most compelling part of the product.

## What's next

More wards and larger cohorts, configurable thresholds surfaced in the UI, richer trend explanations, and per-tool telemetry to study how nurses accept or reject agent proposals.

## WebMCP usage

Tools register on `document.modelContext` (never the deprecated `navigator.modelContext`). Seven tools, grouped by role:

- **Read (scoped, `readOnlyHint` + `untrustedContentHint`):** `list_patients_by_risk`, `explain_risk`
- **Proposal writes (pending proposal, nurse-approved):** `flag_patient`, `annotate_patient`, `acknowledge_alert`, `propose_triage_order`
- **Shared document:** `draft_handoff_summary`

Safety model: tight schemas with `additionalProperties: false`; static, injection-safe descriptions; read tools return scoped fields only; no autonomous writes; `acknowledge_alert` never autonomous; `draft_handoff_summary` writes only the auditable handoff draft.

## Synthetic-data / safety disclaimer

Wardround uses synthetic demo data only. It contains no real patients and is not for clinical use. It is a demonstration of WebMCP tool design and a human-in-the-loop approval model.
