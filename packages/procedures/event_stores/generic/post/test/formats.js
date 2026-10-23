import { strict as assert } from "node:assert";
import post from "../index.js";

describe("Store canonical format activation", () => {
  it("rejects stale writers before deduplication and persistence", async () => {
    let touched = false;
    const handler = post({
      canonicalFormat: 2,
      idempotencyConflictCheckFn: async () => {
        touched = true;
      },
      createTransactionFn: async () => {
        touched = true;
      },
    });
    await assert.rejects(
      handler(
        {
          body: { eventData: [{ event: { headers: { idempotency: "old" } } }] },
        },
        {}
      ),
      /canonical format does not match/
    );
    assert.equal(touched, false);
  });
});
