const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const stream = require("..");

const deps = require("../deps");

const eventStore = "some-event-store";
const parallel = "some-parallel";
const fn = "some-fn";

describe("Mongodb event store event stream", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const streamResult = "stream-result";
    const eachAsyncFake = fake.returns(streamResult);
    const cursorFake = fake.returns({
      eachAsync: eachAsyncFake,
    });
    const findFake = fake.returns({
      cursor: cursorFake,
    });

    const db = {
      find: findFake,
    };

    replace(deps, "db", db);

    const sort = "some-sort";
    const limit = "some-limit";
    const query = "some-query";
    const result = await stream({ eventStore })({
      parallel,
      sort,
      limit,
      query,
      fn,
    });
    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query,
      sort,
      limit,
      options: {
        lean: true,
      },
    });
    expect(cursorFake).to.have.been.calledWith();
    expect(eachAsyncFake).to.have.been.calledWith(fn, { parallel });
    expect(result).to.deep.equal(streamResult);
  });
  it("should call with the correct params an optionals missing", async () => {
    const streamResult = "stream-result";
    const eachAsyncFake = fake.returns(streamResult);
    const cursorFake = fake.returns({
      eachAsync: eachAsyncFake,
    });
    const findFake = fake.returns({
      cursor: cursorFake,
    });

    const db = {
      find: findFake,
    };

    replace(deps, "db", db);

    const query = "some-query";
    const result = await stream({ eventStore })({
      fn,
      query,
    });

    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query,
      options: {
        lean: true,
      },
    });
    expect(cursorFake).to.have.been.calledWith();
    expect(eachAsyncFake).to.have.been.calledWith(fn, { parallel: 1 });
    expect(result).to.deep.equal(streamResult);
  });
});
