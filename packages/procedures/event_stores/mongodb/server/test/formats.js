import { strict as assert } from "node:assert";
import { replace, restore } from "sinon";
import server, { __resetStoresForTest } from "../index.js";
import deps from "../deps.js";

describe("Persisted canonical format markers", () => {
  afterEach(() => { restore(); __resetStoresForTest(); });
  it("survives real Mongo model casting for events, snapshots and blocks", async () => {
    __resetStoresForTest();
    const store = deps.db.store;
    const documents = {};
    replace(deps.db, "store", config => {
      // Compile the actual schema without opening a database connection.
      const Model = store({ ...config, name: `canonical_${config.name}`, connection: {} });
      documents[config.name] = new Model({ headers: { canonicalFormat: 2 } }).toObject();
      return Model;
    });
    replace(deps, "eventStore", () => {});
    await server({ schema: {}, handlers: {}, secretFn: async () => "unused" });
    for (const name of ["events", "snapshots", "blockchain"]) {
      assert.equal(documents[name].headers.canonicalFormat, 2);
    }
  });
});
