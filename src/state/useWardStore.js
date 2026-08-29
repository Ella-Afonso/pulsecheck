import { create } from "zustand";
import alertThresholds from "../data/map_alert_thresholds.json";
import vitalsRecords from "../data/bulk_vitals.json";
import { driftPatient } from "../data/drift";
import { normalizeWardPatients } from "../data/normalize";

const initialPatients = normalizeWardPatients(vitalsRecords, {
  ward: "ICU",
  limit: 6,
});

export const useWardStore = create((set) => ({
  patients: initialPatients,
  thresholds: alertThresholds,
  tick: () => {
    const timestamp = new Date().toISOString();

    set((state) => ({
      patients: state.patients.map((patient) => driftPatient(patient, timestamp)),
    }));
  },
}));
