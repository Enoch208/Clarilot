import { useEffect, useState } from "react";

export function useNow(periodMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, periodMs);
    return () => {
      window.clearInterval(timer);
    };
  }, [periodMs]);
  return now;
}
