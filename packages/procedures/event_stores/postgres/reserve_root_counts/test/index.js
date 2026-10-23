import { expect } from "chai";
import { fake, replace, restore } from "sinon";

import operation from "../index.js";
import deps from "../deps.js";

describe("Postgres event store reserve root counts", () => {
  afterEach(restore);

  it("increments within the transaction and returns the post-increment count", async () => {
    const updated = "2026-10-22T00:00:00.000Z";
    replace(deps, "dateString", fake.returns(updated));
    const query = fake.resolves({
      rows: [{ root: "root", value: "3", updated }],
    });
    replace(deps, "db", { query });
    expect(
      await operation({
        countsStore: { database: "database", table: '"service"."counts"' },
      })({ root: "root", amount: 2, transaction: "transaction" })
    ).to.deep.equal({ root: "root", value: 3, updated });
    const [options] = query.firstCall.args;
    expect(options.database).to.equal("database");
    expect(options.transaction).to.equal("transaction");
    expect(options.values).to.deep.equal(["root", 2, updated]);
    expect(options.text).to.include('INSERT INTO "service"."counts" AS counts');
    expect(options.text).to.include("counts.value + EXCLUDED.value");
    expect(options.text).to.include("RETURNING root, value, updated");
  });
});
