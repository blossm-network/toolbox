import assert from "node:assert/strict";
import test from "node:test";
import * as constants from "../index.js";

test("preserves the public wire values", () => {
  assert.deepEqual(
    { ...constants },
    {
      COMPLETED: "completed",
      QUEUED: "queued",
    }
  );
});
