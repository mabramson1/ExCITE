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

export const RVU_TABLE: Record<string, RvuData> = {
  "99211": { code: "99211", description: "Established, Minimal", workRvu: 0.18, facilityPe: 0.18, nonFacilityPe: 0.47, malpractice: 0.02, totalFacility: 0.38, totalNonFacility: 0.67 },
  "99212": { code: "99212", description: "Established, Straightforward", workRvu: 0.70, facilityPe: 0.42, nonFacilityPe: 1.06, malpractice: 0.05, totalFacility: 1.17, totalNonFacility: 1.81 },
  "99213": { code: "99213", description: "Established, Low", workRvu: 1.30, facilityPe: 0.58, nonFacilityPe: 1.47, malpractice: 0.08, totalFacility: 1.96, totalNonFacility: 2.85 },
  "99214": { code: "99214", description: "Established, Moderate", workRvu: 1.92, facilityPe: 0.78, nonFacilityPe: 1.90, malpractice: 0.11, totalFacility: 2.81, totalNonFacility: 3.93 },
  "99215": { code: "99215", description: "Established, High", workRvu: 2.80, facilityPe: 1.02, nonFacilityPe: 2.31, malpractice: 0.14, totalFacility: 3.96, totalNonFacility: 5.25 },
  "99202": { code: "99202", description: "New Patient, Straightforward", workRvu: 0.93, facilityPe: 0.54, nonFacilityPe: 1.34, malpractice: 0.07, totalFacility: 1.54, totalNonFacility: 2.34 },
  "99203": { code: "99203", description: "New Patient, Low", workRvu: 1.60, facilityPe: 0.76, nonFacilityPe: 1.80, malpractice: 0.10, totalFacility: 2.46, totalNonFacility: 3.50 },
  "99204": { code: "99204", description: "New Patient, Moderate", workRvu: 2.60, facilityPe: 1.07, nonFacilityPe: 2.44, malpractice: 0.14, totalFacility: 3.81, totalNonFacility: 5.18 },
  "99205": { code: "99205", description: "New Patient, High", workRvu: 3.50, facilityPe: 1.30, nonFacilityPe: 2.87, malpractice: 0.17, totalFacility: 4.97, totalNonFacility: 6.54 },
};

export const CONVERSION_FACTOR = 33.29; // 2024 CMS conversion factor

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
