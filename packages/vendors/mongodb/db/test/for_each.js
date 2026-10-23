import * as chai from "chai";
import { fake } from "sinon";
import { forEach } from "../index.js";
import mongoose from "mongoose";

const { expect } = chai;

// Use the installed cursor's actual eachAsync implementation, without a server.
const cursorFor = (documents, error) => {
  const connection = mongoose.createConnection();
  const Model = connection.model("cursor-test", new mongoose.Schema({}, { strict: false, autoCreate: false }));
  Model.collection.buffer = false;
  Model.collection.find = () => ({
    next: async () => {
      if (error) throw error;
      return documents.shift() ?? null;
    },
    close: async () => {},
  });
  const cursor = Model.find().lean().cursor();
  return cursor;
};

const input = (cursor) => {
  const cursorFake = fake.returns(cursor);
  return { find: fake.returns({ cursor: cursorFake }) };
};

describe("For each", () => {
  it("awaits each callback before finishing and preserves cursor order", async () => {
    const completed = [];
    const store = input(cursorFor([{ value: 1 }, { value: 2 }]));
    const result = await forEach({
      store,
      query: { active: true },
      fn: async ({ value }) => {
        await new Promise((resolve) => setTimeout(resolve, value == 1 ? 10 : 0));
        completed.push(value);
      },
    });
    expect(completed).to.deep.equal([1, 2]);
    expect(result).to.equal(undefined);
    expect(store.find.firstCall.args).to.deep.equal([{ active: true }]);
  });

  for (const failure of ["callback", "cursor", "sync callback"]) {
    it(`rejects on ${failure} failure`, async () => {
      const error = new Error("iteration failed");
      const cursor = cursorFor([{ value: 1 }], failure == "cursor" ? error : undefined);
      let actual;
      try {
        await forEach({
          store: input(cursor),
          fn: failure == "sync callback" ? () => { throw error; } : async () => { throw error; },
        });
      } catch (err) {
        actual = err;
      }
      expect(actual).to.equal(error);
    });
  }
});
