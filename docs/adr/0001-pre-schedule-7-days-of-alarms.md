# Pre-schedule 7 days of alarms on every app open

Fajr time shifts daily, so alarms can't be set once and forgotten. We pre-calculate and schedule the next 7 days of alarms every time the app opens, rather than relying on background refresh or rescheduling at dismissal.

iOS severely limits background execution time, making nightly background rescheduling unreliable. Rescheduling only at dismissal fails when the user force-quits or sleeps through the alarm entirely. Pre-scheduling 7 days is instantaneous with `adhan-js` and survives app inactivity, offline use, and iOS background restrictions. Rebuilding the full schedule on every app open ensures any settings change (location, calculation method) is reflected without a separate sync mechanism.

## Considered Options

- **Reschedule at dismissal** — simple, but fails if the user never interacts with the alarm
- **Background refresh at midnight** — fragile on iOS; the OS may not grant execution time
- **Pre-schedule 7 days, rebuild on app open** — chosen; robust across all failure modes
