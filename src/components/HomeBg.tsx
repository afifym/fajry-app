import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { Palette } from '@/constants/theme';

const VB_W = 400;
const VB_H = 170;

/** Mosque skyline — viewBox coords, bottom at y = VB_H. */
function MosqueSilhouette() {
  return (
    <G>
      {/* Left minaret */}
      <Path
        d="M 52 170 L 52 72 L 48 72 L 48 38 L 54 22 L 60 38 L 60 72 L 56 72 L 56 170 Z"
        fill="url(#mosqueFill)"
      />
      <Path d="M 46 68 L 62 68 L 62 74 L 46 74 Z" fill="url(#mosqueFill)" opacity={0.92} />

      {/* Left side domes */}
      <Path
        d="M 88 170 L 88 118 C 88 108 96 100 106 100 C 116 100 124 108 124 118 L 124 170 Z"
        fill="url(#mosqueFill)"
      />
      <Path
        d="M 118 170 L 118 128 C 118 120 124 114 132 114 C 140 114 146 120 146 128 L 146 170 Z"
        fill="url(#mosqueFill)"
        opacity={0.95}
      />

      {/* Main facade + grand dome */}
      <Path
        d="M 128 170 L 128 112 C 128 102 138 96 148 96 L 152 96 C 152 96 158 52 200 18 C 242 52 248 96 248 96 L 252 96 C 262 96 272 102 272 112 L 272 170 Z"
        fill="url(#mosqueFill)"
      />

      {/* Arched openings */}
      <Path
        d="M 158 170 L 158 138 C 158 130 164 124 172 124 C 180 124 186 130 186 138 L 186 170 Z"
        fill={Palette.bg}
        opacity={0.55}
      />
      <Path
        d="M 196 170 L 196 132 C 196 122 204 114 214 114 C 224 114 232 122 232 132 L 232 170 Z"
        fill={Palette.bg}
        opacity={0.55}
      />
      <Path
        d="M 214 170 L 214 138 C 214 130 220 124 228 124 C 236 124 242 130 242 138 L 242 170 Z"
        fill={Palette.bg}
        opacity={0.55}
      />

      {/* Right side domes */}
      <Path
        d="M 254 170 L 254 128 C 254 120 260 114 268 114 C 276 114 282 120 282 128 L 282 170 Z"
        fill="url(#mosqueFill)"
        opacity={0.95}
      />
      <Path
        d="M 276 170 L 276 118 C 276 108 284 100 294 100 C 304 100 312 108 312 118 L 312 170 Z"
        fill="url(#mosqueFill)"
      />

      {/* Right minaret + crescent */}
      <Path
        d="M 340 170 L 340 72 L 336 72 L 336 38 L 342 22 L 348 38 L 348 72 L 344 72 L 344 170 Z"
        fill="url(#mosqueFill)"
      />
      <Path d="M 334 68 L 350 68 L 350 74 L 334 74 Z" fill="url(#mosqueFill)" opacity={0.92} />
      <Path
        d="M 342 16 C 346 16 349 13 349 9 C 349 6 347 4 344 4 C 341 6 339 9 339 12 C 339 14 340 16 342 16 Z"
        fill={Palette.gold}
        opacity={0.55}
      />
    </G>
  );
}

export const HomeBg = () => {
  const { width, height } = useWindowDimensions();
  const mosqueW = width * 1.08;
  const mosqueH = mosqueW * 0.44;
  const mosqueX = (width - mosqueW) / 2;
  const mosqueY = height * 0.26;
  const scaleX = mosqueW / VB_W;
  const scaleY = mosqueH / VB_H;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="base" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#102824" />
          <Stop offset="45%" stopColor={Palette.bg} />
          <Stop offset="100%" stopColor="#060E0C" />
        </LinearGradient>

        <RadialGradient id="sunGlow" cx="50%" cy="36%" rx="42%" ry="28%">
          <Stop offset="0%" stopColor={Palette.gold} stopOpacity={0.14} />
          <Stop offset="55%" stopColor={Palette.gold} stopOpacity={0.04} />
          <Stop offset="100%" stopColor={Palette.bg} stopOpacity={0} />
        </RadialGradient>

        <LinearGradient id="mosqueFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#1F433C" stopOpacity={0.95} />
          <Stop offset="100%" stopColor="#122822" stopOpacity={0.98} />
        </LinearGradient>

        <LinearGradient id="horizonFade" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={Palette.bg} stopOpacity={0} />
          <Stop offset="55%" stopColor={Palette.bg} stopOpacity={0.15} />
          <Stop offset="100%" stopColor={Palette.bg} stopOpacity={0.92} />
        </LinearGradient>
      </Defs>

      <Rect width={width} height={height} fill="url(#base)" />
      <Rect width={width} height={height} fill="url(#sunGlow)" />

      <G transform={`translate(${mosqueX}, ${mosqueY}) scale(${scaleX}, ${scaleY})`}>
        <MosqueSilhouette />
      </G>

      <Rect
        x={0}
        y={mosqueY + mosqueH * 0.35}
        width={width}
        height={height - mosqueY}
        fill="url(#horizonFade)"
      />
    </Svg>
  );
};
