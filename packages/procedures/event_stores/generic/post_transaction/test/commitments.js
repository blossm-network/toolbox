import { expect } from "chai";
import createEvent from "@blossm/create-event";
import hash from "@blossm/hash";
import post from "../index.js";

describe("Stored JSON commitments", () => {
  it("preserves scalar payloads and verifies every component with the canonical hash owner", async () => {
    const commitments = [];
    for (const payload of [false, true, 0, null, "true", {}]) {
      const event = createEvent({ root: "r", action: "set", payload, idempotency: "retry",
        domain: process.env.DOMAIN, service: process.env.SERVICE, network: process.env.NETWORK });
      await post({ eventData: [{event}], tx: { id: "tx" },
        reserveRootCountsFn: async () => ({ root: "r", value: 1 }),
        saveEventsFn: async ({events: [saved]}) => {
          expect(saved.payload).to.deep.equal(payload);
          expect(saved.hash).to.equal(hash(saved.headers).create());
          expect(saved.headers.pHash).to.equal(hash(payload).create());
          expect(saved.headers.tHash).to.equal(hash(saved.tx).create());
          commitments.push(saved.headers.pHash);
        },
      })();
    }
    expect(new Set(commitments).size).to.equal(6);
  });
});
