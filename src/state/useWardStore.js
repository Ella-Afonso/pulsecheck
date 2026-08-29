import { create } from "zustand";
import alertThresholds from "../data/map_alert_thresholds.json";
import vitalsRecords from "../data/bulk_vitals.json";
import { driftPatient } from "../data/drift";
import { normalizeWardPatients } from "../data/normalize";
import { scoreAndRankPatients } from "../logic/riskScore";

const initialPatients = scoreAndRankPatients(
  normalizeWardPatients(vitalsRecords, {
    ward: "ICU",
    limit: 6,
  }),
  alertThresholds,
);

export const useWardStore = create((set) => ({
  patients: initialPatients,
  thresholds: alertThresholds,
  tick: () => {
    const timestamp = new Date().toISOString();

    set((state) => ({
      patients: scoreAndRankPatients(
        state.patients.map((patient) => driftPatient(patient, timestamp)),
        state.thresholds,
      ),
    }));
  },
}));
