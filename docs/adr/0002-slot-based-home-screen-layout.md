# Slot-based home screen layout for future alarm extensibility

The home screen displays alarm times in a slot-based layout component, even though v1 only shows a single Fajr alarm.

A planned v2 feature (sleep chunking — biphasic sleep structured around Fajr) requires displaying two alarm slots on the home screen. Designing a rigid single-alarm layout now would force a home screen redesign in v2. A slot-based component makes the v2 addition purely additive: populate the second slot, no structural changes needed.

## Consequences

The home screen component accepts a list of alarm slots rather than a single alarm. In v1 this list always has one item.
