import { useEffect, useRef, useState } from "react";
import "./App.css";
import { ApprovalsRail } from "./components/ApprovalsRail";
import { AppShell } from "./components/AppShell";
import { AuditLog } from "./components/AuditLog";
import { HandoffPane } from "./components/HandoffPane";
import { Hero } from "./components/Hero";
import { PanelNav } from "./components/PanelNav";
import { PatientBoard } from "./components/PatientBoard";
import { PatientDirectory } from "./components/PatientDirectory";
import { Safeguards } from "./components/Safeguards";
import { StatRow } from "./components/StatRow";
import { TrustStrip } from "./components/TrustStrip";
import { WardContextCard } from "./components/WardContextCard";
import { useVitalsFeed } from "./hooks/useVitalsFeed";
import { useWardStore } from "./state/useWardStore";
import { registerWardTools } from "./tools/registerWardTools";

const VIEWS = [
  { id: "board", label: "Board" },
  { id: "approvals", label: "Approvals" },
  { id: "handoff", label: "Handoff" },
  { id: "activity", label: "Activity" },
  { id: "patients", label: "Patients" },
];

export default function App() {
  useVitalsFeed();

  const [activeView, setActiveView] = useState("board");
  const [liveWardRequest, setLiveWardRequest] = useState(0);
  const dashboardViewRef = useRef(null);
  const pendingCount = useWardStore((state) => state.pendingProposals.length);

  useEffect(() => {
    const canRegister =
      typeof document.modelContext?.registerTool === "function";

    if (!canRegister) {
      return undefined;
    }

    const controller = new AbortController();
    void registerWardTools(controller.signal);

    return () => controller.abort();
  }, []);

  const activeLabel = VIEWS.find((view) => view.id === activeView)?.label ?? "";
  const railHasApprovals = activeView === "board" || activeView === "activity";

  function handleShowLiveWard(event) {
    event.preventDefault();
    setActiveView("board");
    setLiveWardRequest((request) => request + 1);
  }

  useEffect(() => {
    if (liveWardRequest === 0) return;

    window.history.replaceState(null, "", "#live-ward");
    const dashboardView = dashboardViewRef.current;
    dashboardView?.scrollIntoView({ behavior: "smooth", block: "start" });
    dashboardView?.focus({ preventScroll: true });
  }, [liveWardRequest]);

  return (
    <AppShell>
      <div className="wardround-showcase">
        <Hero onShowLiveWard={handleShowLiveWard} />
        <section
          className="wardround-product"
          id="live-ward"
          aria-labelledby="product-panel-title"
        >
          <div className="product-panel">
            <header className="product-panel__header">
              <div className="product-panel__identity">
                <span className="product-panel__mark" aria-hidden="true" />
                <h2 id="product-panel-title">Wardround Shift Co-Pilot</h2>
              </div>
              <div className="product-panel__status">
                <span className="product-panel__status-dot" aria-hidden="true" />
                <span>Live · nurse + agent</span>
                <span className="product-panel__avatar" aria-hidden="true">
                  AN
                </span>
              </div>
            </header>

            <div className="product-panel__body">
              <PanelNav
                views={VIEWS}
                activeView={activeView}
                onSelect={setActiveView}
                pendingCount={pendingCount}
              />

              <div
                className={`dashboard-view dashboard-view--${activeView}`}
                id="dashboard-view"
                ref={dashboardViewRef}
                role="tabpanel"
                aria-labelledby={`tab-${activeView}`}
                tabIndex={0}
              >
                <div className="dashboard-view__center">
                  <div
                    className="dashboard-view__pane"
                    hidden={activeView !== "board"}
                  >
                    <PatientBoard />
                  </div>
                  <div
                    className="dashboard-view__pane"
                    hidden={activeView !== "handoff"}
                  >
                    <HandoffPane />
                  </div>
                  {activeView === "approvals" ? <ApprovalsRail /> : null}
                  {activeView === "activity" ? <AuditLog /> : null}
                  {activeView === "patients" ? <PatientDirectory /> : null}
                </div>

                <aside
                  className="dashboard-view__rail"
                  aria-label={`${activeLabel} context`}
                >
                  {railHasApprovals ? <ApprovalsRail /> : <WardContextCard />}
                  <Safeguards />
                </aside>
              </div>
            </div>

            <StatRow />
          </div>
        </section>
      </div>
      <TrustStrip />
    </AppShell>
  );
}
