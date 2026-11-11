import assert from "node:assert/strict";
import validator from "@blossm/validator";
import validateCommand from "../index.js";

it("preserves command header field paths when composing and serializing errors", async () => {
  await assert.rejects(
    validateCommand({
      headers: { idempotency: 123, issued: new Date().toISOString() },
    }),
    (error) => {
      const result = validator.findError([validator.findError([error])]);
      const json = JSON.parse(JSON.stringify(result));
      assert.equal(json.statusCode, 409);
      assert.equal(json.info.errors[0].path, "headers.idempotency");
      return true;
    },
  );
});
