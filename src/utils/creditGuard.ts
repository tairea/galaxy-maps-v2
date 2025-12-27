import useRootStore from "@/store/index";

/**
 * Check if user has credits available for AI operations
 * If not, show the paywall dialog
 * @returns Promise<boolean> - true if user can proceed, false if blocked by paywall
 */
export async function guardAIActionOrPaywall(): Promise<boolean> {
  const store = useRootStore();
  const userData = store.user?.data || {};

  // Wait for credits to be checked
  if (!userData.creditsChecked) {
    store.setSnackbar({
      show: true,
      text: "Checking your AI credit balance...",
      color: "baseAccent",
    });
    return false;
  }

  const currentCredits = userData.credits || 0;

  // If credits depleted, show paywall
  if (currentCredits <= 0) {
    const hasActiveSubscription = Boolean(userData.hasActiveSubscription);

    store.setPaywall({
      show: true,
      text: hasActiveSubscription
        ? "You've run out of AI credits. Your credits will reset at the start of next month."
        : "You've run out of AI credits. Upgrade to premium for 10,000 monthly credits or wait for your daily reset.",
    });
    return false;
  }

  return true; // Proceed with AI call
}
