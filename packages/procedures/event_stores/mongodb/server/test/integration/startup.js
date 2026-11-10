import { expect } from "chai";
import { replace } from "sinon";
import setup from "./setup.js";
import mongoose from "mongoose";
import server from "../../index.js";
import deps from "../../deps.js";

describe("MongoDB event store indexes", function () {
  this.timeout(30000);
  setup();

  it("creates one unique index for each event-store identity", async () => {
    let composition;
    replace(deps, "eventStore", (options) => {
      composition = options;
    });
    await server({
      schema: { amount: Number },
      handlers: { set() {} },
      secretFn: async () => undefined,
    });
    expect(typeof composition.saveEventsFn).to.equal("function");
    for (const [collection, field] of [
      ["events", "hash"],
      ["events", "headers.idempotency"],
      ["snapshots", "hash"],
      ["counts", "root"],
      ["blockchain", "headers.number"],
    ]) {
      const indexes = await mongoose.connection
        .collection(collection)
        .indexes();
      const matches = indexes.filter(
        ({ key }) => Object.keys(key).length === 1 && key[field] === 1
      );
      expect(matches.length).to.equal(1);
      expect(matches[0].unique).to.equal(true);
    }
  });
});
