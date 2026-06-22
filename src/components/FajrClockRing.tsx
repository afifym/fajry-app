import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const SIZE = 300;
const CENTER = SIZE / 2;
const RING_R = 108;
const STROKE = 14;
const QUARTER_ANGLES = [0, 90, 180, 270];

// 12-hour clock angle: clockwise from top (12 = 0°, 3 = 90°, 6 = 180°, 9 = 270°)
function timeToAngle(date: Date): number {
  const h = date.getHours() % 12;
  const m = date.getMinutes();
  return ((h + m / 60) / 12) * 360;
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

function formatTime(date: Date): string {
  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return '';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

type Props = { fajrTime: Date | null };

export const FajrClockRing = ({ fajrTime }: Props) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);

  const nowAngle = timeToAngle(now);
  const nowPt = polarToCartesian(CENTER, CENTER, RING_R, nowAngle);

  if (!fajrTime) {
    return (
      <View style={s.wrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={CENTER} cy={CENTER} r={RING_R} fill="none" stroke="#1E2D4A" strokeWidth={STROKE} />
          {QUARTER_ANGLES.map((angle) => {
            const pt = polarToCartesian(CENTER, CENTER, RING_R, angle);
            return <Circle key={angle} cx={pt.x} cy={pt.y} r={2.5} fill="#060C1A" />;
          })}
          <Circle cx={nowPt.x} cy={nowPt.y} r={5} fill="#8892A4" />
        </Svg>
        <View style={s.center}>
          <Text style={s.nowTime}>{formatTime(now)}</Text>
          <Text style={s.noAlarm}>No upcoming alarm</Text>
        </View>
      </View>
    );
  }

  const fajrAngle = timeToAngle(fajrTime);
  const msLeft = fajrTime.getTime() - now.getTime();
  const upcoming = msLeft > 0;
  const path = upcoming ? arcD(CENTER, CENTER, RING_R, nowAngle, fajrAngle) : '';

  const fajrPt = polarToCartesian(CENTER, CENTER, RING_R, fajrAngle);

  return (
    <View style={s.wrap}>
      <Svg width={SIZE} height={SIZE}>
        {/* Background track */}
        <Circle cx={CENTER} cy={CENTER} r={RING_R} fill="none" stroke="#1E2D4A" strokeWidth={STROKE} />

        {/* Quarter-hour notch markers */}
        {QUARTER_ANGLES.map((angle) => {
          const pt = polarToCartesian(CENTER, CENTER, RING_R, angle);
          return <Circle key={angle} cx={pt.x} cy={pt.y} r={2.5} fill="#060C1A" />;
        })}

        {/* Arc: current time → Fajr */}
        {path ? (
          <Path d={path} fill="none" stroke="#C9A84C" strokeWidth={STROKE} strokeLinecap="round" />
        ) : null}

        {/* Current time dot */}
        <Circle cx={nowPt.x} cy={nowPt.y} r={5} fill="#8892A4" />

        {/* Fajr glow */}
        <Circle cx={fajrPt.x} cy={fajrPt.y} r={16} fill="#C9A84C" opacity={0.2} />

        {/* Fajr dot */}
        <Circle cx={fajrPt.x} cy={fajrPt.y} r={8} fill="#C9A84C" />
      </Svg>

      <View style={s.center}>
        <Text style={s.nowTime}>{formatTime(now)}</Text>
        <Text style={s.label}>FAJR</Text>
        <Text style={s.time}>{formatTime(fajrTime)}</Text>
        {upcoming && <Text style={s.remaining}>in {formatRemaining(msLeft)}</Text>}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
  },
  nowTime: {
    color: '#4A5568',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  label: {
    color: '#C9A84C',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  time: {
    color: '#ffffff',
    fontSize: 44,
    fontWeight: '200',
    letterSpacing: -1,
  },
  remaining: {
    color: '#06B6D4',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  noAlarm: {
    color: '#8892A4',
    fontSize: 15,
    marginTop: 6,
  },
});
