import { type ReactNode } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { BlurView } from "expo-blur";

import { Palette, Radius } from "@/constants/theme";

type Props = {
  children: ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function GlassSurface({
  children,
  radius = Radius.lg,
  style,
  contentStyle,
}: Props) {
  return (
    <View style={[s.outline, { borderRadius: radius + 1 }, style]}>
      <BlurView
        intensity={36}
        tint="dark"
        style={[s.surface, { borderRadius: radius }, contentStyle]}
        {...(Platform.OS === "android" && {
          blurMethod: "dimezisBlurViewSdk31Plus",
        })}
      >
        <View pointerEvents="none" style={s.scrim} />
        {children}
      </BlurView>
    </View>
  );
}

const s = StyleSheet.create({
  outline: {
    padding: 1,
    overflow: "hidden",
  },
  surface: {
    overflow: "hidden",
    backgroundColor:
      Platform.OS === "android" ? "rgba(26, 46, 40, 0.12)" : undefined,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.glassOutline,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(19, 37, 32, 0.22)",
  },
});
