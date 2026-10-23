import { expect } from "chai";
import { fake, replace, restore } from "sinon";

import operation from "../index.js";
import deps from "../deps.js";

describe("Postgres event store create transaction", () => {
  afterEach(restore);

  it("binds the database and leaves callback execution to the transaction owner", async () => {
    const fn = fake();
    const createTransaction = fake.resolves("result");
    replace(deps, "db", { createTransaction });
    expect(await operation({ database: "database" })(fn)).to.equal("result");
    expect(createTransaction.firstCall.args[0]).to.deep.equal({
      database: "database",
      fn,
    });
    expect(fn.called).to.equal(false);
  });
});
