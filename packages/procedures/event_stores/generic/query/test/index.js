import { expect } from "chai";
import query from "../index.js";

describe("Aggregate query contract", () => {
  for (const pairs of [{}, [{ value: 1 }], [{ key: "a" }]]) {
    it(`rejects missing query structure ${JSON.stringify(pairs)}`, async () => {
      try {
        await query({})(pairs);
        throw new Error("expected rejection");
      } catch (err) {
        expect(err.statusCode).to.equal(400);
      }
    });
  }
  it("returns no results for an empty root stream", async () => {
    expect(await query({ rootStreamFn: async () => {} })([])).to.deep.equal([]);
  });
  it("propagates root enumeration errors", async () => {
    const failure = new Error("root failure");
    try {
      await query({
        rootStreamFn: async () => {
          throw failure;
        },
      })([]);
      throw new Error("expected rejection");
    } catch (err) {
      expect(err).to.equal(failure);
    }
  });
});
