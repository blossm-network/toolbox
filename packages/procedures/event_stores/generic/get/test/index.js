const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const get = require("..");
const deps = require("../deps");

const found = "some-objs";
const root = "some-root";
const findSnapshotsFn = "some-find-snapshots-fn";
const findEventsFn = "some-find-events-fn";
const findOneSnapshotFn = "some-find-one-snapshot-fn";
const eventStreamFn = "some-event-stream-fn";
const handlers = "some-handlers";

describe("Event store get", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params with root", async () => {
    const aggregateFnFake = fake.returns(found);
    const aggregateOuterFnFake = fake.returns(aggregateFnFake);
    replace(deps, "aggregate", aggregateOuterFnFake);
    const params = {
      root,
    };
    const req = {
      params,
    };
    const sendFake = fake();
    const res = {
      send: sendFake,
    };
    await get({
      findSnapshotsFn,
      findEventsFn,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    })(req, res);

    expect(aggregateOuterFnFake).to.have.been.calledWith({
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    });
    expect(aggregateFnFake).to.have.been.calledWith(root);
    expect(sendFake).to.have.been.calledWith(found);
  });
  it("should call with the correct params without root", async () => {
    const queryFnFake = fake.returns(found);
    const queryOuterFnFake = fake.returns(queryFnFake);
    replace(deps, "query", queryOuterFnFake);
    const params = {};
    const key = "some-key";
    const value = "some-value";
    const query = {
      key,
      value,
    };
    const req = {
      params,
      query,
    };
    const sendFake = fake();
    const res = {
      send: sendFake,
    };
    await get({
      findSnapshotsFn,
      findEventsFn,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    })(req, res);
    expect(queryOuterFnFake).to.have.been.calledWith({
      findSnapshotsFn,
      findEventsFn,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    });
    expect(queryFnFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith(found);
  });
  it("should throw correctly if not found", async () => {
    const aggregateFnFake = fake();
    const aggregateOuterFnFake = fake.returns(aggregateFnFake);
    replace(deps, "aggregate", aggregateOuterFnFake);
    const params = {
      root,
    };
    const req = {
      params,
    };
    const res = {};

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "resourceNotFoundError", {
      message: messageFake,
    });

    try {
      await get({
        findSnapshotsFn,
        findEventsFn,
        findOneSnapshotFn,
        eventStreamFn,
        handlers,
      })(req, res);

      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("This root wasn't found.");
      expect(e).to.equal(error);
    }
  });
});
