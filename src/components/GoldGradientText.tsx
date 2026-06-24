import { useId, useState } from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

import { goldArcGradientStops } from '@/constants/goldGradient';
import { FontFamily } from '@/constants/theme';

type Weight = keyof typeof FontFamily;

type Props = {
  children: string;
  size: number;
  weight?: Weight;
  reversed?: boolean;
  containerStyle?: ViewStyle;
};

export function GoldGradientText({
  children,
  size,
  weight = 'bold',
  reversed,
  containerStyle,
}: Props) {
  const gradientId = `goldGrad-${useId().replace(/:/g, '')}`;
  const fontFamily = FontFamily[weight];
  const height = Math.ceil(size * 1.02);
  const widthPad = Math.max(6, Math.round(size * 0.08));
  const [width, setWidth] = useState(
    Math.ceil(children.length * size * 0.56) + widthPad,
  );

  return (
    <View style={[{ overflow: 'visible' }, containerStyle]}>
      <Text
        style={{
          position: 'absolute',
          opacity: 0,
          fontFamily,
          fontSize: size,
          letterSpacing: 0.5,
        }}
        onLayout={(e) =>
          setWidth(Math.ceil(e.nativeEvent.layout.width) + widthPad)
        }
      >
        {children}
      </Text>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient
            id={gradientId}
            x1={reversed ? '100%' : '0%'}
            y1="0%"
            x2={reversed ? '0%' : '100%'}
            y2="0%"
          >
            {goldArcGradientStops.map((stop) => (
              <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </LinearGradient>
        </Defs>
        <SvgText
          fill={`url(#${gradientId})`}
          fontSize={size}
          fontFamily={fontFamily}
          letterSpacing={0.5}
          y={size * 0.88}
          x={0}
        >
          {children}
        </SvgText>
      </Svg>
    </View>
  );
}
