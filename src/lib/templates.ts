/**
 * Specialty-specific A/P templates.
 * Each template is a starter skeleton — user fills in [bracketed] placeholders.
 */

export interface ApTemplate {
  id: string;
  name: string;
  category: string;
  specialty: string;
  description: string;
  skeleton: string;
}

export const SPECIALTIES = [
  { value: "nephrology", label: "Nephrology" },
  // Future: cardiology, endocrinology, hematology-oncology, pulmonology, etc.
];

export const TEMPLATES: ApTemplate[] = [
  // ── CKD ────────────────────────────────────────────────────────────
  {
    id: "neph-ckd-stage3",
    name: "CKD Stage 3 (a/b)",
    category: "Chronic Kidney Disease",
    specialty: "nephrology",
    description: "Stable CKD stage 3a or 3b follow-up",
    skeleton: `Dx: CKD stage [3a or 3b] (GFR [eGFR]), etiology [diabetic nephropathy / hypertensive / other]
Comorbidities: [HTN, DM2, etc.]
Labs: Cr [value], eGFR [value], K [value], HCO3 [value], Hgb [value], Ca [value], Phos [value], PTH [value], UACR [value]
Meds: [ACE/ARB if appropriate], [statin], [other]
BP: [value]
Plan:
- Continue [ACE/ARB] for renoprotection
- Repeat labs in [3 months]
- Monitor for progression
- Patient counseled on CKD diet, NSAID avoidance
- Consider nephrology referral if [criteria]`,
  },
  {
    id: "neph-ckd-stage4",
    name: "CKD Stage 4",
    category: "Chronic Kidney Disease",
    specialty: "nephrology",
    description: "Advanced CKD with pre-dialysis planning considerations",
    skeleton: `Dx: CKD stage 4 (GFR [eGFR]), etiology [diabetic / hypertensive / other]
Comorbidities: [HTN, DM2, CAD, PVD, etc.]
Labs: Cr [value], eGFR [value], K [value], HCO3 [value], Hgb [value], Ca [value], Phos [value], PTH [value], 25-OH Vit D [value], UACR [value]
Meds: [list current meds with doses]
BP: [value], target <130/80
Symptoms: [fatigue, edema, pruritus, anorexia, etc. or none]
Plan:
- Continue [ACE/ARB] - renoprotection
- [Address electrolytes: bicarb supplementation if HCO3 <22, phos binder if elevated]
- [Anemia management: iron studies, consider ESA if Hgb <10]
- [Vitamin D / SHPT management]
- Pre-dialysis education and planning - referral to dialysis educator
- Vascular access planning - vein mapping, vascular surgery referral for AV fistula creation
- Discuss modality choice (HD vs PD vs transplant)
- Repeat labs in [4-6 weeks]
- Continue cardiovascular risk reduction`,
  },
  {
    id: "neph-ckd-stage5",
    name: "CKD Stage 5 / ESRD pre-dialysis",
    category: "Chronic Kidney Disease",
    specialty: "nephrology",
    description: "Stage 5 CKD or ESRD not yet on dialysis",
    skeleton: `Dx: CKD stage 5 (ESRD), GFR [eGFR], not yet on dialysis, etiology [diabetic / hypertensive / other]
Comorbidities: [HTN, DM2, PVD, CAD, etc.]
Labs: Cr [value], eGFR [value], BUN [value], K [value], HCO3 [value], Hgb [value], Ca [value], Phos [value], PTH [value], albumin [value]
Meds: [list]
BP: [value]
Symptoms: [uremic symptoms - nausea, anorexia, fatigue, pruritus, volume status]
Vascular access: [AV fistula mature / maturing / planned, central catheter, none]
Plan:
- [Address hyperkalemia: stop K-sparing meds, K binder if K >5.5]
- [Bicarb supplementation if HCO3 <22]
- Continue [phos binder, vitamin D analog, ESA, iron]
- Plan for dialysis initiation [based on symptoms / GFR / labs]
- Vascular access [status and next steps]
- Modality: [HD vs PD] decision [made / pending]
- Nutrition counseling for ESRD diet
- Transplant evaluation [referred / scheduled / declined]
- ACP discussion documented`,
  },
  {
    id: "neph-esrd-hd",
    name: "ESRD on Hemodialysis",
    category: "Dialysis",
    specialty: "nephrology",
    description: "Outpatient HD patient follow-up",
    skeleton: `Dx: ESRD on hemodialysis [3x/week, MWF or TThS], etiology [diabetic / hypertensive / other], started [date]
Access: [AV fistula left/right arm, AV graft, tunneled HD catheter]
Dialysis Rx: [duration, blood flow, dialysate], dry weight [value]
Comorbidities: [list]
Recent labs: Kt/V [value], URR [value], Hgb [value], iron sat [value], ferritin [value], Ca [value], Phos [value], PTH [value], albumin [value], K pre/post [values]
Meds: [phos binders, ESA dose, iron, calcimimetic, vitamin D, BP meds]
Symptoms: [intradialytic hypotension, cramps, fatigue, pruritus, volume status]
Plan:
- Continue current dialysis prescription
- Anemia: [adjust ESA based on Hgb/iron]
- CKD-MBD: [phos binder titration, calcimimetic adjustment]
- BP management: [interdialytic weight gain, dry weight reassessment]
- Access surveillance
- Transplant status: [active list / inactive / not candidate]
- Nutrition: continue ESRD diet
- Vaccinations up to date`,
  },
  {
    id: "neph-aki",
    name: "Acute Kidney Injury (AKI)",
    category: "Acute Kidney Injury",
    specialty: "nephrology",
    description: "AKI workup and management",
    skeleton: `Dx: AKI - [pre-renal / intrinsic / post-renal], stage [1/2/3] per KDIGO
Baseline Cr: [value], current Cr: [value], Δ: [value]
Etiology: [hypovolemia / sepsis / nephrotoxic exposure / contrast / ATN / AIN / obstruction / other]
Inciting factors: [hypotension, NSAIDs, contrast, antibiotics, ACE/ARB, diuretics]
Labs: BMP, urinalysis [findings], FENa [value if checked], urine sediment [findings]
Imaging: [renal US findings if obtained]
Volume status: [hypovolemic / euvolemic / hypervolemic]
UOP: [oliguric / non-oliguric]
Plan:
- Hold nephrotoxic agents [list specific meds]
- [Volume resuscitation if pre-renal / diuresis if volume overload]
- Renal-dose all medications
- [Treat underlying cause]
- [Address electrolyte abnormalities, acidosis]
- Avoid contrast if possible
- [Consider RRT if K >6.5 unresponsive, severe acidosis, volume overload, uremic complications]
- Monitor Cr, UOP, electrolytes [frequency]
- Outpatient follow-up [timing]`,
  },

  // ── Electrolytes ───────────────────────────────────────────────────
  {
    id: "neph-hyperkalemia",
    name: "Hyperkalemia",
    category: "Electrolyte Disorders",
    specialty: "nephrology",
    description: "Hyperkalemia management (acute or chronic)",
    skeleton: `Dx: Hyperkalemia - [mild 5.0-5.5 / moderate 5.6-6.0 / severe >6.0], K [value]
Setting: [acute / chronic in setting of CKD]
Contributing factors: [CKD, ACE/ARB, MRA, K-sparing diuretics, NSAIDs, K supplements, dietary, acidosis, tissue breakdown]
EKG: [normal / peaked T waves / QRS widening / no EKG changes]
Symptoms: [asymptomatic / weakness / palpitations]
Other labs: Cr [value], HCO3 [value], glucose [value]
Plan:
- [If severe with EKG changes: IV calcium gluconate, insulin/D50, beta-agonist, bicarbonate]
- Discontinue [contributing meds: ACE/ARB, MRA, K supplements]
- Initiate [Veltassa (patiromer) / Lokelma (sodium zirconium)] for chronic management
- Dietary K restriction - patient counseled
- Address underlying acidosis if present
- Repeat K in [hours/days depending on severity]
- [Consider RRT if refractory and ESRD]
- Outpatient follow-up`,
  },
  {
    id: "neph-hyperphos",
    name: "Hyperphosphatemia",
    category: "Electrolyte Disorders",
    specialty: "nephrology",
    description: "Hyperphosphatemia in CKD",
    skeleton: `Dx: Hyperphosphatemia, Phos [value], in setting of CKD stage [stage]
Other CKD-MBD labs: Ca [value], PTH [value], 25-OH Vit D [value]
Current phos binder: [none / calcium-based / sevelamer / lanthanum / iron-based, dose]
Dietary intake: [high / moderate / restricted]
Plan:
- [Initiate / titrate up] [phos binder choice] to [dose] with meals
- Reinforce dietary phosphorus restriction - avoid processed foods, colas, dairy excess
- Check Ca-Phos product
- Address [hypocalcemia / hypercalcemia] if present
- [Vitamin D analog adjustment]
- Repeat labs in [4-6 weeks]
- Continue to monitor PTH and adjust therapy`,
  },

  // ── CKD-MBD & Anemia ───────────────────────────────────────────────
  {
    id: "neph-ckd-mbd",
    name: "CKD-MBD / Secondary Hyperparathyroidism",
    category: "CKD-MBD",
    specialty: "nephrology",
    description: "Mineral bone disorder and SHPT management",
    skeleton: `Dx: CKD-Mineral Bone Disorder with secondary hyperparathyroidism in CKD stage [stage]
Labs: Ca [value], Phos [value], PTH [value, target per KDIGO], 25-OH Vit D [value], alk phos [value]
Symptoms: [bone pain, pruritus, weakness, fractures, calciphylaxis - usually asymptomatic]
Imaging/DEXA: [if obtained]
Current meds: [phos binder, calcitriol/paricalcitol, calcimimetic if HD, cholecalciferol]
Plan:
- Phos: [continue/adjust binder] target [3.5-5.5 in CKD, 3.5-5.5 in HD]
- Ca: [target 8.4-10.2, address if abnormal]
- 25-OH Vit D: [supplement with cholecalciferol if <30]
- PTH: [calcitriol/paricalcitol if active vit D needed]
- [If HD with elevated PTH despite vitamin D: cinacalcet/etelcalcetide]
- Monitor for adynamic bone disease (suppressed PTH)
- Consider parathyroidectomy if severe refractory SHPT
- Repeat CKD-MBD labs in [3 months]`,
  },
  {
    id: "neph-anemia-ckd",
    name: "Anemia of CKD",
    category: "Anemia",
    specialty: "nephrology",
    description: "Anemia management with iron and ESA",
    skeleton: `Dx: Anemia of CKD, Hgb [value] (target 10-11.5)
Iron studies: TSAT [value, target >20%], Ferritin [value, target >100 in CKD, >200 in HD]
Other workup: [B12, folate, occult GI bleed, hemolysis screen if atypical]
CKD stage: [stage], etiology of CKD: [primary]
Current ESA: [none / epoetin alfa / darbepoetin / methoxy-PEG-epoetin], dose [value], frequency [value]
Iron status: [oral iron, IV iron, none]
Plan:
- Iron repletion: [oral iron / IV iron sucrose or ferric gluconate or ferumoxytol]
- ESA: [initiate / titrate] [agent] to target Hgb 10-11
- Monitor Hgb [frequency], adjust ESA dose accordingly
- Avoid Hgb >11.5 (CV risk per CHOIR/CREATE/TREAT trials)
- [Address other contributors: GI workup if needed]
- Counsel patient on signs of [thrombosis/hypertension] with ESA
- Repeat CBC and iron studies in [4 weeks]`,
  },

  // ── Other ──────────────────────────────────────────────────────────
  {
    id: "neph-htn-ckd",
    name: "Hypertension in CKD",
    category: "Other",
    specialty: "nephrology",
    description: "BP management in CKD patient",
    skeleton: `Dx: Hypertension, [controlled / uncontrolled / resistant], in setting of CKD stage [stage]
BP today: [value], home BP avg: [value], target <120/80 or <130/80
Current meds: [list with doses]
Adherence: [reported good / questionable / patient struggling]
Other CV risk: [DM, CAD, PVD, smoking]
Labs: K [value], Cr [value], BUN [value]
Plan:
- [Titrate up / add / change] antihypertensive: [specific changes]
- [Continue ACE/ARB if albuminuria, hold if K elevated]
- [Add diuretic if volume contribution: thiazide if eGFR >30, loop if <30]
- Lifestyle: low sodium diet (<2g/day), DASH diet, exercise
- [Evaluate for secondary HTN if young, refractory, or sudden change]
- Home BP monitoring with log
- Repeat in [4 weeks]`,
  },
  {
    id: "neph-diabetic-nephropathy",
    name: "Diabetic Nephropathy",
    category: "Other",
    specialty: "nephrology",
    description: "DM-related kidney disease management",
    skeleton: `Dx: Diabetic nephropathy, CKD stage [stage], A1c [value]
DM type: [Type 1 / Type 2], duration [years]
Albuminuria: UACR [value, A1/A2/A3 stage]
BP: [value], target <130/80
Other complications: [retinopathy, neuropathy, CAD, PAD]
Current meds: [DM meds, ACE/ARB, SGLT2i, GLP-1, statin]
Plan:
- A1c target [<7 in most, <8 in advanced disease]
- Continue [ACE or ARB] - max tolerated dose
- [Add/continue SGLT2i if eGFR >20: empagliflozin / dapagliflozin] - renoprotective and CV benefit
- [Consider finerenone if persistent albuminuria despite ACE/ARB]
- Statin for CV risk reduction
- BP optimization
- Annual UACR, eye exam, foot exam
- Counsel on diabetic CKD diet
- Endocrine co-management`,
  },
  {
    id: "neph-volume-overload",
    name: "Volume Overload / CHF in CKD",
    category: "Other",
    specialty: "nephrology",
    description: "Diuresis in patient with CKD",
    skeleton: `Dx: Volume overload in setting of CKD stage [stage], [etiology - HF, AKI on CKD, dietary, missed dialysis]
Symptoms: [dyspnea, orthopnea, lower extremity edema, weight gain]
Exam: [JVD, S3, crackles, edema grade]
Labs: BNP [value], Cr [value], K [value], Na [value]
Imaging: [CXR findings, echo if available]
Current diuretic: [agent and dose]
Dry weight: [if known]
Plan:
- [Increase / change / add] diuretic: [specific plan - e.g., furosemide IV/PO, add metolazone]
- Daily weights, strict I/O
- Sodium restriction <2g/day
- Fluid restriction [amount]
- Monitor electrolytes [frequency] - watch for hypokalemia, hyponatremia, AKI
- [Echo / cardiology referral if indicated]
- [Consider ultrafiltration / dialysis if refractory and ESRD]
- Reassess in [days]`,
  },
];

export function getTemplatesBySpecialty(specialty: string): ApTemplate[] {
  return TEMPLATES.filter((t) => t.specialty === specialty);
}

export function getCategoriesForSpecialty(specialty: string): string[] {
  const cats = new Set<string>();
  for (const t of TEMPLATES) {
    if (t.specialty === specialty) cats.add(t.category);
  }
  return Array.from(cats);
}
