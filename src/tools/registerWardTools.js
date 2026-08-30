import { acknowledgeAlert } from "./acknowledgeAlert";
import { annotatePatient } from "./annotatePatient";
import { draftHandoffSummary } from "./draftHandoffSummary";
import { explainRisk } from "./explainRisk";
import { flagPatient } from "./flagPatient";
import { listPatientsByRisk } from "./listPatientsByRisk";
import { proposeTriageOrder } from "./proposeTriageOrder";

export async function registerWardTools(signal) {
  if (typeof document.modelContext?.registerTool !== "function") {
    return false;
  }

  try {
    await document.modelContext.registerTool(listPatientsByRisk, { signal });
    await document.modelContext.registerTool(explainRisk, { signal });
    await document.modelContext.registerTool(flagPatient, { signal });
    await document.modelContext.registerTool(annotatePatient, { signal });
    await document.modelContext.registerTool(acknowledgeAlert, { signal });
    await document.modelContext.registerTool(proposeTriageOrder, { signal });
    await document.modelContext.registerTool(draftHandoffSummary, { signal });
    return true;
  } catch {
    return false;
  }
}
