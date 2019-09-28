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
    const execFake = fake.returns(execResult);
    const skipFake = fake.returns({
      exec: execFake
    });
    const findFake = fake.returns({
      skip: skipFake
    });
    const store = {
      find: findFake,
      skip: skipFake,
      exec: execFake
    };
    const result = await find({ store, query });

    expect(result).to.equal(execResult);
    expect(findFake).to.have.been.calledWith(query);
    expect(skipFake).to.have.been.calledWith(0);
    expect(execFake).to.have.been.calledOnce;
  });
  it("it should return the correct result with all optional parameters included", async () => {
    const execResult = 4;
    const execFake = fake.returns(execResult);
    const sortFake = fake();
    const selectFake = fake();
    const limitFake = fake();
    const skipFake = fake.returns({
      exec: execFake,
      sort: sortFake,
      select: selectFake,
      limit: limitFake
    });
    const findFake = fake.returns({
      skip: skipFake
    });
    const store = {
      find: findFake
    };

    const sort = "some-sort";
    const select = "some-select";
    const skip = "some-skip";
    const pageSize = "some-page-size";

    const result = await find({
      store,
      query,
      sort,
      select,
      skip,
      pageSize
    });

    expect(result).to.equal(execResult);
    expect(findFake).to.have.been.calledWith(query);
    expect(skipFake).to.have.been.calledWith(skip);
    expect(execFake).to.have.been.calledOnce;
    expect(selectFake).to.have.been.calledWith(select);
    expect(sortFake).to.have.been.calledWith(sort);
    expect(limitFake).to.have.been.calledWith(pageSize);
  });
});
