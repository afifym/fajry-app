import { useConsistencyStore } from '../consistencyStore';
import { toISODate } from '@/utils/prayerTimes';

// Helper to get a date N days ago as ISO string
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

const FAR_FUTURE_SUNRISE = new Date(Date.now() + 24 * 60 * 60_000);

beforeEach(() => {
  useConsistencyStore.setState({ confirmations: {}, streak: 0 });
});

describe('confirm', () => {
  it('records a confirmation for a given date', () => {
    const today = toISODate(new Date());
    useConsistencyStore.getState().confirm(today, true);

    const { confirmations } = useConsistencyStore.getState();
    expect(confirmations[today]).toBeDefined();
    expect(confirmations[today].confirmedAt).not.toBeNull();
    expect(confirmations[today].isOnTime).toBe(true);
  });

  it('increments streak for consecutive days', () => {
    const today = toISODate(new Date());
    const yesterday = daysAgo(1);

    useConsistencyStore.getState().confirm(yesterday, true);
    useConsistencyStore.getState().confirm(today, true);

    expect(useConsistencyStore.getState().streak).toBe(2);
  });

  it('streak stops at a gap', () => {
    const today = toISODate(new Date());
    const twoDaysAgo = daysAgo(2);

    // Confirm 2 days ago and today, but NOT yesterday
    useConsistencyStore.getState().confirm(twoDaysAgo, true);
    useConsistencyStore.getState().confirm(today, true);

    // Streak from today only — yesterday is missing
    expect(useConsistencyStore.getState().streak).toBe(1);
  });
});

describe('toggleConfirmation', () => {
  it('toggles a day on within the 7-day window', () => {
    const yesterday = daysAgo(1);
    useConsistencyStore.getState().toggleConfirmation(yesterday, FAR_FUTURE_SUNRISE);

    expect(useConsistencyStore.getState().confirmations[yesterday]?.confirmedAt).not.toBeNull();
  });

  it('toggles a day off when it was on', () => {
    const yesterday = daysAgo(1);
    useConsistencyStore.getState().confirm(yesterday, false);
    useConsistencyStore.getState().toggleConfirmation(yesterday, FAR_FUTURE_SUNRISE);

    expect(useConsistencyStore.getState().confirmations[yesterday]?.confirmedAt).toBeNull();
  });

  it('rejects dates older than 7 days', () => {
    const eightDaysAgo = daysAgo(8);
    useConsistencyStore.getState().toggleConfirmation(eightDaysAgo, FAR_FUTURE_SUNRISE);

    expect(useConsistencyStore.getState().confirmations[eightDaysAgo]).toBeUndefined();
  });

  it('accepts the 7th day back (boundary)', () => {
    const sevenDaysAgo = daysAgo(7);
    useConsistencyStore.getState().toggleConfirmation(sevenDaysAgo, FAR_FUTURE_SUNRISE);

    expect(useConsistencyStore.getState().confirmations[sevenDaysAgo]).toBeDefined();
  });
});
