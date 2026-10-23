import { expect } from "chai";
import { fake, replace, restore } from "sinon";
import save from "../index.js";
import deps from "../deps.js";
const event = {
  hash: "event-hash",
  headers: {
    root: "r",
    action: "set",
    topic: "topic",
    domain: "d",
    service: "s",
    network: "n",
    committed: "2026-01-01T00:00:00.000Z",
  },
};

describe("Transactional publication persistence", () => {
  afterEach(restore);
  it("writes events and durable notices on the same session", async () => {
    const create = fake.resolves();
    replace(deps, "db", { create });
    await save({
      eventStore: "events",
      publicationsStore: "publications",
      handlers: { set() {} },
    })({ events: [event], transaction: "session" });
    expect(create.callCount).to.equal(2);
    expect(create.secondCall.args[0]).to.deep.equal({
      store: "publications",
      data: [
        {
          hash: event.hash,
          created: event.headers.committed,
          topic: "topic",
          data: {
            root: "r",
            action: "set",
            domain: "d",
            service: "s",
            network: "n",
            timestamp: event.headers.committed,
          },
        },
      ],
      options: { session: "session" },
    });
  });
  it("rejects outbox writes without a transaction before persisting any events", async () => {
    const create = fake.resolves();
    replace(deps, "db", { create });
    try {
      await save({
        eventStore: "events",
        publicationsStore: "publications",
        handlers: { set() {} },
      })({ events: [event] });
      throw new Error("expected rejection");
    } catch (err) {
      expect(err.message).to.match(/transaction/i);
    }
    expect(create.callCount).to.equal(0);
  });
});
