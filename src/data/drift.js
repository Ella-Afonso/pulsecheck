import { demoDeterioration, isDemoMode, isDemoTarget } from "./demoMode";

export const MAX_VITALS_HISTORY = 8;

const VITAL_BOUNDS = {
  hr: [35, 180],
  spo2: [70, 100],
  resp: [6, 36],
  temp: [34, 42],
};

function clamp(value, [minimum, maximum]) {
  return Math.min(Math.max(value, minimum), maximum);
}

function randomInteger(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function driftTemperature(temperature) {
  const next = temperature + randomInteger(-1, 1) / 10;
  return Number(clamp(next, VITAL_BOUNDS.temp).toFixed(1));
}

export function driftVitals(vitals) {
  return {
    hr: clamp(vitals.hr + randomInteger(-2, 2), VITAL_BOUNDS.hr),
    spo2: clamp(vitals.spo2 + randomInteger(-1, 1), VITAL_BOUNDS.spo2),
    resp: clamp(vitals.resp + randomInteger(-1, 1), VITAL_BOUNDS.resp),
    temp: driftTemperature(vitals.temp),
    bp: { ...vitals.bp },
  };
}

export function driftPatient(patient, timestamp = new Date().toISOString()) {
  const vitals =
    isDemoMode() && isDemoTarget(patient)
      ? demoDeterioration(patient.vitals)
      : driftVitals(patient.vitals);
  const nextReading = { timestamp, vitals };

  return {
    ...patient,
    vitals,
    vitalsHistory: [...patient.vitalsHistory, nextReading].slice(
      -MAX_VITALS_HISTORY,
    ),
  };
}
