import { useCallback, useRef, useState, type RefObject } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";

import type { AppIcon } from "@/components/Icon";
import { Adhan, Icon, Sunrise } from "@/components/Icon";
import { ElMessiriText } from "@/components/el-messiri-text";
import { featureFlags } from "@/constants/featureFlags";
import { ARC_GRADIENT_HIGHLIGHT } from "@/constants/goldGradient";
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
const UNSELECTED_STROKE = 30;
const HIT_SIZE = 44;
const SELECTED_TRACK_OPACITY = 0.95;

const DURATION_HOURS_SIZE = 28;
const DURATION_HOURS_HEIGHT = Math.round(DURATION_HOURS_SIZE * 1.32);
const DURATION_EMPTY_SIZE = 24;
const DURATION_EMPTY_HEIGHT = Math.round(DURATION_EMPTY_SIZE * 1.32);

const QUARTER_HOUR_LABELS = [
  { label: "12", angle: 0 },
  { label: "3", angle: 90 },
  { label: "6", angle: 180 },
  { label: "9", angle: 270 },
] as const;

const QUARTER_LABEL_R = FACE_R - 28;

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

const SELECTED_ARC_GRADIENT_ID = "sleepArcGradient";
const FAJR_TICK_GRADIENT_ID = "fajrTickGradient";
const FAJR_BADGE_GRADIENT_ID = "fajrBadgeGradient";
const FAJR_TICK_GRADIENT_SPAN = STROKE / 2 + 16;

function GoldArcLinearGradient({
  id,
  x1,
  y1,
  x2,
  y2,
  reversed,
}: {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  reversed?: boolean;
}) {
  return (
    <LinearGradient
      id={id}
      gradientUnits="userSpaceOnUse"
      x1={reversed ? x2 : x1}
      y1={reversed ? y2 : y1}
      x2={reversed ? x1 : x2}
      y2={reversed ? y1 : y2}
    >
      <Stop offset="0%" stopColor={Palette.goldMuted} />
      <Stop offset="50%" stopColor={Palette.gold} />
      <Stop offset="100%" stopColor={ARC_GRADIENT_HIGHLIGHT} />
    </LinearGradient>
  );
}

function SelectedArcGradient({
  startAngle,
  endAngle,
}: {
  startAngle: number;
  endAngle: number;
}) {
  const start = polarToCartesian(CENTER, CENTER, TRACK_R, startAngle);
  const end = polarToCartesian(CENTER, CENTER, TRACK_R, endAngle);

  return (
    <Defs>
      <GoldArcLinearGradient
        id={SELECTED_ARC_GRADIENT_ID}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        reversed
      />
    </Defs>
  );
}

function ArcEndpoint({
  angle,
  fill,
  muted,
}: {
  angle: number;
  fill: string;
  muted?: boolean;
}) {
  const pt = polarToCartesian(CENTER, CENTER, TRACK_R, angle);

  return (
    <Circle
      cx={pt.x}
      cy={pt.y}
      r={STROKE / 2}
      fill={muted ? Palette.borderSubtle : fill}
      opacity={muted ? 0.55 : SELECTED_TRACK_OPACITY}
    />
  );
}

function AnchorDot({ angle }: { angle: number }) {
  const pt = polarToCartesian(CENTER, CENTER, TRACK_R, angle);

  return (
    <Circle cx={pt.x} cy={pt.y} r={STROKE / 4} fill={Palette.bg} />
  );
}

function formatDurationParts(ms: number): { hours: number; minutes: number } {
  const total = Math.max(0, Math.round(ms / 60_000));
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

function DraggableArcHandle({
  angle,
  disabled,
  dialPageOffset,
  onDragStart,
  onAngleChange,
  onDragEnd,
  accessibilityLabel,
}: {
  angle: number;
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
          s.arcHandleHit,
          {
            left: pt.x - HIT_SIZE / 2,
            top: pt.y - HIT_SIZE / 2,
          },
          disabled && s.arcHandleDisabled,
        ]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="adjustable"
      />
    </GestureDetector>
  );
}

function FajrTickGradient({ angle }: { angle: number }) {
  const inner = polarToCartesian(
    CENTER,
    CENTER,
    TRACK_R - FAJR_TICK_GRADIENT_SPAN,
    angle,
  );
  const outer = polarToCartesian(
    CENTER,
    CENTER,
    TRACK_R + FAJR_TICK_GRADIENT_SPAN,
    angle,
  );

  return (
    <Defs>
      <GoldArcLinearGradient
        id={FAJR_TICK_GRADIENT_ID}
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
        reversed
      />
    </Defs>
  );
}

