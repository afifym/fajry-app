import { useCallback, useRef, useState, type RefObject } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";

import type { AppIcon } from "@/components/Icon";
import { Adhan, AlarmClock, Bed, Icon, Sunrise } from "@/components/Icon";
import { ElMessiriText } from "@/components/el-messiri-text";
import { featureFlags } from "@/constants/featureFlags";
import { ARC_GRADIENT_HIGHLIGHT, ARC_GRADIENT_MUTED, arcGradientStops } from "@/constants/goldGradient";
import { Palette } from "@/constants/theme";
import {
  bedtimeFromSleepHours,
  sleepDurationBetween,
  wakeTimeFromOffset,
} from "@/utils/alarmPickerTime";
import {
  angleFromPoint,
  bedDateFrom12hAngle,
  dateToNightFaceAngle,
  sleepHoursFrom12hAngle,
  toNightFaceDisplayDate,
  snapDialAngle,
  wakeDateFrom12hAngleRaw,
  wakeOffsetFrom12hAngle,
} from "@/utils/clockDragTime";

const SIZE = 300;
const CENTER = SIZE / 2;
const TRACK_R = 112;
const FACE_R = 86;
const MARKER_R = 62;
const STROKE = 22;
const UNSELECTED_STROKE = 18;
const HIT_SIZE = 48;
const HANDLE_SIZE = 32;
const SELECTED_TRACK_OPACITY = 0.95;
const UNSELECTED_TRACK_OPACITY = 0.78;

const DURATION_HOURS_SIZE = 24;
const DURATION_HOURS_HEIGHT = Math.round(DURATION_HOURS_SIZE * 1.32);
const DURATION_EMPTY_SIZE = 22;
const DURATION_EMPTY_HEIGHT = Math.round(DURATION_EMPTY_SIZE * 1.32);

const QUARTER_LABEL_R = FACE_R - 10;
const QUARTER_LABEL_BOX = 28;
const QUARTER_LABEL_HEIGHT = 16;

const QUARTER_HOUR_LABELS = [
  { hour: "12", angle: 0 },
  { hour: "3", angle: 90 },
  { hour: "6", angle: 180 },
  { hour: "9", angle: 270 },
] as const;

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
  onTimesPreview?: (times: { bedTime: Date; wakeTime: Date } | null) => void;
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
  const start = dateToNightFaceAngle(bed);
  let end = dateToNightFaceAngle(wake);
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
      {arcGradientStops.map((stop) => (
        <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
      ))}
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

