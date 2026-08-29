import { useEffect } from "react";
import { useWardStore } from "../state/useWardStore";

const VITALS_FEED_INTERVAL_MS = 4_000;

export function useVitalsFeed() {
  const tick = useWardStore((state) => state.tick);

  useEffect(() => {
    const intervalId = window.setInterval(tick, VITALS_FEED_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [tick]);
}
