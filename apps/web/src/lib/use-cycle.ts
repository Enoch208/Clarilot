import { useEffect, useState } from "react";

export function useCycle(length: number, periodMs: number, paused: boolean) {
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(0);
  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => {
      setIndex((value) => (value + 1) % length);
      setRound((value) => value + 1);
    }, periodMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [index, round, length, periodMs, paused]);
  const select = (next: number) => {
    setIndex(next);
    setRound((value) => value + 1);
  };
  return { index, round, select };
}
