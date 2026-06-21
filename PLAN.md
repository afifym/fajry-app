# Implementation Plan: Fajr — Answer the Call

## Overview

Build a focused Fajr alarm app for iOS and Android using React Native (Expo bare workflow). The plan follows the dependency graph bottom-up: foundation types and utilities first, then alarm infrastructure, then screens, then polish.

## Architecture Decisions

- `adhan-js` runs entirely on-device — no network calls for prayer times
- `notifee` owns all scheduling: Fajr alarms, snooze, and Sleep Reminders
- Zustand stores are persisted via MMKV — stores hydrate synchronously on app open
- Alarm Schedule is always rebuilt on app open; notifee cancels and reschedules all 7 days
- Home screen `AlarmSlot` component accepts a list of slots (v1: one item) — v2-ready for sleep chunking

---

## Dependency Graph

```
cities.json + reflections.json (static assets)
        │
TypeScript types (types/)
        │
        ├── prayerTimes.ts (adhan-js wrappers)
        │         │
        ├── location.ts (expo-location + city search)
        │         │
        └── Zustand stores (settingsStore, alarmStore, consistencyStore)
                  │
                  ├── scheduling.ts (notifee — depends on stores + prayerTimes)
                  │
                  └── Screens (depend on stores + utils)
                            │
                            └── Animations (polish layer on top of screens)
```

---

## Phase 1: Foundation

### Task 1: Project scaffold

**Description:** Initialise an Expo bare workflow project with all dependencies installed and configured: NativeWind, Expo Router, Zustand, MMKV, adhan-js, notifee, React Native Reanimated, expo-location, Sentry. Configure TypeScript strict mode and NativeWind dark theme as default.

**Acceptance criteria:**
- [ ] `npx expo start` runs without errors on iOS and Android simulators
- [ ] NativeWind classes render correctly with dark theme active
- [ ] Expo Router file-based routing resolves `app/index.tsx`
- [ ] TypeScript strict mode enabled in `tsconfig.json`
- [ ] All dependencies installed with no peer dependency warnings

**Verification:**
- [ ] Build succeeds: `npx expo export`
- [ ] Manual check: app opens to a blank dark screen on both simulators

**Dependencies:** None

**Files likely touched:**
- `package.json`
- `tsconfig.json`
- `app.json` / `app.config.ts`
- `tailwind.config.js`
- `babel.config.js`
- `metro.config.js`

**Estimated scope:** Medium

---

### Task 2: Static assets — cities dataset and reflections

**Description:** Trim the `cities-list` npm package to only name, country, lat, lng fields and save as `assets/cities.json`. Write 60–90 Reflection entries (hadith, Quran verses, original lines) and save as `assets/reflections.json`.

**Acceptance criteria:**
- [ ] `assets/cities.json` contains only `name`, `country`, `lat`, `lng` fields per entry
- [ ] File size is under 1MB
- [ ] `assets/reflections.json` contains 60–90 entries, each with an `id` and `text` field
- [ ] All Reflection text is sourced and attribution is noted in a comment

**Verification:**
- [ ] `JSON.parse` on both files succeeds without errors
- [ ] Manual spot-check: Cairo, London, New York all present in cities with correct coordinates

**Dependencies:** Task 1

**Files likely touched:**
- `assets/cities.json`
- `assets/reflections.json`
- `scripts/trim-cities.ts` (one-off script to generate trimmed dataset)

**Estimated scope:** Small

---

### Task 3: Core TypeScript types

**Description:** Define all domain types used across the app. No logic — types only.

**Acceptance criteria:**
- [ ] `CalculationMethod` union type covers all adhan-js supported methods
- [ ] `Location` type: `{ lat: number; lng: number; cityName: string; country: string }`
- [ ] `AlarmDay` type: `{ date: string; fajrTime: Date; sunriseTime: Date; scheduled: boolean }`
- [ ] `PrayerConfirmation` type: `{ date: string; confirmedAt: Date | null; isOnTime: boolean }`
- [ ] `AdhanRecitation` union type for curated recitation options
- [ ] No `any` types

