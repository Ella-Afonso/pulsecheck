// URL-gated deterministic recording mode.
//
// Enabled only when the page is opened with `?demo=1`. When active, a single
// real seeded ICU patient (Freya Reed, bed ICU-115) follows a fixed downward
// SpO2 trajectory so the board reaches Critical through the unchanged threshold
// and scoring pipeline in roughly 16 seconds. Without `?demo=1`, none of this
// runs and the normal simulated feed is behaviourally unchanged.

export const DEMO_TARGET_BED = "ICU-115";

// SpO2 falls 4 points per 4s feed tick from the seed value (99) until it hits
// the floor: 99 -> 95 -> 91 -> 87 -> 83. 83 is below the SpO2 critical_min (85),
// which the existing scorer classifies as the worst band, forcing severity 5.
const SPO2_STEP = 4;
const SPO2_FLOOR = 80;
const RESP_STEP = 2;
const RESP_CAP = 30;
const HR_STEP = 3;
const HR_CAP = 130;

let cachedDemoMode = null;

export function isDemoMode() {
  if (cachedDemoMode !== null) {
    return cachedDemoMode;
  }

  if (typeof window === "undefined" || !window.location) {
    cachedDemoMode = false;
    return cachedDemoMode;
  }

  cachedDemoMode =
    new URLSearchParams(window.location.search).get("demo") === "1";
  return cachedDemoMode;
}

export function isDemoTarget(patient) {
  return patient?.bed === DEMO_TARGET_BED;
}

export function demoDeterioration(vitals) {
  return {
    hr: Math.min(vitals.hr + HR_STEP, HR_CAP),
    spo2: Math.max(vitals.spo2 - SPO2_STEP, SPO2_FLOOR),
    resp: Math.min(vitals.resp + RESP_STEP, RESP_CAP),
    temp: vitals.temp,
    bp: { ...vitals.bp },
  };
}
