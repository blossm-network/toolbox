import { expect } from "chai";
import { fake, replace, restore } from "sinon";
import save from "../index.js";
import deps from "../deps.js";

describe("Mongo duplicate error compatibility", () => {
  afterEach(restore);
  for (const error of [
    Object.assign(new Error("duplicate"), {
      code: 11000,
      writeErrors: [{ err: { errmsg: 'dup key: { hash: "event-hash" }' } }],
    }),
    Object.assign(new Error("duplicate"), {
      code: 11000,
      keyValue: { hash: "event-hash" },
    }),
    Object.assign(new Error("duplicate"), { code: 11000 }),
    Object.assign(new Error("duplicate"), {
      code: 11000,
      writeErrors: [{ errmsg: "key: {}" }],
    }),
  ]) {
    it("preserves duplicate classification for supported driver error shapes", async () => {
      replace(deps, "db", { create: fake.rejects(error) });
      let actual;
      try {
        await save({ eventStore: {}, handlers: { set() {} } })({
          events: [{ headers: { action: "set" } }],
        });
      } catch (err) {
        actual = err;
      }
      expect(actual.statusCode).to.equal(412);
      expect(actual.message).to.equal("Duplicates.");
    });
  }
});
