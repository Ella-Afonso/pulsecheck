const VITAL_DEFINITIONS = [
  {
    vitalSign: "Heart Rate",
    vitalKey: "hr",
    label: "Heart rate",
    readValue: (vitals) => vitals.hr,
    weight: 16,
    priority: 5,
  },
  {
    vitalSign: "Systolic BP",
    vitalKey: "systolicBp",
    label: "Systolic BP",
    readValue: (vitals) => vitals.bp?.systolic,
    weight: 18,
    priority: 3,
  },
  {
    vitalSign: "Diastolic BP",
    vitalKey: "diastolicBp",
    label: "Diastolic BP",
    readValue: (vitals) => vitals.bp?.diastolic,
    weight: 10,
    priority: 4,
  },
  {
    vitalSign: "Temperature",
    vitalKey: "temp",
    label: "Temperature",
    readValue: (vitals) => vitals.temp,
    weight: 10,
    priority: 6,
  },
  {
    vitalSign: "SpO2",
    vitalKey: "spo2",
    label: "SpO2",
    readValue: (vitals) => vitals.spo2,
    weight: 26,
    priority: 1,
  },
  {
    vitalSign: "Respiratory Rate",
    vitalKey: "resp",
    label: "Respiratory rate",
    readValue: (vitals) => vitals.resp,
    weight: 20,
    priority: 2,
  },
];

const BAND_MULTIPLIERS = {
  normal: 0,
  warning: 0.3,
  high: 0.7,
  critical: 1,
};

const BAND_PRIORITY = {
  warning: 1,
  high: 2,
  critical: 3,
};

const REQUIRED_THRESHOLD_FIELDS = [
  "normal_min",
  "normal_max",
  "warning_min",
  "warning_max",
  "critical_min",
  "critical_max",
];

function thresholdByVital(thresholds) {
  const byVital = new Map(
    thresholds.map((threshold) => [threshold.vital_sign, threshold]),
  );

  for (const definition of VITAL_DEFINITIONS) {
    const threshold = byVital.get(definition.vitalSign);

    if (!threshold) {
      throw new Error(`Missing threshold definition for ${definition.vitalSign}.`);
    }

    for (const field of REQUIRED_THRESHOLD_FIELDS) {
      if (!Number.isFinite(threshold[field])) {
        throw new Error(
          `Invalid ${field} for ${definition.vitalSign} threshold definition.`,
        );
      }
    }
  }

  return byVital;
}

function isWithin(value, minimum, maximum) {
  return value >= minimum && value <= maximum;
}

function classifyValue(value, threshold) {
  if (isWithin(value, threshold.normal_min, threshold.normal_max)) {
    return "normal";
  }

  if (isWithin(value, threshold.warning_min, threshold.warning_max)) {
    return "warning";
  }

  if (isWithin(value, threshold.critical_min, threshold.critical_max)) {
    return "high";
  }

  return "critical";
}

function directionFor(value, threshold) {
  return value < threshold.normal_min ? "low" : "high";
}

function severityForScore(score) {
  if (score >= 75) return 5;
  if (score >= 50) return 4;
  if (score >= 25) return 3;
  if (score > 0) return 2;
  return 1;
}

function compareConcerns(left, right) {
  const bandDifference = BAND_PRIORITY[right.band] - BAND_PRIORITY[left.band];
  if (bandDifference !== 0) return bandDifference;

  const pointsDifference = right.points - left.points;
  if (pointsDifference !== 0) return pointsDifference;

  return left.priority - right.priority;
}

function dataQualityConcern(definition, threshold) {
  return {
    kind: "data_quality",
    vitalKey: definition.vitalKey,
    label: definition.label,
    value: null,
    unit: threshold.unit,
    direction: null,
    band: "critical",
    points: 0,
  };
}

/**
 * Scores the six live vital signals against the supplied threshold records.
 * The result is deterministic for a given vitals object and threshold array.
 */
export function scorePatientRisk(vitals, thresholds) {
  if (!Array.isArray(thresholds)) {
    throw new Error("Risk scoring requires a threshold array.");
  }

  const thresholdsByVital = thresholdByVital(thresholds);
  const concerns = [];
  let unroundedScore = 0;
  let highestBand = "normal";

  for (const definition of VITAL_DEFINITIONS) {
    const threshold = thresholdsByVital.get(definition.vitalSign);
    const value = definition.readValue(vitals ?? {});

    if (!Number.isFinite(value)) {
      return {
        score: 100,
        severity: 5,
        topConcern: dataQualityConcern(definition, threshold),
      };
    }

    const band = classifyValue(value, threshold);
    const points = definition.weight * BAND_MULTIPLIERS[band];
    unroundedScore += points;

    if (band !== "normal") {
      concerns.push({
        kind: "vital",
        vitalKey: definition.vitalKey,
        label: definition.label,
        value,
        unit: threshold.unit,
        direction: directionFor(value, threshold),
        band,
        points,
        priority: definition.priority,
      });
    }

    if (BAND_PRIORITY[band] > (BAND_PRIORITY[highestBand] ?? 0)) {
      highestBand = band;
    }
  }

  let score = Math.min(100, Math.round(unroundedScore));

  if (highestBand === "critical") {
    score = Math.max(score, 75);
  } else if (highestBand === "high") {
    score = Math.max(score, 50);
  }

  const topConcern = concerns.sort(compareConcerns)[0] ?? null;

  if (topConcern) {
    delete topConcern.priority;
  }

  return {
    score,
    severity: severityForScore(score),
    topConcern,
  };
}

export function scoreAndRankPatients(patients, thresholds) {
  return patients
    .map((patient) => {
      const { score, severity, topConcern } = scorePatientRisk(
        patient.vitals,
        thresholds,
      );

      return {
        ...patient,
        riskScore: score,
        severity,
        topConcern,
      };
    })
    .sort((left, right) => {
      if (right.riskScore !== left.riskScore) {
        return right.riskScore - left.riskScore;
      }

      if (right.severity !== left.severity) {
        return right.severity - left.severity;
      }

      if (left.bed !== right.bed) {
        return left.bed < right.bed ? -1 : 1;
      }

      if (left.patient_id === right.patient_id) return 0;
      return left.patient_id < right.patient_id ? -1 : 1;
    });
}
