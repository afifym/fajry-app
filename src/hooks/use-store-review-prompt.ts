import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";

import { maybeRequestReview } from "@/utils/storeReview";

const REVIEW_IDLE_MS = 2_000;

/** After several days of opening home, ask StoreKit/Play for a review. */
export function useStoreReviewPrompt(): void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      timer.current = setTimeout(() => {
        void maybeRequestReview();
      }, REVIEW_IDLE_MS);
      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }, []),
  );
}
