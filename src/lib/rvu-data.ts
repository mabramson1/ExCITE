export interface RvuData {
  code: string;
  description: string;
  workRvu: number;
  facilityPe: number;
  nonFacilityPe: number;
  malpractice: number;
  totalFacility: number;
  totalNonFacility: number;
}

// Source: 2025 CMS Physician Fee Schedule final rule (CY2025)
// https://www.cms.gov/medicare/payment/fee-schedules/physician
// Work RVUs unchanged from 2024; PE/MP RVUs reflect 2025 final values.
export const RVU_TABLE: Record<string, RvuData> = {
  "99211": { code: "99211", description: "Established, Minimal", workRvu: 0.18, facilityPe: 0.18, nonFacilityPe: 0.49, malpractice: 0.02, totalFacility: 0.38, totalNonFacility: 0.69 },
  "99212": { code: "99212", description: "Established, Straightforward", workRvu: 0.70, facilityPe: 0.42, nonFacilityPe: 1.10, malpractice: 0.05, totalFacility: 1.17, totalNonFacility: 1.85 },
  "99213": { code: "99213", description: "Established, Low", workRvu: 1.30, facilityPe: 0.59, nonFacilityPe: 1.50, malpractice: 0.08, totalFacility: 1.97, totalNonFacility: 2.88 },
  "99214": { code: "99214", description: "Established, Moderate", workRvu: 1.92, facilityPe: 0.79, nonFacilityPe: 1.93, malpractice: 0.11, totalFacility: 2.82, totalNonFacility: 3.96 },
  "99215": { code: "99215", description: "Established, High", workRvu: 2.80, facilityPe: 1.04, nonFacilityPe: 2.34, malpractice: 0.14, totalFacility: 3.98, totalNonFacility: 5.28 },
  "99202": { code: "99202", description: "New Patient, Straightforward", workRvu: 0.93, facilityPe: 0.55, nonFacilityPe: 1.36, malpractice: 0.07, totalFacility: 1.55, totalNonFacility: 2.36 },
  "99203": { code: "99203", description: "New Patient, Low", workRvu: 1.60, facilityPe: 0.77, nonFacilityPe: 1.83, malpractice: 0.10, totalFacility: 2.47, totalNonFacility: 3.53 },
  "99204": { code: "99204", description: "New Patient, Moderate", workRvu: 2.60, facilityPe: 1.09, nonFacilityPe: 2.47, malpractice: 0.14, totalFacility: 3.83, totalNonFacility: 5.21 },
  "99205": { code: "99205", description: "New Patient, High", workRvu: 3.50, facilityPe: 1.32, nonFacilityPe: 2.91, malpractice: 0.17, totalFacility: 4.99, totalNonFacility: 6.58 },
};

// 2025 CMS conversion factor (down 2.83% from $33.29 in 2024)
export const CONVERSION_FACTOR = 32.35;
export const SCHEDULE_YEAR = 2025;

export function estimateReimbursement(code: string, facility: boolean = false): number {
  const rvu = RVU_TABLE[code];
  if (!rvu) return 0;
  const total = facility ? rvu.totalFacility : rvu.totalNonFacility;
  return Math.round(total * CONVERSION_FACTOR * 100) / 100;
}

export function getRvuDifference(currentCode: string, targetCode: string): { rvuDiff: number; dollarDiff: number } {
  const current = RVU_TABLE[currentCode];
  const target = RVU_TABLE[targetCode];
  if (!current || !target) return { rvuDiff: 0, dollarDiff: 0 };
  const rvuDiff = target.workRvu - current.workRvu;
  const dollarDiff = Math.round((target.totalNonFacility - current.totalNonFacility) * CONVERSION_FACTOR * 100) / 100;
  return { rvuDiff: Math.round(rvuDiff * 100) / 100, dollarDiff };
}
