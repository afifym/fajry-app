import { useAlarmStore } from "@/store/alarmStore";
import { useConsistencyStore } from "@/store/consistencyStore";
import { useSettingsStore } from "@/store/settingsStore";
import { clearPendingAlarmLaunch } from "@/utils/alarmEvents";
import { resetReflectionState } from "@/utils/reflections";
import { cancelAllAppAlarms } from "@/utils/scheduling";
import { resetStoreReviewState } from "@/utils/storeReview";

/** Wipe in-app setup so the welcome flow runs again. OS permissions are left alone. */
export async function resetAppFlow(): Promise<void> {
  await cancelAllAppAlarms();
  useSettingsStore.getState().resetSettings();
  useConsistencyStore.getState().resetConsistency();
  useAlarmStore.getState().resetSchedule();
  resetStoreReviewState();
  resetReflectionState();
  clearPendingAlarmLaunch();
}
