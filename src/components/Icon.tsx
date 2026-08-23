import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

import { Palette } from '@/constants/theme';

export type AppIcon = ComponentProps<typeof MaterialCommunityIcons>['name'];

type Props = {
  icon: AppIcon;
  color?: string;
  size?: number;
  /** Ignored — kept for compatibility with previous icon call sites. */
  strokeWidth?: number;
  /** Ignored — kept for compatibility with previous Phosphor call sites. */
  weight?: string;
};

/** App-wide icon wrapper — solid Material Community icons. */
export const Icon = ({
  icon,
  color = Palette.textSecondary,
  size = 20,
}: Props) => <MaterialCommunityIcons name={icon} color={color} size={size} />;

export const ArrowRight: AppIcon = 'arrow-right';
export const Check: AppIcon = 'check';
export const Back: AppIcon = 'chevron-left';
export const ChevronLeft: AppIcon = 'chevron-left';
export const ChevronRight: AppIcon = 'chevron-right';
export const Flame: AppIcon = 'fire';
export const MapPin: AppIcon = 'map-marker';
export const Moon: AppIcon = 'moon-waning-crescent';
export const Settings: AppIcon = 'cog';
export const Sunrise: AppIcon = 'weather-sunset-up';
export const X: AppIcon = 'close';
export const AlarmClock: AppIcon = 'alarm';
export const Adhan: AppIcon = 'mosque';
export const Bed: AppIcon = 'bed';
export const Minus: AppIcon = 'minus';
export const Plus: AppIcon = 'plus';
