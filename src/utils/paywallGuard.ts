import useRootStore from "@/store/index";
import useGalaxyListViewStore from "@/store/galaxyListView";
import type { ICourse } from "@/store/_types";

type CountFn = () => Promise<number>;

export async function guardCreateGalaxyOrPaywall(opts?: {
  maxFree?: number;
  message?: string;
  getCreatedCount?: CountFn;
}): Promise<boolean> {
  const store = useRootStore();
  const maxFree = opts?.maxFree ?? 3;

  const userData = store.user?.data || {};
  const subscriptionChecked = Boolean(userData.subscriptionChecked);
  const hasActiveSubscription = Boolean(userData.hasActiveSubscription);

  // Paid users always allowed
  if (hasActiveSubscription) return true;

  // If we rely on subscription to bypass, but status is still loading — mirror existing UX
  if (!subscriptionChecked) {
    store.setSnackbar({
      show: true,
      text: "Hang tight — checking your subscription status.",
      color: "baseAccent",
    });
    return false;
  }

  // Count authored/owned galaxies (my courses)
  const getCreatedCount: CountFn =
    opts?.getCreatedCount ??
    (async () => {
      const galaxyListStore = useGalaxyListViewStore();
      const courses = Array.isArray(galaxyListStore.courses) ? galaxyListStore.courses : [];
      const personId = store.person?.id;
      if (!personId) return 0;
      // Mirror GalaxyListPanel.getTeachingCourses filter
      const createdByMeCount = courses.filter((course: ICourse) => {
        const isLoggedIn = store.user.loggedIn;
        const isOwner = course?.mappedBy?.personId === personId;
        const isCollaborator =
          Array.isArray(course?.collaboratorIds) && course.collaboratorIds.includes(personId);
        const notSubmitted = course?.status != "submitted";
        return isLoggedIn && (isOwner || isCollaborator) && notSubmitted;
      }).length;
      return createdByMeCount;
    });

  const createdCount = await getCreatedCount();

  if (createdCount < maxFree) return true;

  // Show Paywall dialog
  const finalMessage = `You've created ${createdCount} galaxies. Free plan includes ${maxFree}. Upgrade to create more.`;
  store.setPaywall({ show: true, text: finalMessage });
  return false;
}
