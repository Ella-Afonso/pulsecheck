import { useState } from "react";
import { useWardStore } from "../state/useWardStore";
import { AgentAuthoredMarker } from "./AgentAuthoredMarker";

function formatUpdatedAt(value) {
  if (!value) return "No draft yet";

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function HandoffPane() {
  const handoffDraft = useWardStore((state) => state.handoffDraft);
  const saveNurseHandoffDraft = useWardStore(
    (state) => state.saveNurseHandoffDraft,
  );
  const [editorContent, setEditorContent] = useState(handoffDraft.content);
  const [isDirty, setIsDirty] = useState(false);
  const [baseUpdatedAt, setBaseUpdatedAt] = useState(null);

  const hasIncomingDraft =
    isDirty && handoffDraft.updatedAt !== baseUpdatedAt;
  const visibleContent = isDirty ? editorContent : handoffDraft.content;

  function handleChange(event) {
    const nextContent = event.target.value;
    const nextIsDirty = nextContent !== handoffDraft.content;

    setEditorContent(nextContent);
    setIsDirty(nextIsDirty);
    setBaseUpdatedAt((currentBaseUpdatedAt) =>
      nextIsDirty ? currentBaseUpdatedAt ?? handoffDraft.updatedAt : null,
    );
  }

  function handleSave() {
    const result = saveNurseHandoffDraft(editorContent);

    if (result.ok) {
      setIsDirty(false);
      setBaseUpdatedAt(null);
    }
  }

  return (
    <section className="handoff-pane" aria-labelledby="handoff-title">
      <header className="handoff-pane__header">
        <div>
          <p className="handoff-pane__eyebrow">Shared shift document</p>
          <h2 id="handoff-title">Handoff</h2>
        </div>
        <p className="handoff-pane__updated">
          Updated {formatUpdatedAt(handoffDraft.updatedAt)}
        </p>
      </header>

      <AgentAuthoredMarker
        authoredBy={handoffDraft.authoredBy}
        lastEditedBy={handoffDraft.lastEditedBy}
      />

      <label className="handoff-pane__label" htmlFor="shared-handoff-draft">
        Shared handoff draft
      </label>
      <textarea
        className="handoff-pane__textarea"
        id="shared-handoff-draft"
        value={visibleContent}
        onChange={handleChange}
        placeholder="Draft a handoff or ask the agent to prepare one."
      />

      {hasIncomingDraft ? (
        <p className="handoff-pane__incoming" role="status">
          A newer agent draft is available. Your unsaved edit is still preserved.
        </p>
      ) : null}

      <div className="handoff-pane__footer">
        <p className="handoff-pane__last-editor">
          {handoffDraft.lastEditedBy === "nurse"
            ? "Last saved by you"
            : handoffDraft.lastEditedBy === "agent"
              ? "Last updated by agent"
              : "Ready for a shared draft"}
        </p>
        <button
          className="handoff-pane__save"
          type="button"
          onClick={handleSave}
          disabled={!isDirty}
        >
          Save handoff
        </button>
      </div>
    </section>
  );
}
