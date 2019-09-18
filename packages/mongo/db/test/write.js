const { expect } = require("chai").use(require("chai-as-promised"));
const { write } = require("../index");

describe("write", () => {
  it("it should return correctly with all optional params unspecified", async () => {
    const execResult = 4;
    const store = {
      findOneAndUpdate: () => execResult
    };

    const result = await write({ store, query: {}, update: {} });

    expect(result).to.equal(execResult);
  });
  it("it should return correctly with all optional params included", async () => {
    const execResult = 4;
    const store = {
      findOneAndUpdate: () => execResult
    };

    const result = await write({ store, query: {}, options: {}, update: {} });

    expect(result).to.equal(execResult);
  });
});
