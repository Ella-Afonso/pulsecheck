# Wardround

Wardround is a simulated ICU shift-handoff and triage co-pilot built with React and WebMCP. A nurse and an agent work the same live patient board: the agent can read scoped clinical context, propose workflow changes for nurse approval, and prepare a shared handoff draft.

## Local development

```bash
npm install
npm run dev
```

Run the production checks with:

```bash
npm run lint
npm run build
```

## WebMCP tools

- Read: `list_patients_by_risk`, `explain_risk`
- Nurse-approved proposals: `flag_patient`, `annotate_patient`, `acknowledge_alert`, `propose_triage_order`
- Shared document: `draft_handoff_summary`

## Security & trust

- Wardround uses synthetic demo data only. It is not for clinical use.
- Tools register on `document.modelContext` and read the live client-side Zustand state at execution time; there is no backend or database.
- Read tools return scoped data only and use both `readOnlyHint` and `untrustedContentHint`. Tool descriptions are static and never include agent or user-supplied text.
- Every clinical patient-workflow change is created as a pending proposal with clinical provenance and takes effect only after a nurse approves it. Alert acknowledgement is never autonomous.
- `draft_handoff_summary` is the narrow shared-document exception: it updates only the auditable handoff draft, never patients, proposals, triage order, or clinical workflow state. A nurse can edit and save that draft inline.
