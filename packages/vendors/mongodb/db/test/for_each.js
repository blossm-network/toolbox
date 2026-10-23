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
  const close = fake.resolves();
  Model.collection.find = () => ({
    next: async () => {
      if (error) throw error;
      return documents.shift() ?? null;
    },
    close,
  });
  const cursor = Model.find().lean().cursor();
  cursor.closedFake = close;
  return cursor;
};

const input = (cursor) => {
  const cursorFake = fake.returns(cursor);
  return { find: fake.returns({ cursor: cursorFake }) };
};

describe("For each", () => {
  it("awaits each callback before finishing and preserves cursor order", async () => {
    const completed = [];
    const cursor = cursorFor([{ value: 1 }, { value: 2 }]);
    const store = input(cursor);
    const result = await forEach({
      store,
      query: { active: true },
      fn: async ({ value }) => {
        await new Promise((resolve) => setTimeout(resolve, value == 1 ? 10 : 0));
        completed.push(value);
      },
    });
    expect(completed).to.deep.equal([1, 2]);
    expect(cursor.closedFake.callCount).to.equal(1);
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
      expect(cursor.closedFake.callCount).to.equal(1);
    });
  }
  it("preserves callback errors when closing also fails", async () => {
    const error = new Error("callback failure");
    const cursor = cursorFor([{ value: 1 }]);
    cursor.close = fake.rejects(new Error("cleanup failure"));
    let actual;
    try {
      await forEach({ store: input(cursor), fn: async () => { throw error; } });
    } catch (err) {
      actual = err;
    }
    expect(actual).to.equal(error);
    expect(cursor.close.callCount).to.equal(1);
  });

  it("rejects a closing failure after callbacks complete", async () => {
    const error = new Error("cleanup failure");
    const cursor = cursorFor([{ value: 1 }]);
    cursor.close = fake.rejects(error);
    let actual;
    try {
      await forEach({ store: input(cursor), fn: async () => {} });
    } catch (err) {
      actual = err;
    }
    expect(actual).to.equal(error);
    expect(cursor.close.callCount).to.equal(1);
  });

});
