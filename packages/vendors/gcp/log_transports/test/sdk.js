import assert from "node:assert/strict";
import { test } from "node:test";
import { LoggingWinston } from "@google-cloud/logging-winston";

test("installed cloud logging transport constructs without remote writes", () => {
  const transport = new LoggingWinston({
    projectId: "offline",
    redirectToStdout: true,
  });
  assert.equal(typeof transport.log, "function");
  transport.end();
});
