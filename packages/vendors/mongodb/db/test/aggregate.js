const { expect } = require("chai");
const { restore, fake } = require("sinon");
const { aggregate } = require("../index");

const query = "some-query";

describe("Aggregate", () => {
  afterEach(() => {
    restore();
  });
  it("it should return the correct result with all optional parameters omitted", async () => {
    const execResult = 4;
    const aggregateFake = fake.returns(execResult);
    const store = {
      aggregate: aggregateFake,
    };
    const result = await aggregate({ store, query });

    expect(result).to.equal(execResult);
    expect(aggregateFake).to.have.been.calledWith([
      { $match: query },
      // { $project: { _id: 0, __v: 0 } },
      { $project: {} },
    ]);
  });
  it("it should return the correct result with select inclusion", async () => {
    const execResult = 4;
    const aggregateFake = fake.returns(execResult);
    const store = {
      aggregate: aggregateFake,
    };
    const select = { a: 1 };
    const result = await aggregate({ store, query, select });

    expect(result).to.equal(execResult);
    expect(aggregateFake).to.have.been.calledWith([
      { $match: query },
      { $project: { a: 1 } },
    ]);
  });
  it("it should return the correct result with all optional parameters included", async () => {
    const execResult = 4;
    const aggregateFake = fake.returns(execResult);
    const store = {
      aggregate: aggregateFake,
    };

    const sort = "some-sort";
    const select = { a: 0 };
    const skip = "some-skip";
    const limit = "some-limit";

    const result = await aggregate({
      store,
      query,
      sort,
      select,
      skip,
      limit,
    });

    expect(result).to.equal(execResult);
    expect(aggregateFake).to.have.been.calledWith([
      { $match: query },
      // { $project: { a: 0, _id: 0, __v: 0 } },
      { $project: { a: 0 } },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ]);
  });
});
