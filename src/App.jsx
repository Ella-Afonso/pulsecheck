import { useEffect } from "react";
import "./App.css";
import { ApprovalsRail } from "./components/ApprovalsRail";
import { AuditLog } from "./components/AuditLog";
import { HandoffPane } from "./components/HandoffPane";
import { PatientBoard } from "./components/PatientBoard";
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
    <main className="wardround-app">
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
    </main>
  );
}
