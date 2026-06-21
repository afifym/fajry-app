# Fajr — Answer the Call: Spec

## Objective

A focused Fajr alarm app for Muslim users on iOS and Android. The app wakes the user for the Fajr prayer, tracks their consistency, and optionally reminds them to sleep on time. Published name: **Fajr**, subtitle: **Answer the Call**. Repo: `fajry`.

**Target users:** Muslim individuals who struggle to wake up for Fajr prayer consistently.

**Core value:** Reliable, offline-first Fajr alarm with a consistency tracking layer framed around spiritual intention — not gamification.

---

## Core Features & Acceptance Criteria

### 1. Fajr Alarm
- Alarm fires at Fajr Time, calculated locally via `adhan-js` from Stored Location and Calculation Method
- Wake sound: Adhan plays once in full, then Fallback Tone repeats until user acts
- Alarm screen shows: current time, Fajr Time, time remaining until Sunrise, Snooze button, Dismiss button
- Snooze delays the alarm by Snooze Duration; refused if the next wake time falls after Sunrise
- Alarm Schedule covers the next 7 days; rebuilt in full on every app open
- DND bypass: Android foreground service; iOS best-effort with onboarding guidance

### 2. Prayer Confirmation
- Slide-to-confirm gesture (not a tap button) available from Fajr Time until Sunrise
- Appears on the alarm screen immediately after dismissal, and on the home screen until Sunrise
- Days confirmed after Sunrise (via Consistency Calendar edit) are recorded but distinguishable from on-time confirmations

### 3. Consistency Streak & Calendar
- Consistency Streak = consecutive days with any Prayer Confirmation (on-time or late)
- Framed as consistency, not score — no points, no badges
- Consistency Calendar: toggleable day-by-day view, editable for the previous 7 days only
- Streak shown on home screen alongside Fajr Time and countdown

### 4. Sleep Reminder
- Optional, off by default
- Fires as a notification N hours before the next Fajr Time (N = user-configured desired sleep duration)
- Notification includes a rotating Reflection (hadith, Quran verse, or original line)
- Reflection content is bundled in the app (~60–90 entries), rotated daily

### 5. Location
- GPS via `expo-location` on first launch; falls back to manual city search if permission denied
- City search uses a trimmed local `cities-list` dataset (name, country, lat/lng only) — no network required
- Stored Location persisted in MMKV; used for offline calculation
- Location Change detected on app open if current GPS position is >50km from Stored Location → prompt user to update

### 6. Settings
- Calculation Method (user-selectable; Regional Default pre-set from country)
- Adhan recitation (curated set of options)
- Snooze Duration (minutes)
- Pre-alarm Offset (minutes before Fajr Time to fire the alarm)
- Location override (manual city picker)
- Alarm enabled/disabled toggle
- Sleep Reminder toggle + desired sleep hours

### 7. Onboarding
- Single screen: explains the app, shows pre-selected Regional Default, requests GPS + notification permissions together
- Calculation Method not surfaced in onboarding — accessible via Settings

### 8. Transition Animations
- Alarm screen entrance when the Alarm fires
- Slide-to-confirm gesture on Prayer Confirmation
- Screen-to-screen navigation transitions
- Implemented via React Native Reanimated (UI thread, not JS bridge)

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React Native, Expo bare workflow |
| Styling | NativeWind (Tailwind for RN) |
| Navigation | Expo Router |
| State + persistence | Zustand + MMKV |
| Prayer time calculation | `adhan-js` (local, offline) |
| Alarm scheduling | `notifee` |
| Animations | React Native Reanimated |
| Location | `expo-location` |
| City search | Bundled trimmed `cities-list` |
| Crash reporting | Sentry |

---

## Project Structure

```
fajry/
├── app/                        # Expo Router screens
│   ├── index.tsx               # Home screen
│   ├── alarm.tsx               # Alarm screen (fires on wake)
│   ├── settings.tsx            # Settings screen
│   └── consistency.tsx         # Consistency Calendar screen
├── components/
│   ├── AlarmSlot.tsx           # Slot-based alarm display (v1: one slot; v2-ready for sleep chunking)
│   ├── SlideToConfirm.tsx      # Slide-to-confirm gesture component
│   ├── ConsistencyCalendar.tsx
│   └── CountdownTimer.tsx
├── store/
│   ├── alarmStore.ts           # Alarm Schedule, enabled state
│   ├── settingsStore.ts        # All user settings
│   └── consistencyStore.ts     # Prayer Confirmation records, streak
├── utils/
│   ├── prayerTimes.ts          # adhan-js wrappers: Fajr Time, Sunrise, Alarm Schedule
│   ├── location.ts             # GPS, city search, Location Change detection
│   ├── scheduling.ts           # notifee alarm + Sleep Reminder scheduling
│   └── reflections.ts          # Reflection rotation logic
├── assets/
│   ├── audio/                  # Adhan recitation files + Fallback Tone
│   ├── reflections.json        # Bundled Reflection content
│   └── cities.json             # Trimmed cities dataset
├── docs/
│   └── adr/
│       ├── 0001-pre-schedule-7-days-of-alarms.md
│       └── 0002-slot-based-home-screen-layout.md
├── CONTEXT.md
└── SPEC.md
```

---

## Code Style

- TypeScript throughout — no `any`
- NativeWind for all styling — no inline StyleSheet except where NativeWind cannot reach (e.g. Reanimated animated styles)
- Always dark theme — no light mode, no system-follows
- Comments only when the WHY is non-obvious (workarounds, invariants, constraints)
- No `console.log` in production — use Sentry for error reporting

---

## Testing Strategy

Unit test the pure logic; leave UI and native modules to manual verification.

- `prayerTimes.ts` — Fajr Time and Sunrise calculations for known coordinates and methods
- Snooze cap logic — confirm snooze is refused when next wake time exceeds Sunrise
- Streak calculation — consecutive days, gap detection, 7-day edit window boundary
- Location Change detection — >50km threshold, GPS drift tolerance
- Reflection rotation — no repeats within the 60–90 entry cycle

---

## Boundaries

### Always do
- Calculate prayer times locally via `adhan-js` — never fetch from a network API
- Rebuild the full Alarm Schedule on every app open
- Respect the Sunrise hard cap on Snooze
- Persist Stored Location so the app works fully offline after first setup
- Run animations via React Native Reanimated on the UI thread

### Ask first (require explicit user action)
- GPS location permission
- Notification/alarm scheduling permission
- Updating Location after a Location Change is detected

### Never do
- Fetch prayer times from a remote API
- Show a light-mode UI
- Auto-confirm Prayer Confirmation without user gesture
- Allow Snooze past Sunrise
- Add score, points, badges, or leaderboards — consistency framing only
- Schedule alarms via background refresh (pre-schedule only)