**Verification:**
- [ ] `npx tsc --noEmit` passes with zero errors

**Dependencies:** Task 1

**Files likely touched:**
- `types/index.ts`

**Estimated scope:** Small

---

### Task 4: Prayer time utilities

**Description:** Wrap `adhan-js` in a clean utility module. Expose functions for: calculating Fajr Time and Sunrise for a given date and location, computing the full 7-day Alarm Schedule, and determining whether a given time falls within the confirmation window (Fajr → Sunrise).

**Acceptance criteria:**
- [ ] `getFajrAndSunrise(date, location, method)` returns correct times for known coordinates (test: Cairo, MWL method)
- [ ] `buildAlarmSchedule(location, method, offset)` returns 7 `AlarmDay` entries starting from today
- [ ] Pre-alarm Offset is correctly subtracted from Fajr Time
- [ ] `isConfirmationWindowOpen(fajrTime, sunriseTime)` returns true only between Fajr and Sunrise
- [ ] All functions are pure — no side effects, no network calls

**Verification:**
- [ ] Unit tests pass: `npm test -- prayerTimes`
- [ ] Manual check: log output for Cairo coordinates matches known Fajr times

**Dependencies:** Tasks 1, 3

**Files likely touched:**
- `utils/prayerTimes.ts`
- `utils/__tests__/prayerTimes.test.ts`

**Estimated scope:** Medium

---

### Task 5: Location utilities

**Description:** Implement GPS location fetching via `expo-location`, manual city search over the bundled `cities.json`, Location Change detection (>50km threshold), and Regional Default inference from country code.

**Acceptance criteria:**
- [ ] `requestGPSLocation()` returns a `Location` or throws a typed error if permission denied
- [ ] `searchCities(query)` returns fuzzy-matched results from `cities.json` — no network call
- [ ] `detectLocationChange(stored, current)` returns true only when distance exceeds 50km
- [ ] `inferRegionalDefault(countryCode)` maps country codes to `CalculationMethod`
- [ ] Haversine distance calculation is unit tested

**Verification:**
- [ ] Unit tests pass: `npm test -- location`
- [ ] Manual check: city search for "Cai" returns Cairo as first result

**Dependencies:** Tasks 1, 2, 3

**Files likely touched:**
- `utils/location.ts`
- `utils/__tests__/location.test.ts`

**Estimated scope:** Medium

---

### Task 6: Zustand stores with MMKV persistence

**Description:** Implement three Zustand stores, each persisted to MMKV. `settingsStore`: all user settings with typed defaults. `alarmStore`: Alarm Schedule and enabled state. `consistencyStore`: daily Prayer Confirmation records and Consistency Streak.

**Acceptance criteria:**
- [ ] `settingsStore` persists and rehydrates: Calculation Method, Adhan recitation, Snooze Duration, Pre-alarm Offset, Location, Alarm enabled, Sleep Reminder config
- [ ] `alarmStore` persists and rehydrates the 7-day Alarm Schedule
- [ ] `consistencyStore` persists confirmation records and exposes `streak` as a derived value
- [ ] Streak calculation: consecutive days with any confirmation (on-time or late)
- [ ] 7-day edit window: `toggleConfirmation(date)` rejects dates older than 7 days
- [ ] All stores hydrate synchronously (MMKV, not AsyncStorage)

**Verification:**
- [ ] Unit tests pass: `npm test -- consistencyStore` (streak, gap detection, 7-day boundary)
- [ ] Manual check: kill and reopen app — settings survive

**Dependencies:** Tasks 1, 3

**Files likely touched:**
- `store/settingsStore.ts`
- `store/alarmStore.ts`
- `store/consistencyStore.ts`
- `store/__tests__/consistencyStore.test.ts`

