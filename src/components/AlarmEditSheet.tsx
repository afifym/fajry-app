import { type ReactNode, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeBg } from '@/components/HomeBg';
import { Palette, Radius } from '@/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

const OPEN = { duration: 380, easing: Easing.out(Easing.cubic) };
const CLOSE = { duration: 320, easing: Easing.in(Easing.cubic) };
const BACKDROP_OPEN = { duration: 380 };
const BACKDROP_CLOSE = { duration: 280 };

export function AlarmEditSheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  const [shown, setShown] = useState(visible);
  const backdrop = useSharedValue(0);
  const translateY = useSharedValue(400);

  useEffect(() => {
    if (visible) {
      setShown(true);
      backdrop.value = 0;
      translateY.value = 400;
      requestAnimationFrame(() => {
        backdrop.value = withTiming(1, BACKDROP_OPEN);
        translateY.value = withTiming(0, OPEN);
      });
      return;
    }

    backdrop.value = withTiming(0, BACKDROP_CLOSE);
    translateY.value = withTiming(400, CLOSE, (finished) => {
      if (finished) runOnJS(setShown)(false);
    });
  }, [visible, backdrop, translateY]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={shown}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={s.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close"
        >
          <Animated.View style={[StyleSheet.absoluteFill, s.backdrop, backdropStyle]} />
        </Pressable>
        <Animated.View
          style={[
            s.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
            sheetStyle,
          ]}
        >
          <HomeBg />
          <View style={s.sheetInner}>
            <View style={s.handle} />
            <View style={s.content}>{children}</View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    backgroundColor: 'rgba(10, 22, 18, 0.55)',
  },
  sheet: {
    backgroundColor: Palette.bg,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    overflow: 'hidden',
  },
  sheetInner: {
    position: 'relative',
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.border,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 24,
  },
});
