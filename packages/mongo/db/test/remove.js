const { expect } = require("chai");
const { remove } = require("../index");

describe("Remove", () => {
  it("it should return correctly", async () => {
    const execResult = 4;
    const store = {
      remove: () => store,
      exec: () => execResult
    };

    const result = await remove({ store, query: {} });

    expect(result).to.equal(execResult);
  });
});