**Estimated scope:** Medium

---

### Task 7: Reflection rotation utility

**Description:** Implement daily Reflection rotation over the bundled `reflections.json`. The same Reflection should appear all day; a new one appears the next day. No repeats within the 60–90 entry cycle.

**Acceptance criteria:**
- [ ] `getTodayReflection()` returns the same entry for all calls on the same calendar day
- [ ] Entry rotates on calendar day change
- [ ] Full cycle completes before any entry repeats
- [ ] Rotation index is persisted in MMKV so it survives app restarts

**Verification:**
- [ ] Unit tests pass: `npm test -- reflections`

**Dependencies:** Tasks 1, 2, 6

**Files likely touched:**
- `utils/reflections.ts`
- `utils/__tests__/reflections.test.ts`

**Estimated scope:** Small

---

## Checkpoint: Phase 1

- [ ] All unit tests pass: `npm test`
- [ ] Build succeeds: `npx expo export`
- [ ] Prayer time calculations verified against known values
- [ ] Stores hydrate correctly after app restart
- [ ] Review with human before proceeding to Phase 2

---

## Phase 2: Alarm Infrastructure

### Task 8: notifee setup and Android foreground service

**Description:** Configure `notifee` for both platforms. Set up the Android foreground service required for DND bypass. Create notification channels for: Fajr alarm, Snooze, Sleep Reminder. Request notification permissions.

**Acceptance criteria:**
- [ ] Android foreground service declared in `AndroidManifest.xml`
- [ ] Three notification channels created: `fajr-alarm`, `sleep-reminder`, `snooze`
- [ ] `requestNotificationPermissions()` handles both iOS and Android permission flows
- [ ] notifee headless task registered for alarm firing while app is in background

**Verification:**
- [ ] Manual check: notification appears on Android with correct channel (alarm volume, not notification volume)
- [ ] Manual check: notification appears on locked iOS screen

**Dependencies:** Tasks 1, 3

**Files likely touched:**
- `utils/notifications.ts`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/java/.../MainApplication.kt`
- `index.js` (headless task registration)

**Estimated scope:** Medium

---

### Task 9: Alarm scheduling

**Description:** Implement the full Alarm Schedule pipeline using notifee. On call: cancel all existing Fajr alarms, compute the 7-day schedule, schedule each with the correct Adhan audio. Implement snooze scheduling with Sunrise cap. Implement `rebuildScheduleOnAppOpen()` as the single entry point called from the app root.

**Acceptance criteria:**
- [ ] `rebuildScheduleOnAppOpen()` cancels all existing alarms and reschedules 7 days
- [ ] Each scheduled alarm fires at `fajrTime - preAlarmOffset`
- [ ] `scheduleSnooze(snoozeDuration, sunriseTime)` refuses if next wake time exceeds Sunrise
- [ ] Alarm disabled toggle cancels all scheduled alarms
- [ ] Snooze cap unit tested: snooze refused when `now + snoozeDuration > sunriseTime`

**Verification:**
- [ ] Unit tests pass: `npm test -- scheduling`
- [ ] Manual check: schedule an alarm 2 minutes from now — it fires with sound

**Dependencies:** Tasks 4, 6, 8

**Files likely touched:**
- `utils/scheduling.ts`
- `utils/__tests__/scheduling.test.ts`

**Estimated scope:** Medium

---

### Task 10: Sleep Reminder scheduling

**Description:** When Sleep Reminder is enabled, schedule a nightly notification at `fajrTime - desiredSleepHours` including the day's Reflection text. Rebuild Sleep Reminder notifications as part of `rebuildScheduleOnAppOpen()`.

**Acceptance criteria:**
- [ ] Sleep Reminder fires at the correct time relative to each day's Fajr Time
- [ ] Notification body includes `getTodayReflection().text`
- [ ] Sleep Reminder is not scheduled when the feature is disabled
- [ ] Cancels and reschedules correctly when settings change

**Verification:**
- [ ] Manual check: enable Sleep Reminder, set desired sleep hours to 0.05 (3 min) — notification fires with Reflection text

**Dependencies:** Tasks 7, 9

**Files likely touched:**
- `utils/scheduling.ts` (extend existing)

**Estimated scope:** Small

---

## Checkpoint: Phase 2

- [ ] All unit tests pass: `npm test`
- [ ] Alarm fires at scheduled time on both iOS and Android simulators
- [ ] Snooze past Sunrise is refused
- [ ] Sleep Reminder fires with correct Reflection text
- [ ] Review with human before proceeding to Phase 3

---

## Phase 3: Screens

### Task 11: Navigation setup and dark theme baseline

**Description:** Configure Expo Router with a dark-only theme. Set up the four routes: home (`/`), alarm (`/alarm`), settings (`/settings`), consistency (`/consistency`). Add a shared layout with navigation transitions placeholder.

**Acceptance criteria:**
- [ ] All four routes resolve without errors
- [ ] Background is always dark (`#000` or near-black) — no white flash on navigation
- [ ] Status bar is light-coloured on both platforms
- [ ] No light mode ever activates (ignore system appearance setting)

