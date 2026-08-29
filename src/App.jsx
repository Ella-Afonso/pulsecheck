import { useEffect, useState } from "react";
import { registerPing } from "./tools/registerPing";

export default function App() {
  const [supported, setSupported] = useState(false);
  const [registration, setRegistration] = useState("checking");

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
    <main style={{ padding: 32 }}>
      <h1>Wardround</h1>
      <p>WebMCP support: {supported ? "detected" : "not detected"}</p>
      <p>Ping registration: {registration}</p>
    </main>
  );
}