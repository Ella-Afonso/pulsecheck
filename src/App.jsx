import { useEffect } from "react";
import "./App.css";
import { ApprovalsRail } from "./components/ApprovalsRail";
import { AppShell } from "./components/AppShell";
import { AuditLog } from "./components/AuditLog";
import { HandoffPane } from "./components/HandoffPane";
import { Hero } from "./components/Hero";
import { PatientBoard } from "./components/PatientBoard";
import { TrustStrip } from "./components/TrustStrip";
import { useVitalsFeed } from "./hooks/useVitalsFeed";
import { registerWardTools } from "./tools/registerWardTools";

export default function App() {
  useVitalsFeed();

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

  return (
    <AppShell>
      <Hero />
      <section className="wardround-product" id="live-ward" aria-label="Live Wardround workspace">
        <div className="wardround-workspace">
          <div className="wardround-primary">
            <PatientBoard />
            <HandoffPane />
          </div>
          <aside className="wardround-sidecar" aria-label="Approval activity">
            <ApprovalsRail />
            <AuditLog />
          </aside>
        </div>
      </section>
      <TrustStrip />
    </AppShell>
  );
}
