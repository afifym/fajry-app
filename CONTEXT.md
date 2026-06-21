# Fajr — Answer the Call

A mobile alarm app that wakes the user for the Fajr prayer using on-device prayer time calculation. Published name: **Fajr**, subtitle: **Answer the Call**. Internal project/repo name: Fajry.

## Language

**Fajr Time**:
The calculated start of the Fajr prayer window for a given day, derived from the user's coordinates and chosen calculation method.
_Avoid_: prayer time, alarm time, wake time

**Calculation Method**:
The juristic school or authority whose astronomical formula is used to derive Fajr Time (e.g. Muslim World League, ISNA, Egyptian General Authority, Umm al-Qura).
_Avoid_: method, school, madhab

**Regional Default**:
The Calculation Method automatically inferred from the user's country at first launch, used as the starting value before any explicit user selection.
_Avoid_: default method, auto method

**Alarm**:
A scheduled device wake event tied to a specific Fajr Time. Fires once per day.
_Avoid_: notification, reminder, alert

**Snooze**:
A user-initiated delay of the active Alarm by a fixed interval. Refused if the resulting wake time would fall after Sunrise.
_Avoid_: repeat, delay, dismiss

**Sunrise**:
The calculated end of the Fajr prayer window for a given day. The hard deadline after which Snooze is blocked.
_Avoid_: sunrise time, end time, cutoff

**Location**:
The user's coordinates used to calculate Fajr Time and Sunrise. Sourced from GPS when permitted, otherwise from a user-selected city.
_Avoid_: position, place, city

**Stored Location**:
The last known Location persisted on-device, used for offline calculation when GPS is unavailable.
_Avoid_: cached location, saved city

**Adhan**:
The Islamic call to prayer, played as the primary wake sound when the Alarm fires. Plays once in full before the Fallback Tone begins.
_Avoid_: alarm sound, notification sound, ringtone

**Fallback Tone**:
A repeating alarm tone that plays after the Adhan completes, continuing until the user dismisses or Snoozes the Alarm.
_Avoid_: backup sound, secondary alarm

**Alarm Schedule**:
The set of up to 7 upcoming daily Alarms pre-calculated from the user's Location and Calculation Method. Rebuilt on every app open.
_Avoid_: alarm queue, scheduled notifications

**Location Change**:
A detected displacement between the current GPS position and the Stored Location exceeding 50km. Triggers a prompt to update the Alarm Schedule.
_Avoid_: travel detection, location drift

**Pre-alarm Offset**:
A user-configured number of minutes by which the Alarm fires before the Fajr Time. Allows time for wudu or preparation before the prayer window opens.
_Avoid_: early alarm, buffer time, lead time

**Snooze Duration**:
The fixed number of minutes the Alarm is delayed per Snooze action. User-configurable in Settings.
_Avoid_: snooze interval, snooze length

**Sleep Reminder**:
An optional nightly notification fired a user-configured number of hours before the next Fajr Time, prompting the user to sleep. Includes a rotating bundled Reflection. Disabled by default.
_Avoid_: bedtime reminder, sleep notification, sleep alarm

**Reflection**:
A short piece of curated text — a hadith, Quran verse, or original line — delivered as part of the Sleep Reminder notification to give it spiritual intention. Sourced from a bundled set of 60–90 entries, rotated daily.
_Avoid_: quote, reminder text, message

**Sleep Chunking**:
A v2 concept where sleep is split into two segments around Fajr — a pre-Fajr block ending at the Alarm, and a post-Fajr block with its own separate alarm. Rooted in the historical Islamic sleep pattern. Not in v1, but the home screen layout is designed to accommodate it.
_Avoid_: biphasic sleep, split sleep, second alarm

**Transition Animation**:
A deliberate motion design applied at three moments: the alarm screen entrance when the Alarm fires, the slide-to-confirm gesture on Prayer Confirmation, and navigation between screens. Implemented via React Native Reanimated to run on the UI thread.
_Avoid_: animation, motion, effects

**Prayer Confirmation**:
A user action recording that they prayed Fajr on a given day, performed via a slide gesture (slide-to-confirm). Available from Fajr Time until Sunrise — on the alarm screen immediately after dismissal, and on the home screen until Sunrise. Editable retroactively via the Consistency Calendar for up to 7 past days.
_Avoid_: check-in, mark as prayed, confirmation button

**Consistency Streak**:
The number of consecutive days with a Prayer Confirmation, regardless of whether it was on-time or late. Framed as consistency, not score.
_Avoid_: streak, score, points

**Consistency Calendar**:
A calendar view showing Prayer Confirmation state for each past day. Allows toggling any day within the previous 7 days.
_Avoid_: history, log, streak calendar
