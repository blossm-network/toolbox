import { expect } from "chai";
import { fake, replace, restore } from "sinon";

import operation from "../index.js";
import deps from "../deps.js";

describe("Postgres event store idempotency conflict check", () => {
  afterEach(restore);

  it("checks whether the idempotency key already exists", async () => {
    const find = fake.resolves([{}]);
    replace(deps, "db", { find });
    expect(await operation({ eventStore: "events" })("key")).to.equal(true);
    expect(find.firstCall.args[0]).to.deep.equal({
      store: "events",
      query: { "headers.idempotency": "key" },
      limit: 1,
    });
    restore();
    replace(deps, "db", { find: fake.resolves([]) });
    expect(await operation({ eventStore: "events" })("key")).to.equal(false);
  });
});