**Verification:**
- [ ] Manual check: navigate between all four screens — no white flash, no light mode

**Dependencies:** Tasks 1, 6

**Files likely touched:**
- `app/_layout.tsx`
- `app/index.tsx` (stub)
- `app/alarm.tsx` (stub)
- `app/settings.tsx` (stub)
- `app/consistency.tsx` (stub)

**Estimated scope:** Small

---

### Task 12: Onboarding screen

**Description:** First-launch screen shown when no Stored Location exists. Explains the app briefly, shows the pre-selected Regional Default, then requests GPS and notification permissions together. On completion, runs `rebuildScheduleOnAppOpen()` and navigates to home.

**Acceptance criteria:**
- [ ] Shown only on first launch (no Stored Location in MMKV)
- [ ] Regional Default is pre-selected based on device locale/country
- [ ] Tapping "Get Started" requests location permission, then notification permission
- [ ] If GPS denied: falls through to manual city search
- [ ] After permissions: `rebuildScheduleOnAppOpen()` runs and user lands on home screen
- [ ] Cannot be reached again after onboarding completes

**Verification:**
- [ ] Manual check: fresh install → onboarding appears → grant permissions → home screen with correct Fajr Time

**Dependencies:** Tasks 5, 9, 11

**Files likely touched:**
- `app/onboarding.tsx`
- `app/_layout.tsx` (add onboarding gate)

**Estimated scope:** Medium

---

### Task 13: Home screen

**Description:** The main screen. Shows the `AlarmSlot` component (slot-based, v1: one slot) with next Fajr Time and live countdown. Shows Consistency Streak. Shows `SlideToConfirm` component when the confirmation window is open (Fajr → Sunrise). Runs `rebuildScheduleOnAppOpen()` on mount. Detects Location Change and prompts user.

**Acceptance criteria:**
- [ ] Fajr Time and live countdown displayed and updating every second
- [ ] Consistency Streak displayed
- [ ] `SlideToConfirm` visible only between Fajr Time and Sunrise
- [ ] `AlarmSlot` is a list-based component accepting `slots: AlarmSlot[]` (one item in v1)
- [ ] Location Change prompt appears when displacement >50km
- [ ] `rebuildScheduleOnAppOpen()` called on every mount

**Verification:**
- [ ] Manual check: countdown ticks down correctly
- [ ] Manual check: `SlideToConfirm` appears and disappears at correct times

**Dependencies:** Tasks 5, 6, 9, 11

**Files likely touched:**
- `app/index.tsx`
- `components/AlarmSlot.tsx`
- `components/CountdownTimer.tsx`

**Estimated scope:** Medium

