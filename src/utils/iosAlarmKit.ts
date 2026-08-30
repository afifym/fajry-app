import { Platform } from "react-native";

import type { IosAlarmKitAuthStatus } from "../../modules/ios-alarmkit";

type Native = {
  isAvailable(): Promise<boolean>;
  requestAuthorization(): Promise<IosAlarmKitAuthStatus>;
  scheduleAlarm(id: string, fireAtMs: number, title: string): Promise<void>;
  cancelAlarm(id: string): Promise<void>;
  cancelAllAlarms(): Promise<void>;
};

function getNative(): Native | null {
  if (Platform.OS !== "ios") return null;
  try {
    const loaded = require("../../modules/ios-alarmkit") as {
      default?: Native | null;
    };
    return loaded.default ?? null;
  } catch {
    return null;
  }
}

export async function isIosAlarmKitAvailable(): Promise<boolean> {
  const native = getNative();
  if (!native) return false;
  try {
    return await native.isAvailable();
  } catch {
    return false;
  }
}

export async function ensureIosAlarmKitAuthorized(): Promise<boolean> {
  const native = getNative();
  if (!native) return false;
  try {
    if (!(await isIosAlarmKitAvailable())) return false;
    const status = await native.requestAuthorization();
    return status === "authorized";
  } catch {
    return false;
  }
}

export async function scheduleIosAlarmKit(
  id: string,
  fireAtMs: number,
  title: string,
): Promise<void> {
  const native = getNative();
  if (!native) return;
  await native.scheduleAlarm(id, fireAtMs, title);
}

export async function cancelIosAlarmKit(id: string): Promise<void> {
  const native = getNative();
  if (!native) return;
  try {
    await native.cancelAlarm(id);
  } catch {
    // Already cancelled or never scheduled.
  }
}

export async function cancelAllIosAlarmKit(): Promise<void> {
  const native = getNative();
  if (!native) return;
  try {
    await native.cancelAllAlarms();
  } catch {
    // Nothing scheduled.
  }
}
