// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

import * as fs from "node:fs";

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

if (typeof process !== "undefined" && typeof process.on === "function") {
  process.on("uncaughtException", (error) => {
    record(error);
    try {
      const errText = error instanceof Error ? error.stack || error.message : String(error);
      fs.appendFileSync(
        "ssr-errors.log",
        `[${new Date().toISOString()}] Uncaught Exception:\n${errText}\n\n`,
      );
    } catch (err) {
      console.warn("Failed to write uncaughtException to ssr-errors.log", err);
    }
  });
  process.on("unhandledRejection", (reason) => {
    record(reason);
    try {
      const errText = reason instanceof Error ? reason.stack || reason.message : String(reason);
      fs.appendFileSync(
        "ssr-errors.log",
        `[${new Date().toISOString()}] Unhandled Rejection:\n${errText}\n\n`,
      );
    } catch (err) {
      console.warn("Failed to write unhandledRejection to ssr-errors.log", err);
    }
  });
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