---

### Task 14: SlideToConfirm component

**Description:** A reusable slide-to-confirm gesture component using React Native Reanimated. The user slides a thumb to the right to confirm. Includes animated slide mechanics, completion callback, and reset on incomplete release.

**Acceptance criteria:**
- [ ] Slide gesture tracked via Reanimated (UI thread only — no JS bridge)
- [ ] Thumb snaps back if released before completion
- [ ] Completion fires `onConfirm` callback exactly once
- [ ] Component is stateless — controlled via `onConfirm` prop
- [ ] Used on both home screen and alarm screen (same component, two placements)

**Verification:**
- [ ] Manual check: partial slide → releases → thumb snaps back
- [ ] Manual check: full slide → `onConfirm` fires, `consistencyStore` record created

**Dependencies:** Tasks 6, 11

**Files likely touched:**
- `components/SlideToConfirm.tsx`

**Estimated scope:** Medium

---

### Task 15: Alarm screen

**Description:** The full-screen view triggered when the Fajr alarm fires. Shows current time, Fajr Time, time remaining until Sunrise. Plays Adhan once, then loops Fallback Tone. Provides Dismiss and Snooze buttons. After dismissal, shows `SlideToConfirm`. Snooze is refused past Sunrise with an explanatory message.

**Acceptance criteria:**
- [ ] Screen launched by notifee headless task when alarm fires
- [ ] Adhan plays once in full, then Fallback Tone loops
- [ ] Audio stops immediately on Dismiss or Snooze
- [ ] Snooze button shows remaining time to Sunrise; disabled with message if snooze would exceed Sunrise
- [ ] `SlideToConfirm` appears after Dismiss
- [ ] Screen cannot be dismissed without interacting (back gesture disabled)

**Verification:**
- [ ] Manual check: trigger alarm manually → Adhan plays → Fallback Tone loops → Dismiss → SlideToConfirm appears
- [ ] Manual check: snooze near Sunrise → button disabled with message

**Dependencies:** Tasks 9, 14

**Files likely touched:**
- `app/alarm.tsx`

**Estimated scope:** Medium

---

### Task 16: Settings screen

**Description:** Scrollable settings screen with all seven configurable options: Calculation Method picker, Adhan recitation picker, Snooze Duration input, Pre-alarm Offset input, Location override (city search), Alarm enabled toggle, Sleep Reminder toggle + desired sleep hours. Any change triggers `rebuildScheduleOnAppOpen()`.

**Acceptance criteria:**
- [ ] All seven settings render with current values from `settingsStore`
- [ ] Changes persist to MMKV immediately
- [ ] `rebuildScheduleOnAppOpen()` called after any setting changes
- [ ] City search is offline — searches `cities.json` locally
- [ ] Calculation Method picker lists all supported adhan-js methods with readable names

**Verification:**
- [ ] Manual check: change Calculation Method → home screen Fajr Time updates
- [ ] Manual check: toggle Sleep Reminder on → Sleep Reminder notification scheduled

**Dependencies:** Tasks 5, 9, 11

**Files likely touched:**
- `app/settings.tsx`

**Estimated scope:** Medium

---

### Task 17: Consistency Calendar screen

**Description:** Calendar view showing Prayer Confirmation state for each day. Days are colour-coded: on-time, late, missed. The previous 7 days are toggleable. Tapping a day within the 7-day window toggles its confirmation state.

**Acceptance criteria:**
- [ ] Current month displayed as a calendar grid
- [ ] Each day shows one of three states: on-time (confirmed before Sunrise), late (confirmed after Sunrise), missed
- [ ] Only the previous 7 days are interactive — earlier days are read-only
- [ ] Toggle updates `consistencyStore` and recalculates streak
- [ ] Streak count displayed at top of screen

**Verification:**
- [ ] Unit tests pass for 7-day boundary (Task 6 covers this)
- [ ] Manual check: toggle a missed day → streak updates → toggle back → streak reverts

