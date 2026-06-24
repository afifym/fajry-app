import {
  Platform,
  Text,
  View,
  type TextProps,
  type ViewStyle,
} from 'react-native';

import { FontFamily } from '@/constants/theme';

export type ElMessiriWeight = keyof typeof FontFamily;

type Props = TextProps & {
  size: number;
  weight?: ElMessiriWeight;
  /** Layout height of the clipped box (defaults to ~size). */
  height?: number;
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
  containerStyle,
  style,
  children,
  ...rest
}: Props) {
  const boxHeight = height ?? Math.round(size * 1.02);
  const lineHeight = Math.round(size * 1.32);
  const shiftUp = Math.round(size * (Platform.OS === 'ios' ? 0.09 : 0.07));

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