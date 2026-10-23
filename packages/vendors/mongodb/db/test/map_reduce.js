import * as chai from "chai";
import mongoose from "mongoose";
import { mapReduce } from "../index.js";

const { expect } = chai;

describe("Deprecated map reduce", () => {
  it("keeps imports compatible and directs actual Mongoose callers to aggregation", async () => {
    const connection = mongoose.createConnection();
    const Model = connection.model("map-reduce-test", new mongoose.Schema({}, { autoCreate: false }));
    expect(Model.mapReduce).to.equal(undefined);
    expect(Model.aggregate).to.be.a("function");
    let actual;
    try {
      await mapReduce({ store: Model, map: () => {}, reduce: () => {} });
    } catch (err) {
      actual = err;
    }
    expect(actual).to.be.instanceOf(Error);
    expect(actual.message).to.equal("MongoDB mapReduce is no longer supported. Use aggregate instead.");
  });
});