**Dependencies:** Tasks 6, 11

**Files likely touched:**
- `app/consistency.tsx`
- `components/ConsistencyCalendar.tsx`

**Estimated scope:** Medium

---

## Checkpoint: Phase 3

- [ ] All four screens navigate correctly
- [ ] End-to-end flow works: onboarding → home → alarm fires → confirm prayer → streak increments
- [ ] Settings changes propagate correctly to Alarm Schedule
- [ ] Consistency Calendar toggles update streak
- [ ] Review with human before proceeding to Phase 4

---

## Phase 4: Polish

### Task 18: Transition animations

**Description:** Add three Transition Animations using React Native Reanimated: (1) alarm screen entrance — slides up from bottom when alarm fires; (2) `SlideToConfirm` gesture mechanics (already Reanimated — verify it's fully on UI thread); (3) screen navigation transitions — configure Expo Router to use a shared-element or fade transition.

**Acceptance criteria:**
- [ ] Alarm screen entrance animation runs at 60fps on both simulators
- [ ] `SlideToConfirm` gesture has no JS thread jank — verified via Reanimated strict mode
- [ ] Screen transitions feel smooth — no white flash between routes
- [ ] All animations use `useSharedValue` / `useAnimatedStyle` — no `Animated.Value` from the old API

**Verification:**
- [ ] Manual check: trigger alarm → entrance animation plays smoothly
- [ ] Manual check: navigate settings → back → no jank

**Dependencies:** Tasks 14, 15

**Files likely touched:**
- `app/alarm.tsx`
- `app/_layout.tsx`
- `components/SlideToConfirm.tsx`

**Estimated scope:** Medium

---

### Task 19: Sentry integration

**Description:** Initialise Sentry with the project DSN. Wrap the app root. Capture unhandled exceptions. Add a breadcrumb when the Alarm Schedule is rebuilt. Do not log any user-identifiable data.

**Acceptance criteria:**
- [ ] Sentry initialised in `app/_layout.tsx`
- [ ] Unhandled JS exceptions appear in Sentry dashboard
- [ ] `rebuildScheduleOnAppOpen()` adds a Sentry breadcrumb with the count of scheduled alarms
- [ ] No user location, name, or PII sent to Sentry

**Verification:**
- [ ] Manual check: throw a test error → appears in Sentry within 30 seconds

**Dependencies:** Tasks 9, 11

**Files likely touched:**
- `app/_layout.tsx`
- `utils/scheduling.ts`

**Estimated scope:** Small

---

## Checkpoint: Phase 4 — Complete

- [ ] All unit tests pass: `npm test`
- [ ] Build succeeds on iOS and Android: `npx expo export`
- [ ] Full end-to-end flow tested manually on physical devices
- [ ] Animations run at 60fps — no jank
- [ ] Sentry captures a test error
- [ ] All SPEC.md acceptance criteria met
- [ ] Ready for App Store / Play Store submission review

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| iOS critical alerts entitlement rejected by Apple | High | Prepare onboarding guidance for manual DND allowlist as fallback; don't block shipping on entitlement |
| notifee headless task not firing on some Android OEMs (MIUI, ColorOS) | High | Test on physical Xiaomi/Samsung device early; add onboarding note about battery optimization |
| adhan-js calculation drift from local madhab expectations | Medium | Unit test against published Fajr times for Cairo, London, New York across all methods |
| Reanimated gesture conflicts with Expo Router navigation gestures | Medium | Test `SlideToConfirm` inside navigable screen early (Task 14 before Task 18) |
| `cities.json` trimming removes needed fields | Low | Write and commit the trim script (Task 2) so it's reproducible |

## Open Questions

- Which Adhan recitations to bundle? (Makkah, Madinah, Mishary Rashid — need audio files sourced and licensed)
- Apple Developer account ready for notifee entitlement request?
