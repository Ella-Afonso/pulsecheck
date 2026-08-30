const VITAL_READERS = {
  hr: (vitals) => vitals?.hr,
  spo2: (vitals) => vitals?.spo2,
  resp: (vitals) => vitals?.resp,
  temp: (vitals) => vitals?.temp,
  systolicBp: (vitals) => vitals?.bp?.systolic,
  diastolicBp: (vitals) => vitals?.bp?.diastolic,
};

function unavailableTrend(readingsUsed = 0) {
  return {
    state: "unavailable",
    readings_used: readingsUsed,
    start_value: null,
    latest_value: null,
    change: null,
  };
}

function roundChange(value, vitalKey) {
  const precision = vitalKey === "temp" ? 1 : 0;
  return Number(value.toFixed(precision));
}

export function deriveTopConcernTrend(topConcern, vitalsHistory) {
  if (!topConcern || topConcern.kind === "data_quality") {
    return unavailableTrend();
  }

  const readVital = VITAL_READERS[topConcern.vitalKey];

  if (!readVital || !["high", "low"].includes(topConcern.direction)) {
    return unavailableTrend();
  }

  const readings = Array.isArray(vitalsHistory)
    ? vitalsHistory.slice(-3)
    : [];
  const values = readings.map((reading) => readVital(reading?.vitals));
  const validValues = values.filter(Number.isFinite);

  if (readings.length < 3 || validValues.length < 3) {
    return unavailableTrend(validValues.length);
  }

  const startValue = values[0];
  const latestValue = values[2];
  const change = roundChange(latestValue - startValue, topConcern.vitalKey);
  const concernChange = topConcern.direction === "high" ? change : -change;

  return {
    state:
      concernChange > 0
        ? "worsening"
        : concernChange < 0
          ? "improving"
          : "stable",
    readings_used: 3,
    start_value: startValue,
    latest_value: latestValue,
    change,
  };
}
