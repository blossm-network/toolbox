import { expect } from "chai";
import { fake, replace, restore } from "sinon";

import operation from "../index.js";
import deps from "../deps.js";

describe("Postgres event store save events", () => {
  afterEach(restore);

  it("checks every handler before inserting the event batch", async () => {
    const create = fake.resolves();
    replace(deps, "db", { create });
    const events = [{ headers: { action: "create" } }];
    await operation({ eventStore: "events", handlers: { create: () => {} } })({
      events,
      transaction: "transaction",
    });
    expect(create.firstCall.args[0]).to.deep.equal({
      store: "events",
      data: events,
      transaction: "transaction",
    });
    const error = new Error("missing handler");
    replace(deps, "badRequestError", { message: fake.returns(error) });
    let caught;
    try {
      await operation({ eventStore: "events", handlers: {} })({ events });
    } catch (err) {
      caught = err;
    }
    expect(caught).to.equal(error);
    expect(create.callCount).to.equal(1);
  });

  it("maps unique conflicts but preserves retryable and other failures", async () => {
    const duplicate = Object.assign(new Error("duplicate"), {
      code: "23505",
      constraint: "events_nonce_key",
    });
    const mapped = new Error("Duplicates.");
    const message = fake.returns(mapped);
    replace(deps, "preconditionFailedError", { message });
    for (const error of [
      duplicate,
      Object.assign(new Error("retry"), { code: "40001" }),
      Object.assign(new Error("deadlock"), { code: "40P01" }),
      new Error("unavailable"),
    ]) {
      replace(deps, "db", { create: fake.rejects(error) });
      let caught;
      try {
        await operation({ eventStore: "events", handlers: {} })({ events: [] });
      } catch (err) {
        caught = err;
      }
      expect(caught).to.equal(error === duplicate ? mapped : error);
      restore();
      replace(deps, "preconditionFailedError", { message });
    }
    expect(message.firstCall.args).to.deep.equal([
      "Duplicates.",
      { cause: duplicate, info: { constraint: "events_nonce_key" } },
    ]);
    expect(message.callCount).to.equal(1);
  });
});
