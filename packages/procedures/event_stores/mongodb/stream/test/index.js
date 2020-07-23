const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const stream = require("..");

const deps = require("../deps");

const eventStore = "some-event-store";
const root = "some-root";
const actions = "some-actions";
const from = "some-from";
const parallel = "some-parallel";
const fn = "some-fn";

describe("Mongodb event store stream", () => {
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

    const result = await stream({ eventStore })({
      root,
      actions,
      from,
      parallel,
      fn,
    });
    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "headers.created": { $gte: from },
        "headers.root": root,
        "headers.action": { $in: actions },
      },
      sort: { "headers.created": 1, "headers.number": 1 },
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

    const result = await stream({ eventStore })({
      from,
      fn,
    });

    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query: { "headers.created": { $gte: from } },
      sort: { "headers.created": 1, "headers.number": 1 },
      options: {
        lean: true,
      },
    });
    expect(cursorFake).to.have.been.calledWith();
    expect(eachAsyncFake).to.have.been.calledWith(fn, { parallel: 1 });
    expect(result).to.deep.equal(streamResult);
  });
});
