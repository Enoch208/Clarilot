import { useCallback, useEffect, useState } from "react";
import type { z } from "zod";
import { getJson } from "./api";

type Outcome<T> =
  { state: "ready"; data: T; loadedAt: number } | { state: "error"; message: string };

export type Resource<T> = { state: "loading" } | Outcome<T>;

type Settled<T> = { key: string; outcome: Outcome<T> };

export function useResource<T>(path: string | null, schema: z.ZodType<T>) {
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const [version, setVersion] = useState(0);
  const key = `${path ?? ""}#${String(version)}`;

  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    getJson(path, schema, controller.signal).then(
      (data) => {
        setSettled({ key, outcome: { state: "ready", data, loadedAt: Date.now() } });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : String(error);
        setSettled({ key, outcome: { state: "error", message } });
      },
    );
    return () => {
      controller.abort();
    };
  }, [key, path, schema]);

  const reload = useCallback(() => {
    setVersion((value) => value + 1);
  }, []);

  const resource: Resource<T> =
    settled !== null && settled.key === key ? settled.outcome : { state: "loading" };
  const previous = settled?.outcome ?? null;
  return { resource, previous, reload };
}
