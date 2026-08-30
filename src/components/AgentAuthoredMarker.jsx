export function AgentAuthoredMarker({ authoredBy, lastEditedBy }) {
  if (authoredBy !== "agent" && authoredBy !== "co") {
    return null;
  }

  const wasEditedByNurse = authoredBy === "co" && lastEditedBy === "nurse";

  return (
    <p className="agent-authored-marker" role="status">
      <span aria-hidden="true" />
      {wasEditedByNurse ? "Drafted by agent · edited by you" : "Drafted by agent"}
    </p>
  );
}
