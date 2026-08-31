# Wardround — demo recording script

A timestamped, click-by-click script for a sub-three-minute recording. It uses the deterministic recording mode (`?demo=1`), which drives the seeded ICU patient **Freya Reed (bed ICU-115)** into Critical through the normal scoring pipeline in ~16 seconds.

**Before recording**
- Open **https://pulsecheck.pages.dev/?demo=1** in ChatGPT's in-app browser.
- Have the three prompts ready to paste.
- Start on the **Board** tab.

Total target runtime: **~2:50**.

---

### 0:00 – 0:12 · Open on the shared board
- **Screen:** Board tab, six ICU cards live-updating.
- **Do:** Point the cursor at bed **ICU-115 (Freya Reed)**.
- **Narrator:** "This is Wardround. A nurse and an AI agent work the same live ICU board. Bed ICU-115 is deteriorating — watch her risk climb."

### 0:12 – 0:35 · Agent reads the board
- **Type in ChatGPT:** "List the ICU patients by clinical risk and tell me who is most critical."
- **Expected proof:** The agent calls `list_patients_by_risk` and replies with a scoped risk-ranked list. On the Board, ICU-115's SpO2 is falling each tick (99 → 95 → 91 → 87 → 83).
- **Narrator:** "The agent doesn't scrape the screen. It calls a scoped WebMCP tool and gets structured risk order."

### 0:35 – 0:55 · Deterioration reaches Critical
- **Screen:** ICU-115's card crosses into **Critical** (severity 5) and rises toward the top of the board.
- **Do:** Let the card settle at Critical; hover the risk badge.
- **Narrator:** "Around the fifteen-second mark she tips into Critical — same thresholds, same scoring the nurse trusts."

### 0:55 – 1:30 · Agent explains, then proposes — and stops
- **Type in ChatGPT:** "Explain why bed ICU-115 is high risk, then propose flagging that patient for urgent review."
- **Expected proof:** The agent calls `explain_risk` (citing the downward SpO2 trend), then calls `flag_patient`. A **pending proposal** appears in the Approvals rail with a provenance reason. **The agent stops here — it cannot commit.**
- **Narrator:** "The agent proposes with its reasoning attached. It cannot change the patient. It hands control to the nurse."

### 1:30 – 2:00 · Nurse approves in Wardround
- **Do:** Click the **Approvals** tab. Read the provenance chip. Click **Approve**.
- **Expected proof:** The commit-ring animation fires on ICU-115's card; the flag is applied.
- **Do:** Click the **Activity** tab.
- **Expected proof:** Two audit entries — agent *proposed*, nurse *approved*.
- **Narrator:** "The nurse approves. Now — and only now — the board changes, and every step is in the audit log."

### 2:00 – 2:35 · Shared handoff
- **Type in ChatGPT:** "Draft a shift handoff summary for the ICU ward."
- **Do:** Click the **Handoff** tab.
- **Expected proof:** An agent-authored draft appears with its marker. Edit one line inline and save.
- **Narrator:** "The agent drafts the handoff into a shared document. The nurse edits it — co-authored, auditable."

### 2:35 – 2:50 · Close
- **Screen:** Return to the Board with ICU-115 flagged and Critical.
- **Narrator:** "One shared surface. Every agent write proposed with provenance, gated by human approval. That's Wardround."

---

### Notes for the operator
- Tabs referenced, in order clicked: **Board → Approvals → Activity → Handoff → Board**.
- If a proposal times out visually, it remains pending; simply approve it from the Approvals tab.
- The Approvals rail is also visible from the Board and Activity views, so a pending proposal is never hidden.
