import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";

/**
 * Run `refetch` whenever this screen regains focus after having lost it —
 * e.g. returning from a push()'d edit page. Skips the initial focus on mount
 * (the screen's own data loading covers that), so no double fetch.
 */
export function useRefetchOnRefocus(refetch: () => void) {
  const blurred = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (blurred.current) {
        blurred.current = false;
        refetch();
      }
      return () => {
        blurred.current = true;
      };
    }, [refetch]),
  );
}
