import { useCallback } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const THUMB_SIZE = 56;
// Clamp to screen width minus 24px horizontal padding on each side
const TRACK_WIDTH = Math.min(300, Dimensions.get('window').width - 48);
const MAX_TRANSLATE = TRACK_WIDTH - THUMB_SIZE - 8; // 4px padding each side

type Props = {
  onConfirm: () => void;
  label?: string;
};

export function SlideToConfirm({ onConfirm, label = 'Slide to confirm' }: Props) {
  const translateX = useSharedValue(0);
  const confirmed = useSharedValue(false);

  const fireConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (confirmed.value) return;
      translateX.value = Math.max(0, Math.min(e.translationX, MAX_TRANSLATE));
    })
    .onEnd(() => {
      if (confirmed.value) return;
      if (translateX.value >= MAX_TRANSLATE * 0.85) {
        // Completed — snap to end and fire callback
        translateX.value = withSpring(MAX_TRANSLATE);
        confirmed.value = true;
        runOnJS(fireConfirm)();
      } else {
        // Incomplete — snap back
        translateX.value = withSpring(0);
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const labelOpacity = useAnimatedStyle(() => ({
    opacity: 1 - translateX.value / (MAX_TRANSLATE * 0.5),
  }));

  return (
    <View style={styles.track} accessibilityRole="button" accessibilityLabel={label}>
      <Animated.Text style={[styles.label, labelOpacity]}>{label}</Animated.Text>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.thumb, thumbStyle]}>
          <Text style={styles.arrow}>›</Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: THUMB_SIZE + 8,
    backgroundColor: '#1A1A1A',
    borderRadius: (THUMB_SIZE + 8) / 2,
    justifyContent: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  label: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#5A5E6A',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '600',
    marginTop: -2,
  },
});
