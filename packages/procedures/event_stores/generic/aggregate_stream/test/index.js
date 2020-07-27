const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, stub, match } = require("sinon");

const aggregateStream = require("..");

const deps = require("../deps");

const findOneSnapshotFn = "some-find-one-snapshot-fn";
const eventStreamFn = "some-event-stream-fn";

const handlers = "some-handlers";
const root = "some-root";
const timestamp = "some-timestamp";

const aggregateState = "some-aggragate-state";
const aggregateHeaders = "some-aggragate-headers";
const aggregateContext = "some-aggragate-context";

describe("Event store aggregate stream", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const streamResult = "stream-result";
    const rootStreamFake = stub()
      .yieldsTo("fn", { root })
      .returns(streamResult);

    const aggregate = {
      state: aggregateState,
      headers: aggregateHeaders,
      context: aggregateContext,
    };
    const aggregateFake = fake.returns(aggregate);
    const aggregateOuterFake = fake.returns(aggregateFake);
    replace(deps, "aggregate", aggregateOuterFake);

    const stringifyResult = "some-stringify-fake";
    const stringifyFake = fake.returns(stringifyResult);
    replace(JSON, "stringify", stringifyFake);

    const parallel = "some-parallel";
    const params = { root };

    const req = {
      query: {
        timestamp,
        parallel,
      },
      params,
    };

    const endFake = fake();
    const writeFake = fake();
    const res = {
      end: endFake,
      write: writeFake,
    };
    await aggregateStream({
      rootStreamFn: rootStreamFake,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    })(req, res);

    expect(rootStreamFake).to.have.been.calledWith({
      parallel,
      fn: match(() => true),
    });
    expect(aggregateFake).to.have.been.calledWith(root, {
      timestamp,
    });
    expect(writeFake).to.have.been.calledWith(stringifyResult);
    expect(stringifyFake).to.have.been.calledWith({
      state: aggregateState,
      headers: aggregateHeaders,
      context: aggregateContext,
    });
    expect(endFake).to.have.been.calledOnce;
  });
  it("should call with the correct params with optionals missing", async () => {
    const streamResult = "stream-result";
    const rootStreamFake = stub()
      .yieldsTo("fn", { root })
      .returns(streamResult);

    const aggregate = {
      state: aggregateState,
      headers: aggregateHeaders,
      context: aggregateContext,
    };
    const aggregateFake = fake.returns(aggregate);
    const aggregateOuterFake = fake.returns(aggregateFake);
    replace(deps, "aggregate", aggregateOuterFake);

    const stringifyResult = "some-stringify-fake";
    const stringifyFake = fake.returns(stringifyResult);
    replace(JSON, "stringify", stringifyFake);

    const params = { root };

    const req = {
      query: {},
      params,
    };

    const endFake = fake();
    const writeFake = fake();
    const res = {
      end: endFake,
      write: writeFake,
    };
    await aggregateStream({
      rootStreamFn: rootStreamFake,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    })(req, res);

    expect(rootStreamFake).to.have.been.calledWith({
      fn: match(() => true),
    });
    expect(aggregateFake).to.have.been.calledWith(root, {});
    expect(writeFake).to.have.been.calledWith(stringifyResult);
    expect(stringifyFake).to.have.been.calledWith({
      state: aggregateState,
      headers: aggregateHeaders,
      context: aggregateContext,
    });
    expect(endFake).to.have.been.calledOnce;
  });
});
