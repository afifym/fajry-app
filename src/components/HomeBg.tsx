import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Palette } from '@/constants/theme';

export const HomeBg = () => {
  const { width, height } = useWindowDimensions();

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="base" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#102824" />
          <Stop offset="45%" stopColor={Palette.bg} />
          <Stop offset="100%" stopColor="#060E0C" />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#base)" />
    </Svg>
  );
};
