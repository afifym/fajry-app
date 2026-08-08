import { Palette } from '@/constants/theme';

/** Darker arc end (wake side on the reversed sleep arc). */
export const ARC_GRADIENT_MUTED = Palette.gold;
export const ARC_GRADIENT_HIGHLIGHT = '#F5E098';

export const arcGradientStops = [
  { offset: '0%', color: ARC_GRADIENT_MUTED },
  { offset: '100%', color: ARC_GRADIENT_HIGHLIGHT },
] as const;

export const goldArcGradientStops = [
  { offset: '0%', color: Palette.goldMuted },
  { offset: '50%', color: Palette.gold },
  { offset: '100%', color: ARC_GRADIENT_HIGHLIGHT },
] as const;
