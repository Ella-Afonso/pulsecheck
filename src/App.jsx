import { useEffect, useState } from "react";
import { useVitalsFeed } from "./hooks/useVitalsFeed";
import { useWardStore } from "./state/useWardStore";
import { registerPing } from "./tools/registerPing";

export default function App() {
  const [supported, setSupported] = useState(false);
  const [registration, setRegistration] = useState("checking");
  const patients = useWardStore((state) => state.patients);

  useVitalsFeed();

  useEffect(() => {
    const hasModelContext = "modelContext" in document;
    const canRegister =
      typeof document.modelContext?.registerTool === "function";

    console.info("[webmcp] document.modelContext present:", hasModelContext);
    setSupported(canRegister);

    if (!canRegister) {
      setRegistration("unavailable");
      return undefined;
    }

    const controller = new AbortController();

    void registerPing(controller.signal).then((registered) => {
      if (!controller.signal.aborted) {
        setRegistration(registered ? "registered" : "failed");
      }
    });

    return () => controller.abort();
  }, []);

  return (
    <main className="debug-feed">
      <h1>Wardround</h1>
      <p>WebMCP support: {supported ? "detected" : "not detected"}</p>
      <p>Ping registration: {registration}</p>
      <ul aria-label="Live vitals debug list">
        {patients.map((patient) => (
          <li key={patient.patient_id}>
            {patient.name} · {patient.bed} · SpO₂ {patient.vitals.spo2}% · HR{" "}
            {patient.vitals.hr} · {patient.vitalsHistory.length} readings
          </li>
        ))}
      </ul>
    </main>
  );
}
