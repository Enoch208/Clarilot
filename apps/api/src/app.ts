import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { HTTPException } from "hono/http-exception";
import type { AppDeps } from "./deps";
import { describeFailure, HttpError } from "./http/errors";
import { alertRoutes } from "./routes/alerts";
import { operationRoutes } from "./routes/operations";
import { statusRoutes } from "./routes/status";
import { RegistryError } from "./sql/registry";

export function createApp(deps: AppDeps) {
  return new Hono()
    .use("/api/*", bodyLimit({ maxSize: 16 * 1024 }))
    .route("/api", statusRoutes(deps))
    .route("/api", alertRoutes(deps))
    .route("/api", operationRoutes(deps))
    .notFound((c) =>
      c.json({ code: "NOT_FOUND", message: "There is nothing at this address." }, 404),
    )
    .onError((error, c) => {
      if (error instanceof HttpError) {
        return c.json(error.toBody(), error.status);
      }
      if (error instanceof RegistryError) {
        return c.json({ code: error.code, message: error.message }, 400);
      }
      if (error instanceof HTTPException && error.status < 500) {
        return c.json(
          { code: "INVALID_REQUEST", message: "The request could not be read." },
          error.status,
        );
      }
      process.stderr.write(`${describeFailure(error)}\n`);
      return c.json(
        { code: "INTERNAL", message: "Something went wrong in the API. Try again." },
        500,
      );
    });
}
