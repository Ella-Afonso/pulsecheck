export function PanelNav({ views, activeView, onSelect, pendingCount = 0 }) {
  function focusTab(viewId) {
    const element = document.getElementById(`tab-${viewId}`);
    element?.focus();
  }

  function handleKeyDown(event, index) {
    const { key } = event;
    let nextIndex = null;

    if (key === "ArrowDown" || key === "ArrowRight") {
      nextIndex = (index + 1) % views.length;
    } else if (key === "ArrowUp" || key === "ArrowLeft") {
      nextIndex = (index - 1 + views.length) % views.length;
    } else if (key === "Home") {
      nextIndex = 0;
    } else if (key === "End") {
      nextIndex = views.length - 1;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    const nextView = views[nextIndex];
    onSelect(nextView.id);
    focusTab(nextView.id);
  }

  return (
    <div className="panel-nav">
      <div
        className="panel-nav__list"
        role="tablist"
        aria-label="Wardround views"
        aria-orientation="vertical"
      >
        {views.map((view, index) => {
          const isActive = view.id === activeView;
          const showBadge = view.id === "approvals" && pendingCount > 0;

          return (
            <button
              key={view.id}
              id={`tab-${view.id}`}
              type="button"
              role="tab"
              className={`panel-nav__tab${
                isActive ? " panel-nav__tab--active" : ""
              }`}
              aria-selected={isActive}
              aria-controls="dashboard-view"
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelect(view.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <span>{view.label}</span>
              {showBadge ? (
                <span
                  className="panel-nav__badge"
                  aria-label={`${pendingCount} pending`}
                >
                  {pendingCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="panel-nav__ward">
        <span>Ward</span>
        ICU · on shift
      </p>
    </div>
  );
}
