import Constants from "expo-constants";
import * as StoreReview from "expo-store-review";
import { createMMKV } from "react-native-mmkv";

import { toISODate } from "@/utils/prayerTimes";

export const MIN_REVIEW_USE_DAYS = 3;

const mmkv = createMMKV({ id: "store-review" });
const DAYS_KEY = "use-days";
const LAST_VERSION_KEY = "last-prompted-version";

function readDays(): string[] {
  const raw = mmkv.getString(DAYS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((day): day is string => typeof day === "string")
      : [];
  } catch {
    return [];
  }
}

function writeDays(days: string[]): void {
  mmkv.set(DAYS_KEY, JSON.stringify(days));
}

function appVersion(): string {
  return Constants.expoConfig?.version ?? "1.0.0";
}

export function resetStoreReviewState(): void {
  mmkv.remove(DAYS_KEY);
  mmkv.remove(LAST_VERSION_KEY);
}

export function recordAppUse(now: Date = new Date()): number {
  const day = toISODate(now);
  const days = readDays();
  if (!days.includes(day)) {
    days.push(day);
    writeDays(days);
  }
  return days.length;
}

export function uniqueUseDays(): number {
  return readDays().length;
}

type ReviewDeps = {
  now?: Date;
  version?: string;
  hasAction?: () => Promise<boolean>;
  requestReview?: () => Promise<void>;
};

/** Ask StoreKit/Play for a review after several distinct days of use, once per app version. */
export async function maybeRequestReview(deps: ReviewDeps = {}): Promise<boolean> {
  const days = recordAppUse(deps.now);
  if (days < MIN_REVIEW_USE_DAYS) return false;

  const version = deps.version ?? appVersion();
  if (mmkv.getString(LAST_VERSION_KEY) === version) return false;

  const hasAction = deps.hasAction ?? StoreReview.hasAction;
  if (!(await hasAction())) return false;

  const request = deps.requestReview ?? StoreReview.requestReview;
  try {
    await request();
    mmkv.set(LAST_VERSION_KEY, version);
    return true;
  } catch {
    return false;
  }
}
