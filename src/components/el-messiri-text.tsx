import {
  Platform,
  StyleSheet,
  Text,
  View,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { FontFamily } from '@/constants/theme';

export type ElMessiriWeight = keyof typeof FontFamily;

type Props = TextProps & {
  size: number;
  weight?: ElMessiriWeight;
  /** Layout height of the clipped box (defaults from `lines` × line height). */
  height?: number;
  /** Lines to reserve in the clipped box (default 1). */
  lines?: number;
  containerStyle?: ViewStyle;
};

/**
 * El Messiri ships with tall ascender/descender metrics. A fixed-height clipped
 * wrapper plus an upward nudge keeps glyphs fully visible without extra slack below.
 */
export function ElMessiriText({
  size,
  weight = 'regular',
  height,
  lines = 1,
  containerStyle,
  style,
  children,
  ...rest
}: Props) {
  const flatStyle = StyleSheet.flatten(style) as TextStyle | undefined;
  const lineHeight =
    typeof flatStyle?.lineHeight === 'number'
      ? flatStyle.lineHeight
      : Math.round(size * 1.32);
  const explicitHeight = height != null;
  const shiftUp = explicitHeight
    ? 0
    : Math.round(size * (Platform.OS === 'ios' ? 0.09 : 0.07));
  const descenderPad = Math.round(size * 0.2);
  const boxHeight =
    height ?? Math.round(lineHeight * lines + descenderPad);

  return (
    <View style={[{ height: boxHeight, overflow: 'hidden' }, containerStyle]}>
      <Text
        style={[
          {
            fontFamily: FontFamily[weight],
            fontSize: size,
            lineHeight,
            transform: [{ translateY: -shiftUp }],
            ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
          },
          style,
        ]}
        {...rest}
      >
        {children}
      </Text>
    </View>
  );
}