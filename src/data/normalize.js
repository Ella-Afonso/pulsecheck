const HISTORY_LENGTH = 4;
const HISTORY_INTERVAL_MS = 4_000;

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function copyVitals(vitals) {
  return {
    hr: vitals.hr,
    spo2: vitals.spo2,
    resp: vitals.resp,
    temp: vitals.temp,
    bp: { ...vitals.bp },
  };
}

function vitalsFromRecord(record) {
  return {
    hr: Number(record.heart_rate_bpm),
    spo2: Number(record.spo2_percent),
    resp: Number(record.respiratory_rate_bpm),
    temp: Number(record.temperature_celsius),
    bp: {
      systolic: Number(record.systolic_bp_mmhg),
      diastolic: Number(record.diastolic_bp_mmhg),
    },
  };
}

function sourceTimestamp(readingTimestamp) {
  const parsed = Date.parse(readingTimestamp);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function historicalVitals(vitals, patientIndex, readingIndex) {
  if (readingIndex === HISTORY_LENGTH - 1) {
    return copyVitals(vitals);
  }

  const variation = ((patientIndex + readingIndex * 2) % 3) - 1;

  return {
    hr: clamp(vitals.hr + variation, 35, 180),
    spo2: clamp(vitals.spo2 - variation, 70, 100),
    resp: clamp(vitals.resp + variation, 6, 36),
    temp: Number(clamp(vitals.temp + variation * 0.1, 34, 42).toFixed(1)),
    bp: { ...vitals.bp },
  };
}

function makeVitalsHistory(vitals, readingTimestamp, patientIndex) {
  const latestTimestamp = sourceTimestamp(readingTimestamp);

  return Array.from({ length: HISTORY_LENGTH }, (_, readingIndex) => ({
    timestamp: new Date(
      latestTimestamp - (HISTORY_LENGTH - 1 - readingIndex) * HISTORY_INTERVAL_MS,
    ).toISOString(),
    vitals: historicalVitals(vitals, patientIndex, readingIndex),
  }));
}

export function normalizePatient(record, patientIndex = 0) {
  const vitals = vitalsFromRecord(record);

  return {
    patient_id: record.patient_id,
    name: record.patient_name,
    bed: record.bed_number,
    ward: record.ward_name,
    vitals,
    vitalsHistory: makeVitalsHistory(
      vitals,
      record.reading_timestamp,
      patientIndex,
    ),
    riskScore: null,
    severity: null,
    topConcern: null,
  };
}

export function normalizeWardPatients(
  records,
  { ward = "ICU", limit = 6 } = {},
) {
  const selected = [];
  const seenPatientIds = new Set();

  for (const record of records) {
    if (record.ward_name !== ward || seenPatientIds.has(record.patient_id)) {
      continue;
    }

    selected.push(record);
    seenPatientIds.add(record.patient_id);

    if (selected.length === limit) {
      break;
    }
  }

  return selected.map((record, patientIndex) =>
    normalizePatient(record, patientIndex),
  );
}
