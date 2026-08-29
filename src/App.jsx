import { useEffect } from "react";
import "./App.css";
import { PatientBoard } from "./components/PatientBoard";
import { useVitalsFeed } from "./hooks/useVitalsFeed";
import { registerPing } from "./tools/registerPing";

export default function App() {
  useVitalsFeed();

  useEffect(() => {
    const canRegister =
      typeof document.modelContext?.registerTool === "function";

    if (!canRegister) {
      return undefined;
    }

    const controller = new AbortController();
    void registerPing(controller.signal);

    return () => controller.abort();
  }, []);

  return (
    <main className="wardround-app">
      <PatientBoard />
    </main>
  );
}
