import type { AlertsResponse, QueryFailure } from "@clarilot/core";

export function isQueryFailure(response: AlertsResponse): response is QueryFailure {
  return (
    response.status === "SOURCE_UNAVAILABLE" ||
    response.status === "ACCESS_DENIED" ||
    response.status === "TIMEOUT"
  );
}
