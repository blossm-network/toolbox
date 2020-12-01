const { expect } = require("chai");
const { restore, fake } = require("sinon");
const { find } = require("../index");

const query = "some-query";

describe("Find", () => {
  afterEach(() => {
    restore();
  });
  it("it should return the correct result with all optional parameters omitted", async () => {
    const execResult = 4;
    const findFake = fake.returns(execResult);
    const store = {
      find: findFake,
    };
    const result = await find({ store, query });

    expect(result).to.equal(execResult);
    expect(findFake).to.have.been.calledWith(query, { _id: 0, __v: 0 }, {});
  });
  it("it should return the correct result with select inclusion", async () => {
    const execResult = 4;
    const findFake = fake.returns(execResult);
    const store = {
      find: findFake,
    };
    const select = { a: 1 };
    const result = await find({ store, query, select });

    expect(result).to.equal(execResult);
    expect(findFake).to.have.been.calledWith(query, { a: 1 }, {});
  });
  it("it should return the correct result with all optional parameters included", async () => {
    const execResult = 4;
    const findFake = fake.returns(execResult);
    const store = {
      find: findFake,
    };

    const sort = "some-sort";
    const select = { a: 0 };
    const skip = "some-skip";
    const limit = "some-limit";
    const options = { a: 1 };

    const result = await find({
      store,
      query,
      sort,
      select,
      skip,
      limit,
      options,
    });

    expect(result).to.equal(execResult);
    expect(findFake).to.have.been.calledWith(
      query,
      { a: 0, _id: 0, __v: 0 },
      {
        skip,
        sort,
        limit,
        a: 1,
      }
    );
  });
});
