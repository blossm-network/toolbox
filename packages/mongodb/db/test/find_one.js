const { expect } = require("chai");
const { findOne } = require("../index");

describe("Find one", () => {
  it("it should return the correct result", async () => {
    const execResult = 4;
    const store = {
      findOne: () => {
        return { exec: () => execResult };
      }
    };
    const result = await findOne({ store, query: {} });

    expect(result).to.equal(execResult);
  });
  it("it should return the correct result if select is passed", async () => {
    const execResult = 4;
    const store = {
      findOne: () => {
        return {
          select: () => store,
          exec: () => execResult
        };
      }
    };
    const result = await findOne({ store, query: {}, select: {} });

    expect(result).to.equal(execResult);
  });
});
