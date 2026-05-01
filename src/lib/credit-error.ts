import { toast } from "sonner";

interface CreditInfo {
  used: number;
  limit: number;
  plan: string;
  cost?: number;
}

interface AnalyzeErrorBody {
  error?: string;
  credit?: CreditInfo;
}

/**
 * Show a friendly out-of-credits toast with an Upgrade action when an
 * analyze API returns 402. Returns true if the error was handled — callers
 * should bail out without showing a generic error toast.
 */
export function handleCreditError(
  status: number,
  data: AnalyzeErrorBody | undefined
): boolean {
  if (status !== 402 || !data?.credit) return false;

  const { used, limit, plan } = data.credit;
  const isUnlimited = plan === "unlimited";

  toast.error("Out of credits this month", {
    description: isUnlimited
      ? `You've used ${used} of your ${limit} monthly credits on the Unlimited plan. Resets on the 1st.`
      : `You've used ${used} of ${limit} credits on the ${plan} plan. Upgrade to keep working.`,
    duration: 10_000,
    action: isUnlimited
      ? undefined
      : {
          label: "Upgrade",
          onClick: () => {
            window.location.assign("/pricing");
          },
        },
  });
  return true;
}
