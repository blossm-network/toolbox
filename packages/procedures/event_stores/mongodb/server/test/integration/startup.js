import { expect } from "chai";
import { replace } from "sinon";
import setup from "./setup.js";
import mongoose from "mongoose";
import server from "../../index.js";
import deps from "../../deps.js";

describe("MongoDB event store indexes", function () {
  this.timeout(30000);
  setup();

  it("creates identity indexes and every configured payload/state index", async () => {
    let composition;
    replace(deps, "eventStore", (options) => {
      composition = options;
    });
    await server({
      schema: { amount: Number, other: Number, nested: { field: Number } },
      indexes: ["amount", "other", "nested.field"],
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
        ({ key }) => Object.keys(key).length === 1 && key[field] === 1,
      );
      expect(matches.length).to.equal(1);
      expect(matches[0].unique).to.equal(true);
    }
    for (const [collection, prefix] of [
      ["events", "payload"],
      ["snapshots", "state"],
    ]) {
      const indexes = await mongoose.connection
        .collection(collection)
        .indexes();
      for (const field of ["amount", "other", "nested.field"]) {
        expect(
          indexes.filter(
            ({ key }) =>
              Object.keys(key).length === 1 && key[`${prefix}.${field}`] === 1,
          ),
        ).to.have.length(1);
      }
    }
  });
});
