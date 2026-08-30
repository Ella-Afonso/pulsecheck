const ACTIVE_ALERT_BANDS = new Set(["warning", "high", "critical"]);

/**
 * Returns the single alert a nurse may acknowledge for the patient's current
 * top concern. The ID changes when the concern's vital or severity band
 * changes, so an acknowledgement cannot silently carry over to a new alert.
 */
export function getActiveAlert(patient) {
  const concern = patient?.topConcern;

  if (
    concern?.kind !== "vital" ||
    typeof patient?.patient_id !== "string" ||
    !ACTIVE_ALERT_BANDS.has(concern.band) ||
    typeof concern.vitalKey !== "string"
  ) {
    return null;
  }

  return {
    alertId: `alert:${patient.patient_id}:${concern.vitalKey}:${concern.band}`,
  };
}
