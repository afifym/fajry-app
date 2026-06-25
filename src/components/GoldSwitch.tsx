import {
  Platform,
  StyleSheet,
  Switch,
  View,
  type SwitchProps,
} from "react-native";

import { Palette } from "@/constants/theme";

type Props = Omit<SwitchProps, "trackColor" | "thumbColor">;

/** Theme switch — gold track when on; white thumb on Android. */
export function GoldSwitch({ value, style, ...rest }: Props) {
  return (
    <View style={[Platform.OS === "android" && s.wrap, style]}>
      <Switch
        value={value}
        trackColor={{ true: Palette.gold, false: Palette.borderSubtle }}
        thumbColor={Platform.OS === "android" ? "#FFFFFF" : undefined}
        ios_backgroundColor={Palette.borderSubtle}
        {...rest}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    transform: [{ scale: 1.3 }],
  },
});
