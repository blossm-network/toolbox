import { expect } from "chai";
import { fake, replace, restore } from "sinon";

import operation from "../index.js";
import deps from "../deps.js";

describe("Postgres event store find events", () => {
  afterEach(restore);

  it("keeps event queries bounded and forwards sorting and transaction", async () => {
    const find = fake.resolves(["event"]);
    replace(deps, "db", { find });
    const options = {
      query: { "headers.root": "root" },
      sort: { "headers.number": 1 },
      transaction: "transaction",
    };
    expect(await operation({ eventStore: "events" })(options)).to.deep.equal([
      "event",
    ]);
    expect(find.firstCall.args[0]).to.deep.equal({
      store: "events",
      ...options,
      limit: 100,
    });
    await operation({ eventStore: "events" })({ query: {} });
    expect(find.secondCall.args[0]).not.to.have.property("sort");
  });
});
