import type { Icon as PhosphorIcon, IconProps } from 'phosphor-react-native';
import {
  AlarmIcon,
  BedIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  FlameIcon,
  GearIcon,
  MapPinIcon,
  MegaphoneIcon,
  MinusIcon,
  MoonIcon,
  PlusIcon,
  SunHorizonIcon,
  XIcon,
} from 'phosphor-react-native';

import { Palette } from '@/constants/theme';

export type AppIcon = PhosphorIcon;

type Props = IconProps & {
  icon: AppIcon;
  /** Ignored — kept for compatibility with previous Lucide-based call sites. */
  strokeWidth?: number;
};

/** App-wide icon wrapper — solid Phosphor icons with consistent defaults. */
export const Icon = ({
  icon: IconComponent,
  color = Palette.textSecondary,
  size = 20,
  weight = 'fill',
  strokeWidth: _strokeWidth,
  ...rest
}: Props) => (
  <IconComponent color={color} size={size} weight={weight} {...rest} />
);

export const Check = CheckIcon;
export const Back = CaretLeftIcon;
export const ChevronLeft = CaretLeftIcon;
export const ChevronRight = CaretRightIcon;
export const Flame = FlameIcon;
export const MapPin = MapPinIcon;
export const Moon = MoonIcon;
export const Settings = GearIcon;
export const Sunrise = SunHorizonIcon;
export const X = XIcon;
export const AlarmClock = AlarmIcon;
export const Adhan = MegaphoneIcon;
export const Bed = BedIcon;
export const Minus = MinusIcon;
export const Plus = PlusIcon;
