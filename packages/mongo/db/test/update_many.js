const { expect } = require("chai");
const { updateMany } = require("../index");

describe("Update many", () => {
  it("it should return correctly with all optional params unspecified", async () => {
    const execResult = 4;
    const store = {
      updateMany: () => execResult
    };

    const result = await updateMany({ store, query: {} });

    expect(result).to.equal(execResult);
  });

  it("it should return correctly with all optional params included", async () => {
    const execResult = 4;
    const store = {
      updateMany: () => execResult
    };

    const result = await updateMany({ store, query: {}, options: {} });

    expect(result).to.equal(execResult);
  });
});