function formatDurationParts(ms: number): { hours: number; minutes: number } {
  const total = Math.max(0, Math.round(ms / 60_000));
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

function formatDurationLabel(hours: number, minutes: number): string {
  return `${hours}h ${minutes}m`;
}

function DraggableArcHandle({
  angle,
  icon,
  fillColor,
  disabled,
  interactionDisabled,
  zIndex,
  dialPageOffset,
  onDragStart,
  onAngleChange,
  onDragEnd,
  accessibilityLabel,
}: {
  angle: number;
  icon: AppIcon;
  fillColor: string;
  disabled?: boolean;
  interactionDisabled?: boolean;
  zIndex?: number;
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
    .enabled(!interactionDisabled)
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
            zIndex,
          },
          disabled && s.arcHandleDisabled,
        ]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="adjustable"
      >
        <View
          style={[
            s.arcHandle,
            { backgroundColor: fillColor },
          ]}
        >
          <Icon
            icon={icon}
            size={15}
            color={disabled ? Palette.textMuted : Palette.bgInset}
          />
        </View>
      </View>
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

function QuarterHourLabel({
  hour,
  angle,
}: {
  hour: string;
  angle: number;
}) {
  const pt = polarToCartesian(CENTER, CENTER, QUARTER_LABEL_R, angle);

  return (
    <View
      style={[
        s.quarterLabel,
        {
          left: pt.x - QUARTER_LABEL_BOX / 2,
          top: pt.y - QUARTER_LABEL_HEIGHT / 2,
        },
      ]}
      pointerEvents="none"
    >
      <Text style={s.quarterLabelText}>{hour}</Text>
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
  durationMs: _durationMs,
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
      ? wakeDateFrom12hAngleRaw(dragWakeAngle, fajrTime)
      : wakeTime;

  const hasArc = previewBed && previewWake;
  const sleepArc = hasArc ? sleepArcAngles(previewBed, previewWake) : null;
  const selectedArcPath = sleepArc
    ? arcD(CENTER, CENTER, TRACK_R, sleepArc.start, sleepArc.end)
    : "";

  const displayBed =
    previewBed && fajrTime
      ? toNightFaceDisplayDate(previewBed, fajrTime)
      : previewBed;
  const displayWake =
    previewWake && fajrTime
      ? toNightFaceDisplayDate(previewWake, fajrTime)
      : previewWake;

  const previewDurationMs =
    displayBed && displayWake
      ? sleepDurationBetween(displayBed, displayWake)
      : null;
  const duration =
    previewDurationMs != null ? formatDurationParts(previewDurationMs) : null;

  const bedAngle =
    dragBedAngle ?? (previewBed ? dateToNightFaceAngle(previewBed) : null);
  const wakeAngle =
    dragWakeAngle ?? (previewWake ? dateToNightFaceAngle(previewWake) : null);

  const fajrAngle = fajrTime ? dateToNightFaceAngle(fajrTime) : null;
  const sunriseAngle = sunriseTime ? dateToNightFaceAngle(sunriseTime) : null;

  const emitPreview = useCallback(
    (bedAng: number | null, wakeAng: number | null) => {
      if (!onTimesPreview || !fajrTime) return;
      const nextBed =
        bedAng != null
          ? bedDateFrom12hAngle(bedAng, fajrTime)
          : bedTime;
      const nextWake =
        wakeAng != null
          ? wakeDateFrom12hAngleRaw(wakeAng, fajrTime)
          : wakeTime;
      if (nextBed == null || nextWake == null) return;
      onTimesPreview({
        bedTime: toNightFaceDisplayDate(nextBed, fajrTime),
        wakeTime: toNightFaceDisplayDate(nextWake, fajrTime),
      });
    },
    [onTimesPreview, fajrTime, bedTime, wakeTime],
  );

  const handleBedDragEnd = useCallback(
    (angle: number) => {
      setDragBedAngle(null);
      if (!fajrTime || !onBedTimeChange) {
        onTimesPreview?.(null);
        return;
      }
      const sleepHours = sleepHoursFrom12hAngle(angle, fajrTime);
      const committed = bedtimeFromSleepHours(fajrTime, sleepHours);
      const nextWake =
        dragWakeAngle != null
          ? wakeDateFrom12hAngleRaw(dragWakeAngle, fajrTime)
          : wakeTime;
      if (nextWake) {
        onTimesPreview?.({
          bedTime: toNightFaceDisplayDate(committed, fajrTime),
          wakeTime: toNightFaceDisplayDate(nextWake, fajrTime),
        });
      }
      onBedTimeChange(sleepHours);
    },
    [fajrTime, onBedTimeChange, onTimesPreview, dragWakeAngle, wakeTime],
  );

  const handleBedAngleChange = useCallback(
    (angle: number) => {
      const snapped = snapDialAngle(angle);
      setDragBedAngle(snapped);
      if (!fajrTime) return;
      emitPreview(snapped, dragWakeAngle);
    },
    [fajrTime, dragWakeAngle, emitPreview],
  );

  const handleWakeDragEnd = useCallback(
    (angle: number) => {
      setDragWakeAngle(null);
      if (!fajrTime || !onWakeTimeChange) {
        onTimesPreview?.(null);
        return;
      }
      const offset = wakeOffsetFrom12hAngle(
        angle,
        fajrTime,
        sunriseTime ?? undefined,
      );
      const committed = wakeTimeFromOffset(fajrTime, offset);
      const nextBed =
        dragBedAngle != null
          ? bedDateFrom12hAngle(dragBedAngle, fajrTime)
          : bedTime;
      if (nextBed) {
        onTimesPreview?.({
          bedTime: toNightFaceDisplayDate(nextBed, fajrTime),
          wakeTime: toNightFaceDisplayDate(committed, fajrTime),
        });
      }
      onWakeTimeChange(offset);
    },
    [fajrTime, sunriseTime, onWakeTimeChange, onTimesPreview, dragBedAngle, bedTime],
  );

  const handleWakeAngleChange = useCallback(
    (angle: number) => {
      const snapped = snapDialAngle(angle);
      setDragWakeAngle(snapped);
      if (!fajrTime) return;
      emitPreview(dragBedAngle, snapped);
    },
    [fajrTime, dragBedAngle, emitPreview],
  );

  const bedInteractionDisabled = !fajrTime || !bedEnabled || !onBedTimeChange;
  const wakeInteractionDisabled = !fajrTime || !wakeEnabled || !onWakeTimeChange;

  return (
    <View style={s.clockWrap}>
      <View ref={dialRef} style={s.dial} onLayout={measureDial}>
      <Svg width={SIZE} height={SIZE} style={s.dialFace}>
        {Array.from({ length: 60 }, (_, i) => {
          const angle = i * 6;
          const isHour = i % 5 === 0;
          const isQuarter = i % 15 === 0;
          if (isQuarter) return null;
          const inner = polarToCartesian(CENTER, CENTER, FACE_R - 5, angle);
          const outer = polarToCartesian(
            CENTER,
            CENTER,
            FACE_R - (isHour ? 12 : 8),
            angle,
          );
          return (
            <Path
              key={i}
              d={`M ${inner.x} ${inner.y} L ${outer.x} ${outer.y}`}
              stroke={Palette.textSecondary}
              strokeWidth={isHour ? 1.15 : 0.85}
              strokeLinecap="round"
              opacity={isHour ? 0.58 : 0.38}
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
          opacity={UNSELECTED_TRACK_OPACITY}
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

      {QUARTER_HOUR_LABELS.map(({ hour, angle }) => (
        <QuarterHourLabel key={hour} hour={hour} angle={angle} />
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

      <View
        style={s.durationHub}
        pointerEvents="none"
        accessibilityRole="text"
        accessibilityLabel={
          duration
            ? `Sleep Time, ${duration.hours} hours ${duration.minutes} minutes`
            : "Sleep Time"
        }
      >
        <Text style={s.durationCaption}>Sleep Time</Text>
        {duration ? (
          <ElMessiriText
            size={DURATION_HOURS_SIZE}
            weight="bold"
            height={DURATION_HOURS_HEIGHT}
            style={s.durationHours}
          >
            {formatDurationLabel(duration.hours, duration.minutes)}
          </ElMessiriText>
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

      {bedAngle != null ? (
        <DraggableArcHandle
          angle={bedAngle}
          icon={Bed}
          fillColor={ARC_GRADIENT_HIGHLIGHT}
          zIndex={1}
          disabled={!fajrTime || !onBedTimeChange}
          interactionDisabled={bedInteractionDisabled}
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
          icon={AlarmClock}
          fillColor={ARC_GRADIENT_MUTED}
          zIndex={2}
          disabled={!fajrTime || !onWakeTimeChange}
          interactionDisabled={wakeInteractionDisabled}
          dialPageOffset={dialPageOffset}
          onDragStart={measureDial}
          onAngleChange={handleWakeAngleChange}
          onDragEnd={handleWakeDragEnd}
          accessibilityLabel="Adjust wake up time"
        />
      ) : null}
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
  dialFace: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  arcHandleHit: {
    position: "absolute",
    width: HIT_SIZE,
    height: HIT_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  arcHandleDisabled: { opacity: 0.4 },
  arcHandle: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    borderWidth: 2,
    borderColor: Palette.bgInset,
    alignItems: "center",
    justifyContent: "center",
  },
  durationHub: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  durationCaption: {
    color: Palette.textSecondary,
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  durationHours: {
    color: Palette.gold,
    letterSpacing: -0.4,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  durationEmpty: {
    color: Palette.textMuted,
    textAlign: "center",
  },
  quarterLabel: {
    position: "absolute",
    width: QUARTER_LABEL_BOX,
    height: QUARTER_LABEL_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  quarterLabelText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
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
