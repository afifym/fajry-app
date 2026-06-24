import type { AppIcon } from "@/components/Icon";
import { useCallback, useRef, useState, type RefObject } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";

import { Adhan, AlarmClock, Bed, Icon, Sunrise } from "@/components/Icon";
import { Palette } from "@/constants/theme";
import { sleepDurationBetween } from "@/utils/alarmPickerTime";
import {
  angleFromPoint,
  bedDateFrom12hAngle,
  dateTo12Angle,
  sleepHoursFrom12hAngle,
  snapBedAngle,
  snapWakeAngle,
  wakeDateFrom12hAngle,
  wakeOffsetFrom12hAngle,
} from "@/utils/clockDragTime";

const SIZE = 300;
const CENTER = SIZE / 2;
const TRACK_R = 112;
const FACE_R = 86;
const MARKER_R = 62;
const STROKE = 18;
const HANDLE = 38;

type Props = {
  bedTime: Date | null;
  wakeTime: Date | null;
  fajrTime: Date | null;
  sunriseTime?: Date | null;
  durationMs?: number;
  bedEnabled?: boolean;
  wakeEnabled?: boolean;
  onBedTimeChange?: (sleepHours: number) => void;
  onWakeTimeChange?: (offsetMinutes: number) => void;
  onTimesPreview?: (times: { bedTime: Date; wakeTime: Date }) => void;
};

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcD(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number,
): string {
  let span = end - start;
  if (span <= 0) span += 360;
  if (span >= 359.9) return "";
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

function formatDurationParts(ms: number): { hours: number; minutes: number } {
  const total = Math.max(0, Math.round(ms / 60_000));
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

function DraggableHandle({
  angle,
  icon,
  muted,
  disabled,
  dialPageOffset,
  onDragStart,
  onAngleChange,
  onDragEnd,
  accessibilityLabel,
}: {
  angle: number;
  icon: AppIcon;
  muted?: boolean;
  disabled?: boolean;
  dialPageOffset: RefObject<{ x: number; y: number }>;
  onDragStart?: () => void;
  onAngleChange: (angle: number) => void;
  onDragEnd: (angle: number) => void;
  accessibilityLabel: string;
}) {
  const pt = polarToCartesian(CENTER, CENTER, TRACK_R, angle);

  const touchToAngle = useCallback(
    (absoluteX: number, absoluteY: number) => {
      const lx = absoluteX - dialPageOffset.current.x;
      const ly = absoluteY - dialPageOffset.current.y;
      return angleFromPoint(CENTER, CENTER, lx, ly);
    },
    [dialPageOffset],
  );

  const handleUpdate = useCallback(
    (absoluteX: number, absoluteY: number) => {
      onAngleChange(touchToAngle(absoluteX, absoluteY));
    },
    [onAngleChange, touchToAngle],
  );

  const handleEnd = useCallback(
    (absoluteX: number, absoluteY: number) => {
      onDragEnd(touchToAngle(absoluteX, absoluteY));
    },
    [onDragEnd, touchToAngle],
  );

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onBegin(() => {
      if (onDragStart) runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      runOnJS(handleUpdate)(e.absoluteX, e.absoluteY);
    })
    .onEnd((e) => {
      runOnJS(handleEnd)(e.absoluteX, e.absoluteY);
    });

  return (
    <GestureDetector gesture={pan}>
      <View
        style={[
          s.handle,
          {
            left: pt.x - HANDLE / 2,
            top: pt.y - HANDLE / 2,
          },
          muted && s.handleMuted,
          disabled && s.handleDisabled,
        ]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="adjustable"
      >
        <Icon
          icon={icon}
          size={20}
          color={muted ? Palette.textMuted : Palette.gold}
        />
      </View>
    </GestureDetector>
  );
}

function PrayerTick({ angle }: { angle: number }) {
  const tickInner = polarToCartesian(CENTER, CENTER, TRACK_R - STROKE / 2 - 4, angle);
  const tickOuter = polarToCartesian(CENTER, CENTER, TRACK_R + STROKE / 2 + 4, angle);

  return (
    <Path
      d={`M ${tickInner.x.toFixed(1)} ${tickInner.y.toFixed(1)} L ${tickOuter.x.toFixed(1)} ${tickOuter.y.toFixed(1)}`}
      stroke={Palette.gold}
      strokeWidth={3}
      strokeLinecap="round"
    />
  );
}

function PrayerTimeHighlight({
  angle,
  icon,
  name,
}: {
  angle: number;
  icon: AppIcon;
  name: string;
}) {
  const pt = polarToCartesian(CENTER, CENTER, MARKER_R, angle);

  return (
    <View
      style={[s.prayerHighlight, { left: pt.x - 14, top: pt.y - 14 }]}
      accessibilityLabel={name}
      pointerEvents="none"
    >
      <View style={s.prayerBadge}>
        <Icon icon={icon} size={15} color={Palette.gold} />
      </View>
    </View>
  );
}

export const SleepWakeClock = ({
  bedTime,
  wakeTime,
  fajrTime,
  sunriseTime,
  durationMs,
  bedEnabled = true,
  wakeEnabled = true,
  onBedTimeChange,
  onWakeTimeChange,
  onTimesPreview,
}: Props) => {
  const dialRef = useRef<View>(null);
  const dialPageOffset = useRef({ x: 0, y: 0 });
  const [dragBedAngle, setDragBedAngle] = useState<number | null>(null);
  const [dragWakeAngle, setDragWakeAngle] = useState<number | null>(null);

  const measureDial = useCallback(() => {
    dialRef.current?.measureInWindow((x, y) => {
      dialPageOffset.current = { x, y };
    });
  }, []);

  const previewBed =
    fajrTime && dragBedAngle != null
      ? bedDateFrom12hAngle(dragBedAngle, fajrTime)
      : bedTime;
  const previewWake =
    fajrTime && dragWakeAngle != null
      ? wakeDateFrom12hAngle(dragWakeAngle, fajrTime, sunriseTime ?? undefined)
      : wakeTime;

  const hasArc = previewBed && previewWake;
  const arcPath = hasArc
    ? (() => {
        const { start, end } = sleepArcAngles(previewBed, previewWake);
        return arcD(CENTER, CENTER, TRACK_R, start, end);
      })()
    : "";

  const previewDurationMs = hasArc
    ? dragBedAngle != null || dragWakeAngle != null
      ? sleepDurationBetween(previewBed, previewWake)
      : (durationMs ?? sleepDurationBetween(previewBed, previewWake))
    : null;
  const duration =
    previewDurationMs != null ? formatDurationParts(previewDurationMs) : null;

  const bedAngle =
    dragBedAngle ?? (previewBed ? dateTo12Angle(previewBed) : null);
  const wakeAngle =
    dragWakeAngle ?? (previewWake ? dateTo12Angle(previewWake) : null);

  const fajrAngle = fajrTime ? dateTo12Angle(fajrTime) : null;
  const sunriseAngle = sunriseTime ? dateTo12Angle(sunriseTime) : null;

  const emitPreview = useCallback(
    (bedAng: number | null, wakeAng: number | null) => {
      if (!onTimesPreview || !fajrTime) return;
      const resolvedBedAng = bedAng ?? (bedTime ? dateTo12Angle(bedTime) : null);
      const resolvedWakeAng = wakeAng ?? (wakeTime ? dateTo12Angle(wakeTime) : null);
      if (resolvedBedAng == null || resolvedWakeAng == null) return;
      onTimesPreview({
        bedTime: bedDateFrom12hAngle(resolvedBedAng, fajrTime),
        wakeTime: wakeDateFrom12hAngle(resolvedWakeAng, fajrTime, sunriseTime ?? undefined),
      });
    },
    [onTimesPreview, fajrTime, sunriseTime, bedTime, wakeTime],
  );

  const handleBedDragEnd = useCallback(
    (angle: number) => {
      setDragBedAngle(null);
      if (!fajrTime || !onBedTimeChange) return;
      const snapped = snapBedAngle(angle, fajrTime);
      onBedTimeChange(sleepHoursFrom12hAngle(snapped, fajrTime));
    },
    [fajrTime, onBedTimeChange],
  );

  const handleBedAngleChange = useCallback(
    (angle: number) => {
      if (!fajrTime) {
        setDragBedAngle(angle);
        return;
      }
      const snapped = snapBedAngle(angle, fajrTime);
      setDragBedAngle(snapped);
      emitPreview(snapped, dragWakeAngle);
    },
    [fajrTime, dragWakeAngle, emitPreview],
  );

  const handleWakeDragEnd = useCallback(
    (angle: number) => {
      setDragWakeAngle(null);
      if (!fajrTime || !onWakeTimeChange) return;
      const snapped = snapWakeAngle(angle, fajrTime, sunriseTime ?? undefined);
      onWakeTimeChange(
        wakeOffsetFrom12hAngle(snapped, fajrTime, sunriseTime ?? undefined),
      );
    },
    [fajrTime, sunriseTime, onWakeTimeChange],
  );

  const handleWakeAngleChange = useCallback(
    (angle: number) => {
      if (!fajrTime) {
        setDragWakeAngle(angle);
        return;
      }
      const snapped = snapWakeAngle(angle, fajrTime, sunriseTime ?? undefined);
      setDragWakeAngle(snapped);
      emitPreview(dragBedAngle, snapped);
    },
    [fajrTime, sunriseTime, dragBedAngle, emitPreview],
  );

  const bedDragDisabled = !fajrTime || !bedEnabled || !onBedTimeChange;
  const wakeDragDisabled = !fajrTime || !wakeEnabled || !onWakeTimeChange;

  return (
    <View ref={dialRef} style={s.dial} onLayout={measureDial}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={FACE_R}
          fill="none"
          stroke={Palette.borderSubtle}
          strokeWidth={1}
          strokeDasharray="3 5"
        />

        {Array.from({ length: 12 }, (_, i) => {
          const angle = i * 30;
          const isMajor = i % 3 === 0;
          const inner = polarToCartesian(CENTER, CENTER, FACE_R - 5, angle);
          const outer = polarToCartesian(
            CENTER,
            CENTER,
            FACE_R - (isMajor ? 15 : 11),
            angle,
          );
          return (
            <Path
              key={i}
              d={`M ${inner.x} ${inner.y} L ${outer.x} ${outer.y}`}
              stroke={Palette.textSecondary}
              strokeWidth={isMajor ? 1.5 : 1.15}
              strokeLinecap="round"
              opacity={isMajor ? 0.72 : 0.5}
            />
          );
        })}

        <Circle
          cx={CENTER}
          cy={CENTER}
          r={TRACK_R}
          fill="none"
          stroke={Palette.borderSubtle}
          strokeWidth={STROKE}
        />

        {arcPath ? (
          <Path
            d={arcPath}
            fill="none"
            stroke={Palette.gold}
            strokeWidth={STROKE}
            strokeLinecap="round"
            opacity={0.95}
          />
        ) : null}

        {fajrAngle != null ? <PrayerTick angle={fajrAngle} /> : null}
        {sunriseAngle != null ? <PrayerTick angle={sunriseAngle} /> : null}
      </Svg>

      {fajrAngle != null && fajrTime ? (
        <PrayerTimeHighlight angle={fajrAngle} icon={Adhan} name="Fajr" />
      ) : null}
      {sunriseAngle != null && sunriseTime ? (
        <PrayerTimeHighlight angle={sunriseAngle} icon={Sunrise} name="Sunrise" />
      ) : null}

      {bedAngle != null ? (
        <DraggableHandle
          angle={bedAngle}
          icon={Bed}
          muted={!bedEnabled}
          disabled={bedDragDisabled}
          dialPageOffset={dialPageOffset}
          onDragStart={measureDial}
          onAngleChange={handleBedAngleChange}
          onDragEnd={handleBedDragEnd}
          accessibilityLabel="Adjust go to bed time"
        />
      ) : null}

      {wakeAngle != null ? (
        <DraggableHandle
          angle={wakeAngle}
          icon={AlarmClock}
          muted={!wakeEnabled}
          disabled={wakeDragDisabled}
          dialPageOffset={dialPageOffset}
          onDragStart={measureDial}
          onAngleChange={handleWakeAngleChange}
          onDragEnd={handleWakeDragEnd}
          accessibilityLabel="Adjust wake up time"
        />
      ) : null}

      <View style={s.center} pointerEvents="none">
        {duration ? (
          <>
            <Text style={s.durationHours}>{duration.hours}hr</Text>
            <Text style={s.durationMinutes}>{duration.minutes} min</Text>
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
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    position: "absolute",
    width: HANDLE,
    height: HANDLE,
    borderRadius: HANDLE / 2,
    backgroundColor: Palette.bgCard,
    borderWidth: 1.5,
    borderColor: Palette.goldMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  handleMuted: { opacity: 0.45 },
  handleDisabled: { opacity: 0.35 },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  durationHours: {
    color: Palette.gold,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  durationMinutes: {
    color: Palette.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  durationEmpty: {
    color: Palette.textMuted,
    fontSize: 28,
    fontWeight: "300",
  },
  prayerHighlight: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.goldDim,
    borderWidth: 1,
    borderColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
