import { ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, Lock } from "lucide-react";

/**
 * Static mockups for landing page feature previews.
 * Server components — no interactivity, just visual demos.
 */

function MockCard({ label, children, accent }: { label: string; children: React.ReactNode; accent: string }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 border-b ${accent}`}>
        {label}
      </div>
      <div className="p-3 text-xs font-mono leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

export function ClinicalMockup() {
  return (
    <div className="grid md:grid-cols-2 gap-3 text-xs">
      <MockCard label="Skeleton input" accent="bg-muted/50 text-muted-foreground">
        62M established f/u<br />
        HTN, DM2, CKD3a<br />
        BP 158/94, HR 72<br />
        A1c 8.2%, Cr 1.4<br />
        Meds: lisinopril 20, metformin 1000 BID
      </MockCard>
      <MockCard label="Generated A/P" accent="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
        <div className="space-y-1.5 not-italic">
          <div><span className="text-foreground font-semibold">1. Hypertension, uncontrolled</span> <span className="text-muted-foreground">(I10)</span></div>
          <div className="pl-2 text-[11px]">Stage 2 with target organ damage. Increase lisinopril to 40mg daily, recheck in 4 weeks.</div>
          <div className="pt-2"><span className="text-foreground font-semibold">2. T2DM, suboptimal</span> <span className="text-muted-foreground">(E11.65)</span></div>
          <div className="pl-2 text-[11px]">A1c 8.2%. Add empagliflozin 10mg daily for cardio-renal protection.</div>
          <div className="mt-2 pt-2 border-t flex items-center justify-between text-[11px]">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">E/M: 99214 (Moderate MDM)</span>
            <span className="text-green-600 dark:text-green-400 font-semibold">~$128 RVU</span>
          </div>
        </div>
      </MockCard>
    </div>
  );
}

export function AcademicMockup() {
  return (
    <div className="space-y-3">
      <MockCard label="Bullet points input" accent="bg-muted/50 text-muted-foreground">
        - SGLT2i reduce HF hospitalization in T2DM<br />
        - EMPA-REG showed CV benefits<br />
        - Recent meta-analyses suggest CKD slowing
      </MockCard>
      <div className="flex justify-center">
        <ArrowRight className="h-4 w-4 text-emerald-500" />
      </div>
      <MockCard label="Generated manuscript w/ verified citations" accent="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <div className="space-y-2 not-italic">
          <div className="text-foreground font-semibold">Cardiovascular and Renal Benefits of SGLT2 Inhibitors</div>
          <div className="text-[11px]">Sodium-glucose cotransporter-2 (SGLT2) inhibitors reduce heart failure hospitalization in patients with type 2 diabetes <span className="text-emerald-600 font-semibold">[1]</span>. The EMPA-REG OUTCOME trial demonstrated significant cardiovascular benefits <span className="text-emerald-600 font-semibold">[2]</span>...</div>
          <div className="pt-2 border-t space-y-1 text-[10px]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
              <span><span className="font-semibold">[1]</span> Zinman B, et al. <span className="italic">N Engl J Med.</span> 2015. PMID: 26378978</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
              <span><span className="font-semibold">[2]</span> McMurray JJV, et al. <span className="italic">N Engl J Med.</span> 2019. PMID: 31535829</span>
            </div>
          </div>
        </div>
      </MockCard>
    </div>
  );
}

export function AiIntegrityMockup() {
  return (
    <div className="space-y-3">
      <MockCard label="Pasted text" accent="bg-muted/50 text-muted-foreground">
        &ldquo;In today&apos;s rapidly evolving digital landscape, the
        intersection of technology and human creativity represents a multifaceted
        tapestry of innovation...&rdquo;
      </MockCard>
      <MockCard label="Multi-source consensus" accent="bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
        <div className="space-y-2 not-italic">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-foreground">Likely AI-Generated</span>
            </span>
            <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">87%</span>
          </div>
          <div className="space-y-1 text-[11px]">
            {[
              ["Claude analysis", 92],
              ["Sapling", 78],
              ["Pangram Labs", 91],
              ["Local heuristics", 85],
            ].map(([name, score]) => (
              <div key={name} className="flex items-center gap-2">
                <span className="w-28 text-muted-foreground shrink-0">{name}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-violet-500" style={{ width: `${score}%` }} />
                </div>
                <span className="w-8 text-right text-foreground font-medium">{score}%</span>
              </div>
            ))}
          </div>
        </div>
      </MockCard>
    </div>
  );
}

export function PrivacyMockup() {
  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-3 gap-3">
        <MockCard label="You type" accent="bg-muted/50 text-muted-foreground">
          Patient: <span className="bg-yellow-200/70 dark:bg-yellow-900/40 px-0.5 rounded">John Smith</span><br />
          DOB: <span className="bg-yellow-200/70 dark:bg-yellow-900/40 px-0.5 rounded">5/15/1962</span><br />
          MRN: <span className="bg-yellow-200/70 dark:bg-yellow-900/40 px-0.5 rounded">12345678</span><br />
          62M with HTN, DM2
        </MockCard>
        <MockCard label="Sent to AI" accent="bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300">
          <span className="text-[10px] flex items-center gap-1 mb-1">
            <Lock className="h-3 w-3" /> Redacted in browser
          </span>
          Patient: [REDACTED-NAME-1]<br />
          DOB: [REDACTED-DOB-1]<br />
          MRN: [REDACTED-MRN-1]<br />
          62M with HTN, DM2
        </MockCard>
        <MockCard label="You see" accent="bg-card text-foreground">
          <span className="text-[10px] flex items-center gap-1 mb-1 text-green-600">
            <ShieldCheck className="h-3 w-3" /> Re-injected locally
          </span>
          Patient: <span className="text-foreground font-medium">John Smith</span><br />
          DOB: <span className="text-foreground font-medium">5/15/1962</span><br />
          MRN: <span className="text-foreground font-medium">12345678</span><br />
          62M with HTN, DM2
        </MockCard>
      </div>
      <p className="text-[11px] text-center text-muted-foreground italic">
        Real values never leave your device. Token map stays in your browser.
      </p>
    </div>
  );
}
