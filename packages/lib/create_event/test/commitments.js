import { expect } from "chai";
import createEvent from "../index.js";

describe("Event retry identity", () => {
  it("distinguishes Boolean and empty object payloads with one canonical encoding", () => {
    const events = [true, false, {}].map(enabled => createEvent({
      root: "r", action: "a", domain: "d", service: "s", network: "n",
      idempotency: "retry", payload: { enabled },
    }));
    expect(new Set(events.map(e => e.headers.idempotency)).size).to.equal(3);
    expect(Buffer.from(events[0].headers.idempotency, "hex").toString()).to.equal('retry-r-a-d-s{"enabled":true}');
  });
});
