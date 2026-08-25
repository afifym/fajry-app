import { NativeModule, registerWebModule } from "expo";

class IosAlarmKitModule extends NativeModule {}

export default registerWebModule(IosAlarmKitModule, "IosAlarmKitModule");
