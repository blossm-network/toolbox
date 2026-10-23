import { strict as assert } from "node:assert";
import { useFakeTimers } from "sinon";
import createEvent from "@blossm/create-event";
import hash from "@blossm/hash";
import post from "../index.js";

describe("Event commitment formats", () => {
  it("persists the producer marker and verifies old and new commitments independently", async () => {
    const clock = useFakeTimers(new Date("2026-01-01T00:00:00.000Z"));
    try {
      for (const canonicalFormat of [1, 2]) {
        const event = createEvent({
          root: "r",
          action: "set",
          domain: process.env.DOMAIN,
          service: process.env.SERVICE,
          network: process.env.NETWORK,
          payload: { enabled: false },
          canonicalFormat,
          idempotency: "retry",
        });
        let saved;
        await post({
          eventData: [{ event }],
          tx: { id: "tx" },
          reserveRootCountsFn: async () => ({ root: "r", value: 1 }),
          saveEventsFn: async ({ events }) => {
            [saved] = events;
          },
        })();
        assert.equal(
          saved.headers.canonicalFormat,
          canonicalFormat == 1 ? undefined : 2
        );
        assert.deepEqual(saved.payload, { enabled: false });
        const options = { canonicalFormat: saved.headers.canonicalFormat };
        assert.equal(
          saved.headers.pHash,
          canonicalFormat == 1
            ? "c33c12bd17c8e87e2fe9bb4d25770bcf16767a18667c51a9bf1fa33724d378f9"
            : "c5d6675dd3e3782f9edc5d568b0db07d6f64a9f23075e2f2c9406084f619d7f0"
        );
        assert.equal(saved.hash, hash(saved.headers, options).create());
        assert.equal(saved.headers.tHash, hash(saved.tx, options).create());
      }
    } finally {
      clock.restore();
    }
  });
  it("retains scalar JSON payloads in format 2", async () => {
    const commitments = [];
    for (const payload of [false, true, 0, null, "true", {}]) {
      const event = createEvent({ root: "r", action: "set", domain: process.env.DOMAIN,
        service: process.env.SERVICE, network: process.env.NETWORK, payload, idempotency: "retry" });
      await post({ eventData: [{ event }],
        reserveRootCountsFn: async () => ({ root: "r", value: 1 }),
        saveEventsFn: async ({ events: [saved] }) => {
          assert.deepEqual(saved.payload, payload);
          commitments.push(saved.headers.pHash);
        },
      })();
    }
    assert.equal(new Set(commitments).size, 6);
  });

});
