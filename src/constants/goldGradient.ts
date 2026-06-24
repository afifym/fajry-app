import { Palette } from '@/constants/theme';

export const ARC_GRADIENT_HIGHLIGHT = '#F0D978';

export const goldArcGradientStops = [
  { offset: '0%', color: Palette.goldMuted },
  { offset: '50%', color: Palette.gold },
  { offset: '100%', color: ARC_GRADIENT_HIGHLIGHT },
] as const;
