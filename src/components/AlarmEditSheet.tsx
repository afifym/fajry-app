import { type ReactNode, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, X } from '@/components/Icon';
import { Palette, Radius } from '@/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

const SLIDE = { duration: 220, easing: Easing.out(Easing.cubic) };

export function AlarmEditSheet({ visible, onClose, title, children }: Props) {
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
        backdrop.value = withTiming(1, { duration: 220 });
        translateY.value = withTiming(0, SLIDE);
      });
      return;
    }

    backdrop.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(400, SLIDE, (finished) => {
      if (finished) runOnJS(setShown)(false);
    });
  }, [visible, backdrop, translateY]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value * 0.55,
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
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close">
          <Animated.View style={[s.backdrop, backdropStyle]} />
        </Pressable>
        <Animated.View
          style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }, sheetStyle]}
        >
          <View style={s.handle} />
          <View style={s.header}>
            <Text style={s.title}>{title}</Text>
            <Pressable onPress={onClose} style={s.closeBtn} accessibilityLabel="Close">
              <Icon icon={X} size={20} />
            </Pressable>
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: Palette.bg },
  sheet: {
    backgroundColor: Palette.bgCard,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    borderColor: Palette.borderSubtle,
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.border,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  title: { color: Palette.text, fontSize: 17, fontWeight: '600' },
  closeBtn: { padding: 6 },
});
