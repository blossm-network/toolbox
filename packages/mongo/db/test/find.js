const { expect } = require("chai");
const { find } = require("../index");

describe("Find", () => {
  it("it should return the correct result with all optional parameters omitted", async () => {
    const execResult = 4;
    const store = {
      find: () => store,
      skip: () => store,
      exec: () => execResult
    };
    const result = await find({ store, query: {} });

    expect(result).to.equal(execResult);
  });
  it("it should return the correct result with all optional parameters included", async () => {
    const execResult = 4;
    const store = {
      find: () => store,
      select: () => store,
      sort: () => store,
      skip: () => store,
      limit: () => store,
      exec: () => execResult
    };
    const result = await find({
      store,
      query: {},
      sort: 0,
      select: {},
      skip: 10,
      pageSize: 10
    });

    expect(result).to.equal(execResult);
  });
});
