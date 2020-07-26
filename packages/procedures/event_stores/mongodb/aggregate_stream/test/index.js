const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, stub } = require("sinon");

const aggregateStream = require("..");

const deps = require("../deps");

const eventStore = "some-event-store";
const snapshotStore = "some-snapshot-store";
const countsStore = "some-counts-store";
const handlers = "some-handlers";
const root = "some-root";
const timestamp = "some-timestamp";

describe("Mongodb event store aggregate stream", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const streamResult = "stream-result";
    const rootStreamFake = stub()
      .yieldsTo("fn", { root })
      .returns(streamResult);
    const rootStreamOuterFake = fake.returns(rootStreamFake);

    replace(deps, "rootStream", rootStreamOuterFake);

    const aggregateState = "some-aggragate-state";
    const aggregateHeaders = "some-aggragate-headers";
    const aggregateContext = "some-aggragate-context";
    const aggregate = {
      state: aggregateState,
      headers: aggregateHeaders,
      context: aggregateContext,
    };
    const aggregateFake = fake.returns(aggregate);
    const aggregateOuterFake = fake.returns(aggregateFake);
    replace(deps, "aggregate", aggregateOuterFake);

    const fnFake = fake();
    const result = await aggregateStream({
      eventStore,
      snapshotStore,
      countsStore,
      handlers,
    })({
      timestamp,
      fn: fnFake,
    });
    expect(rootStreamOuterFake).to.have.been.calledWith({
      countsStore,
    });
    expect(aggregateOuterFake).to.have.been.calledWith({
      snapshotStore,
      eventStore,
      handlers,
    });
    expect(aggregateFake).to.have.been.calledWith(root, { timestamp });
    expect(fnFake).to.have.been.calledWith({
      state: aggregateState,
      headers: aggregateHeaders,
      context: aggregateContext,
    });
    expect(result).to.deep.equal(streamResult);
  });
  it("should call with the correct params with optionals missing", async () => {
    const streamResult = "stream-result";
    const rootStreamFake = stub()
      .yieldsTo("fn", { root })
      .returns(streamResult);
    const rootStreamOuterFake = fake.returns(rootStreamFake);

    replace(deps, "rootStream", rootStreamOuterFake);

    const aggregateState = "some-aggragate-state";
    const aggregateHeaders = "some-aggragate-headers";
    const aggregateContext = "some-aggragate-context";
    const aggregate = {
      state: aggregateState,
      headers: aggregateHeaders,
      context: aggregateContext,
    };
    const aggregateFake = fake.returns(aggregate);
    const aggregateOuterFake = fake.returns(aggregateFake);
    replace(deps, "aggregate", aggregateOuterFake);

    const fnFake = fake();
    const result = await aggregateStream({
      eventStore,
      snapshotStore,
      countsStore,
      handlers,
    })({
      fn: fnFake,
    });
    expect(rootStreamOuterFake).to.have.been.calledWith({
      countsStore,
    });
    expect(aggregateOuterFake).to.have.been.calledWith({
      snapshotStore,
      eventStore,
      handlers,
    });
    expect(aggregateFake).to.have.been.calledWith(root);
    expect(fnFake).to.have.been.calledWith({
      state: aggregateState,
      headers: aggregateHeaders,
      context: aggregateContext,
    });
    expect(result).to.deep.equal(streamResult);
  });
  // it("should call with the correct params an optionals missing", async () => {
  //   const streamResult = "stream-result";
  //   const eachAsyncFake = fake.returns(streamResult);
  //   const cursorFake = fake.returns({
  //     eachAsync: eachAsyncFake,
  //   });
  //   const findFake = fake.returns({
  //     cursor: cursorFake,
  //   });

  //   const db = {
  //     find: findFake,
  //   };

  //   replace(deps, "db", db);

  //   const result = await aggregateStream({ eventStore })({
  //     from,
  //     fn,
  //   });

  //   expect(findFake).to.have.been.calledWith({
  //     store: eventStore,
  //     query: { "headers.created": { $gte: from } },
  //     sort: { "headers.created": 1, "headers.number": 1 },
  //     options: {
  //       lean: true,
  //     },
  //   });
  //   expect(cursorFake).to.have.been.calledWith();
  //   expect(eachAsyncFake).to.have.been.calledWith(fn, { parallel: 100 });
  //   expect(result).to.deep.equal(streamResult);
  // });
});
