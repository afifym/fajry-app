import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

const TILE = 70;

export const HomeBg = () => {
  const { width, height } = useWindowDimensions();

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <Pattern id="islamic" x={0} y={0} width={TILE} height={TILE} patternUnits="userSpaceOnUse">
          <Circle cx={0} cy={0} r={TILE} fill="none" stroke="#1A2D50" strokeWidth={1} />
          <Circle cx={TILE} cy={0} r={TILE} fill="none" stroke="#1A2D50" strokeWidth={1} />
          <Circle cx={0} cy={TILE} r={TILE} fill="none" stroke="#1A2D50" strokeWidth={1} />
          <Circle cx={TILE} cy={TILE} r={TILE} fill="none" stroke="#1A2D50" strokeWidth={1} />
        </Pattern>
        <RadialGradient id="vignette" cx="50%" cy="46%" r="65%">
          <Stop offset="0%" stopColor="#060C1A" stopOpacity={0} />
          <Stop offset="75%" stopColor="#060C1A" stopOpacity={0.2} />
          <Stop offset="100%" stopColor="#060C1A" stopOpacity={0.75} />
        </RadialGradient>
      </Defs>

      <Rect width={width} height={height} fill="url(#islamic)" />
      <Rect width={width} height={height} fill="url(#vignette)" />
    </Svg>
  );
};
