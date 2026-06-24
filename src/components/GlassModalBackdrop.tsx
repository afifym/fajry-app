import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  style?: StyleProp<ViewStyle>;
};

export function GlassModalBackdrop({ style }: Props) {
  return (
    <View style={[StyleSheet.absoluteFill, style]}>
      <BlurView
        intensity={90}
        tint="dark"
        style={StyleSheet.absoluteFill}
        {...(Platform.OS === 'android' && {
          blurMethod: 'dimezisBlurViewSdk31Plus',
        })}
      />
      <View pointerEvents="none" style={s.scrim} />
    </View>
  );
}

const s = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 22, 18, 0.18)',
  },
});
