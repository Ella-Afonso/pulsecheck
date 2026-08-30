import { explainRisk } from "./explainRisk";
import { listPatientsByRisk } from "./listPatientsByRisk";

export async function registerWardTools(signal) {
  if (typeof document.modelContext?.registerTool !== "function") {
    console.warn("[webmcp] document.modelContext.registerTool is unavailable");
    return false;
  }

  try {
    await document.modelContext.registerTool(listPatientsByRisk, { signal });
    await document.modelContext.registerTool(explainRisk, { signal });
    console.info("[webmcp] ward read tools registered");
    return true;
  } catch (error) {
    if (!signal.aborted) {
      console.error("[webmcp] ward tool registration failed", error);
    }

    return false;
  }
}
