import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { AlarmClock, Bed, Icon } from '@/components/Icon';

const SIZE = 300;
const CENTER = SIZE / 2;
const TRACK_R = 112;
const FACE_R = 86;
const LABEL_R = 68;
const STROKE = 18;
const HANDLE = 32;
/** Hour labels on a standard 12h face (12 at top, clockwise). */
const CLOCK_HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

type Props = {
  bedTime: Date | null;
  wakeTime: Date | null;
  bedEnabled?: boolean;
  wakeEnabled?: boolean;
};

function dateTo12Angle(date: Date): number {
  const mins = (date.getHours() % 12) * 60 + date.getMinutes();
  return (mins / 720) * 360;
}

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcD(cx: number, cy: number, r: number, start: number, end: number): string {
  let span = end - start;
  if (span <= 0) span += 360;
  if (span >= 359.9) return '';
  const large = span > 180 ? 1 : 0;
  const s = polarToCartesian(cx, cy, r, start);
  const e = polarToCartesian(cx, cy, r, end);
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

function sleepArcAngles(bed: Date, wake: Date): { start: number; end: number } {
  const start = dateTo12Angle(bed);
  let end = dateTo12Angle(wake);
  const bedMins = bed.getHours() * 60 + bed.getMinutes();
  const wakeMins = wake.getHours() * 60 + wake.getMinutes();
  if (wakeMins <= bedMins) end += 360;
  if (end <= start) end += 360;
  return { start, end };
}

function sleepDurationMs(bed: Date, wake: Date): number {
  let diff = wake.getTime() - bed.getTime();
  if (diff <= 0) diff += 24 * 3_600_000;
  return diff;
}

function formatDurationParts(ms: number): { hours: number; minutes: number } {
  const total = Math.max(0, Math.round(ms / 60_000));
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

function hour12ToAngle(h12: number): number {
  return (h12 % 12) * 30;
}

function Handle({
  x,
  y,
  icon,
  muted,
}: {
  x: number;
  y: number;
  icon: LucideIcon;
  muted?: boolean;
}) {
  return (
    <View
      style={[
        s.handle,
        {
          left: x - HANDLE / 2,
          top: y - HANDLE / 2,
        },
        muted && s.handleMuted,
      ]}
    >
      <Icon icon={icon} size={15} color={muted ? '#4A5568' : '#ffffff'} />
    </View>
  );
}

export const SleepWakeClock = ({
  bedTime,
  wakeTime,
  bedEnabled = true,
  wakeEnabled = true,
}: Props) => {
  const hasArc = bedTime && wakeTime;
  const arcPath = hasArc
    ? (() => {
        const { start, end } = sleepArcAngles(bedTime, wakeTime);
        return arcD(CENTER, CENTER, TRACK_R, start, end);
      })()
    : '';
  const duration = hasArc ? formatDurationParts(sleepDurationMs(bedTime, wakeTime)) : null;

  const bedPt = bedTime ? polarToCartesian(CENTER, CENTER, TRACK_R, dateTo12Angle(bedTime)) : null;
  const wakePt = wakeTime ? polarToCartesian(CENTER, CENTER, TRACK_R, dateTo12Angle(wakeTime)) : null;

  return (
    <View style={s.dial}>
      <Svg width={SIZE} height={SIZE}>
        <Defs>
          <LinearGradient id="sleepArc" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#C9A84C" />
            <Stop offset="100%" stopColor="#06B6D4" />
          </LinearGradient>
        </Defs>

        <Circle
          cx={CENTER}
          cy={CENTER}
          r={FACE_R}
          fill="#060C1A"
          stroke="#1E2D4A"
          strokeWidth={1}
          strokeDasharray="3 5"
        />

        {Array.from({ length: 12 }, (_, i) => {
          const angle = i * 30;
          const inner = polarToCartesian(CENTER, CENTER, FACE_R - 6, angle);
          const outer = polarToCartesian(CENTER, CENTER, FACE_R - (i % 2 === 0 ? 14 : 10), angle);
          return (
            <Path
              key={i}
              d={`M ${inner.x} ${inner.y} L ${outer.x} ${outer.y}`}
              stroke="#253352"
              strokeWidth={i % 2 === 0 ? 1.5 : 1}
            />
          );
        })}

        {CLOCK_HOURS.map((h) => {
          const pt = polarToCartesian(CENTER, CENTER, LABEL_R, hour12ToAngle(h));
          return (
            <SvgText
              key={h}
              x={pt.x}
              y={pt.y + 4}
              fill="#4A5568"
              fontSize={11}
              fontWeight="500"
              textAnchor="middle"
            >
              {h}
            </SvgText>
          );
        })}

        <Circle
          cx={CENTER}
          cy={CENTER}
          r={TRACK_R}
          fill="none"
          stroke="#1E2D4A"
          strokeWidth={STROKE}
        />

        {arcPath ? (
          <Path
            d={arcPath}
            fill="none"
            stroke="url(#sleepArc)"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
        ) : null}
      </Svg>

      {bedPt ? <Handle x={bedPt.x} y={bedPt.y} icon={Bed} muted={!bedEnabled} /> : null}
      {wakePt ? <Handle x={wakePt.x} y={wakePt.y} icon={AlarmClock} muted={!wakeEnabled} /> : null}

      <View style={s.center}>
        {duration ? (
          <>
            <Text style={s.durationHours}>{duration.hours}hr</Text>
            <Text style={s.durationMinutes}>{duration.minutes} MIN</Text>
          </>
        ) : (
          <Text style={s.durationEmpty}>—</Text>
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  dial: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    position: 'absolute',
    width: HANDLE,
    height: HANDLE,
    borderRadius: HANDLE / 2,
    backgroundColor: '#1A233A',
    borderWidth: 2,
    borderColor: '#2A3F5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleMuted: { opacity: 0.5 },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationHours: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  durationMinutes: {
    color: '#8892A4',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  durationEmpty: {
    color: '#4A5568',
    fontSize: 28,
    fontWeight: '300',
  },
});
