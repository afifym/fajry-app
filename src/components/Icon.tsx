import type { LucideIcon, LucideProps } from 'lucide-react-native';

type Props = LucideProps & {
  icon: LucideIcon;
};

/** App-wide Lucide wrapper — consistent stroke weight and default color. */
export const Icon = ({
  icon: LucideIconComponent,
  color = '#8892A4',
  size = 20,
  strokeWidth = 1.75,
  ...rest
}: Props) => (
  <LucideIconComponent color={color} size={size} strokeWidth={strokeWidth} {...rest} />
);

export {
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Moon,
  Settings,
  Sunrise,
  X,
  AlarmClock,
  Minus,
  Plus,
} from 'lucide-react-native';
