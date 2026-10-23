import { strict as assert } from "node:assert";
import createEvent from "../index.js";

describe("Event canonical format", () => {
  const input = {
    root: "r",
    action: "a",
    domain: "d",
    service: "s",
    network: "n",
    idempotency: "retry",
  };
  it("marks new events and distinguishes payloads in deduplication", () => {
    const events = [true, false, {}].map((enabled) =>
      createEvent({ ...input, payload: { enabled } })
    );
    assert.equal(new Set(events.map((e) => e.headers.idempotency)).size, 3);
    events.forEach((e) => assert.equal(e.headers.canonicalFormat, 2));
    assert.equal(events[0].headers.version, 0);
    assert.equal(
      Buffer.from(events[0].headers.idempotency.slice(3), "hex").toString(),
      'retry-r-a-d-s{"enabled":true}'
    );
  });
  it("keeps explicit legacy retry identities byte for byte", () => {
    const event = createEvent({
      ...input,
      payload: { enabled: false },
      canonicalFormat: 1,
    });
    assert.equal(event.headers.canonicalFormat, undefined);
    assert.equal(
      Buffer.from(event.headers.idempotency, "hex").toString(),
      'retry-r-a-d-s{"enabled":{}}'
    );
  });
  it("namespaces outside hex so legacy caller keys cannot alias format 2", () => {
    const old = createEvent({ ...input, payload: {}, canonicalFormat: 1, idempotency: "v2-retry" });
    const current = createEvent({ ...input, payload: {} });
    assert.match(current.headers.idempotency, /^v2:[0-9a-f]+$/);
    assert.match(old.headers.idempotency, /^[0-9a-f]+$/);
    assert.notEqual(current.headers.idempotency, old.headers.idempotency);
  });

});
