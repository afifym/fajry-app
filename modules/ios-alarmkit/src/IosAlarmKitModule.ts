import { NativeModule, requireNativeModule } from "expo";

import type { IosAlarmKitAuthStatus } from "./IosAlarmKit.types";

declare class IosAlarmKitModule extends NativeModule {
  isAvailable(): Promise<boolean>;
  requestAuthorization(): Promise<IosAlarmKitAuthStatus>;
  scheduleAlarm(id: string, fireAtMs: number, title: string): Promise<void>;
  cancelAlarm(id: string): Promise<void>;
  cancelAllAlarms(): Promise<void>;
}

export default ((): IosAlarmKitModule | null => {
  try {
    return requireNativeModule<IosAlarmKitModule>("IosAlarmKit");
  } catch {
    return null;
  }
})();
