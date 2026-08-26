import {
  MIN_REVIEW_USE_DAYS,
  maybeRequestReview,
  recordAppUse,
  resetStoreReviewState,
  uniqueUseDays,
} from "../storeReview";

jest.mock("expo-store-review", () => ({
  hasAction: jest.fn().mockResolvedValue(true),
  requestReview: jest.fn().mockResolvedValue(undefined),
}));

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

beforeEach(() => {
  resetStoreReviewState();
});

describe("recordAppUse", () => {
  it("counts a calendar day once", () => {
    const day = daysAgo(0);
    expect(recordAppUse(day)).toBe(1);
    expect(recordAppUse(day)).toBe(1);
    expect(uniqueUseDays()).toBe(1);
  });

  it("counts distinct calendar days", () => {
    recordAppUse(daysAgo(2));
    recordAppUse(daysAgo(1));
    recordAppUse(daysAgo(0));
    expect(uniqueUseDays()).toBe(3);
  });
});

describe("maybeRequestReview", () => {
  const requestReview = jest.fn().mockResolvedValue(undefined);
  const hasAction = jest.fn().mockResolvedValue(true);

  beforeEach(() => {
    requestReview.mockClear();
    hasAction.mockResolvedValue(true);
  });

  it("does not prompt before enough days of use", async () => {
    recordAppUse(daysAgo(1));
    const asked = await maybeRequestReview({
      now: daysAgo(0),
      version: "1.0.0",
      hasAction,
      requestReview,
    });
    expect(asked).toBe(false);
    expect(requestReview).not.toHaveBeenCalled();
  });

  it("prompts once the use-day threshold is met", async () => {
    recordAppUse(daysAgo(2));
    recordAppUse(daysAgo(1));
    const asked = await maybeRequestReview({
      now: daysAgo(0),
      version: "1.0.0",
      hasAction,
      requestReview,
    });
    expect(uniqueUseDays()).toBe(MIN_REVIEW_USE_DAYS);
    expect(asked).toBe(true);
    expect(requestReview).toHaveBeenCalledTimes(1);
  });

  it("does not prompt again for the same app version", async () => {
    recordAppUse(daysAgo(2));
    recordAppUse(daysAgo(1));
    await maybeRequestReview({
      now: daysAgo(0),
      version: "1.0.0",
      hasAction,
      requestReview,
    });
    const asked = await maybeRequestReview({
      now: daysAgo(0),
      version: "1.0.0",
      hasAction,
      requestReview,
    });
    expect(asked).toBe(false);
    expect(requestReview).toHaveBeenCalledTimes(1);
  });

  it("can prompt again after an app version change", async () => {
    recordAppUse(daysAgo(2));
    recordAppUse(daysAgo(1));
    await maybeRequestReview({
      now: daysAgo(0),
      version: "1.0.0",
      hasAction,
      requestReview,
    });
    const asked = await maybeRequestReview({
      now: daysAgo(0),
      version: "1.1.0",
      hasAction,
      requestReview,
    });
    expect(asked).toBe(true);
    expect(requestReview).toHaveBeenCalledTimes(2);
  });

  it("skips when the store review action is unavailable", async () => {
    recordAppUse(daysAgo(2));
    recordAppUse(daysAgo(1));
    hasAction.mockResolvedValue(false);
    const asked = await maybeRequestReview({
      now: daysAgo(0),
      version: "1.0.0",
      hasAction,
      requestReview,
    });
    expect(asked).toBe(false);
    expect(requestReview).not.toHaveBeenCalled();
  });
});
