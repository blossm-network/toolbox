import { expect } from "chai";
import { fake, replace, restore } from "sinon";

import operation from "../index.js";
import deps from "../deps.js";

describe("Postgres event store event stream", () => {
  afterEach(restore);

  it("forwards streaming options, including a zero limit", async () => {
    const stream = fake.resolves("result");
    replace(deps, "db", { stream });
    const fn = fake();
    const options = {
      query: { "headers.root": "root" },
      sort: { "headers.number": 1 },
      parallel: 3,
      limit: 0,
      fn,
      transaction: "transaction",
    };
    expect(await operation({ eventStore: "events" })(options)).to.equal(
      "result"
    );
    expect(stream.firstCall.args[0]).to.deep.equal({
      store: "events",
      ...options,
    });
    await operation({ eventStore: "events" })({ fn });
    expect(stream.secondCall.args[0]).to.deep.equal({
      store: "events",
      query: undefined,
      parallel: 1,
      fn,
      transaction: undefined,
    });
  });
});