function PrayerTick({
  angle,
  useArcGradient,
}: {
  angle: number;
  useArcGradient?: boolean;
}) {
  const tickInner = polarToCartesian(CENTER, CENTER, TRACK_R - STROKE / 2 - 4, angle);
  const tickOuter = polarToCartesian(CENTER, CENTER, TRACK_R + STROKE / 2 + 4, angle);

  return (
    <Path
      d={`M ${tickInner.x.toFixed(1)} ${tickInner.y.toFixed(1)} L ${tickOuter.x.toFixed(1)} ${tickOuter.y.toFixed(1)}`}
      stroke={
        useArcGradient ? `url(#${FAJR_TICK_GRADIENT_ID})` : Palette.gold
      }
      strokeWidth={useArcGradient ? 4 : 3}
      strokeLinecap="round"
    />
  );
}

function QuarterHourLabel({ label, angle }: { label: string; angle: number }) {
  const pt = polarToCartesian(CENTER, CENTER, QUARTER_LABEL_R, angle);

  return (
    <View
      style={[s.quarterLabel, { left: pt.x - 14, top: pt.y - 10 }]}
      pointerEvents="none"
    >
      <Text style={s.quarterLabelText}>{label}</Text>
    </View>
  );
}

function PrayerTimeHighlight({
  angle,
  icon,
  name,
  useArcGradient,
}: {
  angle: number;
  icon: AppIcon;
  name: string;
  useArcGradient?: boolean;
}) {
  const pt = polarToCartesian(CENTER, CENTER, MARKER_R, angle);

  return (
    <View
      style={[s.prayerHighlight, { left: pt.x - 14, top: pt.y - 14 }]}
      accessibilityLabel={name}
      pointerEvents="none"
    >
      <View style={[s.prayerBadge, useArcGradient && s.prayerBadgeGradient]}>
        {useArcGradient ? (
          <Svg width={28} height={28} style={s.prayerBadgeRing}>
            <Defs>
              <GoldArcLinearGradient
                id={FAJR_BADGE_GRADIENT_ID}
                x1={0}
                y1={0}
                x2={28}
                y2={28}
                reversed
              />
            </Defs>
            <Circle
              cx={14}
              cy={14}
              r={12.5}
              fill={`url(#${FAJR_BADGE_GRADIENT_ID})`}
            />
          </Svg>
        ) : null}
        <Icon
          icon={icon}
          size={15}
          color={useArcGradient ? Palette.bgInset : Palette.gold}
        />
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
  const sleepArc = hasArc ? sleepArcAngles(previewBed, previewWake) : null;
  const selectedArcPath = sleepArc
    ? arcD(CENTER, CENTER, TRACK_R, sleepArc.start, sleepArc.end)
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
    <View style={s.clockWrap}>
      <View ref={dialRef} style={s.dial} onLayout={measureDial}>
      <Svg width={SIZE} height={SIZE}>
        {Array.from({ length: 60 }, (_, i) => {
          const angle = i * 6;
          const isHour = i % 5 === 0;
          const isQuarter = i % 15 === 0;
          const inner = polarToCartesian(CENTER, CENTER, FACE_R - 5, angle);
          const outer = polarToCartesian(
            CENTER,
            CENTER,
            FACE_R - (isQuarter ? 15 : isHour ? 12 : 8),
            angle,
          );
          return (
            <Path
              key={i}
              d={`M ${inner.x} ${inner.y} L ${outer.x} ${outer.y}`}
              stroke={Palette.textSecondary}
              strokeWidth={isQuarter ? 1.5 : isHour ? 1.15 : 0.85}
              strokeLinecap="round"
              opacity={isQuarter ? 0.72 : isHour ? 0.58 : 0.38}
            />
          );
        })}

        <Circle
          cx={CENTER}
          cy={CENTER}
          r={TRACK_R}
          fill="none"
          stroke={Palette.sleepTrack}
          strokeWidth={UNSELECTED_STROKE}
        />

        {selectedArcPath && sleepArc ? (
          <>
            <SelectedArcGradient
              startAngle={sleepArc.start}
              endAngle={sleepArc.end}
            />
            <Path
              d={selectedArcPath}
              fill="none"
              stroke={`url(#${SELECTED_ARC_GRADIENT_ID})`}
              strokeWidth={STROKE}
              strokeLinecap="butt"
              opacity={SELECTED_TRACK_OPACITY}
            />
            {bedAngle != null ? (
              <ArcEndpoint
                angle={bedAngle}
                fill={ARC_GRADIENT_HIGHLIGHT}
                muted={!bedEnabled}
              />
            ) : null}
            {wakeAngle != null ? (
              <ArcEndpoint
                angle={wakeAngle}
                fill={Palette.goldMuted}
                muted={!wakeEnabled}
              />
            ) : null}
            {bedAngle != null ? <AnchorDot angle={bedAngle} /> : null}
            {wakeAngle != null ? <AnchorDot angle={wakeAngle} /> : null}
          </>
        ) : null}

        {featureFlags.clockPrayerTimeHighlights && fajrAngle != null ? (
          <FajrTickGradient angle={fajrAngle} />
        ) : null}
        {featureFlags.clockPrayerTimeHighlights && fajrAngle != null ? (
          <PrayerTick angle={fajrAngle} useArcGradient />
        ) : null}
        {featureFlags.clockPrayerTimeHighlights && sunriseAngle != null ? (
          <PrayerTick angle={sunriseAngle} />
        ) : null}
      </Svg>

      {QUARTER_HOUR_LABELS.map(({ label, angle }) => (
        <QuarterHourLabel key={label} label={label} angle={angle} />
      ))}

      {featureFlags.clockPrayerTimeHighlights && fajrAngle != null && fajrTime ? (
        <PrayerTimeHighlight
          angle={fajrAngle}
          icon={Adhan}
          name="Fajr"
          useArcGradient
        />
      ) : null}
      {featureFlags.clockPrayerTimeHighlights && sunriseAngle != null && sunriseTime ? (
        <PrayerTimeHighlight angle={sunriseAngle} icon={Sunrise} name="Sunrise" />
      ) : null}

      {bedAngle != null ? (
        <DraggableArcHandle
          angle={bedAngle}
          disabled={bedDragDisabled}
          dialPageOffset={dialPageOffset}
          onDragStart={measureDial}
          onAngleChange={handleBedAngleChange}
          onDragEnd={handleBedDragEnd}
          accessibilityLabel="Adjust go to bed time"
        />
      ) : null}

      {wakeAngle != null ? (
        <DraggableArcHandle
          angle={wakeAngle}
          disabled={wakeDragDisabled}
          dialPageOffset={dialPageOffset}
          onDragStart={measureDial}
          onAngleChange={handleWakeAngleChange}
          onDragEnd={handleWakeDragEnd}
          accessibilityLabel="Adjust wake up time"
        />
      ) : null}
      </View>

      <View style={s.durationRow} pointerEvents="none">
        {duration ? (
          <View style={s.durationLine}>
            <ElMessiriText
              size={DURATION_HOURS_SIZE}
              weight="bold"
              height={DURATION_HOURS_HEIGHT}
              style={s.durationHours}
            >
              {duration.hours} hr
            </ElMessiriText>
            <ElMessiriText
              size={DURATION_HOURS_SIZE}
              weight="bold"
              height={DURATION_HOURS_HEIGHT}
              style={s.durationHours}
            >
              {duration.minutes} min
            </ElMessiriText>
          </View>
        ) : (
          <ElMessiriText
            size={DURATION_EMPTY_SIZE}
            weight="regular"
            height={DURATION_EMPTY_HEIGHT}
            style={s.durationEmpty}
          >
            —
          </ElMessiriText>
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  clockWrap: {
    alignItems: "center",
  },
  dial: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  arcHandleHit: {
    position: "absolute",
    width: HIT_SIZE,
    height: HIT_SIZE,
  },
  arcHandleDisabled: { opacity: 0.35 },
  durationRow: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    paddingBottom: 4,
    minHeight: DURATION_HOURS_HEIGHT,
  },
  durationLine: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  durationHours: {
    color: Palette.gold,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  durationEmpty: {
    color: Palette.textMuted,
    textAlign: "center",
  },
  quarterLabel: {
    position: 'absolute',
    width: 28,
    alignItems: 'center',
  },
  quarterLabelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
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
  prayerBadgeGradient: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  prayerBadgeRing: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
